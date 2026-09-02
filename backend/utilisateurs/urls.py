from django.urls import path
from . import views

urlpatterns = [
    path('', views.UtilisateurListCreateView.as_view(), name='utilisateurs-liste'),
    path('<int:pk>/', views.UtilisateurDetailView.as_view(), name='utilisateur-detail'),
]
