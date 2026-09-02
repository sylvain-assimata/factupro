from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import Utilisateur
from .serializers import UtilisateurSerializer, InscriptionSerializer, InviterUtilisateurSerializer
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
