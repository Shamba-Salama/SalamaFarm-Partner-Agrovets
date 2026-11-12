from django.urls import path

from .upload_views import PresignedUploadUrlView

# Included at api/upload-url/ in config.urls — single segment, not …/upload-url/upload-url/
urlpatterns = [
    path("", PresignedUploadUrlView.as_view(), name="upload-url"),
]
