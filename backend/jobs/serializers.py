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