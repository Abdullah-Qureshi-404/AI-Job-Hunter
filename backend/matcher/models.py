from django.db import models
from jobs.models import Job


# Stores job matching scores for a user profile.
class MatchedJob(models.Model):

    supabase_uid = models.CharField(max_length=255)

    job = models.ForeignKey(
        Job,
        on_delete=models.CASCADE
    )

    match_score = models.FloatField()

    matched_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-match_score"]
        unique_together = ("supabase_uid", "job")

    def __str__(self):
        return f"{self.supabase_uid} - {self.job.title} ({self.match_score}%)"
