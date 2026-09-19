from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    path('connexion/', views.ConnexionView.as_view(), name='connexion'),
    path('rafraichir/', TokenRefreshView.as_view(), name='rafraichir'),
    path('inscription/', views.InscriptionView.as_view(), name='inscription'),
    path('moi/', views.MoiView.as_view(), name='moi'),
    path('mot-de-passe-oublie/', views.DemanderReinitialisationView.as_view(), name='mot-de-passe-oublie'),
    path('reinitialiser-mot-de-passe/', views.ConfirmerReinitialisationView.as_view(), name='reinitialiser-mot-de-passe'),
]
