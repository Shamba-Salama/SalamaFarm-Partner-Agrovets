"""Customer JWT issuance.

Design note — audience separation from vendor tokens:

Vendor tokens (issued by the stock SimpleJWT views) carry the ``user_id`` claim
and are resolved against ``AUTH_USER_MODEL`` (accounts.VendorUser). Customer
tokens deliberately carry ``customer_id`` INSTEAD OF ``user_id``, plus an
``account_type=customer`` marker.

Consequences (both enforced by token *shape*, not by ad-hoc checks):
  * A customer token has no ``user_id`` → the default vendor JWTAuthentication
    raises InvalidToken ("no recognizable user identification"), so customer
    tokens cannot authenticate on any vendor endpoint.
  * CustomerJWTAuthentication requires ``account_type=customer`` + ``customer_id``,
    so vendor tokens cannot authenticate on any customer endpoint.

``account_type``/``customer_id`` are not in SimpleJWT's ``no_copy_claims`` and
therefore survive the refresh -> access copy (see RefreshToken.access_token).
"""

from __future__ import annotations

from rest_framework_simplejwt.tokens import RefreshToken

ACCOUNT_TYPE_CLAIM = "account_type"
CUSTOMER_ID_CLAIM = "customer_id"
CUSTOMER_ACCOUNT_TYPE = "customer"


class CustomerRefreshToken(RefreshToken):
    """RefreshToken that identifies a CustomerAccount, never a VendorUser."""

    @classmethod
    def for_account(cls, account) -> "CustomerRefreshToken":
        token = cls()  # fresh jti / exp / iat / token_type=refresh
        token[ACCOUNT_TYPE_CLAIM] = CUSTOMER_ACCOUNT_TYPE
        token[CUSTOMER_ID_CLAIM] = account.pk
        return token


def issue_customer_tokens(account) -> dict[str, str]:
    """Return a fresh {refresh, access} pair for a CustomerAccount."""
    refresh = CustomerRefreshToken.for_account(account)
    return {
        "refresh": str(refresh),
        "access": str(refresh.access_token),
    }
