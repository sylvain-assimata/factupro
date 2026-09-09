from django.db import models
import uuid


class Entreprise(models.Model):
    DEVISE_CHOICES = [
        ('XOF', 'Franc CFA (XOF)'),
        ('EUR', 'Euro (EUR)'),
        ('USD', 'Dollar (USD)'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nom = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, unique=True)
    email_contact = models.EmailField(blank=True)
    telephone = models.CharField(max_length=30, blank=True)
    adresse = models.CharField(max_length=255, blank=True)
    ville = models.CharField(max_length=100, blank=True)
    pays = models.CharField(max_length=100, blank=True, default='Togo')
    numero_fiscal = models.CharField(max_length=100, blank=True, help_text="NIF / Registre de commerce")
    logo = models.ImageField(upload_to='logos_entreprises/', blank=True, null=True)
    devise = models.CharField(max_length=3, choices=DEVISE_CHOICES, default='XOF')
    taux_tva_defaut = models.DecimalField(max_digits=5, decimal_places=2, default=18.00)

    PLAN_CHOICES = [
        ('essai', 'Essai gratuit'),
        ('starter', 'Starter'),
        ('pro', 'Pro'),
    ]
    plan = models.CharField(max_length=20, choices=PLAN_CHOICES, default='essai')
    date_fin_essai = models.DateField(null=True, blank=True)
    date_fin_abonnement = models.DateField(null=True, blank=True, help_text="Date jusqu'à laquelle le plan payant est actif")
    actif = models.BooleanField(default=True)

    date_creation = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['nom']

    def __str__(self):
        return self.nom


# Plans disponibles (prix mensuels en FCFA — ajustables ici)
PLANS = {
    'starter': {'nom': 'Starter', 'prix': 5000, 'devise': 'XOF', 'periode': 'mois',
                'description': 'Pour les indépendants : devis, factures et clients illimités.'},
    'pro': {'nom': 'Pro', 'prix': 15000, 'devise': 'XOF', 'periode': 'mois',
            'description': "Pour les équipes : tout Starter + comptes membres illimités et export comptable."},
}


class Abonnement(models.Model):
    """Historique des tentatives de paiement d'abonnement (via FedaPay)."""

    STATUT_CHOICES = [
        ('en_attente', 'En attente'),
        ('paye', 'Payé'),
        ('echoue', 'Échoué'),
        ('annule', 'Annulé'),
    ]

    entreprise = models.ForeignKey(Entreprise, on_delete=models.CASCADE, related_name='abonnements')
    plan = models.CharField(max_length=20, choices=[(k, v['nom']) for k, v in PLANS.items()])
    montant = models.DecimalField(max_digits=12, decimal_places=2)
    devise = models.CharField(max_length=3, default='XOF')
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='en_attente')
    fedapay_transaction_id = models.CharField(max_length=50, blank=True, null=True)
    date_creation = models.DateTimeField(auto_now_add=True)
    date_paiement = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-date_creation']

    def __str__(self):
        return f"{self.entreprise.nom} — {self.plan} — {self.statut}"
