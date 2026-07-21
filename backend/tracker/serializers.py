from rest_framework import serializers

from .models import Application


# Serializer for job applications.
class ApplicationSerializer(serializers.ModelSerializer):

    class Meta:

        model = Application

        fields = "__all__"