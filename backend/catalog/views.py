"""Store-scoped product API + public marketplace browse."""

from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import parsers, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response

from stores.models import AgrovetStore

from .csv_import import parse_products_csv
from .models import Product
from .serializers import ProductSerializer, PublicProductSerializer


class MarketplacePagination(PageNumberPagination):
    page_size = 20


class ProductViewSet(viewsets.ModelViewSet):
    """
    CRUD + toggle + CSV import for the authenticated vendor's products.

    All querysets and lookups are scoped to request.user.store — cross-tenant
    ids return 404 (not 403).
    """

    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [
        parsers.JSONParser,
        parsers.MultiPartParser,
        parsers.FormParser,
    ]
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]

    def get_store(self) -> AgrovetStore:
        return get_object_or_404(AgrovetStore, owner=self.request.user)

    def get_queryset(self):
        qs = Product.objects.for_store(self.get_store())

        category = self.request.query_params.get("category")
        if category:
            qs = qs.filter(category=category)

        active = self.request.query_params.get("active")
        if active is not None and active != "":
            qs = qs.filter(active=active.lower() in ("1", "true", "yes"))

        search = self.request.query_params.get("search")
        if search:
            qs = qs.filter(name__icontains=search)

        return qs

    def perform_create(self, serializer):
        serializer.save(store=self.get_store())

    def perform_update(self, serializer):
        # store must never be reassigned from the body
        serializer.save(store=self.get_store())

    @action(detail=True, methods=["post"], url_path="toggle")
    def toggle(self, request, pk=None):
        product = self.get_object()
        product.active = not product.active
        product.save(update_fields=["active", "updated_at"])
        return Response(self.get_serializer(product).data)

    @action(
        detail=False,
        methods=["post"],
        url_path="import",
        parser_classes=[parsers.MultiPartParser, parsers.FormParser],
    )
    def import_csv(self, request):
        upload = request.FILES.get("file")
        if not upload:
            return Response(
                {"detail": "Upload a CSV file under the form field 'file'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            text = upload.read().decode("utf-8-sig")
            rows = parse_products_csv(text)
        except UnicodeDecodeError:
            return Response(
                {"detail": "CSV must be UTF-8 encoded."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        if not rows:
            return Response(
                {"detail": "No valid product rows found."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        store = self.get_store()
        with transaction.atomic():
            products = [Product(store=store, **row) for row in rows]
            Product.objects.bulk_create(products)

        return Response(
            {
                "created": len(products),
                "products": ProductSerializer(
                    products, many=True, context={"request": request}
                ).data,
            },
            status=status.HTTP_201_CREATED,
        )


class MarketplaceProductViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Public cross-store catalog for the customer app.

    No auth. Only active products from open stores. Distinct from the
    vendor-scoped ProductViewSet at /api/v1/products/.
    """

    serializer_class = PublicProductSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = MarketplacePagination
    http_method_names = ["get", "head", "options"]

    def get_queryset(self):
        qs = (
            Product.objects.filter(active=True, store__open=True)
            .select_related("store")
            .order_by("name", "id")
        )

        category = self.request.query_params.get("category")
        if category:
            qs = qs.filter(category=category)

        search = self.request.query_params.get("search")
        if search:
            qs = qs.filter(name__icontains=search)

        return qs
