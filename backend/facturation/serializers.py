from rest_framework import serializers
from .models import Devis, Facture, LigneDocument, Paiement


class LigneDocumentSerializer(serializers.ModelSerializer):
    total_ligne_ht = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)
    total_ligne_tva = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)
    total_ligne_ttc = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)

    class Meta:
        model = LigneDocument
        fields = [
            'id', 'designation', 'quantite', 'prix_unitaire_ht', 'taux_tva',
            'ordre', 'total_ligne_ht', 'total_ligne_tva', 'total_ligne_ttc',
        ]


class DevisSerializer(serializers.ModelSerializer):
    lignes = LigneDocumentSerializer(many=True)
    client_nom = serializers.CharField(source='client.nom', read_only=True)
    total_ht = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)
    total_tva = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)
    total_ttc = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)

    class Meta:
        model = Devis
        fields = [
            'id', 'numero', 'client', 'client_nom', 'objet', 'statut',
            'date_emission', 'date_validite', 'notes', 'lignes',
            'total_ht', 'total_tva', 'total_ttc', 'date_creation',
        ]
        read_only_fields = ['id', 'numero', 'date_emission', 'date_creation']

    def _generer_numero(self, entreprise):
        annee = __import__('datetime').date.today().year
        count = Devis.objects.filter(entreprise=entreprise, numero__startswith=f'DEV-{annee}').count() + 1
        return f"DEV-{annee}-{count:04d}"

    def create(self, validated_data):
        lignes_data = validated_data.pop('lignes')
        validated_data.pop('entreprise', None)  # peut être injecté par TenantQuerysetMixin, on gère nous-mêmes
        request = self.context['request']
        entreprise = request.user.entreprise
        devis = Devis.objects.create(
            entreprise=entreprise,
            numero=self._generer_numero(entreprise),
            cree_par=request.user,
            **validated_data,
        )
        for i, ligne in enumerate(lignes_data):
            LigneDocument.objects.create(devis=devis, ordre=i, **ligne)
        return devis

    def update(self, instance, validated_data):
        lignes_data = validated_data.pop('lignes', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if lignes_data is not None:
            instance.lignes.all().delete()
            for i, ligne in enumerate(lignes_data):
                LigneDocument.objects.create(devis=instance, ordre=i, **ligne)
        return instance


class PaiementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Paiement
        fields = ['id', 'montant', 'mode', 'reference', 'date_paiement', 'note']
        read_only_fields = ['id', 'date_paiement']


class FactureSerializer(serializers.ModelSerializer):
    lignes = LigneDocumentSerializer(many=True)
    paiements = PaiementSerializer(many=True, read_only=True)
    client_nom = serializers.CharField(source='client.nom', read_only=True)
    total_ht = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)
    total_tva = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)
    total_ttc = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)
    total_paye = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)
    solde_restant = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)

    class Meta:
        model = Facture
        fields = [
            'id', 'numero', 'client', 'client_nom', 'devis_origine', 'statut',
            'date_emission', 'date_echeance', 'notes', 'lignes', 'paiements',
            'total_ht', 'total_tva', 'total_ttc', 'total_paye', 'solde_restant',
            'date_creation',
        ]
        read_only_fields = ['id', 'numero', 'date_emission', 'date_creation']

    def _generer_numero(self, entreprise):
        annee = __import__('datetime').date.today().year
        count = Facture.objects.filter(entreprise=entreprise, numero__startswith=f'FAC-{annee}').count() + 1
        return f"FAC-{annee}-{count:04d}"

    def create(self, validated_data):
        lignes_data = validated_data.pop('lignes')
        validated_data.pop('entreprise', None)
        request = self.context['request']
        entreprise = request.user.entreprise
        facture = Facture.objects.create(
            entreprise=entreprise,
            numero=self._generer_numero(entreprise),
            cree_par=request.user,
            **validated_data,
        )
        for i, ligne in enumerate(lignes_data):
            LigneDocument.objects.create(facture=facture, ordre=i, **ligne)
        return facture

    def update(self, instance, validated_data):
        lignes_data = validated_data.pop('lignes', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if lignes_data is not None:
            instance.lignes.all().delete()
            for i, ligne in enumerate(lignes_data):
                LigneDocument.objects.create(facture=instance, ordre=i, **ligne)
        return instance
