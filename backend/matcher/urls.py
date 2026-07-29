from django.urls import path
from .views import MatchJobsView

urlpatterns = [
    path(
        "match/",
        MatchJobsView.as_view(),
        name="match-jobs"
    ),
]