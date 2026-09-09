from rest_framework import serializers
from .models import Entreprise, Abonnement, PLANS


class EntrepriseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Entreprise
        fields = [
            'id', 'nom', 'slug', 'email_contact', 'telephone', 'adresse',
            'ville', 'pays', 'numero_fiscal', 'logo', 'devise',
            'taux_tva_defaut', 'plan', 'date_fin_essai', 'date_fin_abonnement',
            'actif', 'date_creation',
        ]
        read_only_fields = ['id', 'slug', 'plan', 'date_fin_essai', 'date_fin_abonnement', 'actif', 'date_creation']


class AbonnementSerializer(serializers.ModelSerializer):
    plan_nom = serializers.SerializerMethodField()

    class Meta:
        model = Abonnement
        fields = ['id', 'plan', 'plan_nom', 'montant', 'devise', 'statut', 'date_creation', 'date_paiement']

    def get_plan_nom(self, obj):
        return PLANS.get(obj.plan, {}).get('nom', obj.plan)
