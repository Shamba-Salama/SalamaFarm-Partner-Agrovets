from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("stores", "0003_agrovetstore_latitude_longitude"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="agrovetstore",
            name="paystack_subaccount_code",
        ),
    ]
