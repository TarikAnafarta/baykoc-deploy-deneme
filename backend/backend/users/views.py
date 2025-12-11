import logging
from urllib.parse import urlencode

from django.conf import settings
from django.contrib.auth import logout
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.db import transaction
from django.shortcuts import redirect
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from backend.users.models import PasswordResetToken, User, VerificationCode
from backend.users.serializers import (
    UserChangePasswordSerializer,
    UserCompleteProfileSerializer,
    UserForgotPasswordSerializer,
    UserLoginSerializer,
    UserRegisterSerializer,
    UserResetPasswordSerializer,
    UserSerializer,
)
from backend.users.services.auth import (
    register_user_with_verification,
    request_password_reset,
    reset_password,
)
from backend.users.services.google_oauth import GoogleOAuthError, GoogleOAuthService

# Removed legacy template-based views (migrated to React SPA)


@method_decorator(csrf_exempt, name="dispatch")
class UserAPIView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request, *args, **kwargs):
        user = request.user
        serializer = UserSerializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, *args, **kwargs):
        user = request.user
        serializer = UserSerializer(user, data=request.data, partial=True)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, *args, **kwargs):
        user = request.user

        if "profile_picture" in request.FILES:
            user.profile_picture = request.FILES["profile_picture"]
            user.save(update_fields=["profile_picture"])
            return Response(
                {"message": "Profil fotoğrafı güncellendi."}, status=status.HTTP_200_OK
            )

        return Response(
            {"message": "No profile picture provided"},
            status=status.HTTP_400_BAD_REQUEST,
        )


@method_decorator(csrf_exempt, name="dispatch")
class UserRegisterAPIView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request, *args, **kwargs):
        serializer = UserRegisterSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data.get("email")
        name = serializer.validated_data.get("name")
        password = serializer.validated_data.get("password")

        try:
            result = register_user_with_verification(
                email=email, name=name, password=password
            )
        except ValueError as exc:
            return Response({"message": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logging.error(f"User creation failed: {e}")
            return Response(
                {"message": "Error creating user."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        verification_code = result.verification_code
        if settings.DEBUG:
            message = (
                f"User created successfully. Verification code: {verification_code.code}"
                " (Check email or console)"
            )
        else:
            message = "User created successfully. Please check your email for verification code."
        return Response({"message": message}, status=status.HTTP_201_CREATED)


@method_decorator(csrf_exempt, name="dispatch")
class UserLoginAPIView(APIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)

    def post(self, request, *args, **kwargs):
        serializer = UserLoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"message": "Email or password is wrong."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        email = serializer.validated_data["email"]
        password = serializer.validated_data["password"]
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {"message": "Email or password is wrong."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not user.is_active:
            return Response(
                {"message": "Account is inactive."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if not user.check_password(password):
            return Response(
                {"message": "Email or password is wrong."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from rest_framework.authtoken.models import Token

        token, _ = Token.objects.get_or_create(user=user)
        return Response({"token": token.key}, status=status.HTTP_200_OK)


@method_decorator(csrf_exempt, name="dispatch")
class UserLogoutAPIView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request, *args, **kwargs):
        token = getattr(request.user, "auth_token", None)
        if token is not None:
            token.delete()
        logout(request)
        return Response({"message": "User logged out."}, status=status.HTTP_200_OK)


@method_decorator(csrf_exempt, name="dispatch")
class UserChangePasswordAPIView(APIView):
    def post(self, request, *args, **kwargs):
        serializer = UserChangePasswordSerializer(data=request.data)
        user = self.request.user
        if serializer.is_valid():
            if not user.check_password(serializer.data.get("current_password")):
                return Response(
                    {"message": "Current password is wrong."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if serializer.data.get("current_password") == serializer.data.get(
                "new_password"
            ):
                return Response(
                    {
                        "message": "New password must be different from the current password."
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            try:
                validate_password(serializer.data.get("new_password"), user)
            except ValidationError:
                return Response(
                    {
                        "message": "This password is too short (must be at least 8 characters), "
                        "too common, or entirely numeric. Please choose a stronger password."
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            user.set_password(serializer.data.get("new_password"))
            user.save()
            return Response(
                {"message": "Password updated successfully"}, status=status.HTTP_200_OK
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@method_decorator(csrf_exempt, name="dispatch")
class UserVerifyAPIView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request, *args, **kwargs):
        code = request.data.get("code", None)
        if not code:
            return Response(
                {"message": "Verification code is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        email = request.data.get("email", None)
        if not email:
            return Response(
                {"message": "Email is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            verification_code = VerificationCode.objects.get(
                code=code, user__email=email
            )
            if verification_code.is_expired:
                return Response(
                    {"message": "Verification code has expired."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            verification_code.user.is_active = True
            verification_code.user.save()
            verification_code.delete()
            return Response(
                {"message": "Account activated successfully."},
                status=status.HTTP_200_OK,
            )
        except VerificationCode.DoesNotExist:
            return Response(
                {"message": "Invalid verification code."},
                status=status.HTTP_400_BAD_REQUEST,
            )


@method_decorator(csrf_exempt, name="dispatch")
class UserForgotPasswordAPIView(APIView):
    """Forgot-password endpoint which generates a reset token.

    Email templates are generated & printed in request_password_reset, so here we
    just call the service and return a generic success message.
    """

    permission_classes = (AllowAny,)

    def post(self, request, *args, **kwargs):
        serializer = UserForgotPasswordSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data["email"]

        try:
            reset_token = request_password_reset(email=email)
        except Exception as exc:
            logging.error("Password reset request failed for %s: %s", email, exc)
            return Response(
                {"message": "Something went wrong while preparing password reset."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if reset_token is None:
            # Email not found; do not reveal this to the client
            logging.info("Password reset requested for non-existent email: %s", email)

        # Always respond with a generic message
        return Response(
            {
                "message": "If this email is registered, password reset instructions were generated. Check backend logs for the email template.",
            },
            status=status.HTTP_200_OK,
        )


@method_decorator(csrf_exempt, name="dispatch")
class UserResetPasswordAPIView(APIView):
    permission_classes = (AllowAny,)

    @transaction.atomic
    def post(self, request, *args, **kwargs):
        serializer = UserResetPasswordSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        token_value = serializer.validated_data["token"]
        new_password = serializer.validated_data["new_password"]

        try:
            reset_password(token_value=token_value, new_password=new_password)
        except PasswordResetToken.DoesNotExist:
            return Response(
                {"message": "Invalid password reset link."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except ValueError as exc:
            if str(exc) == "expired":
                return Response(
                    {"message": "Password reset link has expired."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if str(exc) == "same_password":
                return Response(
                    {
                        "message": "New password must be different from the current password.",
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
            return Response(
                {"message": "Something went wrong."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception:
            return Response(
                {"message": "Something went wrong."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {"message": "Password reset successfully."},
            status=status.HTTP_200_OK,
        )


@method_decorator(csrf_exempt, name="dispatch")
class UserCompleteProfileAPIView(APIView):
    """API endpoint for users to complete their profile after registration."""

    permission_classes = (IsAuthenticated,)

    def post(self, request, *args, **kwargs):
        user = request.user
        serializer = UserCompleteProfileSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user.grade = serializer.validated_data["grade"]
        user.track = serializer.validated_data["track"]
        user.language = serializer.validated_data.get("language")
        user.profile_completed = True
        user.save(update_fields=["grade", "track", "language", "profile_completed"])

        return Response(
            {"message": "Profil başarıyla tamamlandı."},
            status=status.HTTP_200_OK,
        )

    def get(self, request, *args, **kwargs):
        user = request.user
        serializer = UserSerializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)


@method_decorator(csrf_exempt, name="dispatch")
class GoogleOAuthStartAPIView(APIView):
    permission_classes = (AllowAny,)

    def get(self, request, *args, **kwargs):
        next_path = request.query_params.get("next")
        try:
            service = GoogleOAuthService()
            authorization_url = service.build_authorization_url(next_path)
        except GoogleOAuthError as exc:
            return Response(
                {"message": str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        return Response(
            {"authorization_url": authorization_url}, status=status.HTTP_200_OK
        )


@method_decorator(csrf_exempt, name="dispatch")
class GoogleOAuthCallbackAPIView(APIView):
    permission_classes = (AllowAny,)
    authentication_classes = []

    def get(self, request, *args, **kwargs):
        error_code = request.query_params.get("error")
        if error_code:
            return self._redirect_with_error(
                request.query_params.get("error_description") or error_code
            )

        code = request.query_params.get("code")
        state = request.query_params.get("state")
        if not code or not state:
            return self._redirect_with_error("Missing authorization data from Google.")

        try:
            service = GoogleOAuthService()
        except GoogleOAuthError as exc:
            return self._redirect_with_error(str(exc))

        try:
            result = service.process_callback(code=code, state=state)
        except GoogleOAuthError as exc:
            return self._redirect_with_error(str(exc))

        params = {
            "token": result.token,
            "next": result.next_path,
            "profile_completed": "true" if result.user.profile_completed else "false",
        }
        redirect_url = (
            f"{settings.FRONTEND_URL}/auth/google/callback?{urlencode(params)}"
        )
        return redirect(redirect_url)

    def _redirect_with_error(self, message: str):
        params = urlencode({"error": message})
        redirect_url = f"{settings.FRONTEND_URL}/auth/google/callback?{params}"
        return redirect(redirect_url)
