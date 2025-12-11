# -*- coding: utf-8 -*-
"""DB-heavy tests for custom User model and related tokens.

Uses Django TestCase to require a real database (PostgreSQL in CI).
"""
from django.contrib.auth import get_user_model
from django.test import TestCase

from backend.users.models import PasswordResetToken, VerificationCode


class UserModelDBTest(TestCase):
    def test_create_user_and_related_models(self):
        User = get_user_model()
        user = User.objects.create_user(
            email="alice@example.com",
            password="Str0ngPass!",
            name="Alice",
            is_active=True,
        )
        self.assertTrue(user.pk)
        self.assertTrue(user.check_password("Str0ngPass!"))

        # Create VerificationCode (OneToOne)
        vc = VerificationCode.objects.create(user=user)
        self.assertEqual(vc.user_id, user.pk)
        self.assertFalse(vc.is_expired)

        # Send should not raise with locmem backend
        vc.send()

        # Create PasswordResetToken (ForeignKey)
        token = PasswordResetToken.objects.create(user=user)
        self.assertEqual(token.user_id, user.pk)
        self.assertFalse(token.is_expired)

    def test_unique_reset_token_constraint(self):
        User = get_user_model()
        user = User.objects.create_user(
            email="bob@example.com",
            password="An0therPass!",
            name="Bob",
            is_active=True,
        )
        # First token ok
        PasswordResetToken.objects.create(user=user)
        self.assertEqual(user.password_reset_tokens.count(), 1)

        # Attempting to create another token for same user should fail (unique constraint)
        from django.db import IntegrityError

        with self.assertRaises(IntegrityError):
            PasswordResetToken.objects.create(user=user)
