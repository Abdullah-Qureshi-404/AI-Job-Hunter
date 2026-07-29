from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from jobs.models import Job
from services.apply_ai_client import get_profile

from .models import MatchedJob
from .serializers import MatchedJobSerializer
from .services import match_jobs_for_user


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

        # 1 & 2. Get profile from ApplyAI service
        profile_data = get_profile(token)

        if not profile_data:
            return Response(
                {"error": "Failed to retrieve profile intelligence from ApplyAI."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # 3. Extract skills
        skills = profile_data.get("skills", [])

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
        return Response(serializer.data, status=status.HTTP_200_OK)
