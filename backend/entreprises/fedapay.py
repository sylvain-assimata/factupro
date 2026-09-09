"""
Intégration FedaPay (paiement Mobile Money / carte) — appels REST directs.
Pas de SDK Python officiel chez FedaPay (seulement PHP/Node/Ruby), donc on
utilise leur API HTTP documentée directement via `requests`.

Sécurité : on ne fait JAMAIS confiance à la redirection du navigateur ni au
contenu brut d'un webhook. On revérifie systématiquement le statut réel de
la transaction en interrogeant l'API FedaPay avec notre clé secrète
(GET /transactions/<id>) avant de valider un paiement côté serveur.
"""
import requests
from django.conf import settings


def _base_url():
    return 'https://api.fedapay.com/v1' if settings.FEDAPAY_ENVIRONMENT == 'live' \
        else 'https://sandbox-api.fedapay.com/v1'


def _headers():
    return {
        'Authorization': f'Bearer {settings.FEDAPAY_SECRET_KEY}',
        'Content-Type': 'application/json',
    }


def _extraire_objet(data, cle_possible):
    """FedaPay enveloppe parfois la réponse (ex: {'v1/transaction': {...}}), parfois non.
    On gère les deux cas plutôt que de supposer un format unique."""
    if cle_possible in data:
        return data[cle_possible]
    if 'transaction' in data:
        return data['transaction']
    # Sinon on suppose que l'objet est directement à la racine
    return data


def creer_transaction(*, montant, description, entreprise, callback_url):
    """Crée une transaction FedaPay et renvoie son id + l'URL de paiement."""
    payload = {
        'description': description,
        'amount': int(montant),
        'currency': {'iso': 'XOF'},
        'callback_url': callback_url,
        'customer': {
            'firstname': entreprise.nom[:60] or 'Client',
            'lastname': 'FactuPro',
            'email': entreprise.email_contact or 'contact@factupro.app',
        },
    }
    resp = requests.post(f'{_base_url()}/transactions', json=payload, headers=_headers(), timeout=15)
    resp.raise_for_status()
    transaction = _extraire_objet(resp.json(), 'v1/transaction')

    # Étape 2 : générer le lien de paiement (token) pour cette transaction
    resp_token = requests.post(
        f'{_base_url()}/transactions/{transaction["id"]}/token', headers=_headers(), timeout=15
    )
    resp_token.raise_for_status()
    token_data = resp_token.json()

    return {'id': transaction['id'], 'url': token_data['url']}


def recuperer_transaction(transaction_id):
    """Interroge FedaPay pour connaître le VRAI statut d'une transaction (source de vérité)."""
    resp = requests.get(f'{_base_url()}/transactions/{transaction_id}', headers=_headers(), timeout=15)
    resp.raise_for_status()
    return _extraire_objet(resp.json(), 'v1/transaction')
