from rest_framework import serializers


class UUIDModelSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(format="hex_verbose", required=False)

    class Meta:
        abstract = (
            True  # This serializer is intended to be extended, not used directly.
        )
