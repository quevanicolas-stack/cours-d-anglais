/* ==================================================================
   Fluent & Forward — collecteur de prospects (Google Apps Script)

   À utiliser quand la landing est hébergée sur un serveur qui n'exécute
   pas de code : GitHub Pages, Netlify, Cloudflare Pages…

   Le fichier de sauvegarde est alors une feuille Google Sheets, avec
   un onglet « Prospects » et un onglet « Statistiques ».

   Mise en place : voir LISEZMOI.md.
   ================================================================== */

var ONGLET_PROSPECTS = 'Prospects';
var ONGLET_STATS = 'Statistiques';

/* Ouvrir l'adresse de déploiement dans un navigateur affiche cette réponse.
   C'est le moyen le plus simple de vérifier que le collecteur est en ligne. */
function doGet() {
  var total = 0;
  try {
    var f = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ONGLET_PROSPECTS);
    if (f) total = Math.max(0, f.getLastRow() - 1);
  } catch (err) {}

  return ContentService
    .createTextOutput('Collecteur Fluent & Forward en ligne. Contacts enregistrés : ' + total)
    .setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
  try {
    var contact = JSON.parse(e.postData.contents);

    var prenom = String(contact.prenom || '').trim();
    var email = String(contact.email || '').trim();

    if (!prenom || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      return reponse({ erreur: 'Prénom ou email invalide' });
    }
    if (!contact.consentementRgpd) {
      return reponse({ erreur: 'Consentement au traitement manquant' });
    }

    var classeur = SpreadsheetApp.getActiveSpreadsheet();
    var feuille = classeur.getSheetByName(ONGLET_PROSPECTS);
    if (!feuille) {
      feuille = classeur.insertSheet(ONGLET_PROSPECTS);
      feuille.appendRow(['Date', 'Prénom', 'Email', 'Consentement RGPD',
                         'Accepte prospection', 'Demande rappel', 'Origine', 'Provenance']);
      feuille.getRange('A1:H1').setFontWeight('bold');
      feuille.setFrozenRows(1);
    }

    feuille.appendRow([
      new Date(),
      prenom,
      email,
      'oui',
      contact.accepteProspection ? 'oui' : 'non',
      contact.demandeRappel ? 'oui' : 'non',
      String(contact.origine || 'inconnue').slice(0, 40),
      String(contact.provenance || 'direct').slice(0, 300)
    ]);

    majStatistiques(classeur, feuille);

    return reponse({ ok: true });
  } catch (err) {
    return reponse({ erreur: String(err) });
  }
}

/* Recalcule l'onglet Statistiques à partir des contacts enregistrés. */
function majStatistiques(classeur, feuilleProspects) {
  var stats = classeur.getSheetByName(ONGLET_STATS);
  if (!stats) {
    stats = classeur.insertSheet(ONGLET_STATS);
  }

  var lignes = feuilleProspects.getDataRange().getValues();
  lignes.shift(); // en-tête

  var uniques = {};
  var parJour = {};
  var parOrigine = {};
  var prospection = 0;
  var rappels = 0;

  lignes.forEach(function (l) {
    var date = l[0] instanceof Date
      ? Utilities.formatDate(l[0], Session.getScriptTimeZone(), 'yyyy-MM-dd')
      : String(l[0]).slice(0, 10);
    uniques[String(l[2]).toLowerCase()] = true;
    parJour[date] = (parJour[date] || 0) + 1;
    if (l[4] === 'oui') prospection++;
    if (l[5] === 'oui') rappels++;
    parOrigine[l[6]] = (parOrigine[l[6]] || 0) + 1;
  });

  stats.clear();
  stats.appendRow(['Indicateur', 'Valeur']);
  stats.appendRow(['Téléchargements', lignes.length]);
  stats.appendRow(['Adresses uniques', Object.keys(uniques).length]);
  stats.appendRow(['Acceptent la prospection', prospection]);
  stats.appendRow(['Demandent à être rappelés', rappels]);
  stats.appendRow(['Dernière mise à jour', new Date()]);
  stats.appendRow(['', '']);

  stats.appendRow(['Par jour', '']);
  Object.keys(parJour).sort().forEach(function (j) {
    stats.appendRow([j, parJour[j]]);
  });

  stats.appendRow(['', '']);
  stats.appendRow(['Par emplacement du formulaire', '']);
  Object.keys(parOrigine).forEach(function (o) {
    stats.appendRow([o, parOrigine[o]]);
  });

  stats.getRange('A1:B1').setFontWeight('bold');
}

function reponse(objet) {
  return ContentService
    .createTextOutput(JSON.stringify(objet))
    .setMimeType(ContentService.MimeType.JSON);
}
