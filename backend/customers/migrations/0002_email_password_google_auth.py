# Generated manually for email/password + Google customer auth

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("customers", "0001_initial"),
    ]

    operations = [
        migrations.AlterModelOptions(
            name="customeraccount",
            options={
                "ordering": ["full_name", "email", "phone"],
                "verbose_name": "customer account",
                "verbose_name_plural": "customer accounts",
            },
        ),
        migrations.AddField(
            model_name="customeraccount",
            name="email",
            field=models.EmailField(blank=True, max_length=254, null=True, unique=True),
        ),
        migrations.AddField(
            model_name="customeraccount",
            name="password",
            field=models.CharField(blank=True, default="", max_length=128),
        ),
        migrations.AddField(
            model_name="customeraccount",
            name="google_sub",
            field=models.CharField(blank=True, max_length=64, null=True, unique=True),
        ),
        migrations.AddField(
            model_name="customeraccount",
            name="auth_provider",
            field=models.CharField(
                choices=[
                    ("email", "Email"),
                    ("google", "Google"),
                    ("phone_legacy", "Phone (legacy OTP)"),
                ],
                default="phone_legacy",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="customeraccount",
            name="is_org_account",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="customeraccount",
            name="org_role",
            field=models.CharField(
                blank=True,
                choices=[
                    ("superadmin", "Super admin"),
                    ("developer", "Developer"),
                ],
                default="",
                max_length=20,
            ),
        ),
        migrations.AlterField(
            model_name="customeraccount",
            name="phone",
            field=models.CharField(blank=True, max_length=20, null=True, unique=True),
        ),
        migrations.CreateModel(
            name="PasswordResetToken",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("email", models.EmailField(db_index=True, max_length=254)),
                ("code_hash", models.CharField(max_length=128)),
                ("expires_at", models.DateTimeField()),
                ("attempts_count", models.PositiveIntegerField(default=0)),
                ("is_used", models.BooleanField(default=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={
                "ordering": ["-created_at"],
            },
        ),
    ]
