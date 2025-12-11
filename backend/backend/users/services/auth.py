from __future__ import annotations

from dataclasses import dataclass

from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import check_password
from django.db import transaction

from backend.users.models import PasswordResetToken, VerificationCode
from backend.users.utils import get_password_reset_email_template

UserModel = get_user_model()


@dataclass
class RegistrationResult:
    user: object  # concrete user instance
    verification_code: VerificationCode


@transaction.atomic
def register_user_with_verification(
    email: str, name: str, password: str
) -> RegistrationResult:
    existing_user = UserModel.objects.filter(email=email).first()

    if existing_user:
        if existing_user.is_active:
            raise ValueError("User with this email already exists")
        existing_user.name = name
        existing_user.set_password(password)
        existing_user.save()
        VerificationCode.objects.filter(user=existing_user).delete()
        verification_code = VerificationCode.objects.create(user=existing_user)
        verification_code.send()
        return RegistrationResult(
            user=existing_user, verification_code=verification_code
        )

    user = UserModel.objects.create_user(email=email, name=name, password=password)
    verification_code = VerificationCode.objects.create(user=user)
    verification_code.send()
    return RegistrationResult(user=user, verification_code=verification_code)


def request_password_reset(email: str) -> PasswordResetToken | None:
    """Create a PasswordResetToken and log the email templates to console."""
    try:
        user = UserModel.objects.get(email=email)
    except UserModel.DoesNotExist:
        return None

    PasswordResetToken.objects.filter(user=user).delete()
    reset_token = PasswordResetToken.objects.create(user=user)

    # Build frontend reset URL (Vite default port) and log templates
    reset_url = f"http://localhost:5173/reset-password?token={reset_token.token}"
    plain_text, html_message = get_password_reset_email_template(
        user_name=user.name or user.email,
        reset_url=reset_url,
    )

    # Use print so it always appears in container logs regardless of logging config
    print("=== PASSWORD RESET EMAIL (TEXT) ===")
    print(plain_text)
    print("=== PASSWORD RESET EMAIL (HTML) ===")
    print(html_message)

    return reset_token


def reset_password(token_value, new_password: str) -> object:
    reset_token = PasswordResetToken.objects.select_for_update().get(token=token_value)
    if reset_token.is_expired:
        raise ValueError("expired")
    user = reset_token.user
    # Reject if new password is same as current one
    if check_password(new_password, user.password):
        raise ValueError("same_password")
    user.set_password(new_password)
    user.save()
    reset_token.delete()
    return user
