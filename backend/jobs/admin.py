from django.contrib import admin
from .models import Job


@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    list_display = ['title', 'company', 'source', 'job_type', 'is_remote', 'is_active', 'date_posted']
    list_filter = ['source', 'job_type', 'is_remote', 'is_active', 'country']
    search_fields = ['title', 'company', 'description']
    readonly_fields = ['date_fetched']
