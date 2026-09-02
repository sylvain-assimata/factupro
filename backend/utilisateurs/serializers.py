from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken
from django.utils.text import slugify
from django.db import transaction
from datetime import date, timedelta

from .models import Utilisateur
from entreprises.models import Entreprise
from entreprises.serializers import EntrepriseSerializer


class UtilisateurSerializer(serializers.ModelSerializer):
    class Meta:
        model = Utilisateur
        fields = ['id', 'email', 'prenom', 'nom', 'role', 'telephone', 'actif', 'date_creation']
        read_only_fields = ['id', 'date_creation']


class InscriptionSerializer(serializers.Serializer):
    nom_entreprise = serializers.CharField(max_length=200)
    prenom = serializers.CharField(max_length=100)
    nom = serializers.CharField(max_length=100)
    email = serializers.EmailField()
    password = serializers.CharField(min_length=6, write_only=True)
    devise = serializers.ChoiceField(choices=Entreprise.DEVISE_CHOICES, default='XOF')

    def validate_email(self, value):
        if Utilisateur.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Un compte existe déjà avec cet email.")
        return value

    def create(self, validated_data):
        with transaction.atomic():
            base_slug = slugify(validated_data['nom_entreprise'])[:200] or 'entreprise'
            slug = base_slug
            i = 1
            while Entreprise.objects.filter(slug=slug).exists():
                i += 1
                slug = f"{base_slug}-{i}"

            entreprise = Entreprise.objects.create(
                nom=validated_data['nom_entreprise'],
                slug=slug,
                email_contact=validated_data['email'],
                devise=validated_data['devise'],
                plan='essai',
                date_fin_essai=date.today() + timedelta(days=14),
            )

            utilisateur = Utilisateur.objects.create_user(
                email=validated_data['email'],
                password=validated_data['password'],
                prenom=validated_data['prenom'],
                nom=validated_data['nom'],
                role='proprietaire',
                entreprise=entreprise,
            )

            return utilisateur

    def to_representation(self, instance):
        refresh = RefreshToken.for_user(instance)
        return {
            'utilisateur': UtilisateurSerializer(instance).data,
            'entreprise': EntrepriseSerializer(instance.entreprise).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }


class InviterUtilisateurSerializer(serializers.Serializer):
    email = serializers.EmailField()
    prenom = serializers.CharField(max_length=100)
    nom = serializers.CharField(max_length=100)
    password = serializers.CharField(min_length=6, write_only=True)
    role = serializers.ChoiceField(choices=Utilisateur.ROLE_CHOICES, default='membre')

    def validate_email(self, value):
        if Utilisateur.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Un compte existe déjà avec cet email.")
        return value

    def create(self, validated_data):
        entreprise = self.context['entreprise']
        return Utilisateur.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            prenom=validated_data['prenom'],
            nom=validated_data['nom'],
            role=validated_data['role'],
            entreprise=entreprise,
        )
