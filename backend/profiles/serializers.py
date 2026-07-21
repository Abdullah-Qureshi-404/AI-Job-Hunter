from rest_framework import serializers

from .models import Profile
from .models import CV


# Serializer for Profile model.
class ProfileSerializer(serializers.ModelSerializer):

    class Meta:

        model = Profile

        fields = "__all__"


# Serializer for CV model.
class CVSerializer(serializers.ModelSerializer):

    class Meta:

        model = CV

        fields = "__all__"