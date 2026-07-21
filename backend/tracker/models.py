from django.db import models
from jobs.models import Job


class Application(models.Model):
    """Tracks a user's application lifecycle for a specific job."""

    class Status(models.TextChoices):
        SAVED     = 'saved',     'Saved'
        APPLIED   = 'applied',   'Applied'
        INTERVIEW = 'interview', 'Interview'
        OFFER     = 'offer',     'Offer'
        REJECTED  = 'rejected',  'Rejected'

    job            = models.ForeignKey(
        Job, on_delete=models.CASCADE, related_name='applications'
    )
    status         = models.CharField(
        max_length=20, choices=Status.choices, default=Status.SAVED
    )
    applied_date   = models.DateField(null=True, blank=True)
    notes          = models.TextField(blank=True, default='')
    contact_person = models.CharField(max_length=200, blank=True, default='')
    contact_email  = models.EmailField(blank=True, default='')
    follow_up_date = models.DateField(null=True, blank=True)
    created_at     = models.DateTimeField(auto_now_add=True)
    updated_at     = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'applications'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.job.title} at {self.job.company} — {self.status}"
