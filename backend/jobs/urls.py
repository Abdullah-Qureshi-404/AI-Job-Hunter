from django.urls import path

from .views import JobListView
from .views import JobDetailView
from .views import FetchJobsView

urlpatterns = [

    path(
        "",
        JobListView.as_view(),
        name="job-list"
    ),

    path(
        "<int:pk>/",
        JobDetailView.as_view(),
        name="job-detail"
    ),
    path(
    "fetch/",
    FetchJobsView.as_view(),
    name="fetch-jobs",
    ),

]