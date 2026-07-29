from django.urls import path

from .views import JobListView
from .views import JobDetailView
from .views import FetchJobsView
from .views import AnalyzeJobView
from .views import GenerateResumeView
from .views import GenerateEmailView
from .views import AnalyzeJobImageView

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
    path(
        "analyze/",
        AnalyzeJobView.as_view(),
        name="analyze-job",
    ),
    path(
        "analyze-image/",
        AnalyzeJobImageView.as_view(),
        name="analyze-job-image",
    ),
    path(
        "generate-resume/",
        GenerateResumeView.as_view(),
        name="generate-resume",
    ),
    path(
        "generate-email/",
        GenerateEmailView.as_view(),
        name="generate-email",
    ),

]