"""
One-off: list Paystack Kenya banks and highlight M-Pesa / mobile_money channels.

Usage (from backend/, with PAYSTACK_SECRET_KEY in .env):

  .venv/bin/python manage.py list_paystack_kenya_banks

Does not change create-subaccount defaults — investigation only.
"""

from __future__ import annotations

import json
import re

from django.core.management.base import BaseCommand, CommandError

from payments.paystack_client import PaystackClient, PaystackError

INTERESTING = re.compile(r"mpesa|m-pesa|mobile[_ ]?money|till", re.I)


class Command(BaseCommand):
    help = "Fetch GET /bank?country=kenya from Paystack and print mobile_money/M-Pesa matches."

    def add_arguments(self, parser):
        parser.add_argument(
            "--raw-only",
            action="store_true",
            help="Print raw JSON only (no highlights).",
        )

    def handle(self, *args, **options):
        try:
            client = PaystackClient()
        except PaystackError as exc:
            raise CommandError(str(exc)) from exc

        queries = [
            {"country": "kenya"},
            {"country": "kenya", "currency": "KES"},
            {"country": "kenya", "type": "mobile_money"},
            {"currency": "KES", "type": "mobile_money"},
        ]

        all_interesting: list[dict] = []
        seen_codes: set[str] = set()

        for params in queries:
            self.stdout.write(self.style.NOTICE(f"\n=== GET /bank params={params} ==="))
            try:
                payload = client.list_banks(**params)
            except PaystackError as exc:
                self.stderr.write(
                    self.style.ERROR(
                        f"Failed: {exc} (http={exc.status_code}) payload={exc.payload}"
                    )
                )
                continue

            self.stdout.write(json.dumps(payload, indent=2, default=str))

            banks = payload.get("data") or []
            if not isinstance(banks, list):
                continue

            for bank in banks:
                if not isinstance(bank, dict):
                    continue
                blob = " ".join(
                    str(bank.get(k, ""))
                    for k in ("name", "slug", "code", "type", "currency", "gateway")
                )
                if INTERESTING.search(blob):
                    code = str(bank.get("code") or "")
                    key = f"{code}:{bank.get('name')}"
                    if key not in seen_codes:
                        seen_codes.add(key)
                        all_interesting.append(bank)

        self.stdout.write(self.style.NOTICE("\n=== HIGHLIGHTS (name/type/slug/code matching mpesa|mobile_money|till) ==="))
        if not all_interesting:
            self.stdout.write(
                self.style.WARNING(
                    "No Kenya bank entries matched mpesa / mobile_money / till.\n"
                    "This suggests M-Pesa Till settlement via Subaccount settlement_bank "
                    "may not be exposed the same way as Nigeria mobile_money bank codes.\n"
                    "Do NOT treat the hardcoded 'MPESA' string as confirmed for Till.\n"
                    "Next: confirm with Paystack support whether Kenya subaccounts can "
                    "settle to a Till, or if settlement must use a bank account / MSISDN."
                )
            )
        else:
            for bank in all_interesting:
                self.stdout.write(
                    self.style.SUCCESS(
                        f"- name={bank.get('name')!r}  code={bank.get('code')!r}  "
                        f"type={bank.get('type')!r}  slug={bank.get('slug')!r}  "
                        f"currency={bank.get('currency')!r}"
                    )
                )
            self.stdout.write(
                json.dumps(all_interesting, indent=2, default=str),
            )
