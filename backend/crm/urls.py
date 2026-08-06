from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import CustomerOrderViewSet, CustomerViewSet, WeeklySalesView

router = DefaultRouter()
router.register(r"customers", CustomerViewSet, basename="customer")
router.register(r"orders", CustomerOrderViewSet, basename="order")

urlpatterns = [
    path("analytics/weekly-sales/", WeeklySalesView.as_view(), name="weekly-sales"),
    *router.urls,
]
