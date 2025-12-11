from __future__ import annotations

import time
from dataclasses import dataclass
from typing import Any, Dict
from urllib.parse import urlencode

import requests
from django.conf import settings
from django.core import signing
from django.utils.crypto import get_random_string
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from rest_framework.authtoken.models import Token

from backend.users.models import User


class GoogleOAuthError(Exception):
    """Domain-specific error for Google OAuth failures."""


@dataclass
class GoogleOAuthResult:
    user: User
    token: str
    next_path: str


class GoogleOAuthService:
    TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token"
    STATE_SALT = "backend.users.google_oauth.state"

    def __init__(self):
        self.client_id = getattr(settings, "GOOGLE_CLIENT_ID", "")
        self.client_secret = getattr(settings, "GOOGLE_CLIENT_SECRET", "")
        self.redirect_uri = getattr(
            settings,
            "GOOGLE_REDIRECT_URI",
            "http://localhost:8000/api/users/auth/google/callback",
        )
        self.scopes = getattr(
            settings, "GOOGLE_OAUTH_SCOPES", ["openid", "email", "profile"]
        )
        self.state_max_age = getattr(settings, "GOOGLE_OAUTH_STATE_MAX_AGE", 300)
        if not self.client_id or not self.client_secret:
            raise GoogleOAuthError("Google OAuth client configuration is missing.")

    def build_authorization_url(self, next_path: str | None = None) -> str:
        """Return the Google consent screen URL with a signed state token."""
        state_value = self._encode_state(next_path)
        params = {
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "response_type": "code",
            "scope": " ".join(self.scopes),
            "access_type": "offline",
            "include_granted_scopes": "true",
            "prompt": "select_account",
            "state": state_value,
        }
        return f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"

    def process_callback(self, *, code: str, state: str) -> GoogleOAuthResult:
        """Handle Google's callback by exchanging the code and syncing the user."""
        state_payload = self._decode_state(state)
        tokens = self._exchange_code_for_tokens(code)
        id_info = self._verify_id_token(tokens.get("id_token"))
        user = self._sync_user(id_info)
        token, _ = Token.objects.get_or_create(user=user)
        return GoogleOAuthResult(
            user=user,
            token=token.key,
            next_path=state_payload["next"],
        )

    def _encode_state(self, next_path: str | None) -> str:
        payload = {
            "next": self._sanitize_next_path(next_path),
            "nonce": get_random_string(32),
            "ts": int(time.time()),
        }
        return signing.dumps(payload, salt=self.STATE_SALT)

    def _decode_state(self, value: str) -> Dict[str, Any]:
        if not value:
            raise GoogleOAuthError("Missing OAuth state parameter.")
        try:
            data = signing.loads(
                value,
                salt=self.STATE_SALT,
                max_age=self.state_max_age,
            )
        except signing.BadSignature as exc:
            raise GoogleOAuthError("OAuth state could not be verified.") from exc
        return data

    def _exchange_code_for_tokens(self, code: str) -> Dict[str, Any]:
        if not code:
            raise GoogleOAuthError("Missing authorization code from Google.")
        payload = {
            "code": code,
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "redirect_uri": self.redirect_uri,
            "grant_type": "authorization_code",
        }
        try:
            response = requests.post(
                self.TOKEN_ENDPOINT,
                data=payload,
                timeout=10,
            )
            response.raise_for_status()
        except requests.RequestException as exc:
            raise GoogleOAuthError(
                "Failed to communicate with Google OAuth servers."
            ) from exc

        data = response.json()
        if "id_token" not in data:
            raise GoogleOAuthError("Google response did not include an id_token.")
        return data

    def _verify_id_token(self, raw_id_token: str | None) -> Dict[str, Any]:
        if not raw_id_token:
            raise GoogleOAuthError("Google response did not include an id_token.")
        try:
            request_adapter = google_requests.Request()
            id_info = id_token.verify_oauth2_token(
                raw_id_token,
                request_adapter,
                self.client_id,
            )
        except ValueError as exc:
            raise GoogleOAuthError("Google token verification failed.") from exc

        if not id_info.get("email"):
            raise GoogleOAuthError("Google account did not return an email address.")
        if not id_info.get("email_verified"):
            raise GoogleOAuthError("Google email is not verified.")
        if not id_info.get("sub"):
            raise GoogleOAuthError(
                "Google account did not include a subject identifier."
            )
        return id_info

    def _sync_user(self, id_info: Dict[str, Any]) -> User:
        email = id_info["email"].lower()
        google_sub = id_info["sub"]
        name = id_info.get("name") or email.split("@")[0]

        user = User.objects.filter(email=email).first()
        if user is None:
            user = User.objects.create_user(email=email, name=name)
            user.set_unusable_password()
            user.save(update_fields=["password"])

        if user.google_sub and user.google_sub != google_sub:
            raise GoogleOAuthError(
                "Google account is already linked to another BayKo\u00e7 user."
            )

        updated_fields = set()
        if not user.google_sub:
            user.google_sub = google_sub
            updated_fields.add("google_sub")
        if not user.is_active:
            user.is_active = True
            updated_fields.add("is_active")
        if name and not user.name:
            user.name = name
            updated_fields.add("name")
        if not user.has_usable_password():
            user.set_unusable_password()
            updated_fields.add("password")

        if updated_fields:
            user.save(update_fields=list(updated_fields))
        return user

    def _sanitize_next_path(self, next_path: str | None) -> str:
        if not next_path:
            return "/dashboard"
        if not next_path.startswith("/"):
            return "/dashboard"
        return next_path
