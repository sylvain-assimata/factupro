from rest_framework import generics, permissions
from django.db.models import Q
from config.mixins import TenantQuerysetMixin
from .models import Client
from .serializers import ClientSerializer


class ClientListCreateView(TenantQuerysetMixin, generics.ListCreateAPIView):
    serializer_class = ClientSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Client.objects.all()

    def get_queryset(self):
        qs = super().get_queryset()
        recherche = self.request.query_params.get('recherche')
        if recherche:
            qs = qs.filter(Q(nom__icontains=recherche) | Q(email__icontains=recherche) | Q(telephone__icontains=recherche))
        return qs


class ClientDetailView(TenantQuerysetMixin, generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ClientSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Client.objects.all()
