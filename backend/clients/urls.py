from django.urls import path
from . import views

urlpatterns = [
    path('', views.ClientListCreateView.as_view(), name='clients-liste'),
    path('<int:pk>/', views.ClientDetailView.as_view(), name='client-detail'),
]
