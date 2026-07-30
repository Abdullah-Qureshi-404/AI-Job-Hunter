from rest_framework import serializers

from jobs.serializers import JobSerializer
from .models import MatchedJob


# Serializer for MatchedJob model.
class MatchedJobSerializer(serializers.ModelSerializer):

    job = JobSerializer(read_only=True)

    class Meta:

        model = MatchedJob

        fields = [
            "id",
            "supabase_uid",
            "job",
            "match_score",
            "matched_at",
        ]
