"""Store API — singleton for the authenticated vendor's AgrovetStore."""

from django.conf import settings
from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from payments.paystack_client import PaystackClient, PaystackError

from .models import AgrovetStore
from .serializers import AgrovetStoreSerializer, CreateSubaccountSerializer


class StoreView(generics.RetrieveUpdateAPIView):
    """
    GET /store/  — current vendor's store
    PATCH /store/ — update profile / open / onboarded

    Resolves exclusively via request.user.store (never a URL/body store id).
    """

    serializer_class = AgrovetStoreSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ["get", "patch", "head", "options"]

    def get_object(self) -> AgrovetStore:
        # Ignore any stray id in the body; tenants are bound to the JWT user.
        return get_object_or_404(AgrovetStore, owner=self.request.user)


class CreateSubaccountView(APIView):
    """
    POST /store/create-subaccount/

    Create (or return existing) Paystack subaccount for request.user.store.
    Idempotent: if paystack_subaccount_code is already set, do not call Paystack again.
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        store = get_object_or_404(AgrovetStore, owner=request.user)

        if store.paystack_subaccount_code:
            return Response(
                {
                    "created": False,
                    "subaccount_code": store.paystack_subaccount_code,
                    "store": AgrovetStoreSerializer(store).data,
                    "detail": "Subaccount already exists for this store.",
                },
                status=status.HTTP_200_OK,
            )

        ser = CreateSubaccountSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        data = ser.validated_data

        business_name = (store.name or "").strip()
        if not business_name:
            return Response(
                {"detail": "Store name is required before creating a Paystack subaccount."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Defaults: Kenya M-Pesa bank code + store till as account_number.
        # See README / endpoint docstring notes: Till vs phone is ambiguous in docs.
        settlement_bank = data.get("settlement_bank") or getattr(
            settings, "PAYSTACK_DEFAULT_SETTLEMENT_BANK", "MPTILL"
        )
        account_number = (data.get("account_number") or store.till or "").strip()
        if not account_number:
            return Response(
                {
                    "detail": (
                        "Store till (or account_number in the request body) is required "
                        "for Paystack subaccount settlement."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        percentage_charge = data.get(
            "percentage_charge",
            float(getattr(settings, "PAYSTACK_DEFAULT_PERCENTAGE_CHARGE", 0.0)),
        )

        try:
            client = PaystackClient()
            extra = {}
            if store.attendant_phone:
                extra["primary_contact_phone"] = store.attendant_phone
            payload = client.create_subaccount(
                business_name=business_name,
                settlement_bank=settlement_bank,
                account_number=account_number,
                percentage_charge=percentage_charge,
                **extra,
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

        sub_data = payload.get("data") or {}
        code = sub_data.get("subaccount_code") or ""
        if not code:
            return Response(
                {
                    "detail": "Paystack response missing subaccount_code.",
                    "paystack_payload": payload,
                },
                status=status.HTTP_502_BAD_GATEWAY,
            )

        store.paystack_subaccount_code = code
        store.save(update_fields=["paystack_subaccount_code", "updated_at"])

        return Response(
            {
                "created": True,
                "subaccount_code": code,
                "store": AgrovetStoreSerializer(store).data,
                "paystack": sub_data,
            },
            status=status.HTTP_201_CREATED,
        )
