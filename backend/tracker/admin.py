from django.contrib import admin

from .models import Application


@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):

    list_display = [
        "job",
        "status",
        "applied_date",
        "follow_up_date",
        "created_at",
    ]

    list_filter = [
        "status",
    ]

    search_fields = [
        "job__title",
        "job__company",
        "contact_person",
        "contact_email",
    ]

    readonly_fields = [
        "created_at",
    ]