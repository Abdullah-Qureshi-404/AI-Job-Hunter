"""
URL configuration for the AI Job Hunter project.
"""

from django.contrib import admin
from django.conf import settings
from django.conf.urls.static import static
from django.urls import include, path


urlpatterns = [
    path("admin/", admin.site.urls),

    path("api/jobs/", include("jobs.urls")),
    path("api/profiles/", include("profiles.urls")),
    path("api/matcher/", include("matcher.urls")),
    path("api/outreach/", include("outreach.urls")),
    # path("api/tracker/", include("tracker.urls")),
]

# Serve uploaded media files during development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)