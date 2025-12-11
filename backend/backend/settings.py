# -*- coding: utf-8 -*-
"""
Django settings for BayKoc backend.
"""

import os
from pathlib import Path

import cloudinary
from decouple import Csv, config
from dotenv import load_dotenv

load_dotenv()

# Build paths inside the project
BASE_DIR = Path(__file__).resolve().parent.parent

ENVIRONMENT = config("DJANGO_ENV", default="development")
IS_PRODUCTION = ENVIRONMENT == "production"

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = config(
    "SECRET_KEY", default="django-insecure-dev-key-change-in-production"
)

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = config("DEBUG", default=not IS_PRODUCTION, cast=bool)
LOG_LEVEL = config("LOG_LEVEL", default="INFO").upper()

ALLOWED_HOSTS = config("ALLOWED_HOSTS", default="localhost,127.0.0.1", cast=Csv())

AUTH_USER_MODEL = "users.User"

# Application definition
INSTALLED_APPS = [
    "cloudinary",
    "cloudinary_storage",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "rest_framework.authtoken",
    "corsheaders",
    "django_extensions",
    "backend.artifacts",
    "backend.users",
]

# Cloudinary configuration
if not config("DISABLE_CLOUDINARY", default=False, cast=bool):
    cloudinary.config(
        cloud_name=os.getenv("CLOUDINARY_NAME"),
        api_key=os.getenv("CLOUDINARY_API_KEY"),
        api_secret=os.getenv("CLOUDINARY_API_SECRET"),
        secure=True,
    )

    CLOUDINARY_STORAGE = {
        "CLOUD_NAME": os.getenv("CLOUDINARY_NAME"),
        "API_KEY": os.getenv("CLOUDINARY_API_KEY"),
        "API_SECRET": os.getenv("CLOUDINARY_API_SECRET"),
    }
else:
    CLOUDINARY_STORAGE = {}

# File & static storage backends (Cloudinary or local filesystem)
if CLOUDINARY_STORAGE:
    DEFAULT_FILE_STORAGE = "cloudinary_storage.storage.MediaCloudinaryStorage"
    STATICFILES_STORAGE = "cloudinary_storage.storage.StaticCloudinaryStorage"
else:
    DEFAULT_FILE_STORAGE = "django.core.files.storage.FileSystemStorage"
    STATICFILES_STORAGE = "django.contrib.staticfiles.storage.StaticFilesStorage"

MEDIA_URL = "/media/"

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "backend.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],  # no project-level templates (React handles UI)
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "backend.wsgi.application"

# Database
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": config("DB_NAME", default="baykoc"),
        "USER": config("DB_USER", default="postgres"),
        "PASSWORD": config("DB_PASSWORD", default=""),
        "HOST": config("DB_HOST", default="localhost"),
        "PORT": config("DB_PORT", default="5432"),
    }
}

# Redis cache configuration (backed by docker-compose redis service)
REDIS_URL = config("REDIS_URL", default="redis://127.0.0.1:6379/0")
REDIS_CACHE_PREFIX = config("REDIS_CACHE_PREFIX", default="baykoc")
CACHE_TIMEOUT_SECONDS = config("CACHE_TIMEOUT_SECONDS", default=300, cast=int)
REDIS_MAX_CONNECTIONS = config("REDIS_MAX_CONNECTIONS", default=50, cast=int)

CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": REDIS_URL,
        "TIMEOUT": CACHE_TIMEOUT_SECONDS,
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
            "CONNECTION_POOL_KWARGS": {
                "max_connections": REDIS_MAX_CONNECTIONS,
            },
        },
        "KEY_PREFIX": REDIS_CACHE_PREFIX,
    }
}

SESSION_ENGINE = "django.contrib.sessions.backends.cache"
SESSION_CACHE_ALIAS = "default"

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"
    },
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# Internationalization
LANGUAGE_CODE = "tr-tr"
TIME_ZONE = "Europe/Istanbul"
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = "static/"
STATICFILES_DIRS = (
    []
)  # no project static dir; static served by React or collected in STATIC_ROOT if any
STATIC_ROOT = BASE_DIR / "staticfiles"

# Default primary key field type
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# REST Framework settings
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.TokenAuthentication",
        "rest_framework.authentication.SessionAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_RENDERER_CLASSES": [
        "rest_framework.renderers.JSONRenderer",
        "rest_framework.renderers.BrowsableAPIRenderer",
    ],
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 100,
}

FRONTEND_URL = config("FRONTEND_URL", default="http://localhost:5173")
FRONTEND_ORIGINS = config(
    "FRONTEND_ORIGINS",
    default=FRONTEND_URL,
    cast=Csv(),
)
FRONTEND_ORIGINS = [origin for origin in FRONTEND_ORIGINS if origin]
if not FRONTEND_ORIGINS and FRONTEND_URL:
    FRONTEND_ORIGINS = [FRONTEND_URL]
DEV_FRONTEND_ORIGINS = ["http://127.0.0.1:5173", "http://localhost:5173"]

# Google OAuth configuration
GOOGLE_CLIENT_ID = config("GOOGLE_CLIENT_ID", default="")
GOOGLE_CLIENT_SECRET = config("GOOGLE_CLIENT_SECRET", default="")
GOOGLE_REDIRECT_URI = config(
    "GOOGLE_REDIRECT_URI",
    default="http://localhost:8000/api/users/auth/google/callback",
)
GOOGLE_OAUTH_SCOPES = ["openid", "email", "profile"]
GOOGLE_OAUTH_STATE_MAX_AGE = config("GOOGLE_OAUTH_STATE_MAX_AGE", default=300, cast=int)

# CORS settings (dev: allow Vite; prod: restrict origins)
if DEBUG:
    CORS_ALLOW_ALL_ORIGINS = True
    CORS_ALLOWED_ORIGINS = list(
        dict.fromkeys(FRONTEND_ORIGINS + DEV_FRONTEND_ORIGINS)
    )
else:
    CORS_ALLOW_ALL_ORIGINS = False
    CORS_ALLOWED_ORIGINS = FRONTEND_ORIGINS

CORS_ALLOW_CREDENTIALS = True

# CSRF settings to trust the frontend origin (only needed if using SessionAuth/CSRF)
CSRF_TRUSTED_ORIGINS = list(dict.fromkeys(FRONTEND_ORIGINS + DEV_FRONTEND_ORIGINS))

CSRF_COOKIE_HTTPONLY = True
CSRF_USE_SESSIONS = False
CSRF_COOKIE_SAMESITE = "Lax"

# Email settings (for development - console backend)
EMAIL_BACKEND = config(
    "EMAIL_BACKEND",
    default="django.core.mail.backends.console.EmailBackend",
)
DEFAULT_FROM_EMAIL = config("DEFAULT_FROM_EMAIL", default="noreply@baykoc.com")

# Points to /app/data/curriculum in Docker and <repo>/backend/data/curriculum locally
CURRICULUM_DIR = (BASE_DIR / "data" / "curriculum").resolve()

# Verification / reset config
VERIFICATION_CODE_EXPIRY_MINUTES = config(
    "VERIFICATION_CODE_EXPIRY_MINUTES", default=30, cast=int
)
PASSWORD_RESET_EXPIRY_MINUTES = config(
    "PASSWORD_RESET_EXPIRY_MINUTES", default=30, cast=int
)

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "[%(asctime)s] %(levelname)s %(name)s: %(message)s",
        }
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "verbose",
        }
    },
    "root": {
        "handlers": ["console"],
        "level": LOG_LEVEL,
    },
    "loggers": {
        "django": {
            "handlers": ["console"],
            "level": LOG_LEVEL,
            "propagate": False,
        },
        "backend.artifacts": {
            "handlers": ["console"],
            "level": LOG_LEVEL,
            "propagate": False,
        },
    },
}
