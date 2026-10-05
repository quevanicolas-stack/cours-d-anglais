/* ===================================================================
   ESPACE MEMBRES — Fluent & Forward

   Fichier de SCRIPT (.gs) à placer à côté de Code.gs, dans le projet
   Apps Script lié au classeur « Prospects Fluent & Forward ». Surtout
   pas dans un fichier HTML : Google ne l'exécuterait jamais.

   Connexion par lien : aucun mot de passe, aucun code à recopier.
   - Première fois : la personne demande un accès, Aurélie valide par
     email, et la personne reçoit un lien qui la connecte directement.
   - Ensuite : la personne indique son email sur la page de connexion
     et reçoit aussitôt un nouveau lien, sans passer par Aurélie.
   Chaque lien ne sert qu'une fois et expire.

   Marche à suivre :

   1. Dans l'éditeur, « + » à côté de Fichiers → Script → le nommer
      « MembresEspace » → coller tout le contenu de ce fichier.

   2. Dans Code.gs, tout en haut de doGet(e), une seule ligne :

           if (e.parameter.membre || e.parameter.action === 'decision') return doGetMembres(e);

      (elle remplace l'ancienne ligne qui ne testait que 'decision').
      Les lignes ajoutées en haut de doPost(e) peuvent rester : elles
      fonctionnent toujours, le site ne s'en sert simplement plus.

   3. Dans la feuille de calcul, deux onglets avec ces en-têtes en
      ligne 1 :

      Onglet « Membres » :
        horodatage_demande | prenom | email | statut | jeton_decision |
        date_validation | date_expiration | otp_code | otp_expiration |
        otp_tentatives | otp_dernier_envoi | session_token |
        session_expiration | site

      Les colonnes « otp_… » gardent leur nom d'origine mais contiennent
      désormais le lien de connexion (jeton, expiration, dernier envoi).
      La colonne « site » est facultative : elle retient l'adresse du
      site d'où vient la demande, pour que le premier lien y renvoie.

      Onglet « Programme » :
        semaine | module_titre | fichiers

      La colonne « fichiers » liste des entrées séparées par des
      points-virgules, chacune sous la forme fichier.html|Libellé. Pour
      la semaine 1 (une seule cellule, à copier telle quelle) :

          module1-seance1.html|Séance 1 — Why Your Brain Freezes in English;module1-seance2.html|Séance 2 — The 3 Pillars of Business English;module1-seance3.html|Séance 3 — Structuring Simple Professional Sentences;module1-vocabulaire.html|Vocabulary Kit;module1-grammaire.html|Grammar — The Present Simple

      Ajouter un module plus tard = ajouter une ligne, sans redéployer.

   4. Vérifier les réglages ci-dessous (email d'Aurélie, adresse du
      script, adresses du site).

   5. Choisir la fonction autoriserEspaceMembres dans la barre du haut,
      « Exécuter », accepter la fenêtre d'autorisation Google (une seule
      fois : l'envoi d'emails l'exige).

   6. Déployer → Gérer les déploiements → crayon → Nouvelle version.
   =================================================================== */

// ---------- Réglages ----------
var MEMBRES_FEUILLE           = 'Membres';
var PROGRAMME_FEUILLE         = 'Programme';
var MEMBRES_DUREE_COMPTE_J    = 180;  // validité d'un compte, en jours
var MEMBRES_LIEN_PREMIER_H    = 72;   // validité du lien envoyé après validation, en heures
var MEMBRES_LIEN_VALIDITE_MIN = 30;   // validité des liens suivants, en minutes
var MEMBRES_LIEN_DELAI_SEC    = 60;   // délai minimum entre deux envois de lien
var MEMBRES_SESSION_J         = 14;   // durée de connexion sur un appareil

var MEMBRES_EMAIL_AURELIE     = 'contact@fluentandforward.com';
var MEMBRES_URL_SCRIPT        = 'https://script.google.com/macros/s/AKfycbwK0XxvWhNiwoWVsROAHi7EFQFRMymFOcH5gxV-KSZ3C5F39DPcT1YxSp83iJq9oMbO/exec';

// Adresses du site vers lesquelles un lien de connexion peut renvoyer.
// La première sert par défaut. Toute autre adresse est refusée : un lien
// qui pointerait ailleurs livrerait la connexion à un autre site.
var MEMBRES_SITES = [
  'https://fluentandforward.pages.dev',
  'https://fluentandforward.com',
  'https://www.fluentandforward.com'
];

// ---------- Autorisation (à lancer une fois depuis l'éditeur) ----------

function autoriserEspaceMembres() {
  var classeur = classeurMembres();
  feuilleMembres();
  feuilleProgramme();
  MailApp.sendEmail(MEMBRES_EMAIL_AURELIE, 'Espace membres — test',
    'Si tu lis cet email, l\'espace membres peut envoyer ses messages.\n' +
    'Classeur relié : ' + classeur.getName());
}

// ---------- Utilitaires communs ----------

function essayerLireJSON(e) {
  try {
    if (!e.postData || !e.postData.contents) return null;
    return JSON.parse(e.postData.contents);
  } catch (err) {
    return null;
  }
}

function classeurMembres() {
  return (typeof ID_CLASSEUR !== 'undefined' && ID_CLASSEUR)
    ? SpreadsheetApp.openById(ID_CLASSEUR)
    : SpreadsheetApp.getActiveSpreadsheet();
}

function feuilleMembres() {
  var f = classeurMembres().getSheetByName(MEMBRES_FEUILLE);
  if (!f) throw new Error('Onglet "Membres" introuvable — voir les instructions en tête de fichier.');
  return f;
}

function feuilleProgramme() {
  var f = classeurMembres().getSheetByName(PROGRAMME_FEUILLE);
  if (!f) throw new Error('Onglet "Programme" introuvable — voir les instructions en tête de fichier.');
  return f;
}

var COL = {
  horodatage_demande: 1, prenom: 2, email: 3, statut: 4, jeton_decision: 5,
  date_validation: 6, date_expiration: 7, lien_jeton: 8, lien_expiration: 9,
  inutilisee: 10, lien_dernier_envoi: 11, session_token: 12, session_expiration: 13,
  site: 14
};

function trouverLigneMembre(email) {
  var valeurs = feuilleMembres().getDataRange().getValues();
  var emailBas = String(email).trim().toLowerCase();
  for (var i = 1; i < valeurs.length; i++) {
    if (String(valeurs[i][COL.email - 1]).trim().toLowerCase() === emailBas) {
      return { ligne: i + 1, valeurs: valeurs[i] };
    }
  }
  return null;
}

function trouverLigneParColonne(colonne, valeur) {
  if (!valeur) return null;
  var valeurs = feuilleMembres().getDataRange().getValues();
  for (var i = 1; i < valeurs.length; i++) {
    if (String(valeurs[i][colonne - 1]) === valeur) return { ligne: i + 1, valeurs: valeurs[i] };
  }
  return null;
}

function jetonAleatoire(longueur) {
  var alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  var s = '';
  for (var i = 0; i < longueur; i++) s += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  return s;
}

function echapper(texte) {
  return String(texte).replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function adresseSite(origine) {
  return MEMBRES_SITES.indexOf(String(origine || '')) >= 0 ? origine : MEMBRES_SITES[0];
}

function compteExpire(valeursLigne) {
  var exp = valeursLigne[COL.date_expiration - 1];
  return exp && new Date(exp) < new Date();
}

function reponseJSON(objet) {
  return ContentService.createTextOutput(JSON.stringify(objet))
    .setMimeType(ContentService.MimeType.JSON);
}

function reponseHTML(texte) {
  return HtmlService.createHtmlOutput(
    '<div style="font-family:sans-serif;font-size:16px;max-width:560px;margin:40px auto;line-height:1.5">' +
    texte + '</div>');
}

// ---------- Répartiteurs ----------

// Appelé depuis doGet de Code.gs : le site et les liens d'Aurélie.
function doGetMembres(e) {
  return traiterMembres(e.parameter || {});
}

// Ancien point d'entrée, conservé pour les lignes déjà posées dans doPost.
function doPostMembres(e, corps) {
  return traiterMembres(corps || {});
}

function traiterMembres(p) {
  var op = p.op || p.action;
  try {
    if (op === 'demande_compte')   return membresDemandeCompte(p);
    if (op === 'decision')         return membresDecision(p);
    if (op === 'demande_lien')     return membresDemandeLien(p);
    if (op === 'ouvrir_lien')      return membresOuvrirLien(p);
    if (op === 'verifier_session') return membresVerifierSession(p);
    return reponseJSON({ ok: false, erreur: 'action_inconnue' });
  } catch (err) {
    if (op === 'decision') return reponseHTML('<p>Erreur : ' + echapper(err) + '</p>');
    return reponseJSON({ ok: false, erreur: 'serveur', detail: String(err) });
  }
}

// ---------- 1. Demande de compte ----------

function membresDemandeCompte(p) {
  var prenom = String(p.prenom || '').trim().slice(0, 80);
  var email = String(p.email || '').trim().toLowerCase();
  if (!prenom || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return reponseJSON({ ok: false, erreur: 'prenom_ou_email_invalide' });
  }

  var existant = trouverLigneMembre(email);
  if (existant) {
    var statut = existant.valeurs[COL.statut - 1];
    if (statut === 'en_attente') return reponseJSON({ ok: true, info: 'deja_en_attente' });
    if (statut === 'valide' && !compteExpire(existant.valeurs)) return reponseJSON({ ok: true, info: 'deja_membre' });
    // refusé ou expiré : nouvelle demande possible
  }

  var f = feuilleMembres();
  var jeton = jetonAleatoire(32);
  var maintenant = new Date();
  var site = adresseSite(p.origine);

  if (existant) {
    var ligne = existant.ligne;
    f.getRange(ligne, COL.horodatage_demande).setValue(maintenant);
    f.getRange(ligne, COL.prenom).setValue(prenom);
    f.getRange(ligne, COL.statut).setValue('en_attente');
    f.getRange(ligne, COL.jeton_decision).setValue(jeton);
    f.getRange(ligne, COL.site).setValue(site);
  } else {
    f.appendRow([maintenant, prenom, email, 'en_attente', jeton, '', '', '', '', '', '', '', '', site]);
  }

  var lien = MEMBRES_URL_SCRIPT + '?action=decision&token=' + jeton + '&choix=';
  MailApp.sendEmail(MEMBRES_EMAIL_AURELIE, 'Demande d\'accès — ' + prenom,
    'Nouvelle demande d\'accès à l\'espace membres.\n\n' +
    'Prénom : ' + prenom + '\nEmail  : ' + email + '\n\n' +
    'Valider : ' + lien + 'valider\nRefuser : ' + lien + 'refuser\n',
    { htmlBody:
      '<p>Nouvelle demande d\'accès à l\'espace membres.</p>' +
      '<p><b>Prénom :</b> ' + echapper(prenom) + '<br><b>Email :</b> ' + echapper(email) + '</p>' +
      '<p><a href="' + lien + 'valider" style="background:#1B6B4A;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:bold">Valider</a>' +
      '&nbsp;&nbsp;<a href="' + lien + 'refuser" style="color:#A8452F">Refuser</a></p>' });

  return reponseJSON({ ok: true });
}

// ---------- 2. Décision d'Aurélie (clic dans son email) ----------

function membresDecision(p) {
  var m = trouverLigneParColonne(COL.jeton_decision, String(p.token || ''));
  if (!m) return reponseHTML('<p>Lien invalide ou déjà utilisé.</p>');

  var f = feuilleMembres();
  var prenom = m.valeurs[COL.prenom - 1];
  var email = m.valeurs[COL.email - 1];
  var statut = m.valeurs[COL.statut - 1];
  var qui = echapper(prenom) + ' (' + echapper(email) + ')';

  if (statut !== 'en_attente') {
    return reponseHTML('<p>Cette demande a déjà été traitée (statut : ' + echapper(statut) + ').</p>');
  }

  if (p.choix === 'refuser') {
    f.getRange(m.ligne, COL.statut).setValue('refuse');
    return reponseHTML('<p>Demande de ' + qui + ' refusée. Aucun email ne lui a été envoyé.</p>');
  }
  if (p.choix !== 'valider') return reponseHTML('<p>Lien incomplet.</p>');

  var maintenant = new Date();
  f.getRange(m.ligne, COL.statut).setValue('valide');
  f.getRange(m.ligne, COL.date_validation).setValue(maintenant);
  f.getRange(m.ligne, COL.date_expiration).setValue(
    new Date(maintenant.getTime() + MEMBRES_DUREE_COMPTE_J * 24 * 3600 * 1000));

  envoyerLien(m.ligne, prenom, email, true, m.valeurs[COL.site - 1]);

  return reponseHTML('<p>Compte de ' + qui + ' validé. Un lien de connexion vient de lui être envoyé par email.</p>');
}

// ---------- 3. Envoi d'un lien de connexion ----------

function envoyerLien(ligne, prenom, email, premiereFois, origine) {
  var f = feuilleMembres();
  var maintenant = new Date();
  var dureeMs = premiereFois ? MEMBRES_LIEN_PREMIER_H * 3600 * 1000 : MEMBRES_LIEN_VALIDITE_MIN * 60 * 1000;
  var jeton = jetonAleatoire(40);

  f.getRange(ligne, COL.lien_jeton).setValue(jeton);
  f.getRange(ligne, COL.lien_expiration).setValue(new Date(maintenant.getTime() + dureeMs));
  f.getRange(ligne, COL.lien_dernier_envoi).setValue(maintenant);

  var url = adresseSite(origine) + '/membres/connexion.html?lien=' + jeton;
  var validite = premiereFois
    ? (MEMBRES_LIEN_PREMIER_H >= 24 ? (MEMBRES_LIEN_PREMIER_H / 24) + ' jours' : MEMBRES_LIEN_PREMIER_H + ' heures')
    : MEMBRES_LIEN_VALIDITE_MIN + ' minutes';
  var sujet = premiereFois ? 'Ton accès Fluent & Forward est prêt' : 'Ton lien de connexion Fluent & Forward';
  var intro = premiereFois
    ? 'Ton compte vient d\'être validé. Clique sur le lien ci-dessous pour accéder à ton espace.'
    : 'Voici ton lien pour accéder à ton espace.';
  var note = 'Ce lien est valable ' + validite + ' et ne sert qu\'une fois. Pour te reconnecter plus tard, ' +
    'indique simplement ton email sur la page de connexion : un nouveau lien t\'est envoyé aussitôt.';

  MailApp.sendEmail(email, sujet,
    'Bonjour ' + prenom + ',\n\n' + intro + '\n\n' + url + '\n\n' + note + '\n',
    { name: 'Fluent & Forward', htmlBody:
      '<p>Bonjour ' + echapper(prenom) + ',</p><p>' + intro + '</p>' +
      '<p style="margin:26px 0"><a href="' + url + '" style="background:#1B6B4A;color:#fff;padding:13px 26px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block">Accéder à mon espace</a></p>' +
      '<p style="color:#777;font-size:13px">' + note + '</p>' });
}

function membresDemandeLien(p) {
  var email = String(p.email || '').trim().toLowerCase();
  var m = trouverLigneMembre(email);

  // Réponse identique que l'adresse soit membre ou non : un tiers ne
  // peut pas en déduire qui a un compte.
  if (!m || m.valeurs[COL.statut - 1] !== 'valide') return reponseJSON({ ok: true });
  if (compteExpire(m.valeurs)) return reponseJSON({ ok: true, info: 'compte_expire' });

  var dernier = m.valeurs[COL.lien_dernier_envoi - 1];
  if (dernier && (new Date() - new Date(dernier)) < MEMBRES_LIEN_DELAI_SEC * 1000) {
    return reponseJSON({ ok: true, info: 'patienter' });
  }

  envoyerLien(m.ligne, m.valeurs[COL.prenom - 1], email, false, p.origine);
  return reponseJSON({ ok: true });
}

// ---------- 4. Ouverture du lien : ouvre une session ----------

function membresOuvrirLien(p) {
  var jeton = String(p.lien || '').trim();
  if (jeton.length < 30) return reponseJSON({ ok: false, erreur: 'lien_invalide' });

  var m = trouverLigneParColonne(COL.lien_jeton, jeton);
  if (!m || m.valeurs[COL.statut - 1] !== 'valide') return reponseJSON({ ok: false, erreur: 'lien_invalide' });
  if (compteExpire(m.valeurs)) return reponseJSON({ ok: false, erreur: 'compte_expire' });

  var f = feuilleMembres();
  var expLien = m.valeurs[COL.lien_expiration - 1];
  if (!expLien || new Date(expLien) < new Date()) {
    f.getRange(m.ligne, COL.lien_jeton).setValue('');
    return reponseJSON({ ok: false, erreur: 'lien_expire' });
  }

  var maintenant = new Date();
  var expCompte = new Date(m.valeurs[COL.date_expiration - 1]);
  var expSession = new Date(maintenant.getTime() + MEMBRES_SESSION_J * 24 * 3600 * 1000);
  if (expSession > expCompte) expSession = expCompte;

  // Une session encore valide est reprise plutôt que remplacée : se
  // connecter sur le téléphone ne déconnecte pas l'ordinateur.
  var session = String(m.valeurs[COL.session_token - 1] || '');
  var finSession = m.valeurs[COL.session_expiration - 1];
  if (!session || !finSession || new Date(finSession) < maintenant) session = jetonAleatoire(40);

  f.getRange(m.ligne, COL.lien_jeton).setValue('');
  f.getRange(m.ligne, COL.lien_expiration).setValue('');
  f.getRange(m.ligne, COL.session_token).setValue(session);
  f.getRange(m.ligne, COL.session_expiration).setValue(expSession);

  return reponseJSON({ ok: true, session: session });
}

// ---------- 5. Vérification de session + modules débloqués ----------

function membresVerifierSession(p) {
  var m = trouverLigneParColonne(COL.session_token, String(p.session || '').trim());
  if (!m) return reponseJSON({ ok: false, erreur: 'session_inconnue' });

  var fin = m.valeurs[COL.session_expiration - 1];
  if (!fin || new Date(fin) < new Date() || compteExpire(m.valeurs)) {
    return reponseJSON({ ok: false, erreur: 'session_expiree' });
  }

  var dateValidation = new Date(m.valeurs[COL.date_validation - 1]);
  var joursEcoules = Math.floor((new Date() - dateValidation) / (24 * 3600 * 1000));
  var semaineCourante = Math.floor(joursEcoules / 7) + 1;

  return reponseJSON({
    ok: true,
    prenom: m.valeurs[COL.prenom - 1],
    semaine_courante: semaineCourante,
    date_expiration: m.valeurs[COL.date_expiration - 1],
    programme: programmeDebloqueJusqua(semaineCourante)
  });
}

function programmeDebloqueJusqua(semaineCourante) {
  var valeurs = feuilleProgramme().getDataRange().getValues();
  var resultat = [];
  for (var i = 1; i < valeurs.length; i++) {
    var semaine = Number(valeurs[i][0]);
    if (!semaine) continue;
    var fichiers = String(valeurs[i][2] || '').split(';').map(function (entree) {
      var parties = entree.split('|');
      var fichier = (parties[0] || '').trim();
      return { fichier: fichier, libelle: (parties[1] || fichier).trim() };
    }).filter(function (x) { return x.fichier; });
    resultat.push({ semaine: semaine, titre: valeurs[i][1], fichiers: fichiers, debloque: semaine <= semaineCourante });
  }
  resultat.sort(function (a, b) { return a.semaine - b.semaine; });
  return resultat;
}
