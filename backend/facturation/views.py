from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Q
from django.http import HttpResponse
from config.mixins import TenantQuerysetMixin
from .models import Devis, Facture, LigneDocument, Paiement
from .serializers import DevisSerializer, FactureSerializer, PaiementSerializer
from .pdf_generator import generer_pdf_devis, generer_pdf_facture


class DevisListCreateView(TenantQuerysetMixin, generics.ListCreateAPIView):
    serializer_class = DevisSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Devis.objects.all()

    def get_queryset(self):
        qs = super().get_queryset()
        recherche = self.request.query_params.get('recherche')
        if recherche:
            qs = qs.filter(Q(numero__icontains=recherche) | Q(client__nom__icontains=recherche))
        statut = self.request.query_params.get('statut')
        if statut:
            qs = qs.filter(statut=statut)
        return qs


class DevisDetailView(TenantQuerysetMixin, generics.RetrieveUpdateDestroyAPIView):
    serializer_class = DevisSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Devis.objects.all()


class DevisConvertirEnFactureView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            devis = Devis.objects.get(pk=pk, entreprise=request.user.entreprise)
        except Devis.DoesNotExist:
            return Response({'detail': 'Devis introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        annee = __import__('datetime').date.today().year
        count = Facture.objects.filter(entreprise=request.user.entreprise, numero__startswith=f'FAC-{annee}').count() + 1
        numero = f"FAC-{annee}-{count:04d}"

        facture = Facture.objects.create(
            entreprise=request.user.entreprise,
            client=devis.client,
            devis_origine=devis,
            numero=numero,
            cree_par=request.user,
            notes=devis.notes,
        )
        for ligne in devis.lignes.all():
            LigneDocument.objects.create(
                facture=facture,
                designation=ligne.designation,
                quantite=ligne.quantite,
                prix_unitaire_ht=ligne.prix_unitaire_ht,
                taux_tva=ligne.taux_tva,
                ordre=ligne.ordre,
            )
        devis.statut = 'accepte'
        devis.save()

        return Response(FactureSerializer(facture).data, status=status.HTTP_201_CREATED)


class FactureListCreateView(TenantQuerysetMixin, generics.ListCreateAPIView):
    serializer_class = FactureSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Facture.objects.all()

    def get_queryset(self):
        qs = super().get_queryset()
        recherche = self.request.query_params.get('recherche')
        if recherche:
            qs = qs.filter(Q(numero__icontains=recherche) | Q(client__nom__icontains=recherche))
        statut = self.request.query_params.get('statut')
        if statut:
            qs = qs.filter(statut=statut)
        return qs


class FactureDetailView(TenantQuerysetMixin, generics.RetrieveUpdateDestroyAPIView):
    serializer_class = FactureSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Facture.objects.all()


class PaiementListCreateView(generics.ListCreateAPIView):
    serializer_class = PaiementSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_facture(self):
        return Facture.objects.get(pk=self.kwargs['facture_id'], entreprise=self.request.user.entreprise)

    def get_queryset(self):
        return Paiement.objects.filter(facture=self.get_facture())

    def perform_create(self, serializer):
        facture = self.get_facture()
        paiement = serializer.save(facture=facture, enregistre_par=self.request.user)
        facture.refresh_from_db()
        if facture.solde_restant <= 0:
            facture.statut = 'payee'
        elif facture.total_paye > 0:
            facture.statut = 'partielle'
        facture.save()
        return paiement


class StatistiquesView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        entreprise = request.user.entreprise
        factures = Facture.objects.filter(entreprise=entreprise)
        devis = Devis.objects.filter(entreprise=entreprise)
        clients_count = entreprise.clients.count() if entreprise else 0

        total_facture = sum((f.total_ttc for f in factures), 0)
        total_encaisse = sum((f.total_paye for f in factures), 0)
        total_impaye = total_facture - total_encaisse

        return Response({
            'nb_clients': clients_count,
            'nb_devis': devis.count(),
            'nb_factures': factures.count(),
            'nb_factures_impayees': factures.filter(statut__in=['envoyee', 'partielle', 'retard']).count(),
            'total_facture': total_facture,
            'total_encaisse': total_encaisse,
            'total_impaye': total_impaye,
        })


# ---------- Génération PDF ----------

class DevisPDFView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        try:
            devis = Devis.objects.get(pk=pk, entreprise=request.user.entreprise)
        except Devis.DoesNotExist:
            return Response({'detail': 'Devis introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        buffer = generer_pdf_devis(devis)
        response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
        response['Content-Disposition'] = f'inline; filename="{devis.numero}.pdf"'
        return response


class FacturePDFView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        try:
            facture = Facture.objects.get(pk=pk, entreprise=request.user.entreprise)
        except Facture.DoesNotExist:
            return Response({'detail': 'Facture introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        buffer = generer_pdf_facture(facture)
        response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
        response['Content-Disposition'] = f'inline; filename="{facture.numero}.pdf"'
        return response
