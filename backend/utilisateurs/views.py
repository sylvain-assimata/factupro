from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode
from django.core.mail import send_mail
from django.conf import settings

from .models import Utilisateur
from .serializers import (
    UtilisateurSerializer, InscriptionSerializer, InviterUtilisateurSerializer,
    DemandeReinitialisationSerializer, ConfirmerReinitialisationSerializer,
)
from entreprises.serializers import EntrepriseSerializer


class ConnexionSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        data['utilisateur'] = UtilisateurSerializer(self.user).data
        data['entreprise'] = EntrepriseSerializer(self.user.entreprise).data if self.user.entreprise else None
        return data


class ConnexionView(TokenObtainPairView):
    serializer_class = ConnexionSerializer
    permission_classes = [permissions.AllowAny]


class InscriptionView(generics.CreateAPIView):
    serializer_class = InscriptionSerializer
    permission_classes = [permissions.AllowAny]


class MoiView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response({
            'utilisateur': UtilisateurSerializer(request.user).data,
            'entreprise': EntrepriseSerializer(request.user.entreprise).data if request.user.entreprise else None,
        })


class UtilisateurListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Utilisateur.objects.filter(entreprise=self.request.user.entreprise)

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return InviterUtilisateurSerializer
        return UtilisateurSerializer

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['entreprise'] = self.request.user.entreprise
        return ctx

    def create(self, request, *args, **kwargs):
        if request.user.role not in ('proprietaire', 'comptable'):
            return Response({'detail': "Action réservée aux propriétaires/comptables."},
                             status=status.HTTP_403_FORBIDDEN)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(UtilisateurSerializer(user).data, status=status.HTTP_201_CREATED)


class UtilisateurDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = UtilisateurSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Utilisateur.objects.filter(entreprise=self.request.user.entreprise)


class DemanderReinitialisationView(APIView):
    """
    POST /api/auth/mot-de-passe-oublie/ { email }
    Renvoie toujours une réponse identique, que l'email existe ou non
    (pour ne pas révéler quels comptes existent).
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = DemandeReinitialisationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']

        try:
            utilisateur = Utilisateur.objects.get(email__iexact=email, actif=True)
            uid = urlsafe_base64_encode(str(utilisateur.pk).encode())
            token = default_token_generator.make_token(utilisateur)
            lien = f"{settings.FRONTEND_URL}/reinitialiser-mot-de-passe?uid={uid}&token={token}"

            send_mail(
                subject="Réinitialisation de votre mot de passe FactuPro",
                message=(
                    f"Bonjour {utilisateur.prenom},\n\n"
                    "Vous avez demandé la réinitialisation de votre mot de passe FactuPro.\n"
                    f"Cliquez sur ce lien pour choisir un nouveau mot de passe :\n{lien}\n\n"
                    "Ce lien expire dans quelques heures. Si vous n'êtes pas à l'origine de "
                    "cette demande, vous pouvez ignorer cet email.\n\nL'équipe FactuPro"
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=True,
            )
        except Utilisateur.DoesNotExist:
            pass  # on ne révèle jamais si l'email existe ou non

        return Response({
            'detail': "Si un compte existe avec cet email, un lien de réinitialisation vient d'être envoyé."
        })


class ConfirmerReinitialisationView(APIView):
    """POST /api/auth/reinitialiser-mot-de-passe/ { uid, token, password }"""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ConfirmerReinitialisationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({'detail': 'Mot de passe mis à jour avec succès.'})
