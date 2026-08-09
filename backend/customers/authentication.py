"""Custom DRF authentication for CustomerAccount JWTs.

Used explicitly on customer endpoints via ``authentication_classes``. It reuses
SimpleJWT's signature/expiry validation (get_validated_token) but resolves the
token to a CustomerAccount instead of AUTH_USER_MODEL.
"""

from __future__ import annotations

from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import AuthenticationFailed, InvalidToken

from .models import CustomerAccount
from .tokens import ACCOUNT_TYPE_CLAIM, CUSTOMER_ACCOUNT_TYPE, CUSTOMER_ID_CLAIM


class CustomerJWTAuthentication(JWTAuthentication):
    """Resolve a validated JWT to a CustomerAccount.

    Rejects any token not explicitly marked ``account_type=customer`` (e.g. a
    vendor token), so vendor credentials cannot be replayed against customer
    endpoints.
    """

    def get_user(self, validated_token) -> CustomerAccount:
        if validated_token.get(ACCOUNT_TYPE_CLAIM) != CUSTOMER_ACCOUNT_TYPE:
            raise AuthenticationFailed(
                "Token is not a customer token.", code="not_customer_token"
            )

        try:
            customer_id = validated_token[CUSTOMER_ID_CLAIM]
        except KeyError as exc:
            raise InvalidToken(
                "Token contained no customer identification."
            ) from exc

        try:
            return CustomerAccount.objects.get(pk=customer_id)
        except CustomerAccount.DoesNotExist as exc:
            raise AuthenticationFailed(
                "Customer not found.", code="customer_not_found"
            ) from exc
