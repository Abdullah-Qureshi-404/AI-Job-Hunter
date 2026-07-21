import os

from django.db import models


# This model stores information about the user profile.
class Profile(models.Model):

    EXPERIENCE_LEVELS = [
        ("junior", "Junior"),
        ("mid", "Mid"),
        ("senior", "Senior"),
    ]

    name = models.CharField(max_length=200)

    email = models.EmailField(unique=True)

    skills = models.TextField()

    experience_level = models.CharField(
        max_length=20,
        choices=EXPERIENCE_LEVELS
    )

    preferred_roles = models.TextField()

    target_countries = models.TextField()

    job_types_wanted = models.TextField()

    min_salary = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


# This model stores uploaded CV files.
class CV(models.Model):

    profile = models.ForeignKey(
        Profile,
        on_delete=models.CASCADE,
        related_name="cvs"
    )

    label = models.CharField(max_length=255)

    file = models.FileField(upload_to="cvs/")

    extracted_skills = models.TextField(blank=True)

    is_default = models.BooleanField(default=False)

    uploaded_at = models.DateTimeField(auto_now_add=True)

    def filename(self):
        return os.path.basename(self.file.name)

    def __str__(self):
        return self.label