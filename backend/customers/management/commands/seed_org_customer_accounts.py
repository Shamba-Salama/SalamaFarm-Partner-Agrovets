"""Seed SalamaFarm organisation customer accounts for direct app login.

Creates / updates two CustomerAccount rows so org staff can sign in with
email + password without going through Sign Up.

Passwords are NEVER hard-coded. Provide them via environment variables, or
omit them and the command will generate strong random passwords and print
them once to stdout (store in your org password manager immediately).

Usage (from backend/):

  ORG_SUPERADMIN_PASSWORD='…' ORG_DEVELOPER_PASSWORD='…' \\
    python manage.py seed_org_customer_accounts

  # Or generate passwords:
  python manage.py seed_org_customer_accounts --generate-passwords

Env (optional overrides):
  ORG_SUPERADMIN_EMAIL   default info@salamafarm.com
  ORG_SUPERADMIN_PASSWORD
  ORG_DEVELOPER_EMAIL    default technicalofficer@salamafarm.com
  ORG_DEVELOPER_PASSWORD
"""

from __future__ import annotations

import secrets
import string

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from customers.models import CustomerAccount


def _strong_password(length: int = 20) -> str:
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*-_"
    return "".join(secrets.choice(alphabet) for _ in range(length))


class Command(BaseCommand):
    help = "Upsert org superadmin + developer CustomerAccount rows for mobile login."

    def add_arguments(self, parser):
        parser.add_argument(
            "--generate-passwords",
            action="store_true",
            help="Generate random passwords when env passwords are missing.",
        )
        parser.add_argument(
            "--print-passwords",
            action="store_true",
            help="Print plaintext passwords to stdout (only for the keeper).",
        )

    def handle(self, *args, **options):
        generate = options["generate_passwords"]
        print_pw = options["print_passwords"] or generate

        specs = [
            {
                "email": getattr(settings, "ORG_SUPERADMIN_EMAIL", "info@salamafarm.com"),
                "password": getattr(settings, "ORG_SUPERADMIN_PASSWORD", "") or "",
                "password_env": "ORG_SUPERADMIN_PASSWORD",
                "full_name": "SalamaFarm Super Admin",
                "org_role": CustomerAccount.OrgRole.SUPERADMIN,
            },
            {
                "email": getattr(
                    settings, "ORG_DEVELOPER_EMAIL", "technicalofficer@salamafarm.com"
                ),
                "password": getattr(settings, "ORG_DEVELOPER_PASSWORD", "") or "",
                "password_env": "ORG_DEVELOPER_PASSWORD",
                "full_name": "SalamaFarm Technical Officer",
                "org_role": CustomerAccount.OrgRole.DEVELOPER,
            },
        ]

        created_or_updated = []
        for spec in specs:
            email = str(spec["email"]).strip().lower()
            password = str(spec["password"] or "")
            password_env = spec["password_env"]
            generated = False
            if not password:
                if not generate:
                    raise CommandError(
                        f"Missing {password_env}. Set it in the environment "
                        "or pass --generate-passwords."
                    )
                password = _strong_password()
                generated = True

            account, created = CustomerAccount.objects.get_or_create(
                email=email,
                defaults={
                    "full_name": spec["full_name"],
                    "location": "Nairobi",
                    "farm_type": "mixed",
                    "farm_name": "Salama Farm",
                    "auth_provider": CustomerAccount.AuthProvider.EMAIL,
                    "is_org_account": True,
                    "org_role": spec["org_role"],
                },
            )
            account.full_name = spec["full_name"]
            account.is_org_account = True
            account.org_role = spec["org_role"]
            account.auth_provider = CustomerAccount.AuthProvider.EMAIL
            if not account.location:
                account.location = "Nairobi"
            if not account.farm_type:
                account.farm_type = "mixed"
            account.set_password(password)
            account.save()

            created_or_updated.append(
                {
                    "email": email,
                    "role": spec["org_role"],
                    "created": created,
                    "password": password if print_pw else None,
                    "generated": generated,
                }
            )

        self.stdout.write(self.style.SUCCESS("Org customer accounts ready:"))
        for row in created_or_updated:
            action = "created" if row["created"] else "updated"
            self.stdout.write(f"  • {row['email']} ({row['role']}) — {action}")
            if row["password"]:
                tag = "GENERATED" if row["generated"] else "from env"
                self.stdout.write(
                    self.style.WARNING(f"    password ({tag}): {row['password']}")
                )

        if print_pw:
            self.stdout.write("")
            self.stdout.write(
                self.style.WARNING(
                    "Store these passwords in your organisation password manager. "
                    "They are not saved in plaintext anywhere in the database or git."
                )
            )
