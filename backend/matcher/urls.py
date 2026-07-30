from django.urls import path
from .views import MatchedJobListView
from .views import MatchJobsView

urlpatterns = [
    path(
        "match/",
        MatchJobsView.as_view(),
        name="match-jobs"
    ),
    path(
        "matches/",
        MatchedJobListView.as_view(),
        name="matched-jobs"
    ),
]