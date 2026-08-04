"""Thin Paystack HTTP client (Kenya)."""

from __future__ import annotations

from typing import Any

import requests
from django.conf import settings


class PaystackError(Exception):
    """Raised when Paystack returns a non-success response or is misconfigured."""

    def __init__(
        self,
        message: str,
        *,
        status_code: int | None = None,
        payload: Any = None,
    ):
        super().__init__(message)
        self.status_code = status_code
        self.payload = payload


class PaystackClient:
    """Minimal wrapper around Paystack's REST API using the secret key."""

    BASE_URL = "https://api.paystack.co"

    def __init__(self, secret_key: str | None = None, timeout: int = 30):
        self.secret_key = secret_key if secret_key is not None else settings.PAYSTACK_SECRET_KEY
        self.timeout = timeout
        if not self.secret_key:
            raise PaystackError(
                "PAYSTACK_SECRET_KEY is not configured. Set it in your environment/.env."
            )

    def _headers(self) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {self.secret_key}",
            "Content-Type": "application/json",
        }

    def _request(self, method: str, path: str, **kwargs) -> dict:
        url = f"{self.BASE_URL}{path}"
        try:
            response = requests.request(
                method,
                url,
                headers=self._headers(),
                timeout=self.timeout,
                **kwargs,
            )
        except requests.RequestException as exc:
            raise PaystackError(f"Paystack request failed: {exc}") from exc

        try:
            payload = response.json()
        except ValueError:
            payload = {"raw": response.text}

        if not 200 <= response.status_code < 300:
            message = None
            if isinstance(payload, dict):
                message = payload.get("message") or payload.get("error")
            raise PaystackError(
                message or f"Paystack HTTP {response.status_code}",
                status_code=response.status_code,
                payload=payload,
            )

        if isinstance(payload, dict) and payload.get("status") is False:
            raise PaystackError(
                payload.get("message") or "Paystack returned status=false",
                status_code=response.status_code,
                payload=payload,
            )

        return payload if isinstance(payload, dict) else {"data": payload}

    def create_subaccount(
        self,
        business_name: str,
        settlement_bank: str,
        account_number: str,
        percentage_charge: float,
        **extra: Any,
    ) -> dict:
        """
        Create a Paystack subaccount.

        Returns the full JSON body from Paystack (includes data.subaccount_code).
        See: https://paystack.com/docs/api/subaccount/#create
        """
        body = {
            "business_name": business_name,
            "settlement_bank": settlement_bank,
            "account_number": account_number,
            "percentage_charge": percentage_charge,
            **extra,
        }
        return self._request("POST", "/subaccount", json=body)

    def update_subaccount(self, code_or_id: str, **fields: Any) -> dict:
        """
        Update an existing Paystack subaccount (PUT /subaccount/:id_or_code).

        Pass any supported fields as kwargs, e.g. percentage_charge=5.0.
        See: https://paystack.com/docs/api/subaccount/#update
        """
        if not fields:
            raise PaystackError("update_subaccount requires at least one field to update.")
        return self._request("PUT", f"/subaccount/{code_or_id}", json=fields)

    def fetch_subaccount(self, code_or_id: str) -> dict:
        """GET /subaccount/:id_or_code — fetch a single subaccount."""
        return self._request("GET", f"/subaccount/{code_or_id}")

    def list_banks(self, **params: Any) -> dict:
        """
        List banks / financial channels.

        Common params: country, currency, type (e.g. mobile_money), perPage.
        See: https://paystack.com/docs/api/miscellaneous/#bank
        """
        return self._request("GET", "/bank", params=params or None)

    def charge_mobile_money(
        self,
        email: str,
        amount_kobo: int,
        phone: str,
        subaccount_code: str,
        bearer: str = "subaccount",
        *,
        currency: str = "KES",
        provider: str = "mpesa",
        reference: str | None = None,
        metadata: dict | None = None,
    ) -> dict:
        """
        Initiate a Kenya M-Pesa STK push via POST /charge.

        amount_kobo must be the smallest currency unit (KES * 100).
        phone should already be E.164 (+254…).
        See: https://paystack.com/docs/payments/payment-channels/#m-pesa
        """
        if amount_kobo <= 0:
            raise PaystackError("amount_kobo must be a positive integer (KES * 100).")
        body: dict[str, Any] = {
            "email": email,
            "amount": amount_kobo,
            "currency": currency,
            "mobile_money": {
                "phone": phone,
                "provider": provider,
            },
            "subaccount": subaccount_code,
            "bearer": bearer,
        }
        if reference:
            body["reference"] = reference
        if metadata:
            body["metadata"] = metadata
        return self._request("POST", "/charge", json=body)
