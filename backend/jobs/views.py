from rest_framework import generics
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Job
from .serializers import JobSerializer
from .serializers import JobListSerializer

from jobs.scrapers.orchestrator import run_all_scrapers
from jobs.logger import get_scraper_logger


logger = get_scraper_logger("views")


# Returns a list of jobs with filtering and searching.
class JobListView(generics.ListAPIView):

    queryset = Job.objects.filter(is_active=True)

    serializer_class = JobListSerializer

    filterset_fields = [
        "source",
        "job_type",
        "country",
        "is_remote",
    ]

    search_fields = [
        "title",
        "company",
    ]

    ordering_fields = [
        "date_posted",
        "salary_min",
        "salary_max",
    ]

    ordering = ["-date_posted"]


# Returns details for a single job.
class JobDetailView(generics.RetrieveAPIView):

    queryset = Job.objects.filter(is_active=True)

    serializer_class = JobSerializer


# Triggers fetching jobs from all scrapers.
class FetchJobsView(APIView):

    def post(self, request):
        """
        Triggers job fetching from all scrapers.
        POST /api/jobs/fetch/
        """

        try:
            print("🚀 Job fetch triggered via API")
            logger.info("Job fetch triggered via API")

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