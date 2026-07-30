"""
Django settings for AI Job Hunter project.

This settings file is configured for:
- Django REST Framework
- Supabase PostgreSQL
- React Frontend
- Environment variables
"""

from pathlib import Path
import os
import sys

from django.core.exceptions import ImproperlyConfigured
from dotenv import load_dotenv
import dj_database_url


# ---------------------------------------------------
# Load environment variables
# ---------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent.parent

# Explicit path: relying on working-directory discovery meant running
# manage.py from the repo root silently loaded nothing, then crashed on a
# missing DATABASE_URL with an unrelated traceback.
load_dotenv(BASE_DIR / ".env", interpolate=False)

# Include Apply AI backend in sys.path for services.apply_ai_client import
APPLY_AI_BACKEND = BASE_DIR.parent.parent / "Apply AI" / "backend"
if APPLY_AI_BACKEND.exists() and str(APPLY_AI_BACKEND) not in sys.path:
    sys.path.append(str(APPLY_AI_BACKEND))



# ---------------------------------------------------
# Security
# ---------------------------------------------------

SECRET_KEY = os.getenv(
    "SECRET_KEY",
    "django-insecure-change-this-in-production"
)

DEBUG = os.getenv("DEBUG", "True") == "True"

ALLOWED_HOSTS = os.getenv(
    "ALLOWED_HOSTS",
    "127.0.0.1,localhost"
).split(",")


# ---------------------------------------------------
# Installed Applications
# ---------------------------------------------------

INSTALLED_APPS = [
    # Django Apps
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    # Third Party Apps
    "rest_framework",
    "corsheaders",
    "django_filters",

    # Local Apps
    "jobs",
    "profiles",
    "matcher",
]


# ---------------------------------------------------
# Middleware
# ---------------------------------------------------

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",

    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",

    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",

    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",

    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]


ROOT_URLCONF = "core.urls"


# ---------------------------------------------------
# Templates
# ---------------------------------------------------

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]


WSGI_APPLICATION = "core.wsgi.application"


# ---------------------------------------------------
# Database (Supabase PostgreSQL)
# ---------------------------------------------------

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ImproperlyConfigured(
        "DATABASE_URL is not set. Copy backend/.env.example to backend/.env "
        "and fill in your Supabase connection string."
    )

DATABASES = {
    "default": dj_database_url.parse(DATABASE_URL)
}


# ---------------------------------------------------
# Password Validation
# ---------------------------------------------------

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME":
        "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME":
        "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME":
        "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME":
        "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]


# ---------------------------------------------------
# Internationalization
# ---------------------------------------------------

LANGUAGE_CODE = "en-us"

TIME_ZONE = "UTC"

USE_I18N = True

USE_TZ = True


# ---------------------------------------------------
# Static Files
# ---------------------------------------------------

STATIC_URL = "static/"

STATIC_ROOT = BASE_DIR / "staticfiles"


# ---------------------------------------------------
# Media Files
# ---------------------------------------------------

MEDIA_URL = "/media/"

MEDIA_ROOT = BASE_DIR / "media"


# ---------------------------------------------------
# Default Primary Key
# ---------------------------------------------------

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"


# ---------------------------------------------------
# CORS Settings
# ---------------------------------------------------

# Wide open in development only. In production set CORS_ALLOWED_ORIGINS to a
# comma-separated list of your frontend origins.
_cors_origins = os.getenv("CORS_ALLOWED_ORIGINS", "")

if _cors_origins:
    CORS_ALLOWED_ORIGINS = [
        origin.strip() for origin in _cors_origins.split(",") if origin.strip()
    ]
elif DEBUG:
    CORS_ALLOW_ALL_ORIGINS = True
else:
    raise ImproperlyConfigured(
        "CORS_ALLOWED_ORIGINS must be set when DEBUG is False."
    )


# ---------------------------------------------------
# Supabase Settings
# ---------------------------------------------------

SUPABASE_URL = os.getenv("SUPABASE_URL", "")

SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")


# ---------------------------------------------------
# Django REST Framework
# ---------------------------------------------------

REST_FRAMEWORK = {

    "DEFAULT_AUTHENTICATION_CLASSES": [
        "core.authentication.SupabaseAuthentication",
    ],

    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],

    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ],

    "DEFAULT_PAGINATION_CLASS":
        "rest_framework.pagination.PageNumberPagination",

    "PAGE_SIZE": 20,
}


# ---------------------------------------------------
# Logging
# ---------------------------------------------------

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "[{asctime}] [{levelname}] [{name}] {message}",
            "style": "{",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "verbose",
        },
    },
    "loggers": {
        "jobs": {
            "handlers": ["console"],
            "level": "INFO",
            "propagate": False,
        },
    },
}