from django.urls import path

from .views import CreateSubaccountView, StoreView

urlpatterns = [
    path("", StoreView.as_view(), name="store-detail"),
    path(
        "create-subaccount/",
        CreateSubaccountView.as_view(),
        name="store-create-subaccount",
    ),
]
