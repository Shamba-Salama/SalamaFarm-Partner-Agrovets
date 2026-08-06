"""Paystack charge initiation and webhook handling."""

import logging
from datetime import datetime

from django.conf import settings
from django.db import transaction
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from core.tenancy import get_vendor_store
from crm.models import CustomerOrder

from .models import MpesaTransaction
from .paystack_client import PaystackClient, PaystackError
from .serializers import ChargeSerializer
from .utils import kes_to_cents, normalize_kenya_msisdn
from .webhooks import verify_paystack_signature

logger = logging.getLogger(__name__)


class ChargeView(APIView):
    """
    POST /payments/charge/

    Body: {order_id, phone}
    Initiates Paystack M-Pesa STK for the store-scoped order and records a
    pending MpesaTransaction. Final status comes from the webhook.
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        store = get_vendor_store(request.user)
        ser = ChargeSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        order_id = ser.validated_data["order_id"]
        phone_raw = ser.validated_data["phone"]

        try:
            order = (
                CustomerOrder.objects.for_store(store)
                .select_related("customer")
                .get(pk=order_id)
            )
        except CustomerOrder.DoesNotExist:
            return Response(
                {"detail": "No CustomerOrder matches the given query."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Idempotency: do not fire a second Paystack charge while one is pending
        # or after a successful charge for this order.
        charge_txns = MpesaTransaction.objects.filter(
            order=order,
            kind=MpesaTransaction.Kind.CHARGE,
        )
        if charge_txns.filter(status=MpesaTransaction.Status.SUCCESS).exists():
            return Response(
                {"detail": "Order already paid"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if charge_txns.filter(status=MpesaTransaction.Status.PENDING).exists():
            return Response(
                {"detail": "A charge is already in progress for this order"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        subaccount_code = (store.paystack_subaccount_code or "").strip()
        if not subaccount_code:
            return Response(
                {
                    "detail": (
                        "This store has no Paystack subaccount. "
                        "Call POST /api/v1/store/create-subaccount/ first."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            phone = normalize_kenya_msisdn(phone_raw)
        except ValueError as exc:
            return Response(
                {"detail": str(exc), "phone": phone_raw},
                status=status.HTTP_400_BAD_REQUEST,
            )

        amount_cents = kes_to_cents(order.amount)
        if amount_cents <= 0:
            return Response(
                {"detail": "Order amount must be greater than zero."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            client = PaystackClient()
            payload = client.charge_mobile_money(
                email=request.user.email,
                amount_kobo=amount_cents,
                phone=phone,
                subaccount_code=subaccount_code,
                bearer="subaccount",
                metadata={"order_id": order.id, "store_id": store.id},
            )
        except PaystackError as exc:
            return Response(
                {
                    "detail": str(exc),
                    "paystack_status": exc.status_code,
                    "paystack_payload": exc.payload,
                },
                status=status.HTTP_502_BAD_GATEWAY,
            )

        data = payload.get("data") or {}
        reference = (data.get("reference") or "").strip()
        if not reference:
            return Response(
                {
                    "detail": "Paystack charge response missing reference.",
                    "paystack_payload": payload,
                },
                status=status.HTTP_502_BAD_GATEWAY,
            )

        with transaction.atomic():
            txn = MpesaTransaction.objects.create(
                store=store,
                order=order,
                customer=order.customer,
                phone=phone,
                amount=order.amount,
                reference=reference,
                subaccount_code=subaccount_code,
                kind=MpesaTransaction.Kind.CHARGE,
                status=MpesaTransaction.Status.PENDING,
                result_desc=data.get("display_text") or data.get("status") or "",
                raw_webhook={},
            )

        return Response(
            {
                "transaction_id": txn.id,
                "reference": reference,
                "status": data.get("status"),
                "display_text": data.get("display_text"),
                "amount": str(order.amount),
                "amount_cents": amount_cents,
                "phone": phone,
                "subaccount_code": subaccount_code,
                "paystack": data,
            },
            status=status.HTTP_201_CREATED,
        )


class PaystackWebhookView(APIView):
    """
    POST /api/paystack/webhook/

    Public endpoint. Verifies X-Paystack-Signature (HMAC-SHA512 of raw body).
    """

    authentication_classes: list = []
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        raw_body = request.body
        signature = request.headers.get("X-Paystack-Signature") or request.META.get(
            "HTTP_X_PAYSTACK_SIGNATURE"
        )
        secret = settings.PAYSTACK_SECRET_KEY

        if not verify_paystack_signature(raw_body, signature, secret):
            return Response(
                {"detail": "Invalid Paystack signature."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        payload = request.data
        if not isinstance(payload, dict):
            logger.warning("Paystack webhook: non-object JSON payload")
            return Response({"detail": "ignored"}, status=status.HTTP_200_OK)

        event = payload.get("event") or ""
        data = payload.get("data") or {}
        reference = (data.get("reference") or "").strip()

        if event == "charge.success":
            return self._handle_charge_success(payload, data, reference)
        if event == "charge.failed":
            return self._handle_charge_failed(payload, data, reference)

        logger.info(
            "Paystack webhook ignored event=%s reference=%s",
            event,
            reference or None,
        )
        return Response({"detail": "ignored"}, status=status.HTTP_200_OK)

    def _handle_charge_success(self, payload: dict, data: dict, reference: str) -> Response:
        if not reference:
            logger.warning("Paystack charge.success without reference: %s", payload)
            return Response({"detail": "ok"}, status=status.HTTP_200_OK)

        try:
            txn = MpesaTransaction.objects.select_related("order").get(reference=reference)
        except MpesaTransaction.DoesNotExist:
            logger.warning(
                "Paystack charge.success for unknown reference=%s — acknowledging without update",
                reference,
            )
            return Response({"detail": "unknown_reference"}, status=status.HTTP_200_OK)

        paid_at = _parse_paystack_time(data.get("paid_at") or data.get("paidAt")) or timezone.now()
        receipt = (data.get("receipt_number") or "").strip()
        gateway = data.get("gateway_response") or data.get("message") or "success"

        with transaction.atomic():
            txn.status = MpesaTransaction.Status.SUCCESS
            if receipt:
                txn.mpesa_receipt = receipt
            txn.result_desc = str(gateway)
            txn.raw_webhook = payload
            txn.save(
                update_fields=[
                    "status",
                    "mpesa_receipt",
                    "result_desc",
                    "raw_webhook",
                    "updated_at",
                ]
            )

            order = txn.order
            if order is not None:
                order.paid_at = paid_at
                update_fields = ["paid_at", "updated_at"]
                # Populate verify-code field used by the frontend reconciliation UI.
                # Prefer Paystack receipt_number; fall back to the charge reference.
                code = (receipt or reference or "").strip()
                if code:
                    order.mpesa_code = code[:20]
                    update_fields.append("mpesa_code")
                if order.pickup == CustomerOrder.Pickup.UNMATCHED:
                    order.pickup = CustomerOrder.Pickup.AWAITING_PICKUP
                    update_fields.append("pickup")
                order.save(update_fields=update_fields)

        return Response({"detail": "ok"}, status=status.HTTP_200_OK)

    def _handle_charge_failed(self, payload: dict, data: dict, reference: str) -> Response:
        if not reference:
            logger.warning("Paystack charge.failed without reference: %s", payload)
            return Response({"detail": "ok"}, status=status.HTTP_200_OK)

        try:
            txn = MpesaTransaction.objects.get(reference=reference)
        except MpesaTransaction.DoesNotExist:
            logger.warning(
                "Paystack charge.failed for unknown reference=%s — acknowledging without update",
                reference,
            )
            return Response({"detail": "unknown_reference"}, status=status.HTTP_200_OK)

        reason = (
            data.get("gateway_response")
            or data.get("message")
            or data.get("display_text")
            or "failed"
        )

        txn.status = MpesaTransaction.Status.FAILED
        txn.result_desc = str(reason)
        txn.raw_webhook = payload
        txn.save(update_fields=["status", "result_desc", "raw_webhook", "updated_at"])
        return Response({"detail": "ok"}, status=status.HTTP_200_OK)


def _parse_paystack_time(value) -> datetime | None:
    if value is None:
        return None
    if isinstance(value, datetime):
        return value if timezone.is_aware(value) else timezone.make_aware(value, timezone.utc)
    if isinstance(value, str):
        dt = parse_datetime(value.replace("Z", "+00:00"))
        if dt is None:
            return None
        if timezone.is_naive(dt):
            return timezone.make_aware(dt, timezone.utc)
        return dt
    return None
