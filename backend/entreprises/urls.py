from django.urls import path
from . import views

urlpatterns = [
    path('', views.MonEntrepriseView.as_view(), name='mon-entreprise'),
]
