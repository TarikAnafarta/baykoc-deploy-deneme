from unittest.mock import MagicMock, patch

from django.test import TestCase, override_settings
from rest_framework.authtoken.models import Token

from backend.users.models import User
from backend.users.services.google_oauth import GoogleOAuthError, GoogleOAuthService


@override_settings(
    GOOGLE_CLIENT_ID="test-client",
    GOOGLE_CLIENT_SECRET="test-secret",
    GOOGLE_REDIRECT_URI="http://localhost:8000/api/users/auth/google/callback",
)
class GoogleOAuthServiceTest(TestCase):
    def test_build_authorization_url_contains_required_params(self):
        service = GoogleOAuthService()
        url = service.build_authorization_url("/dashboard")
        self.assertIn("client_id=test-client", url)
        self.assertIn("response_type=code", url)
        self.assertIn("state=", url)

    @patch("backend.users.services.google_oauth.id_token.verify_oauth2_token")
    @patch("backend.users.services.google_oauth.requests.post")
    def test_process_callback_creates_or_updates_user(self, mock_post, mock_verify):
        mock_response = MagicMock()
        mock_response.json.return_value = {"id_token": "encoded-token"}
        mock_response.raise_for_status.return_value = None
        mock_post.return_value = mock_response

        mock_verify.return_value = {
            "sub": "google-sub-1",
            "email": "oauth@example.com",
            "email_verified": True,
            "name": "OAuth User",
        }

        service = GoogleOAuthService()
        state_value = service._encode_state("/dashboard")
        result = service.process_callback(code="abc123", state=state_value)

        self.assertEqual(result.user.email, "oauth@example.com")
        self.assertTrue(result.user.is_active)
        token = Token.objects.get(user=result.user)
        self.assertEqual(result.token, token.key)

    def test_missing_configuration_raises(self):
        with override_settings(GOOGLE_CLIENT_SECRET=""):
            with self.assertRaises(GoogleOAuthError):
                GoogleOAuthService()

    def test_existing_user_with_different_google_sub_fails(self):
        user = User.objects.create_user(
            email="conflict@example.com",
            name="Conflict User",
            password="SecurePass123!",
            is_active=True,
        )
        user.google_sub = "original-sub"
        user.save(update_fields=["google_sub"])

        service = GoogleOAuthService()
        state_value = service._encode_state("/dashboard")

        with patch(
            "backend.users.services.google_oauth.requests.post"
        ) as mock_post, patch(
            "backend.users.services.google_oauth.id_token.verify_oauth2_token"
        ) as mock_verify:
            mock_response = MagicMock()
            mock_response.json.return_value = {"id_token": "encoded-token"}
            mock_response.raise_for_status.return_value = None
            mock_post.return_value = mock_response

            mock_verify.return_value = {
                "sub": "different-sub",
                "email": "conflict@example.com",
                "email_verified": True,
                "name": "Conflict User",
            }

            with self.assertRaises(GoogleOAuthError):
                service.process_callback(code="abc", state=state_value)
