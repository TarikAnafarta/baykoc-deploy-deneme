# -*- coding: utf-8 -*-
"""
CI/Test settings for BayKoc.

These settings are intended for running the test suite locally or in CI
(GitHub Actions). They avoid any external service dependencies such as
Cloudinary by using local file storage and in-memory email backend.

Usage:
  export DJANGO_SETTINGS_MODULE=backend.settings_ci
  python manage.py test
"""
import os

from .settings import *  # noqa: F401,F403

CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        "LOCATION": "unique-ci",
    }
}

# Use local filesystem storage instead of Cloudinary during tests/CI
DEFAULT_FILE_STORAGE = "django.core.files.storage.FileSystemStorage"
STATICFILES_STORAGE = "django.contrib.staticfiles.storage.StaticFilesStorage"

# Test/CI-specific paths
MEDIA_ROOT = BASE_DIR / "media"  # noqa: F405  (BASE_DIR comes from base settings)
STATIC_ROOT = BASE_DIR / "staticfiles"  # noqa: F405

# Faster password hasher for tests (optional optimization)
PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.MD5PasswordHasher",
]

# In-memory email backend for assertions
EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"

# REST Framework: keep renderers minimal for speed in tests
REST_FRAMEWORK = {
    **REST_FRAMEWORK,  # noqa: F405
    "DEFAULT_RENDERER_CLASSES": ["rest_framework.renderers.JSONRenderer"],
}

# Allow DB engine selection via env; default to SQLite for local convenience.
TEST_DB_ENGINE = os.getenv("DB_ENGINE", "django.db.backends.sqlite3")

if TEST_DB_ENGINE.endswith("sqlite3"):
    DATABASES["default"] = {  # noqa: F405
        "ENGINE": TEST_DB_ENGINE,
        "NAME": BASE_DIR / "test.sqlite3",  # noqa: F405
    }
else:
    DATABASES["default"] = {  # noqa: F405
        "ENGINE": TEST_DB_ENGINE,
        "NAME": os.getenv("DB_NAME", "baykoc_test"),
        "USER": os.getenv("DB_USER", "postgres"),
        "PASSWORD": os.getenv("DB_PASSWORD", "postgres"),
        "HOST": os.getenv("DB_HOST", "127.0.0.1"),
        "PORT": os.getenv("DB_PORT", "5432"),
    }
