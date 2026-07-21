from django_filters.rest_framework import DjangoFilterBackend

from rest_framework import generics, filters, status
from rest_framework.views import APIView
from rest_framework.response import Response

from .models import Job
from .serializers import JobSerializer, JobListSerializer

from .scrapers import fetch_all_free_api_jobs
from .services import save_jobs_to_db

class JobListView(generics.ListAPIView):
    """
    GET /api/jobs/
    Returns all active jobs with filtering, search, and ordering.

    Query params:
      - source          e.g. ?source=greenhouse
      - job_type        e.g. ?job_type=full-time
      - country         e.g. ?country=Germany
      - is_remote       e.g. ?is_remote=true
      - search          e.g. ?search=python developer  (searches title & company)
      - ordering        e.g. ?ordering=-date_fetched
    """
    serializer_class = JobListSerializer
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ['source', 'job_type', 'country', 'is_remote']
    search_fields = ['title', 'company', 'description']
    ordering_fields = ['date_posted', 'date_fetched', 'salary_min', 'salary_max']
    ordering = ['-date_posted']

    def get_queryset(self):
        return Job.objects.filter(is_active=True)


class JobDetailView(generics.RetrieveAPIView):
    """
    GET /api/jobs/<id>/
    Returns full detail for a single job.
    """
    queryset = Job.objects.all()
    serializer_class = JobSerializer
    lookup_field = 'id'


class FetchJobsView(APIView):
    """
    POST /api/jobs/fetch/
    Fetch jobs from all APIs and save them.
    """


    # This function fetches jobs and saves them into database.
    def post(self, request):

        jobs, stats = fetch_all_free_api_jobs()

        result = save_jobs_to_db(jobs)

        return Response(

            {
                "success": True,
                "scrapers": stats,
                "database": result,
            },

            status=status.HTTP_200_OK,
        )