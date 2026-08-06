"""Store API — singleton for the authenticated vendor's AgrovetStore."""

from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import AgrovetStore
from .paystack_subaccount import ensure_paystack_subaccount
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

        result = ensure_paystack_subaccount(
            store,
            settlement_bank=data.get("settlement_bank"),
            account_number=data.get("account_number"),
            percentage_charge=data.get("percentage_charge"),
        )

        if not result.ok:
            # Validation-style failures (missing name/till) → 400; Paystack → 502.
            is_client = result.paystack_status is None and result.paystack_payload is None
            return Response(
                {
                    "detail": result.error or "Could not create Paystack subaccount.",
                    **(
                        {}
                        if is_client
                        else {
                            "paystack_status": result.paystack_status,
                            "paystack_payload": result.paystack_payload,
                        }
                    ),
                },
                status=(
                    status.HTTP_400_BAD_REQUEST
                    if is_client
                    else status.HTTP_502_BAD_GATEWAY
                ),
            )

        store.refresh_from_db()
        return Response(
            {
                "created": result.created,
                "subaccount_code": result.subaccount_code,
                "store": AgrovetStoreSerializer(store).data,
                "paystack": result.paystack,
            },
            status=status.HTTP_201_CREATED if result.created else status.HTTP_200_OK,
        )
