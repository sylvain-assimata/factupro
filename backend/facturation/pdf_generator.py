"""
Génération PDF pour Devis et Factures (reportlab).
"""
from io import BytesIO
from datetime import datetime

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_RIGHT, TA_LEFT
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, HRFlowable,
)

BRAND_COLOR = colors.HexColor('#4F46E5')   # indigo (identité FactuPro)
BRAND_DARK = colors.HexColor('#1E1B4B')
GOLD = colors.HexColor('#D4A017')
GRAY = colors.HexColor('#6B7280')
LIGHT_BG = colors.HexColor('#F5F5FA')


def _devise_symbole(devise):
    return {'XOF': 'F CFA', 'EUR': '€', 'USD': '$'}.get(devise, devise or '')


def _fmt_montant(valeur, devise):
    try:
        montant = float(valeur)
    except (TypeError, ValueError):
        montant = 0
    return f"{montant:,.0f}".replace(',', ' ') + f" {_devise_symbole(devise)}"


def generer_pdf_document(document, type_doc='devis'):
    """
    document : instance de Devis ou Facture (mêmes champs de base : numero, client,
               entreprise, lignes, notes, date_emission, total_ht/tva/ttc).
    type_doc : 'devis' ou 'facture'
    Retourne un buffer BytesIO contenant le PDF.
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=A4,
        topMargin=18 * mm, bottomMargin=18 * mm,
        leftMargin=18 * mm, rightMargin=18 * mm,
    )

    styles = getSampleStyleSheet()
    style_title = ParagraphStyle('TitreDoc', parent=styles['Heading1'], fontSize=20,
                                  textColor=BRAND_DARK, spaceAfter=2, alignment=TA_RIGHT)
    style_numero = ParagraphStyle('Numero', parent=styles['Normal'], fontSize=11,
                                   textColor=BRAND_COLOR, alignment=TA_RIGHT, spaceAfter=2)
    style_entreprise_nom = ParagraphStyle('EntNom', parent=styles['Heading2'], fontSize=15,
                                           textColor=BRAND_DARK, spaceAfter=1)
    style_petit = ParagraphStyle('Petit', parent=styles['Normal'], fontSize=9, textColor=GRAY, leading=13)
    style_label = ParagraphStyle('Label', parent=styles['Normal'], fontSize=8, textColor=GRAY,
                                  spaceAfter=1)
    style_client_nom = ParagraphStyle('ClientNom', parent=styles['Normal'], fontSize=11,
                                       textColor=BRAND_DARK, spaceAfter=1)
    style_notes = ParagraphStyle('Notes', parent=styles['Normal'], fontSize=9, textColor=GRAY, leading=13)

    entreprise = document.entreprise
    client = document.client
    devise = entreprise.devise if entreprise else 'XOF'
    elements = []

    # ---------- En-tête : entreprise (gauche) / titre document (droite) ----------
    entreprise_html = f"<b>{entreprise.nom}</b>"
    infos_entreprise = []
    if entreprise.adresse:
        infos_entreprise.append(entreprise.adresse)
    if entreprise.ville or entreprise.pays:
        infos_entreprise.append(f"{entreprise.ville}{', ' if entreprise.ville and entreprise.pays else ''}{entreprise.pays}")
    if entreprise.telephone:
        infos_entreprise.append(f"Tél : {entreprise.telephone}")
    if entreprise.email_contact:
        infos_entreprise.append(entreprise.email_contact)
    if entreprise.numero_fiscal:
        infos_entreprise.append(f"NIF : {entreprise.numero_fiscal}")

    titre_label = 'DEVIS' if type_doc == 'devis' else 'FACTURE'
    date_doc = document.date_emission.strftime('%d/%m/%Y') if document.date_emission else ''

    entete_gauche = [Paragraph(entreprise_html, style_entreprise_nom)]
    entete_gauche.append(Paragraph('<br/>'.join(infos_entreprise), style_petit))

    entete_droite = [Paragraph(titre_label, style_title)]
    entete_droite.append(Paragraph(f"N° {document.numero}", style_numero))
    entete_droite.append(Paragraph(f"Date d'émission : {date_doc}", style_petit))
    if type_doc == 'devis' and document.date_validite:
        entete_droite.append(Paragraph(
            f"Valable jusqu'au : {document.date_validite.strftime('%d/%m/%Y')}", style_petit))
    if type_doc == 'facture' and document.date_echeance:
        entete_droite.append(Paragraph(
            f"Échéance : {document.date_echeance.strftime('%d/%m/%Y')}", style_petit))

    table_entete = Table([[entete_gauche, entete_droite]], colWidths=[95 * mm, 77 * mm])
    table_entete.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
    ]))
    elements.append(table_entete)
    elements.append(Spacer(1, 4 * mm))
    elements.append(HRFlowable(width='100%', thickness=1.4, color=BRAND_COLOR))
    elements.append(Spacer(1, 6 * mm))

    # ---------- Bloc client ----------
    infos_client = []
    if client.adresse:
        infos_client.append(client.adresse)
    if client.ville or client.pays:
        infos_client.append(f"{client.ville}{', ' if client.ville and client.pays else ''}{client.pays}")
    if client.telephone:
        infos_client.append(f"Tél : {client.telephone}")
    if client.email:
        infos_client.append(client.email)
    if client.numero_fiscal:
        infos_client.append(f"NIF : {client.numero_fiscal}")

    bloc_client = [
        Paragraph('DESTINATAIRE', style_label),
        Paragraph(client.nom, style_client_nom),
        Paragraph('<br/>'.join(infos_client), style_petit),
    ]
    table_client = Table([[bloc_client]], colWidths=[172 * mm])
    table_client.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), LIGHT_BG),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(table_client)
    elements.append(Spacer(1, 8 * mm))

    if getattr(document, 'objet', ''):
        elements.append(Paragraph(f"<b>Objet :</b> {document.objet}", style_petit))
        elements.append(Spacer(1, 4 * mm))

    # ---------- Tableau des lignes ----------
    entetes = ['Désignation', 'Qté', 'PU HT', 'TVA', 'Total HT']
    data = [entetes]
    for ligne in document.lignes.all():
        data.append([
            Paragraph(ligne.designation, style_petit),
            f"{float(ligne.quantite):g}",
            _fmt_montant(ligne.prix_unitaire_ht, devise),
            f"{float(ligne.taux_tva):g}%",
            _fmt_montant(ligne.total_ligne_ht, devise),
        ])

    table_lignes = Table(data, colWidths=[74 * mm, 18 * mm, 32 * mm, 18 * mm, 30 * mm])
    table_lignes.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), BRAND_COLOR),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
        ('ALIGN', (0, 0), (0, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('LINEBELOW', (0, 0), (-1, -2), 0.5, colors.HexColor('#E5E7EB')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, LIGHT_BG]),
    ]))
    elements.append(table_lignes)
    elements.append(Spacer(1, 6 * mm))

    # ---------- Totaux ----------
    lignes_totaux = [
        ['Total HT', _fmt_montant(document.total_ht, devise)],
        ['TVA', _fmt_montant(document.total_tva, devise)],
    ]
    lignes_totaux.append(['TOTAL TTC', _fmt_montant(document.total_ttc, devise)])

    if type_doc == 'facture':
        lignes_totaux.append(['Total payé', _fmt_montant(document.total_paye, devise)])
        lignes_totaux.append(['Solde restant dû', _fmt_montant(document.solde_restant, devise)])

    table_totaux = Table(lignes_totaux, colWidths=[45 * mm, 40 * mm])
    style_totaux = [
        ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LINEABOVE', (0, -1 if type_doc == 'devis' else -2), (-1, -1 if type_doc == 'devis' else -2), 1, BRAND_COLOR),
    ]
    idx_ttc = 2  # ligne "TOTAL TTC" (index fixe car toujours 3e ligne)
    style_totaux.append(('FONTNAME', (0, idx_ttc), (-1, idx_ttc), 'Helvetica-Bold'))
    style_totaux.append(('FONTSIZE', (0, idx_ttc), (-1, idx_ttc), 12))
    style_totaux.append(('TEXTCOLOR', (0, idx_ttc), (-1, idx_ttc), BRAND_COLOR))
    if type_doc == 'facture':
        idx_solde = len(lignes_totaux) - 1
        style_totaux.append(('FONTNAME', (0, idx_solde), (-1, idx_solde), 'Helvetica-Bold'))
        style_totaux.append(('TEXTCOLOR', (0, idx_solde), (-1, idx_solde), colors.HexColor('#B91C1C')))
    table_totaux.setStyle(TableStyle(style_totaux))

    table_totaux_wrapper = Table([[Spacer(1, 1), table_totaux]], colWidths=[87 * mm, 85 * mm])
    table_totaux_wrapper.setStyle(TableStyle([('VALIGN', (0, 0), (-1, -1), 'TOP')]))
    elements.append(table_totaux_wrapper)

    # ---------- Notes ----------
    if getattr(document, 'notes', ''):
        elements.append(Spacer(1, 8 * mm))
        elements.append(Paragraph('NOTES', style_label))
        elements.append(Paragraph(document.notes.replace('\n', '<br/>'), style_notes))

    # ---------- Pied de page ----------
    def pied_de_page(canvas, doc_template):
        canvas.saveState()
        canvas.setFont('Helvetica', 7.5)
        canvas.setFillColor(GRAY)
        texte = f"{entreprise.nom} — Document généré le {datetime.now().strftime('%d/%m/%Y à %H:%M')} — FactuPro"
        canvas.drawCentredString(A4[0] / 2, 12 * mm, texte)
        canvas.restoreState()

    doc.build(elements, onFirstPage=pied_de_page, onLaterPages=pied_de_page)
    buffer.seek(0)
    return buffer


def generer_pdf_devis(devis):
    return generer_pdf_document(devis, type_doc='devis')


def generer_pdf_facture(facture):
    return generer_pdf_document(facture, type_doc='facture')
