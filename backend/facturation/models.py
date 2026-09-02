from django.db import models
from django.core.validators import MinValueValidator
from decimal import Decimal
from entreprises.models import Entreprise
from clients.models import Client
from utilisateurs.models import Utilisateur


class Devis(models.Model):
    STATUT_CHOICES = [
        ('brouillon', 'Brouillon'),
        ('envoye',    'Envoyé'),
        ('accepte',   'Accepté'),
        ('refuse',    'Refusé'),
        ('expire',    'Expiré'),
    ]

    entreprise = models.ForeignKey(Entreprise, on_delete=models.CASCADE, related_name='devis')
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='devis')
    numero = models.CharField(max_length=50)
    objet = models.CharField(max_length=255, blank=True)
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='brouillon')
    date_emission = models.DateField(auto_now_add=True)
    date_validite = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)
    cree_par = models.ForeignKey(Utilisateur, on_delete=models.SET_NULL, null=True, blank=True)
    date_creation = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date_creation']
        unique_together = ('entreprise', 'numero')

    def __str__(self):
        return f"{self.numero} — {self.client.nom}"

    @property
    def total_ht(self):
        return sum((l.total_ligne_ht for l in self.lignes.all()), Decimal('0'))

    @property
    def total_tva(self):
        return sum((l.total_ligne_tva for l in self.lignes.all()), Decimal('0'))

    @property
    def total_ttc(self):
        return self.total_ht + self.total_tva


class Facture(models.Model):
    STATUT_CHOICES = [
        ('brouillon', 'Brouillon'),
        ('envoyee',   'Envoyée'),
        ('payee',     'Payée'),
        ('partielle', 'Partiellement payée'),
        ('retard',    'En retard'),
        ('annulee',   'Annulée'),
    ]

    entreprise = models.ForeignKey(Entreprise, on_delete=models.CASCADE, related_name='factures')
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='factures')
    devis_origine = models.ForeignKey(Devis, on_delete=models.SET_NULL, null=True, blank=True, related_name='factures')
    numero = models.CharField(max_length=50)
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='brouillon')
    date_emission = models.DateField(auto_now_add=True)
    date_echeance = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)
    cree_par = models.ForeignKey(Utilisateur, on_delete=models.SET_NULL, null=True, blank=True)
    date_creation = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date_creation']
        unique_together = ('entreprise', 'numero')

    def __str__(self):
        return f"{self.numero} — {self.client.nom}"

    @property
    def total_ht(self):
        return sum((l.total_ligne_ht for l in self.lignes.all()), Decimal('0'))

    @property
    def total_tva(self):
        return sum((l.total_ligne_tva for l in self.lignes.all()), Decimal('0'))

    @property
    def total_ttc(self):
        return self.total_ht + self.total_tva

    @property
    def total_paye(self):
        return sum((p.montant for p in self.paiements.all()), Decimal('0'))

    @property
    def solde_restant(self):
        return self.total_ttc - self.total_paye


class LigneDocument(models.Model):
    devis = models.ForeignKey(Devis, on_delete=models.CASCADE, related_name='lignes', null=True, blank=True)
    facture = models.ForeignKey(Facture, on_delete=models.CASCADE, related_name='lignes', null=True, blank=True)
    designation = models.CharField(max_length=255)
    quantite = models.DecimalField(max_digits=10, decimal_places=2, default=1, validators=[MinValueValidator(0)])
    prix_unitaire_ht = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    taux_tva = models.DecimalField(max_digits=5, decimal_places=2, default=18)
    ordre = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['ordre', 'id']

    def __str__(self):
        return self.designation

    @property
    def total_ligne_ht(self):
        return self.quantite * self.prix_unitaire_ht

    @property
    def total_ligne_tva(self):
        return self.total_ligne_ht * (self.taux_tva / Decimal('100'))

    @property
    def total_ligne_ttc(self):
        return self.total_ligne_ht + self.total_ligne_tva


class Paiement(models.Model):
    MODE_CHOICES = [
        ('especes',      'Espèces'),
        ('mobile_money', 'Mobile Money'),
        ('virement',     'Virement bancaire'),
        ('cheque',       'Chèque'),
        ('carte',        'Carte bancaire'),
    ]

    facture = models.ForeignKey(Facture, on_delete=models.CASCADE, related_name='paiements')
    montant = models.DecimalField(max_digits=14, decimal_places=2)
    mode = models.CharField(max_length=20, choices=MODE_CHOICES, default='especes')
    reference = models.CharField(max_length=100, blank=True)
    date_paiement = models.DateField(auto_now_add=True)
    note = models.CharField(max_length=255, blank=True)
    enregistre_par = models.ForeignKey(Utilisateur, on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        ordering = ['-date_paiement']

    def __str__(self):
        return f"{self.montant} — {self.facture.numero}"
