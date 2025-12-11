# -*- coding: utf-8 -*-
"""API-level tests for user registration, verification, login, and password reset."""

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from rest_framework.authtoken.models import Token

from backend.users.models import PasswordResetToken, VerificationCode


class UserAPIFLowTest(TestCase):
    def setUp(self):
        self.User = get_user_model()

    def _auth_headers(self, user):
        token, _ = Token.objects.get_or_create(user=user)
        return {"HTTP_AUTHORIZATION": f"Token {token.key}"}

    def test_register_and_verify_and_login(self):
        register_url = reverse("users:user-register")
        login_url = reverse("users:user-login")
        verify_url = reverse("users:user-verify")

        payload = {
            "email": "test@example.com",
            "name": "Test User",
            "password": "StrongPass123!",
        }
        resp = self.client.post(register_url, payload, content_type="application/json")
        self.assertEqual(resp.status_code, 201)

        user = self.User.objects.get(email="test@example.com")
        self.assertFalse(user.is_active)
        code_obj = VerificationCode.objects.get(user=user)

        resp = self.client.post(
            verify_url,
            {"email": user.email, "code": code_obj.code},
            content_type="application/json",
        )
        self.assertEqual(resp.status_code, 200)
        user.refresh_from_db()
        self.assertTrue(user.is_active)

        resp = self.client.post(
            login_url,
            {"email": user.email, "password": payload["password"]},
            content_type="application/json",
        )
        self.assertEqual(resp.status_code, 200)
        self.assertIn("token", resp.json())

    def test_forgot_and_reset_password_flow(self):
        user = self.User.objects.create_user(
            email="forgot@example.com", name="Forgot User", password="OldPass123!"
        )
        user.is_active = True
        user.save()

        forgot_url = reverse("users:forgot-password")
        reset_url = reverse("users:reset-password")

        resp = self.client.post(
            forgot_url,
            {"email": user.email},
            content_type="application/json",
        )
        self.assertEqual(resp.status_code, 200)
        token_obj = PasswordResetToken.objects.get(user=user)

        resp = self.client.post(
            reset_url,
            {
                "token": str(token_obj.token),
                "new_password": "NewPass123!",
                "confirm_password": "NewPass123!",
            },
            content_type="application/json",
        )
        self.assertEqual(resp.status_code, 200)
        user.refresh_from_db()
        self.assertTrue(user.check_password("NewPass123!"))

    def test_logout_is_idempotent(self):
        user = self.User.objects.create_user(
            email="logout@example.com", name="Logout User", password="SomePass123!"
        )
        user.is_active = True
        user.save()
        token = Token.objects.create(user=user)

        logout_url = reverse("users:user-logout")
        headers = {"HTTP_AUTHORIZATION": f"Token {token.key}"}
        resp = self.client.post(logout_url, **headers)
        self.assertEqual(resp.status_code, 200)

        # Second call with the same (now invalid) token should be unauthorized
        resp = self.client.post(logout_url, **headers)
        self.assertEqual(resp.status_code, 401)

    def test_track_change_persists_for_high_grades(self):
        user = self.User.objects.create_user(
            email="profile@example.com",
            name="Profile User",
            password="StrongPass123!",
            grade=10,
            track="sayisal",
        )
        user.is_active = True
        user.save()

        url = reverse("users:user-me")
        headers = self._auth_headers(user)
        resp = self.client.put(
            url,
            {"track": "sozel"},
            content_type="application/json",
            **headers,
        )

        self.assertEqual(resp.status_code, 200)
        user.refresh_from_db()
        self.assertEqual(user.track, "sozel")
        self.assertEqual(user.grade, 10)

    def test_lower_grades_force_lgs_track(self):
        user = self.User.objects.create_user(
            email="profile-lgs@example.com",
            name="LGS User",
            password="StrongPass123!",
            grade=9,
            track="sozel",
        )
        user.is_active = True
        user.save()

        url = reverse("users:user-me")
        headers = self._auth_headers(user)
        resp = self.client.put(
            url,
            {"grade": 8},
            content_type="application/json",
            **headers,
        )

        self.assertEqual(resp.status_code, 200)
        user.refresh_from_db()
        self.assertEqual(user.grade, 8)
        self.assertEqual(user.track, "lgs")

    def test_dil_track_requires_language(self):
        user = self.User.objects.create_user(
            email="dil-missing@example.com",
            name="Dil Missing",
            password="StrongPass123!",
            grade=10,
            track="sayisal",
        )
        user.is_active = True
        user.save()

        url = reverse("users:user-me")
        headers = self._auth_headers(user)
        resp = self.client.put(
            url,
            {"track": "dil"},
            content_type="application/json",
            **headers,
        )

        self.assertEqual(resp.status_code, 400)
        self.assertIn("language", resp.json())

    def test_dil_track_updates_language_and_grade_drop_clears_it(self):
        user = self.User.objects.create_user(
            email="dil-lang@example.com",
            name="Dil Language",
            password="StrongPass123!",
            grade=10,
            track="sayisal",
        )
        user.is_active = True
        user.save()

        url = reverse("users:user-me")
        headers = self._auth_headers(user)

        resp = self.client.put(
            url,
            {"track": "dil", "language": "ingilizce"},
            content_type="application/json",
            **headers,
        )
        self.assertEqual(resp.status_code, 200)
        user.refresh_from_db()
        self.assertEqual(user.track, "dil")
        self.assertEqual(user.language, "ingilizce")

        resp = self.client.put(
            url,
            {"grade": 8},
            content_type="application/json",
            **headers,
        )
        self.assertEqual(resp.status_code, 200)
        user.refresh_from_db()
        self.assertEqual(user.grade, 8)
        self.assertEqual(user.track, "lgs")
        self.assertIsNone(user.language)
