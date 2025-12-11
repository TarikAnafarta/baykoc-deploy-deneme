import uuid

from cloudinary.models import CloudinaryField
from django.conf import settings
from django.contrib.auth.base_user import AbstractBaseUser
from django.contrib.auth.models import PermissionsMixin
from django.core.mail import send_mail
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from backend.users.managers import UserManager
from backend.users.utils import (
    generate_verification_code,
    get_password_reset_email_template,
    get_verification_email_template,
)


class User(AbstractBaseUser, PermissionsMixin):
    GRADE_MEZUN_VALUE = 13
    GRADE_CHOICES = [
        (5, "5. Sınıf"),
        (6, "6. Sınıf"),
        (7, "7. Sınıf"),
        (8, "8. Sınıf"),
        (9, "9. Sınıf"),
        (10, "10. Sınıf"),
        (11, "11. Sınıf"),
        (12, "12. Sınıf"),
        (GRADE_MEZUN_VALUE, "Mezun"),
    ]

    TRACK_CHOICES = [
        ("lgs", "LGS"),
        ("sayisal", "Sayısal"),
        ("sozel", "Sözel"),
        ("dil", "Dil"),
    ]

    LANGUAGE_CHOICES = [
        ("almanca", "Almanca"),
        ("arapca", "Arapça"),
        ("fransizca", "Fransızca"),
        ("ingilizce", "İngilizce"),
        ("rusca", "Rusça"),
    ]

    id = models.UUIDField("ID", primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(_("Name of User"), max_length=255)
    email = models.EmailField("Email", unique=True, db_index=True)
    is_staff = models.BooleanField(
        default=False, help_text="Only staff users can access Django Admin."
    )
    is_active = models.BooleanField(
        default=False, help_text="Only active users can login."
    )
    date_joined = models.DateTimeField("Date Joined", default=timezone.now)

    # Profile completion fields
    grade = models.IntegerField(
        "Grade",
        choices=GRADE_CHOICES,
        null=True,
        blank=True,
        help_text="Student's current grade (5-12) or Mezun",
    )
    track = models.CharField(
        "Track",
        max_length=10,
        choices=TRACK_CHOICES,
        null=True,
        blank=True,
        help_text="Academic track (LGS, Sayısal, Sözel, Dil)",
    )
    language = models.CharField(
        "Language",
        max_length=20,
        choices=LANGUAGE_CHOICES,
        null=True,
        blank=True,
        help_text="Foreign language selection required for Dil track",
    )
    profile_completed = models.BooleanField(
        default=False, help_text="Whether user has completed their profile information"
    )
    profile_picture = CloudinaryField(
        "profile_picture",
        null=True,
        blank=True,
        folder="profile_pictures",
        help_text="User's profile picture",
    )
    google_sub = models.CharField(
        "Google Subject",
        max_length=255,
        unique=True,
        null=True,
        blank=True,
        help_text="Google account subject identifier",
    )

    USERNAME_FIELD = "email"

    objects = UserManager()


class VerificationCode(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="verification_code",
        verbose_name="Verification Code Owner",
    )
    code = models.CharField(
        "Verification Code", max_length=6, default=generate_verification_code
    )
    created_at = models.DateTimeField("Code Creation Date", auto_now_add=True)

    @property
    def is_expired(self):
        return timezone.now() > self.created_at + timezone.timedelta(
            minutes=getattr(settings, "VERIFICATION_CODE_EXPIRY_MINUTES", 30)
        )

    def send(self):
        subject = "Your Verification Code"

        # Get both plain text and HTML versions of the message
        plain_text_message, html_message = get_verification_email_template(
            self.user.name, self.code
        )

        recipient_list = [self.user.email]
        send_mail(
            subject, plain_text_message, None, recipient_list, html_message=html_message
        )


class PasswordResetToken(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="password_reset_tokens",
        verbose_name="Password Reset Token Owner",
    )
    token = models.UUIDField("Reset Token", default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField("Token Creation Date", auto_now_add=True)

    @property
    def is_expired(self):
        return timezone.now() > self.created_at + timezone.timedelta(
            minutes=getattr(settings, "PASSWORD_RESET_EXPIRY_MINUTES", 30)
        )

    def send(self):
        """Send password reset email with a secure one-time link."""
        subject = "Reset Your Password"
        frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:5173")
        reset_url = f"{frontend_url}/reset-password?token={self.token}"
        plain_text_message, html_message = get_password_reset_email_template(
            self.user.name, reset_url
        )
        recipient_list = [self.user.email]
        send_mail(
            subject,
            plain_text_message,
            None,
            recipient_list,
            html_message=html_message,
        )

    class Meta:
        verbose_name = "Password Reset Token Owner"
        verbose_name_plural = "Password Reset Token Owners"
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(fields=["user"], name="unique_user_reset_token"),
        ]
