from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("users", "0003_remove_recentaction"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="google_sub",
            field=models.CharField(
                "Google Subject",
                max_length=255,
                unique=True,
                null=True,
                blank=True,
                help_text="Google account subject identifier",
            ),
        ),
    ]
