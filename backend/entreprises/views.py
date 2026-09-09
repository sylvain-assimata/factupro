from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta
from django.conf import settings
from .serializers import EntrepriseSerializer, AbonnementSerializer
from .models import Abonnement, PLANS
from . import fedapay


class MonEntrepriseView(generics.RetrieveUpdateAPIView):
    serializer_class = EntrepriseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user.entreprise


class PlansView(APIView):
    """GET /api/entreprise/abonnement/plans/ — liste des plans disponibles (public, pas besoin d'être connecté)."""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response([{'code': k, **v} for k, v in PLANS.items()])


def _valider_paiement(abonnement, transaction_fedapay):
    """Marque l'abonnement payé et fait évoluer le plan de l'entreprise (idempotent)."""
    if abonnement.statut == 'paye':
        return  # déjà traité, on ne double-compte pas
    abonnement.statut = 'paye'
    abonnement.date_paiement = timezone.now()
    abonnement.save()

    entreprise = abonnement.entreprise
    entreprise.plan = abonnement.plan
    # Renouvellement : on prolonge à partir de la date de fin actuelle si elle est encore future
    base = entreprise.date_fin_abonnement if (
        entreprise.date_fin_abonnement and entreprise.date_fin_abonnement > timezone.now().date()
    ) else timezone.now().date()
    entreprise.date_fin_abonnement = base + timedelta(days=30)
    entreprise.save()


class InitierAbonnementView(APIView):
    """POST /api/entreprise/abonnement/initier/ { plan: 'starter' } -> { url: '...' } (redirection FedaPay)."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        plan = request.data.get('plan')
        if plan not in PLANS:
            return Response({'detail': 'Plan invalide.'}, status=status.HTTP_400_BAD_REQUEST)

        if not settings.FEDAPAY_SECRET_KEY:
            return Response(
                {'detail': "Le paiement en ligne n'est pas encore configuré (clé FedaPay manquante)."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        entreprise = request.user.entreprise
        infos_plan = PLANS[plan]
        abonnement = Abonnement.objects.create(
            entreprise=entreprise, plan=plan, montant=infos_plan['prix'], devise=infos_plan['devise'],
        )

        callback_url = f"{settings.FRONTEND_URL}/abonnement/retour?abonnement_id={abonnement.id}"
        try:
            transaction = fedapay.creer_transaction(
                montant=infos_plan['prix'],
                description=f"Abonnement FactuPro — Plan {infos_plan['nom']} ({entreprise.nom})",
                entreprise=entreprise,
                callback_url=callback_url,
            )
        except Exception:
            abonnement.statut = 'echoue'
            abonnement.save()
            return Response({'detail': "Erreur lors de la création du paiement FedaPay."},
                             status=status.HTTP_502_BAD_GATEWAY)

        abonnement.fedapay_transaction_id = transaction['id']
        abonnement.save()

        return Response({'url': transaction['url'], 'abonnement_id': abonnement.id})


class VerifierAbonnementView(APIView):
    """
    GET /api/entreprise/abonnement/<id>/verifier/
    Revérifie le VRAI statut auprès de FedaPay (jamais confiance dans l'URL de retour seule).
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        try:
            abonnement = Abonnement.objects.get(pk=pk, entreprise=request.user.entreprise)
        except Abonnement.DoesNotExist:
            return Response({'detail': 'Introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        if abonnement.statut == 'paye':
            return Response(AbonnementSerializer(abonnement).data)

        if not abonnement.fedapay_transaction_id:
            return Response(AbonnementSerializer(abonnement).data)

        try:
            transaction = fedapay.recuperer_transaction(abonnement.fedapay_transaction_id)
        except Exception:
            return Response({'detail': 'Impossible de vérifier le paiement pour le moment.'},
                             status=status.HTTP_502_BAD_GATEWAY)

        if transaction.get('status') == 'approved':
            _valider_paiement(abonnement, transaction)
        elif transaction.get('status') in ('declined', 'canceled'):
            abonnement.statut = 'echoue' if transaction.get('status') == 'declined' else 'annule'
            abonnement.save()

        return Response(AbonnementSerializer(abonnement).data)


class WebhookFedaPayView(APIView):
    """
    POST /api/entreprise/abonnement/webhook/
    Endpoint public appelé par FedaPay. On NE FAIT PAS confiance au contenu envoyé :
    on revérifie systématiquement le statut réel auprès de l'API FedaPay avant d'agir.
    """
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        data = request.data or {}
        entity = data.get('entity') or data.get('object') or {}
        transaction_id = entity.get('id') or data.get('id')

        if not transaction_id:
            return Response(status=status.HTTP_200_OK)  # on accuse réception quand même

        try:
            abonnement = Abonnement.objects.get(fedapay_transaction_id=transaction_id)
        except Abonnement.DoesNotExist:
            return Response(status=status.HTTP_200_OK)

        try:
            transaction = fedapay.recuperer_transaction(transaction_id)
        except Exception:
            return Response(status=status.HTTP_200_OK)

        if transaction.get('status') == 'approved':
            _valider_paiement(abonnement, transaction)
        elif transaction.get('status') in ('declined', 'canceled') and abonnement.statut == 'en_attente':
            abonnement.statut = 'echoue' if transaction.get('status') == 'declined' else 'annule'
            abonnement.save()

        return Response(status=status.HTTP_200_OK)
