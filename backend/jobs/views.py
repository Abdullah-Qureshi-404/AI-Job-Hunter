from django.db.models import Case
from django.db.models import F
from django.db.models import IntegerField
from django.db.models import OuterRef
from django.db.models import Q
from django.db.models import Subquery
from django.db.models import Value
from django.db.models import When

from rest_framework import generics
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Job
from .models import SavedJob
from .serializers import JobSerializer
from .serializers import JobListSerializer
from .serializers import SavedJobSerializer

from jobs.scrapers.orchestrator import run_all_scrapers
from jobs.logger import get_scraper_logger


logger = get_scraper_logger("views")


def jobs_with_match_score(request):
    """
    Active jobs annotated with this user's match score (null if unmatched).

    Without the annotation the frontend has no score to render, which is what
    previously led the UI to display a hardcoded percentage.
    """
    from matcher.models import MatchedJob

    supabase_uid = getattr(request.user, "supabase_uid", None)

    queryset = Job.objects.filter(is_active=True)

    if not supabase_uid:
        return queryset

    scores = MatchedJob.objects.filter(
        job=OuterRef("pk"),
        supabase_uid=supabase_uid,
    ).values("match_score")[:1]

    return queryset.annotate(match_score=Subquery(scores))


# Returns a list of jobs with filtering and searching.
class JobListView(generics.ListAPIView):

    serializer_class = JobListSerializer

    def filter_queryset(self, queryset):
        queryset = super().filter_queryset(queryset)

        if self._search_terms() and not self.request.query_params.get("ordering"):
            queryset = queryset.order_by(
                F("date_posted").desc(nulls_last=True),
                F("date_fetched").desc(),
            )

        return queryset

    def _search_terms(self):
        search = self.request.query_params.get("search", "").strip()
        return [term for term in search.split() if term]

    def get_queryset(self):
        queryset = jobs_with_match_score(self.request)

        terms = self._search_terms()

        if not terms:
            return queryset

        # Filter matching jobs and order strictly by newest posted/fetched date
        matches_any = Q()
        for term in terms:
            matches_any |= (
                Q(title__icontains=term)
                | Q(company__icontains=term)
                | Q(requirements__icontains=term)
                | Q(description__icontains=term)
                | Q(location__icontains=term)
            )

        return (
            queryset.filter(matches_any)
            .order_by(
                F("date_posted").desc(nulls_last=True),
                F("date_fetched").desc(),
            )
        )

    filterset_fields = [
        "source",
        "job_type",
        "country",
        "is_remote",
    ]

    search_fields = []

    ordering_fields = [
        "date_posted",
        "salary_min",
        "salary_max",
    ]

    ordering = [
        F("date_posted").desc(nulls_last=True),
        F("date_fetched").desc(),
    ]


# Returns details for a single job.
class JobDetailView(generics.RetrieveAPIView):

    serializer_class = JobSerializer

    def get_queryset(self):
        return jobs_with_match_score(self.request)


from rest_framework.permissions import IsAdminUser


# Triggers fetching jobs from all scrapers.
class FetchJobsView(APIView):
    permission_classes = [IsAdminUser]
    throttle_scope = "scrapers"

    def post(self, request):
        """
        Triggers job fetching from all scrapers.
        POST /api/jobs/fetch/
        Restricted to admin users only.
        """
        from jobs.scheduler import _scrape_lock

        if not _scrape_lock.acquire(blocking=False):
            return Response({
                "success": False,
                "error": "A job scraper run is already in progress. Please wait for it to finish."
            }, status=409)

        try:
            print("🚀 Job fetch triggered via Admin API")
            logger.info("Job fetch triggered via Admin API")

            # Run all scrapers through orchestrator
            result = run_all_scrapers()

            # Save jobs to database
            from jobs.services import save_jobs_to_db

            db_result = save_jobs_to_db(result["jobs"])

            return Response({
                "success": True,
                "scrapers": result["stats"],
                "total_fetched": result["total_fetched"],
                "failed_sources": result["failed_sources"],
                "database": {
                    "new": db_result.get("new", 0),
                    "skipped": db_result.get("skipped", 0),
                    "total": db_result.get("total", 0),
                }
            })

        except Exception as e:
            logger.exception("Job fetch via API failed")

            return Response({
                "success": False,
                "error": str(e)
            }, status=500)
        finally:
            _scrape_lock.release()



# # Analyzes job description using ApplyAI service.
# class AnalyzeJobView(APIView):
#     throttle_scope = "ai_services"

#     def post(self, request):
#         """
#         POST /api/jobs/analyze/
#         """
#         from rest_framework import status
#         from .serializers import JobAnalyzeSerializer
#         from services.apply_ai_client import ApplyAIError, analyze_job

#         serializer = JobAnalyzeSerializer(data=request.data)
#         if not serializer.is_valid():
#             return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

#         token = request.auth
#         job_description = serializer.validated_data["job_description"]

#         try:
#             result = analyze_job(token, job_description)
#         except ApplyAIError as exc:
#             return Response(
#                 {"error": exc.detail},
#                 status=exc.status_code,
#             )

#         if result is None:
#             return Response(
#                 {"error": "AI service is temporarily unavailable. Please try again later."},
#                 status=status.HTTP_503_SERVICE_UNAVAILABLE,
#             )

#         return Response(result, status=status.HTTP_200_OK)


class AnalyzeJobView(APIView):
    throttle_scope = "ai_services"

    def post(self, request):
        from rest_framework import status
        from .serializers import JobAnalyzeSerializer
        from services.apply_ai_client import ApplyAIError, analyze_job

        logger.info("========== DJANGO ANALYZE REQUEST ==========")
        logger.info("request.auth exists: %s", bool(request.auth))
        logger.info("request.user: %s", request.user)

        serializer = JobAnalyzeSerializer(data=request.data)

        if not serializer.is_valid():
            logger.warning(
                "Job analysis serializer error: %s",
                serializer.errors
            )
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

        token = request.auth
        job_description = serializer.validated_data["job_description"]

        logger.info(
            "Calling ApplyAI. Token exists=%s, description_length=%s",
            bool(token),
            len(job_description)
        )

        try:
            result = analyze_job(token, job_description)

        except ApplyAIError as exc:
            logger.exception(
                "ApplyAI returned an error: %s",
                exc.detail
            )

            return Response(
                {"error": exc.detail},
                status=exc.status_code,
            )

        except Exception as exc:
            logger.exception(
                "UNEXPECTED AnalyzeJobView ERROR: %s",
                exc
            )

            return Response(
                {"error": str(exc)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        if result is None:
            logger.error(
                "ApplyAI returned None. FastAPI request failed or timed out."
            )

            return Response(
                {
                    "error": "AI service is temporarily unavailable. Please try again later."
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        logger.info("========== DJANGO ANALYZE SUCCESS ==========")

        return Response(
            result,
            status=status.HTTP_200_OK
        )


class DiagnosticHealthView(APIView):
    """
    Temporary diagnostic view to test connection from Django to FastAPI /health endpoint.
    """
    permission_classes = []
    authentication_classes = []

    def get(self, request):
        from services.apply_ai_client import check_apply_ai_health
        data = check_apply_ai_health()
        return Response(data)


    
# Generates tailored resume content using ApplyAI service.
class GenerateResumeView(APIView):
    throttle_scope = "ai_services"

    def post(self, request):
        """
        POST /api/jobs/generate-resume/
        """
        from rest_framework import status
        from .serializers import JobAnalyzeSerializer
        from services.apply_ai_client import ApplyAIError, generate_resume
        from .ai_quota import check_and_increment_quota, AI_DAILY_QUOTA

        serializer = JobAnalyzeSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Per-user daily AI cost quota (separate from request throttle)
        uid = getattr(request.user, "supabase_uid", None)
        if uid:
            allowed, count = check_and_increment_quota(uid)
            if not allowed:
                return Response(
                    {
                        "error": f"Daily AI generation limit of {AI_DAILY_QUOTA} reached. "
                                 "Your quota resets at midnight UTC."
                    },
                    status=status.HTTP_429_TOO_MANY_REQUESTS,
                )

        token = request.auth
        job_description = serializer.validated_data["job_description"]

        try:
            result = generate_resume(token, job_description)
        except ApplyAIError as exc:
            return Response(
                {"error": exc.detail},
                status=exc.status_code,
            )

        if result is None:
            return Response(
                {"error": "AI service is temporarily unavailable. Please try again later."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        return Response(result, status=status.HTTP_200_OK)


# Generates personalized outreach email using ApplyAI service.
class GenerateEmailView(APIView):
    throttle_scope = "ai_services"

    def post(self, request):
        """
        POST /api/jobs/generate-email/
        """
        from rest_framework import status
        from .serializers import EmailGenerateSerializer
        from services.apply_ai_client import ApplyAIError, generate_email
        from .ai_quota import check_and_increment_quota, AI_DAILY_QUOTA

        serializer = EmailGenerateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Per-user daily AI cost quota (separate from request throttle)
        uid = getattr(request.user, "supabase_uid", None)
        if uid:
            allowed, count = check_and_increment_quota(uid)
            if not allowed:
                return Response(
                    {
                        "error": f"Daily AI generation limit of {AI_DAILY_QUOTA} reached. "
                                 "Your quota resets at midnight UTC."
                    },
                    status=status.HTTP_429_TOO_MANY_REQUESTS,
                )

        token = request.auth
        job_title = serializer.validated_data["job_title"]
        company_name = serializer.validated_data["company_name"]
        job_description = serializer.validated_data["job_description"]

        try:
            result = generate_email(
                token=token,
                job_title=job_title,
                company_name=company_name,
                job_description=job_description,
            )
        except ApplyAIError as exc:
            return Response(
                {"error": exc.detail},
                status=exc.status_code,
            )

        if result is None:
            return Response(
                {"error": "AI service is temporarily unavailable. Please try again later."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        return Response(result, status=status.HTTP_200_OK)


# Analyzes job description screenshot image using ApplyAI service.
class AnalyzeJobImageView(APIView):
    throttle_scope = "ai_services"

    def post(self, request):
        """
        POST /api/jobs/analyze-image/
        """
        from rest_framework import status
        from services.apply_ai_client import ApplyAIError, analyze_job_from_image

        token = request.auth
        if not token:
            return Response(
                {"error": "Authentication token missing."},
                status=status.HTTP_401_UNAUTHORIZED
            )

        if "file" not in request.FILES:
            return Response(
                {"error": "No image file provided in request."},
                status=status.HTTP_400_BAD_REQUEST
            )

        uploaded_file = request.FILES["file"]
        content_type = uploaded_file.content_type.lower() if uploaded_file.content_type else ""

        valid_types = {
            "image/jpeg": "image/jpeg",
            "image/jpg": "image/jpeg",
            "image/png": "image/png",
            "image/webp": "image/webp",
        }

        if content_type not in valid_types and uploaded_file.name:
            ext = uploaded_file.name.lower().split(".")[-1]
            if ext in ["jpg", "jpeg"]:
                content_type = "image/jpeg"
            elif ext == "png":
                content_type = "image/png"
            elif ext == "webp":
                content_type = "image/webp"

        if content_type not in valid_types:
            return Response(
                {"error": "Invalid image format. Allowed formats: JPEG, PNG, WEBP."},
                status=status.HTTP_400_BAD_REQUEST
            )

        image_bytes = uploaded_file.read()
        media_type = valid_types[content_type]

        try:
            result = analyze_job_from_image(
                token=token,
                image_bytes=image_bytes,
                image_media_type=media_type
            )
        except ApplyAIError as exc:
            return Response(
                {"error": exc.detail},
                status=exc.status_code,
            )

        if result is None:
            return Response(
                {"error": "Image job analysis service unavailable or failed."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(result, status=status.HTTP_200_OK)



# Lists the authenticated user's saved jobs, and saves a new one.
class SavedJobListCreateView(generics.ListCreateAPIView):

    serializer_class = SavedJobSerializer

    def get_queryset(self):
        supabase_uid = getattr(self.request.user, "supabase_uid", None)

        if not supabase_uid:
            return SavedJob.objects.none()

        return (
            SavedJob.objects
            .filter(supabase_uid=supabase_uid, job__is_active=True)
            .select_related("job")
        )

    def create(self, request, *args, **kwargs):
        from rest_framework import status

        supabase_uid = getattr(request.user, "supabase_uid", None)

        if not supabase_uid:
            return Response(
                {"error": "User identification missing."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        job_id = request.data.get("job") or request.data.get("job_id")

        if not job_id:
            return Response(
                {"error": "A job id is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            job = Job.objects.get(pk=job_id, is_active=True)
        except (Job.DoesNotExist, ValueError, TypeError):
            return Response(
                {"error": "That job could not be found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Saving twice is not an error - just return the existing bookmark.
        saved, created = SavedJob.objects.get_or_create(
            supabase_uid=supabase_uid,
            job=job,
            defaults={"note": request.data.get("note", "")},
        )

        serializer = self.get_serializer(saved)

        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


# Removes a saved job by the job's id (not the bookmark id), which is what
# the job detail page has to hand.
class SavedJobDeleteView(generics.DestroyAPIView):

    serializer_class = SavedJobSerializer

    lookup_field = "job_id"

    def get_queryset(self):
        supabase_uid = getattr(self.request.user, "supabase_uid", None)

        if not supabase_uid:
            return SavedJob.objects.none()

        return SavedJob.objects.filter(supabase_uid=supabase_uid)
