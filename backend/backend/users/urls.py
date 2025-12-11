from django.urls import path

from backend.users.views import (
    GoogleOAuthCallbackAPIView,
    GoogleOAuthStartAPIView,
    UserAPIView,
    UserChangePasswordAPIView,
    UserCompleteProfileAPIView,
    UserForgotPasswordAPIView,
    UserLoginAPIView,
    UserLogoutAPIView,
    UserRegisterAPIView,
    UserResetPasswordAPIView,
    UserVerifyAPIView,
)

app_name = "users"

urlpatterns = [
    # API endpoints
    path("me/", UserAPIView.as_view(), name="user-me"),
    path("login/", UserLoginAPIView.as_view(), name="user-login"),
    path("register/", UserRegisterAPIView.as_view(), name="user-register"),
    path("logout/", UserLogoutAPIView.as_view(), name="user-logout"),
    path(
        "change-password/",
        UserChangePasswordAPIView.as_view(),
        name="user-change-password",
    ),
    path("verify/", UserVerifyAPIView.as_view(), name="user-verify"),
    path(
        "forgot-password/", UserForgotPasswordAPIView.as_view(), name="forgot-password"
    ),
    path("reset-password/", UserResetPasswordAPIView.as_view(), name="reset-password"),
    path(
        "complete-profile/",
        UserCompleteProfileAPIView.as_view(),
        name="complete-profile",
    ),
    path(
        "auth/google/login/",
        GoogleOAuthStartAPIView.as_view(),
        name="google-login",
    ),
    path(
        "auth/google/callback/",
        GoogleOAuthCallbackAPIView.as_view(),
        name="google-callback",
    ),
    # Support Google's exact redirect URL without the trailing slash to avoid 301s.
    path(
        "auth/google/callback",
        GoogleOAuthCallbackAPIView.as_view(),
        name="google-callback-no-slash",
    ),
]
