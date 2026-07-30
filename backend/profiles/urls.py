from django.urls import path

from .views import ProfileView
from .views import CVUploadView
from .views import CVListView
from .views import CVDeleteView


urlpatterns = [

    path(
        "",
        ProfileView.as_view(),
        name="profile"
    ),

    path(
        "cvs/",
        CVListView.as_view(),
        name="cv-list"
    ),

    path(
        "cvs/upload/",
        CVUploadView.as_view(),
        name="cv-upload"
    ),

    path(
        "cvs/<int:pk>/delete/",
        CVDeleteView.as_view(),
        name="cv-delete"
    ),

]