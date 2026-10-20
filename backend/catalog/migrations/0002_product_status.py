from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("catalog", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="product",
            name="status",
            field=models.CharField(
                choices=[
                    ("draft", "Draft"),
                    ("pending", "Pending review"),
                    ("published", "Published"),
                    ("archived", "Archived"),
                ],
                default="published",
                max_length=16,
            ),
        ),
        migrations.AlterField(
            model_name="product",
            name="status",
            field=models.CharField(
                choices=[
                    ("draft", "Draft"),
                    ("pending", "Pending review"),
                    ("published", "Published"),
                    ("archived", "Archived"),
                ],
                default="draft",
                max_length=16,
            ),
        ),
    ]
