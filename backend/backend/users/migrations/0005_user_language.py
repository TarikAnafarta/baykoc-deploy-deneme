from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0004_user_google_sub"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="language",
            field=models.CharField(
                blank=True,
                choices=[
                    ("almanca", "Almanca"),
                    ("arapca", "Arapça"),
                    ("fransizca", "Fransızca"),
                    ("ingilizce", "İngilizce"),
                    ("rusca", "Rusça"),
                ],
                help_text="Foreign language selection required for Dil track",
                max_length=20,
                null=True,
                verbose_name="Language",
            ),
        ),
    ]
