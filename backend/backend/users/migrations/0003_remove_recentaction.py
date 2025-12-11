# Generated migration to remove RecentAction model

from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("users", "0002_user_profile_picture"),
    ]

    operations = [
        # Remove indexes first
        migrations.RemoveIndex(
            model_name="recentaction",
            name="users_recen_user_id_3c04fa_idx",
        ),
        migrations.RemoveIndex(
            model_name="recentaction",
            name="users_recen_last_ac_817f92_idx",
        ),
        # Remove constraint
        migrations.RemoveConstraint(
            model_name="recentaction",
            name="unique_user_item_action",
        ),
        # Delete the model
        migrations.DeleteModel(
            name="RecentAction",
        ),
    ]
