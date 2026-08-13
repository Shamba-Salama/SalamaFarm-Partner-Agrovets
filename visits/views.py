"""Customer marketplace store-visit endpoints + vendor analytics."""

from datetime import timedelta

from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from core.tenancy import get_vendor_store
from customers.authentication import CustomerJWTAuthentication
from customers.permissions import IsAuthenticatedCustomer

from .models import StoreVisit
from .serializers import (
    StoreVisitArriveSerializer,
    StoreVisitSerializer,
    StoreVisitStartSerializer,
)


class MarketplaceStoreVisitStartView(APIView):
    """POST /api/v1/marketplace/store-visits/ — create or reuse open visit."""

    authentication_classes = [CustomerJWTAuthentication]
    permission_classes = [IsAuthenticatedCustomer]

    def post(self, request, *args, **kwargs):
        serializer = StoreVisitStartSerializer(
            data=request.data,
            context={"account": request.user, "request": request},
        )
        serializer.is_valid(raise_exception=True)
        visit = serializer.save()
        reused = bool(serializer.context.get("reused"))
        return Response(
            StoreVisitSerializer(visit).data,
            status=status.HTTP_200_OK if reused else status.HTTP_201_CREATED,
        )


class MarketplaceStoreVisitArriveView(APIView):
    """POST /api/v1/marketplace/store-visits/{id}/arrive/ — idempotent."""

    authentication_classes = [CustomerJWTAuthentication]
    permission_classes = [IsAuthenticatedCustomer]

    def post(self, request, pk, *args, **kwargs):
        visit = StoreVisit.objects.filter(pk=pk, account=request.user).first()
        if visit is None:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = StoreVisitArriveSerializer(
            data=request.data,
            context={"visit": visit, "request": request},
        )
        serializer.is_valid(raise_exception=True)
        visit = serializer.save()
        return Response(StoreVisitSerializer(visit).data, status=status.HTTP_200_OK)



class AppVisitsAnalyticsView(APIView):
    """GET /api/v1/analytics/app-visits/ — vendor dashboard aggregate."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        store = get_vendor_store(request.user)
        qs = StoreVisit.objects.filter(store=store)
        now = timezone.now()
        start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
        # ISO week: Monday as week start (matches WeeklySalesView isocalendar).
        start_of_week = start_of_day - timedelta(days=start_of_day.weekday())

        arrived = qs.filter(status=StoreVisit.Status.ARRIVED)
        return Response(
            {
                "started_count": qs.filter(status=StoreVisit.Status.STARTED).count(),
                "arrived_count": arrived.count(),
                "arrived_today": arrived.filter(arrived_at__gte=start_of_day).count(),
                "arrived_this_week": arrived.filter(arrived_at__gte=start_of_week).count(),
            }
        )
