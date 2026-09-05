/**
 * Déclenche le téléchargement d'un blob PDF reçu de l'API (avec Authorization),
 * puisqu'un simple <a href> ne peut pas transmettre le header Authorization.
 */
export function telechargerPdf(blob, nomFichier) {
  const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
  const lien = document.createElement('a');
  lien.href = url;
  lien.setAttribute('download', `${nomFichier}.pdf`);
  document.body.appendChild(lien);
  lien.click();
  lien.remove();
  window.URL.revokeObjectURL(url);
}
