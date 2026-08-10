from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import MarketplaceProductViewSet, ProductViewSet

router = DefaultRouter()
router.register(r"products", ProductViewSet, basename="product")

marketplace_router = DefaultRouter()
marketplace_router.register(
    r"products", MarketplaceProductViewSet, basename="marketplace-product"
)

urlpatterns = [
    path("", include(router.urls)),
    path("marketplace/", include(marketplace_router.urls)),
]
