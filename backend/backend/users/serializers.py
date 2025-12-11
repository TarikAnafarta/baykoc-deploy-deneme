from rest_framework import serializers

from backend.common.serializers import UUIDModelSerializer
from backend.users.models import User

HIGH_SCHOOL_TRACKS = {"sayisal", "sozel", "dil"}
DIL_TRACK = "dil"


class FlexibleGradeChoiceField(serializers.ChoiceField):
    def to_internal_value(self, data):
        if data == "mezun":
            data = User.GRADE_MEZUN_VALUE
        if isinstance(data, str) and data.isdigit():
            data = int(data)
        return super().to_internal_value(data)

    def to_representation(self, value):
        if value is None:
            return None
        if value == User.GRADE_MEZUN_VALUE:
            return "mezun"
        try:
            return int(value)
        except (TypeError, ValueError):
            return value


class NullableChoiceField(serializers.ChoiceField):
    def __init__(self, **kwargs):
        kwargs.setdefault("allow_null", True)
        kwargs.setdefault("allow_blank", True)
        super().__init__(**kwargs)

    def to_internal_value(self, data):
        if data in (None, ""):
            return None
        return super().to_internal_value(data)


class UserSerializer(serializers.ModelSerializer):
    profile_picture = serializers.SerializerMethodField()
    grade = FlexibleGradeChoiceField(
        choices=User.GRADE_CHOICES, required=False, allow_null=True
    )
    language = NullableChoiceField(choices=User.LANGUAGE_CHOICES, required=False)

    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "name",
            "is_staff",
            "is_active",
            "grade",
            "track",
            "language",
            "profile_completed",
            "date_joined",
            "profile_picture",
            "google_sub",
        )
        read_only_fields = (
            "id",
            "email",
            "is_staff",
            "is_active",
            "profile_completed",
            "date_joined",
            "google_sub",
        )

    def get_profile_picture(self, obj):
        """Return the full Cloudinary URL for the profile picture"""
        if obj.profile_picture:
            # Use Cloudinary's build_url to get the full URL
            return obj.profile_picture.url
        return None

    def validate(self, attrs):
        provided_grade = "grade" in attrs
        provided_track = "track" in attrs
        provided_language = "language" in attrs

        grade = attrs.get("grade")
        track = attrs.get("track")
        language = attrs.get("language")

        if self.instance:
            if grade is None:
                grade = self.instance.grade
            if track is None:
                track = self.instance.track
            if not provided_language:
                language = self.instance.language

        grade_value = grade
        if grade_value is not None and not isinstance(grade_value, int):
            try:
                grade_value = int(grade_value)
            except (TypeError, ValueError):
                raise serializers.ValidationError(
                    {"grade": "Geçersiz sınıf değeri gönderildi."}
                )

        if grade_value is not None and grade_value <= 8:
            if provided_track and attrs.get("track") not in (None, "lgs"):
                raise serializers.ValidationError(
                    {"track": "8. sınıf ve altı için sadece LGS seçeneği geçerlidir."}
                )
            attrs["track"] = "lgs"
            attrs["language"] = None
            return attrs

        if grade_value and grade_value > 8:
            final_track = attrs.get("track") if provided_track else track
            if final_track in (None, "lgs") or final_track not in HIGH_SCHOOL_TRACKS:
                raise serializers.ValidationError(
                    {
                        "track": "9. sınıf ve üzeri için Sayısal, Sözel veya Dil alanlarından birini seçmelisiniz."
                    }
                )

        if not provided_grade and provided_track:
            if grade_value and grade_value <= 8 and attrs.get("track") != "lgs":
                raise serializers.ValidationError(
                    {"track": "8. sınıf ve altı için sadece LGS seçeneği geçerlidir."}
                )

        final_track = attrs.get("track") if provided_track else track
        if final_track == DIL_TRACK:
            final_language = attrs.get("language") if provided_language else language
            if not final_language:
                raise serializers.ValidationError(
                    {"language": "Dil alanı için bir yabancı dil seçmelisiniz."}
                )
            if provided_language:
                attrs["language"] = final_language
        else:
            attrs["language"] = None

        return attrs


class UserDetailSerializer(UUIDModelSerializer):
    class Meta:
        model = User
        fields = ("id", "email", "name")


class UserBasicSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("email", "name")


class UserLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()


class UserRegisterSerializer(serializers.ModelSerializer):
    grade = FlexibleGradeChoiceField(
        choices=User.GRADE_CHOICES, required=False, allow_null=True
    )
    language = NullableChoiceField(choices=User.LANGUAGE_CHOICES, required=False)

    class Meta:
        model = User
        fields = ("email", "name", "password", "grade", "track", "language")

    def validate(self, attrs):
        # Validate that if grade > 8, track must be provided and not 'lgs'
        grade = attrs.get("grade")
        track = attrs.get("track")
        language = attrs.get("language")

        if grade and grade <= 8:
            if track and track != "lgs":
                raise serializers.ValidationError(
                    {"track": "8. sınıf ve altı için sadece LGS seçeneği geçerlidir."}
                )
            attrs["track"] = "lgs"
            attrs["language"] = None
            return attrs

        if grade and grade > 8:
            if not track or track not in HIGH_SCHOOL_TRACKS:
                raise serializers.ValidationError(
                    {
                        "track": "9. sınıf ve üzeri için Sayısal, Sözel veya Dil alanlarından birini seçmelisiniz."
                    }
                )

        if track == DIL_TRACK:
            if not language:
                raise serializers.ValidationError(
                    {"language": "Dil alanı için bir yabancı dil seçmelisiniz."}
                )
        else:
            attrs["language"] = None

        return attrs


class UserChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)
    confirm_password = serializers.CharField(required=True)

    def validate(self, attrs):
        if attrs["new_password"] != attrs["confirm_password"]:
            raise serializers.ValidationError({"message": "Passwords do not match."})
        return attrs


class UserForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)


class UserResetPasswordSerializer(serializers.Serializer):
    token = serializers.UUIDField(required=True)
    new_password = serializers.CharField(required=True)
    confirm_password = serializers.CharField(required=True)

    def validate(self, attrs):
        if attrs["new_password"] != attrs["confirm_password"]:
            raise serializers.ValidationError({"message": "Passwords do not match."})
        return attrs


class UserCompleteProfileSerializer(serializers.ModelSerializer):
    grade = FlexibleGradeChoiceField(choices=User.GRADE_CHOICES)
    language = NullableChoiceField(choices=User.LANGUAGE_CHOICES, required=False)

    class Meta:
        model = User
        fields = ("grade", "track", "language")

    def validate(self, attrs):
        grade = attrs.get("grade")
        track = attrs.get("track")
        language = attrs.get("language")

        if grade is None:
            raise serializers.ValidationError({"grade": "Sınıf bilgisi zorunludur."})

        if not track:
            raise serializers.ValidationError({"track": "Alan bilgisi zorunludur."})

        if grade <= 8:
            if track != "lgs":
                raise serializers.ValidationError(
                    {"track": "8. sınıf ve altı için sadece LGS seçeneği geçerlidir."}
                )
            attrs["language"] = None
            return attrs

        if track not in HIGH_SCHOOL_TRACKS:
            raise serializers.ValidationError(
                {
                    "track": "9. sınıf ve üzeri için Sayısal, Sözel veya Dil alanlarından birini seçmelisiniz."
                }
            )

        if track == DIL_TRACK:
            if not language:
                raise serializers.ValidationError(
                    {"language": "Dil alanı için bir yabancı dil seçmelisiniz."}
                )
        else:
            attrs["language"] = None

        return attrs
