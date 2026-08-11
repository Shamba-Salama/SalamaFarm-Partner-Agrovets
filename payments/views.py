"""Paystack charge initiation and webhook handling."""

import logging

from django.conf import settings
from django.shortcuts import get_object_or_404
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from core.tenancy import get_vendor_store
from crm.models import CustomerOrder
from customers.authentication import CustomerJWTAuthentication
from customers.permissions import IsAuthenticatedCustomer

from .charge_outcome import apply_charge_failed, apply_charge_success
from .charge_service import (
    ChargeError,
    charge_result_to_response_body,
    initiate_paystack_charge,
)
from .models import MpesaTransaction
from .serializers import ChargeSerializer
from .webhooks import verify_paystack_signature

logger = logging.getLogger(__name__)


def _charge_error_response(exc: ChargeError) -> Response:
    body = {"detail": exc.message, **exc.extra}
    return Response(body, status=exc.status_code)


class ChargeView(APIView):
    """
    POST /payments/charge/

    Body: {order_id, phone}
    Vendor-scoped: initiates Paystack M-Pesa STK for an order belonging to the
    authenticated vendor's store. Final status comes from the webhook
    (or a synchronous success response in Paystack test mode).
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
                .select_related("customer", "store")
                .get(pk=order_id)
            )
        except CustomerOrder.DoesNotExist:
            return Response(
                {"detail": "No CustomerOrder matches the given query."},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            result = initiate_paystack_charge(
                order=order,
                phone_raw=phone_raw,
                paystack_email=getattr(request.user, "email", "") or "",
            )
        except ChargeError as exc:
            return _charge_error_response(exc)

        return Response(
            charge_result_to_response_body(result),
            status=status.HTTP_201_CREATED,
        )


class CustomerChargeView(APIView):
    """
    POST /payments/customer-charge/

    Body: {order_id, phone}
    Customer-scoped: order must belong to the authenticated CustomerAccount
    (via CRM Customer.account). Same Paystack STK + MpesaTransaction path as
    the vendor ChargeView; paid_at is set by webhook or synchronous success.
    """

    authentication_classes = [CustomerJWTAuthentication]
    permission_classes = [IsAuthenticatedCustomer]

    def post(self, request, *args, **kwargs):
        ser = ChargeSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        order_id = ser.validated_data["order_id"]
        phone_raw = ser.validated_data["phone"]

        order = get_object_or_404(
            CustomerOrder.objects.select_related("customer", "store"),
            pk=order_id,
            customer__account=request.user,
        )

        try:
            result = initiate_paystack_charge(
                order=order,
                phone_raw=phone_raw,
                # Paystack rejects reserved TLDs like .local; use a stable synth address.
                paystack_email=f"customer+{request.user.pk}@customers.salamafarm.com",
            )
        except ChargeError as exc:
            return _charge_error_response(exc)

        return Response(
            charge_result_to_response_body(result),
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

        apply_charge_success(txn, data if isinstance(data, dict) else {}, raw_payload=payload)
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

        if txn.status == MpesaTransaction.Status.SUCCESS:
            logger.info(
                "Paystack charge.failed ignored for already-successful reference=%s",
                reference,
            )
            return Response({"detail": "ok"}, status=status.HTTP_200_OK)

        apply_charge_failed(txn, data if isinstance(data, dict) else {}, raw_payload=payload)
        return Response({"detail": "ok"}, status=status.HTTP_200_OK)
