from rest_framework import serializers
from .models import Entreprise


class EntrepriseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Entreprise
        fields = [
            'id', 'nom', 'slug', 'email_contact', 'telephone', 'adresse',
            'ville', 'pays', 'numero_fiscal', 'logo', 'devise',
            'taux_tva_defaut', 'plan', 'date_fin_essai', 'actif', 'date_creation',
        ]
        read_only_fields = ['id', 'slug', 'plan', 'date_fin_essai', 'actif', 'date_creation']
