from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    CustomerOrderViewSet,
    CustomerViewSet,
    MarketplaceOrderViewSet,
    WeeklySalesView,
)

router = DefaultRouter()
router.register(r"customers", CustomerViewSet, basename="customer")
router.register(r"orders", CustomerOrderViewSet, basename="order")

marketplace_router = DefaultRouter()
marketplace_router.register(
    r"orders", MarketplaceOrderViewSet, basename="marketplace-order"
)

urlpatterns = [
    path("analytics/weekly-sales/", WeeklySalesView.as_view(), name="weekly-sales"),
    path("marketplace/", include(marketplace_router.urls)),
    *router.urls,
]
