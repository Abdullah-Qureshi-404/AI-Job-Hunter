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


def current_profile(request):
    """
    Resolve the Profile owned by the authenticated caller.

    Identity comes from the verified Supabase JWT only (see
    core.authentication). The email claim is used to adopt a profile that
    predates supabase_uid, but it is never read from the request body -
    doing so would let a caller take over someone else's profile.
    """
    supabase_uid = getattr(request.user, "supabase_uid", None)
    user_email = getattr(request.user, "email", None)

    if supabase_uid:
        profile = Profile.objects.filter(supabase_uid=supabase_uid).first()
        if profile:
            return profile

    if user_email:
        profile = Profile.objects.filter(email=user_email).first()
        if profile:
            if supabase_uid and not profile.supabase_uid:
                profile.supabase_uid = supabase_uid
                profile.save(update_fields=["supabase_uid"])
            return profile

    return None


# This view creates and lists profiles.
class ProfileView(generics.ListCreateAPIView):
    serializer_class = ProfileSerializer

    def get_queryset(self):
        profile = current_profile(self.request)

        if profile is None:
            # No profile yet for this user. Never fall back to the full table.
            return Profile.objects.none()

        return Profile.objects.filter(pk=profile.pk)

    def post(self, request, *args, **kwargs):
        supabase_uid = getattr(request.user, "supabase_uid", None)

        profile = current_profile(request)

        if profile:
            # Update existing profile (upsert)
            serializer = self.get_serializer(profile, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            if supabase_uid and not profile.supabase_uid:
                serializer.save(supabase_uid=supabase_uid)
            else:
                serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)

        # Otherwise create new profile safely
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(supabase_uid=supabase_uid)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


# This view lists all uploaded CVs.
class CVListView(generics.ListAPIView):
    serializer_class = CVSerializer

    def get_queryset(self):
        # Scope strictly to the caller's own profile. A client-supplied
        # ?profile=<id> is ignored: it would expose every user's CVs.
        profile = current_profile(self.request)

        if profile is None:
            return CV.objects.none()

        return CV.objects.filter(profile=profile)


# This view uploads a CV and extracts text.
class CVUploadView(generics.CreateAPIView):
    serializer_class = CVSerializer

    def post(self, request):
        supabase_uid = getattr(self.request.user, "supabase_uid", None)
        user_email = getattr(request.user, "email", None)

        # Owner is resolved from the token only. A profile id in the request
        # body is ignored - it would let a caller attach a CV to any profile.
        profile = current_profile(request)

        # Create a placeholder profile if the user has not made one yet.
        # Fields are left empty: inventing skills here surfaces later on the
        # Profile page as if the user had entered them.
        if not profile:
            if not user_email:
                return Response(
                    {"error": "Could not determine your account. Please sign in again."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            profile = Profile.objects.create(
                supabase_uid=supabase_uid,
                name=user_email.split("@")[0],
                email=user_email,
            )

        uploaded_file = request.FILES.get("file")
        if not uploaded_file:
            return Response(
                {"error": "No file uploaded"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not uploaded_file.name.lower().endswith(".pdf"):
            return Response(
                {"error": "Only PDF files are allowed"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if uploaded_file.size > 5 * 1024 * 1024:
            return Response(
                {"error": "File size exceeds maximum limit of 5 MB"},
                status=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE
            )

        label = request.data.get("label") or uploaded_file.name
        file_bytes = uploaded_file.read()
        if not file_bytes.startswith(b"%PDF-"):
            return Response(
                {"error": "Uploaded file header is not a valid PDF document"},
                status=status.HTTP_400_BAD_REQUEST
            )
        uploaded_file.seek(0)

        cv = CV.objects.create(
            profile=profile,
            label=label,
            file=uploaded_file,
        )

        try:
            pdf_text = extract_pdf_text(cv.file.path)
            cv.extracted_skills = pdf_text
            cv.save()
        except Exception:
            cv.extracted_skills = ""
            cv.save()

        # Mirror upload into Apply AI so RAG / match / generate features work.
        apply_ai_result = None
        token = request.auth
        if token and file_bytes:
            from services.apply_ai_client import upload_resume

            resume_type = request.data.get("resume_type") or "general"
            apply_ai_result = upload_resume(
                token=token,
                file_bytes=file_bytes,
                filename=uploaded_file.name or "resume.pdf",
                resume_type=resume_type,
            )

        serializer = CVSerializer(cv)
        response_data = serializer.data
        if apply_ai_result is not None:
            response_data["apply_ai"] = apply_ai_result
        elif token:
            response_data["apply_ai_warning"] = (
                "Resume saved locally, but Apply AI upload failed. "
                "AI match/generate features may not work until Apply AI is reachable."
            )

        return Response(
            response_data,
            status=status.HTTP_201_CREATED
        )


# This view deletes a CV.
class CVDeleteView(generics.DestroyAPIView):

    serializer_class = CVSerializer

    def get_queryset(self):
        # Without this filter any authenticated user could delete any CV by id.
        profile = current_profile(self.request)

        if profile is None:
            return CV.objects.none()

        return CV.objects.filter(profile=profile)

    def perform_destroy(self, instance):

        if instance.file:
            try:
                if os.path.exists(instance.file.path):
                    os.remove(instance.file.path)
            except (ValueError, OSError, NotImplementedError):
                # Missing file on disk, or non-filesystem storage. The database
                # row should still be removed.
                pass

        instance.delete()