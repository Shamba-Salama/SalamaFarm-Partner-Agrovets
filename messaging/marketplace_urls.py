from rest_framework.routers import DefaultRouter

from .marketplace_views import MarketplaceThreadViewSet

router = DefaultRouter()
router.register(r"threads", MarketplaceThreadViewSet, basename="marketplace-thread")

urlpatterns = router.urls
