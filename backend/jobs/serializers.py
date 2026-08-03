from rest_framework import serializers
from .models import Job
from .models import SavedJob


# match_score is annotated onto the queryset per requesting user (see
# jobs.views.jobs_with_match_score). It is null when the user has no computed
# match for that job - clients must render that as "no score", not invent one.


# Serializer for complete job details.
class JobSerializer(serializers.ModelSerializer):

    match_score = serializers.FloatField(read_only=True, allow_null=True, required=False)

    class Meta:

        model = Job

        fields = "__all__"


# Serializer used when listing many jobs.
class JobListSerializer(serializers.ModelSerializer):

    match_score = serializers.FloatField(read_only=True, allow_null=True, required=False)

    class Meta:

        model = Job

        fields = [
            "id",
            "title",
            "company",
            "location",
            "country",
            "job_type",
            "source",
            "date_posted",
            "is_remote",
            "salary_min",
            "salary_max",
            "currency",
            "match_score",
        ]


# Serializer for job analysis and resume generation request.
class JobAnalyzeSerializer(serializers.Serializer):
    job_description = serializers.CharField(required=True)


# Serializer for email generation request.
class EmailGenerateSerializer(serializers.Serializer):
    job_title = serializers.CharField(required=True)
    company_name = serializers.CharField(required=True)
    job_description = serializers.CharField(required=True)

# Serializer for a saved (bookmarked) job.
class SavedJobSerializer(serializers.ModelSerializer):

    job = JobListSerializer(read_only=True)

    class Meta:

        model = SavedJob

        fields = [
            "id",
            "job",
            "note",
            "saved_at",
        ]
