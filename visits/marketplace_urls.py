from django.urls import path

from .views import MarketplaceStoreVisitArriveView, MarketplaceStoreVisitStartView

urlpatterns = [
    path(
        "store-visits/",
        MarketplaceStoreVisitStartView.as_view(),
        name="marketplace-store-visit-start",
    ),
    path(
        "store-visits/<int:pk>/arrive/",
        MarketplaceStoreVisitArriveView.as_view(),
        name="marketplace-store-visit-arrive",
    ),
]
