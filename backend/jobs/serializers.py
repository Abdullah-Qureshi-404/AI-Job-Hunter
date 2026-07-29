from rest_framework import serializers
from .models import Job


# Serializer for complete job details.
class JobSerializer(serializers.ModelSerializer):

    class Meta:

        model = Job

        fields = "__all__"


# Serializer used when listing many jobs.
class JobListSerializer(serializers.ModelSerializer):

    class Meta:

        model = Job

        fields = [
            "id",
            "title",
            "company",
            "location",
            "job_type",
            "source",
            "date_posted",
            "is_remote",
        ]


# Serializer for job analysis and resume generation request.
class JobAnalyzeSerializer(serializers.Serializer):
    job_description = serializers.CharField(required=True)


# Serializer for email generation request.
class EmailGenerateSerializer(serializers.Serializer):
    job_title = serializers.CharField(required=True)
    company_name = serializers.CharField(required=True)
    job_description = serializers.CharField(required=True)