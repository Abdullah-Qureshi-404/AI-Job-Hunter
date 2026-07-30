from django.contrib import admin
from .models import Profile, CV


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ['name', 'email', 'experience_level', 'min_salary', 'created_at']
    list_filter = ['experience_level']
    search_fields = ['name', 'email', 'skills']


@admin.register(CV)
class CVAdmin(admin.ModelAdmin):
    list_display = ['label', 'profile', 'is_default', 'uploaded_at']
    list_filter = ['is_default']
    search_fields = ['label', 'profile__name']