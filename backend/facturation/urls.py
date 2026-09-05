from django.urls import path
from . import views

urlpatterns = [
    path('devis/', views.DevisListCreateView.as_view(), name='devis-liste'),
    path('devis/<int:pk>/', views.DevisDetailView.as_view(), name='devis-detail'),
    path('devis/<int:pk>/convertir/', views.DevisConvertirEnFactureView.as_view(), name='devis-convertir'),
    path('devis/<int:pk>/pdf/', views.DevisPDFView.as_view(), name='devis-pdf'),

    path('factures/', views.FactureListCreateView.as_view(), name='factures-liste'),
    path('factures/<int:pk>/', views.FactureDetailView.as_view(), name='facture-detail'),
    path('factures/<int:pk>/pdf/', views.FacturePDFView.as_view(), name='facture-pdf'),
    path('factures/<int:facture_id>/paiements/', views.PaiementListCreateView.as_view(), name='paiements-liste'),

    path('statistiques/', views.StatistiquesView.as_view(), name='statistiques'),
]
