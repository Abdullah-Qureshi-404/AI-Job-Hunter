from django.urls import path
from .views import ProfileView, CVListView, CVUploadView, CVDeleteView

urlpatterns = [
    path('', ProfileView.as_view(), name='profile-list-create'),
    path('cvs/', CVListView.as_view(), name='cv-list'),
    path('cvs/upload/', CVUploadView.as_view(), name='cv-upload'),
    path('cvs/<int:id>/delete/', CVDeleteView.as_view(), name='cv-delete'),
]
