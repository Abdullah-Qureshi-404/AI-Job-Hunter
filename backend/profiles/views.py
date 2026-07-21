import os

from pypdf import PdfReader

from rest_framework import generics
from rest_framework import status
from rest_framework.response import Response

from .models import Profile
from .models import CV

from .serializers import ProfileSerializer
from .serializers import CVSerializer


# This function extracts text from a PDF file.
def extract_pdf_text(file_path):

    text = ""

    reader = PdfReader(file_path)

    for page in reader.pages:

        page_text = page.extract_text()

        if page_text:
            text += page_text + "\n"

    return text


# This view creates and lists profiles.
class ProfileView(generics.ListCreateAPIView):

    queryset = Profile.objects.all()

    serializer_class = ProfileSerializer


# This view lists all uploaded CVs.
class CVListView(generics.ListAPIView):

    serializer_class = CVSerializer

    def get_queryset(self):

        profile_id = self.request.query_params.get("profile")

        if profile_id:

            return CV.objects.filter(profile_id=profile_id)

        return CV.objects.all()


# This view uploads a CV and extracts text.
class CVUploadView(generics.CreateAPIView):

    serializer_class = CVSerializer

    def post(self, request):

        profile_id = request.data.get("profile")

        profile = Profile.objects.get(id=profile_id)

        uploaded_file = request.FILES["file"]

        cv = CV.objects.create(
            profile=profile,
            label=request.data.get("label"),
            file=uploaded_file,
        )

        pdf_text = extract_pdf_text(cv.file.path)

        cv.extracted_skills = pdf_text

        cv.save()

        serializer = CVSerializer(cv)

        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED
        )


# This view deletes a CV.
class CVDeleteView(generics.DestroyAPIView):

    queryset = CV.objects.all()

    serializer_class = CVSerializer

    def perform_destroy(self, instance):

        if instance.file:

            if os.path.exists(instance.file.path):

                os.remove(instance.file.path)

        instance.delete()