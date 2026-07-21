from rest_framework import generics

from .models import Application

from .serializers import ApplicationSerializer


# Lists all applications and creates a new application.
class ApplicationListView(generics.ListCreateAPIView):

    serializer_class = ApplicationSerializer

    def get_queryset(self):

        queryset = Application.objects.all()

        status = self.request.query_params.get("status")

        if status:

            queryset = queryset.filter(status=status)

        return queryset


# Retrieves, updates or deletes a single application.
class ApplicationDetailView(generics.RetrieveUpdateDestroyAPIView):

    queryset = Application.objects.all()

    serializer_class = ApplicationSerializer