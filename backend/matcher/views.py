import logging

from rest_framework import generics
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from jobs.models import Job
from profiles.views import current_profile
from services.apply_ai_client import get_profile

from .models import MatchedJob
from .serializers import MatchedJobSerializer
from .services import match_jobs_for_user

logger = logging.getLogger(__name__)


def local_skills(request):
    """
    Skills taken from the user's own Profile record.

    Used when Apply AI is unreachable so that matching still works from what
    the user typed into the Profile page.
    """
    profile = current_profile(request)

    if not profile or not profile.skills:
        return []

    return [skill.strip() for skill in profile.skills.split(",") if skill.strip()]


# Returns previously computed matches without recomputing them.
class MatchedJobListView(generics.ListAPIView):
    serializer_class = MatchedJobSerializer

    def get_queryset(self):
        supabase_uid = getattr(self.request.user, "supabase_uid", None)

        if not supabase_uid:
            return MatchedJob.objects.none()

        return MatchedJob.objects.filter(
            supabase_uid=supabase_uid,
            job__is_active=True,
        ).select_related("job")


# Triggers job matching for authenticated user.
class MatchJobsView(APIView):

    def post(self, request):
        """
        POST /api/matcher/match/
        """
        token = request.auth
        supabase_uid = getattr(request.user, "supabase_uid", None)

        if not supabase_uid:
            return Response(
                {"error": "User identification missing."},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # 1 & 2. Get skills from Apply AI, falling back to the local profile
        # so that an Apply AI outage does not empty the dashboard.
        skills = []
        degraded = False

        try:
            profile_data = get_profile(token)
        except Exception:
            logger.exception("Apply AI get_profile failed")
            profile_data = None

        if profile_data:
            skills = profile_data.get("skills") or []

        if not skills:
            degraded = True
            skills = local_skills(request)

        if not skills:
            return Response(
                {
                    "error": (
                        "No skills found yet. Add skills to your profile, or "
                        "upload a resume so Apply AI can extract them."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # 4. Fetch active jobs from database
        jobs = Job.objects.filter(is_active=True)

        # 5. Compute matches
        matches = match_jobs_for_user(
            supabase_uid=supabase_uid,
            skills=skills,
            jobs=jobs
        )

        # 6. Save results using update_or_create to prevent duplicates
        matched_records = []

        for item in matches:
            record, _ = MatchedJob.objects.update_or_create(
                supabase_uid=supabase_uid,
                job=item["job"],
                defaults={
                    "match_score": item["match_score"]
                }
            )
            matched_records.append(record)

        # 7. Return matched jobs with scores
        serializer = MatchedJobSerializer(matched_records, many=True)

        if degraded:
            return Response(
                {
                    "degraded": True,
                    "detail": (
                        "Apply AI is unavailable - matched using the skills "
                        "listed on your profile."
                    ),
                    "results": serializer.data,
                },
                status=status.HTTP_200_OK
            )

        return Response(serializer.data, status=status.HTTP_200_OK)
