from django.urls import path

from .views import JobListView
from .views import JobDetailView
from .views import FetchJobsView
from .views import AnalyzeJobView
from .views import GenerateResumeView
from .views import GenerateEmailView
from .views import AnalyzeJobImageView
from .views import SavedJobListCreateView
from .views import SavedJobDeleteView

urlpatterns = [

    path(
        "",
        JobListView.as_view(),
        name="job-list"
    ),

    # Declared before "<int:pk>/" so the literal path always wins.
    path(
        "saved/",
        SavedJobListCreateView.as_view(),
        name="saved-jobs",
    ),
    path(
        "saved/<int:job_id>/",
        SavedJobDeleteView.as_view(),
        name="saved-job-delete",
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