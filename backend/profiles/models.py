from django.db import models


class Profile(models.Model):
    """Stores the job-seeker's preferences and target criteria."""

    class ExperienceLevel(models.TextChoices):
        JUNIOR = 'junior', 'Junior'
        MID    = 'mid',    'Mid'
        SENIOR = 'senior', 'Senior'

    name               = models.CharField(max_length=200)
    email              = models.EmailField(unique=True)
    skills             = models.TextField(
        blank=True, default='',
        help_text='Comma-separated list of skills, e.g. "Python, React, AWS"'
    )
    experience_level   = models.CharField(
        max_length=20,
        choices=ExperienceLevel.choices,
        default=ExperienceLevel.MID,
    )
    preferred_roles    = models.TextField(
        blank=True, default='',
        help_text='Comma-separated, e.g. "AI Engineer, ML Engineer"'
    )
    target_countries   = models.TextField(
        blank=True, default='',
        help_text='Comma-separated, e.g. "Germany, United Kingdom, Remote"'
    )
    job_types_wanted   = models.TextField(
        blank=True, default='',
        help_text='Comma-separated, e.g. "full-time, remote"'
    )
    min_salary         = models.IntegerField(null=True, blank=True)
    created_at         = models.DateTimeField(auto_now_add=True)
    updated_at         = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'profiles'

    def __str__(self):
        return self.name


class CV(models.Model):
    """A CV file uploaded by the user; text is extracted for matching."""

    profile          = models.ForeignKey(
        Profile, on_delete=models.CASCADE, related_name='cvs'
    )
    label            = models.CharField(max_length=200, default='My CV')
    file_path        = models.FileField(upload_to='cvs/')
    extracted_skills = models.TextField(blank=True, default='')
    is_default       = models.BooleanField(default=False)
    uploaded_at      = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'cvs'
        ordering = ['-uploaded_at']

    def __str__(self):
        return f"{self.label} — {self.profile.name}"
