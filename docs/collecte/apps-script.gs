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

/* Laisser vide si le script a été créé DEPUIS le tableur
   (Extensions > Apps Script) : il retrouve le tableur tout seul.

   À renseigner si le script a été créé à part, depuis script.google.com :
   dans ce cas il n'est rattaché à aucun tableur et ne peut rien écrire.
   L'identifiant se lit dans l'adresse du tableur, entre /d/ et /edit :
   docs.google.com/spreadsheets/d/[ICI]/edit */
var ID_CLASSEUR = '';

/* Ouvre le tableur, ou explique précisément pourquoi il ne peut pas.
   C'est la panne la plus fréquente : un script créé à part écrit dans
   le vide, sans qu'aucun message ne le signale. */
function ouvrirClasseur() {
  if (ID_CLASSEUR) return SpreadsheetApp.openById(ID_CLASSEUR);

  var actif = SpreadsheetApp.getActiveSpreadsheet();
  if (!actif) {
    throw new Error(
      "Ce script n'est rattaché à aucun tableur : il ne peut donc rien " +
      "enregistrer. Deux solutions — recréer le script depuis le tableur " +
      "(Extensions > Apps Script), ou renseigner ID_CLASSEUR en haut de ce " +
      "fichier puis redéployer une nouvelle version.");
  }
  return actif;
}

/* ------------------------------------------------------------------
   Ouvrir l'adresse de déploiement dans un navigateur affiche l'état réel
   du collecteur. C'est le moyen le plus simple de vérifier qu'il marche
   AVANT de tester depuis la landing.

   Ajouter ?essai=1 à la fin de l'adresse enregistre un contact d'essai :
   si la ligne apparaît dans le tableur, la chaîne complète fonctionne et
   la panne est forcément côté site. La ligne est marquée ESSAI, elle se
   supprime à la main.
   ------------------------------------------------------------------ */
function doGet(e) {
  var lignes = ['Collecteur Fluent & Forward', ''];
  var classeur;

  try {
    classeur = ouvrirClasseur();
  } catch (err) {
    lignes.push('Rattachement au tableur : ÉCHEC');
    lignes.push('');
    lignes.push(String(err.message || err));
    return texte(lignes.join('\n'));
  }

  lignes.push('Rattachement au tableur : OK — « ' + classeur.getName() + ' »');

  var feuille = classeur.getSheetByName(ONGLET_PROSPECTS);
  if (!feuille) {
    lignes.push('Onglet Prospects : pas encore créé');
    lignes.push("  (normal tant qu'aucun contact n'est arrivé : il se crée au premier envoi)");
  } else {
    var total = Math.max(0, feuille.getLastRow() - 1);
    lignes.push('Onglet Prospects : ' + total + ' contact(s) enregistré(s)');
    if (total > 0) {
      lignes.push('Dernier enregistrement : ' +
                  feuille.getRange(feuille.getLastRow(), 1).getValue());
    }
  }

  if (e && e.parameter && e.parameter.essai) {
    try {
      enregistrer(classeur, {
        prenom: 'ESSAI',
        email: 'essai@fluentandforward.test',
        consentementRgpd: true,
        accepteProspection: false,
        demandeRappel: false,
        origine: 'essai-direct',
        provenance: "ouverture manuelle de l'adresse du script"
      });
      lignes.push('');
      lignes.push("Contact d'essai enregistré. Ouvrez le tableur : une ligne");
      lignes.push('ESSAI doit y figurer. Vous pouvez la supprimer ensuite.');
    } catch (err) {
      lignes.push('');
      lignes.push("Écriture du contact d'essai : ÉCHEC — " + String(err.message || err));
    }
  } else {
    lignes.push('');
    lignes.push("Pour tester l'écriture, ajoutez ?essai=1 à la fin de cette adresse.");
  }

  return texte(lignes.join('\n'));
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

    enregistrer(ouvrirClasseur(), contact);

    return reponse({ ok: true });
  } catch (err) {
    return reponse({ erreur: String(err.message || err) });
  }
}

/* Ajoute une ligne dans l'onglet Prospects, en le créant au besoin,
   puis recalcule les statistiques. */
function enregistrer(classeur, contact) {
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
    String(contact.prenom || '').trim(),
    String(contact.email || '').trim(),
    'oui',
    contact.accepteProspection ? 'oui' : 'non',
    contact.demandeRappel ? 'oui' : 'non',
    String(contact.origine || 'inconnue').slice(0, 40),
    String(contact.provenance || 'direct').slice(0, 300)
  ]);

  majStatistiques(classeur, feuille);
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

function texte(contenu) {
  return ContentService
    .createTextOutput(contenu)
    .setMimeType(ContentService.MimeType.TEXT);
}

function reponse(objet) {
  return ContentService
    .createTextOutput(JSON.stringify(objet))
    .setMimeType(ContentService.MimeType.JSON);
}
