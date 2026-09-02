from rest_framework import serializers
from .models import Client


class ClientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = [
            'id', 'nom', 'email', 'telephone', 'adresse', 'ville',
            'pays', 'numero_fiscal', 'notes', 'date_creation',
        ]
        read_only_fields = ['id', 'date_creation']
