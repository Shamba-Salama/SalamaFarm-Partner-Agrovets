"""Auth API views."""

from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .serializers import RegisterSerializer, VendorMeSerializer


class RegisterView(APIView):
    """POST /auth/register/ — create VendorUser + AgrovetStore."""

    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request, *args, **kwargs):
        serializer = RegisterSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            VendorMeSerializer(user, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class MeView(generics.RetrieveAPIView):
    """GET /auth/me/ — current vendor with nested store summary."""

    serializer_class = VendorMeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class EmailTokenObtainPairView(TokenObtainPairView):
    """POST /auth/token/ — JWT pair via email + password (USERNAME_FIELD)."""

    permission_classes = [permissions.AllowAny]


class EmailTokenRefreshView(TokenRefreshView):
    """POST /auth/token/refresh/."""

    permission_classes = [permissions.AllowAny]
