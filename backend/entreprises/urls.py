from django.urls import path
from . import views

urlpatterns = [
    path('', views.MonEntrepriseView.as_view(), name='mon-entreprise'),
    path('abonnement/plans/', views.PlansView.as_view(), name='abonnement-plans'),
    path('abonnement/initier/', views.InitierAbonnementView.as_view(), name='abonnement-initier'),
    path('abonnement/<int:pk>/verifier/', views.VerifierAbonnementView.as_view(), name='abonnement-verifier'),
    path('abonnement/webhook/', views.WebhookFedaPayView.as_view(), name='abonnement-webhook'),
]
