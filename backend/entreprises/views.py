from rest_framework import generics, permissions
from .serializers import EntrepriseSerializer


class MonEntrepriseView(generics.RetrieveUpdateAPIView):
    serializer_class = EntrepriseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user.entreprise
