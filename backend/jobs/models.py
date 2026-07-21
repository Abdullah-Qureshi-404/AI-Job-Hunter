from django.db import models


# This model stores job information collected from different job websites.
class Job(models.Model):

    JOB_TYPES = [
        ("full-time", "Full Time"),
        ("part-time", "Part Time"),
        ("freelance", "Freelance"),
        ("remote", "Remote"),
        ("internship", "Internship"),
    ]

    SOURCES = [
        ("greenhouse", "Greenhouse"),
        ("ashby", "Ashby"),
        ("remoteok", "RemoteOK"),
        ("arbeitnow", "ArbeitNow"),
        ("linkedin", "LinkedIn"),
        ("indeed", "Indeed"),
        ("glassdoor", "Glassdoor"),
        ("rozee", "Rozee"),
        ("wellfound", "Wellfound"),
        ("ycombinator", "Y Combinator"),
        ("lever", "Lever"),
        ("himalayas", "Himalayas"),
        ("remotive", "Remotive"),
        ("weworkremotely", "We Work Remotely"),
        ("jobicy", "Jobicy"),
        ("mustakbil", "Mustakbil"),
        ("jobspy_linkedin", "JobSpy LinkedIn"),
        ("jobspy_indeed", "JobSpy Indeed"),
    ]

    title = models.CharField(max_length=255)

    company = models.CharField(max_length=255)

    location = models.CharField(max_length=255)

    country = models.CharField(
    max_length=255,
    blank=True,
    null=True
    )

    job_type = models.CharField(
        max_length=20,
        choices=JOB_TYPES
    )

    description = models.TextField(blank=True)

    requirements = models.TextField(blank=True)

    salary_min = models.IntegerField(
        null=True,
        blank=True
    )

    salary_max = models.IntegerField(
        null=True,
        blank=True
    )

    currency = models.CharField(
        max_length=10,
        blank=True
    )

    source = models.CharField(
        max_length=30,
        choices=SOURCES
    )

    source_url = models.URLField()

    source_id = models.CharField(max_length=255)

    is_remote = models.BooleanField(default=False)

    date_posted = models.DateField(
        null=True,
        blank=True
    )

    date_fetched = models.DateTimeField(
        auto_now_add=True
    )

    is_active = models.BooleanField(default=True)

    class Meta:

        unique_together = ("source", "source_id")

        indexes = [
            models.Index(fields=["source"]),
            models.Index(fields=["country"]),
            models.Index(fields=["job_type"]),
            models.Index(fields=["is_remote"]),
            models.Index(fields=["date_posted"]),
        ]

        ordering = ["-date_posted"]

    def __str__(self):
        return f"{self.title} - {self.company}"