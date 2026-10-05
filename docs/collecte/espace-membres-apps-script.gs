/* ===================================================================
   ESPACE MEMBRES — Fluent & Forward

   Ce fichier est une ADDITION, pas un remplacement. Il ne touche à
   rien de ce qui existe déjà (inscriptions au guide, tableau de bord
   des parcours). Marche à suivre :

   1. Ouvrir le projet Apps Script lié au classeur « Prospects Fluent
      & Forward » (celui qui gère déjà le guide et le tableau de bord —
      voir docs/README.md).
   2. Dans l'éditeur, cliquer sur le « + » à côté des fichiers existants
      → Script → le nommer par exemple « MembresEspace » → coller tout
      le contenu de ce fichier dedans.
   3. Dans le fichier qui contient déjà votre doPost(e) existant,
      ajouter TOUT EN HAUT de la fonction, avant le reste de son code :

           var corpsMembres = essayerLireJSON(e);
           if (corpsMembres && corpsMembres.type === 'membre') {
             return doPostMembres(e, corpsMembres);
           }

      Et dans votre doGet(e) existant, tout en haut :

           if (e.parameter.action === 'decision') return doGetDecision(e);

   4. Dans la feuille de calcul, créer deux nouveaux onglets, avec ces
      en-têtes EXACTS en ligne 1 :

      Onglet « Membres » :
        horodatage_demande | prenom | email | statut | jeton_decision |
        date_validation | date_expiration | otp_code | otp_expiration |
        otp_tentatives | otp_dernier_envoi | session_token |
        session_expiration

      Onglet « Programme » :
        semaine | module_titre | fichiers

      Dans « Programme », ajouter une première ligne :
        1 | Module 1 — Think & Speak Like a Business Person |
        module1-seance1.html,module1-seance2.html,module1-seance3.html

      C'est cet onglet qui pilote le déblocage. Pour ajouter un module
      plus tard, il suffit d'ajouter une ligne — aucun redéploiement de
      script nécessaire. Les fichiers eux-mêmes doivent en revanche être
      publiés dans /membres/cours/ au moment voulu (ça, c'est un commit).

   5. En bas de ce fichier, remplir les deux constantes MEMBRES_EMAIL_
      AURELIE et MEMBRES_URL_SCRIPT, puis redéployer (Déployer →
      Gérer les déploiements → crayon → Nouvelle version).

   Rien n'est stocké en clair de façon permanente : le code OTP est
   effacé de la feuille dès qu'il est utilisé ou remplacé, et aucun mot
   de passe n'est jamais conservé — seulement un code à usage unique,
   valable quelques minutes, renvoyé à chaque connexion.
   =================================================================== */

// ---------- Réglages ----------
var MEMBRES_FEUILLE          = 'Membres';
var PROGRAMME_FEUILLE        = 'Programme';
var MEMBRES_DUREE_COMPTE_J   = 180;   // validité d'un compte, en jours
var MEMBRES_OTP_VALIDITE_MIN = 10;    // validité d'un code, en minutes
var MEMBRES_OTP_TENTATIVES   = 5;     // essais autorisés avant d'exiger un nouveau code
var MEMBRES_OTP_DELAI_SEC    = 60;    // délai minimum entre deux envois de code
var MEMBRES_SESSION_J        = 14;    // durée d'une session après connexion réussie

var MEMBRES_EMAIL_AURELIE    = 'À COMPLÉTER — email d\'Aurélie qui reçoit les demandes';
var MEMBRES_URL_SCRIPT       = 'À COMPLÉTER — l\'adresse /exec de CE déploiement';

// ---------- Utilitaires communs ----------

function essayerLireJSON(e) {
  try {
    if (!e.postData || !e.postData.contents) return null;
    return JSON.parse(e.postData.contents);
  } catch (err) {
    return null;
  }
}

function feuilleMembres() {
  var cl = SpreadsheetApp.getActiveSpreadsheet();
  var f = cl.getSheetByName(MEMBRES_FEUILLE);
  if (!f) throw new Error('Onglet "Membres" introuvable — voir les instructions en tête de fichier.');
  return f;
}

function feuilleProgramme() {
  var cl = SpreadsheetApp.getActiveSpreadsheet();
  var f = cl.getSheetByName(PROGRAMME_FEUILLE);
  if (!f) throw new Error('Onglet "Programme" introuvable — voir les instructions en tête de fichier.');
  return f;
}

var COL = {
  horodatage_demande: 1, prenom: 2, email: 3, statut: 4, jeton_decision: 5,
  date_validation: 6, date_expiration: 7, otp_code: 8, otp_expiration: 9,
  otp_tentatives: 10, otp_dernier_envoi: 11, session_token: 12, session_expiration: 13
};

function trouverLigneMembre(email) {
  var f = feuilleMembres();
  var valeurs = f.getDataRange().getValues();
  var emailBas = String(email).trim().toLowerCase();
  for (var i = 1; i < valeurs.length; i++) {
    if (String(valeurs[i][COL.email - 1]).trim().toLowerCase() === emailBas) {
      return { ligne: i + 1, valeurs: valeurs[i] };
    }
  }
  return null;
}

function jetonAleatoire(longueur) {
  var alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
  var s = '';
  for (var i = 0; i < longueur; i++) s += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  return s;
}

function codeOtp() {
  // 6 chiffres, jamais de zéro en tête perdu à l'affichage : stocké en texte.
  return String(Math.floor(100000 + Math.random() * 900000));
}

function reponseJSON(objet) {
  return ContentService.createTextOutput(JSON.stringify(objet))
    .setMimeType(ContentService.MimeType.JSON);
}

function reponseHTML(texte) {
  return HtmlService.createHtmlOutput(texte);
}

// ---------- Répartiteur POST (appelé depuis votre doPost existant) ----------

function doPostMembres(e, corps) {
  var action = corps.action;
  if (action === 'demande_compte')  return membresDemandeCompte(corps);
  if (action === 'demande_otp')     return membresDemandeOtp(corps);
  if (action === 'verifier_otp')    return membresVerifierOtp(corps);
  if (action === 'verifier_session') return membresVerifierSession(corps);
  return reponseJSON({ ok: false, erreur: 'action inconnue' });
}

// ---------- Répartiteur GET (appelé depuis votre doGet existant) ----------

function doGetDecision(e) {
  var token = e.parameter.token;
  var choix = e.parameter.choix; // "valider" ou "refuser"
  if (!token || !choix) return reponseHTML('<p>Lien incomplet.</p>');

  var f = feuilleMembres();
  var valeurs = f.getDataRange().getValues();
  for (var i = 1; i < valeurs.length; i++) {
    if (String(valeurs[i][COL.jeton_decision - 1]) === token) {
      var ligne = i + 1;
      var email = valeurs[i][COL.email - 1];
      var prenom = valeurs[i][COL.prenom - 1];
      var statutActuel = valeurs[i][COL.statut - 1];

      if (statutActuel !== 'en_attente') {
        return reponseHTML('<p>Cette demande a déjà été traitée (statut actuel : ' + statutActuel + ').</p>');
      }

      if (choix === 'refuser') {
        f.getRange(ligne, COL.statut).setValue('refuse');
        return reponseHTML('<p>Demande de ' + prenom + ' (' + email + ') refusée. Aucun email supplémentaire ne lui a été envoyé.</p>');
      }

      // --- validation ---
      var maintenant = new Date();
      var expiration = new Date(maintenant.getTime() + MEMBRES_DUREE_COMPTE_J * 24 * 60 * 60 * 1000);
      f.getRange(ligne, COL.statut).setValue('valide');
      f.getRange(ligne, COL.date_validation).setValue(maintenant);
      f.getRange(ligne, COL.date_expiration).setValue(expiration);

      var premierCode = codeOtp();
      f.getRange(ligne, COL.otp_code).setValue(premierCode);
      f.getRange(ligne, COL.otp_expiration).setValue(new Date(maintenant.getTime() + MEMBRES_OTP_VALIDITE_MIN * 60 * 1000));
      f.getRange(ligne, COL.otp_tentatives).setValue(0);
      f.getRange(ligne, COL.otp_dernier_envoi).setValue(maintenant);

      envoyerEmailOtp(prenom, email, premierCode, true);

      return reponseHTML('<p>Compte de ' + prenom + ' (' + email + ') validé. Son premier code de connexion vient de lui être envoyé par email.</p>');
    }
  }
  return reponseHTML('<p>Lien invalide ou déjà utilisé.</p>');
}

// ---------- 1. Demande de compte ----------

function membresDemandeCompte(corps) {
  var prenom = String(corps.prenom || '').trim();
  var email = String(corps.email || '').trim().toLowerCase();
  if (!prenom || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return reponseJSON({ ok: false, erreur: 'prenom ou email invalide' });
  }

  var existant = trouverLigneMembre(email);
  if (existant) {
    var statut = existant.valeurs[COL.statut - 1];
    if (statut === 'en_attente') return reponseJSON({ ok: true, info: 'deja_en_attente' });
    if (statut === 'valide')     return reponseJSON({ ok: true, info: 'deja_membre' });
    // si "refuse", on laisse la possibilité de redemander : on retombe plus bas
  }

  var f = feuilleMembres();
  var jeton = jetonAleatoire(24);
  var maintenant = new Date();

  if (existant) {
    var ligne = existant.ligne;
    f.getRange(ligne, COL.horodatage_demande).setValue(maintenant);
    f.getRange(ligne, COL.statut).setValue('en_attente');
    f.getRange(ligne, COL.jeton_decision).setValue(jeton);
  } else {
    var nouvelleLigne = [maintenant, prenom, email, 'en_attente', jeton, '', '', '', '', '', '', '', ''];
    f.appendRow(nouvelleLigne);
  }

  envoyerEmailDecisionAurelie(prenom, email, jeton);
  return reponseJSON({ ok: true });
}

function envoyerEmailDecisionAurelie(prenom, email, jeton) {
  var lienValider = MEMBRES_URL_SCRIPT + '?action=decision&token=' + jeton + '&choix=valider';
  var lienRefuser = MEMBRES_URL_SCRIPT + '?action=decision&token=' + jeton + '&choix=refuser';
  var corps =
    'Nouvelle demande d\'accès à l\'espace membres.\n\n' +
    'Prénom : ' + prenom + '\n' +
    'Email  : ' + email + '\n\n' +
    'Valider : ' + lienValider + '\n' +
    'Refuser : ' + lienRefuser + '\n';
  MailApp.sendEmail(MEMBRES_EMAIL_AURELIE, 'Demande d\'accès — ' + prenom, corps);
}

function envoyerEmailOtp(prenom, email, code, premiereFois) {
  var sujet = premiereFois ? 'Ton accès Fluent & Forward est prêt' : 'Ton code de connexion Fluent & Forward';
  var corps =
    'Bonjour ' + prenom + ',\n\n' +
    (premiereFois ? 'Ton compte vient d\'être validé. ' : '') +
    'Voici ton code de connexion, valable ' + MEMBRES_OTP_VALIDITE_MIN + ' minutes :\n\n' +
    '    ' + code + '\n\n' +
    'Il ne sert qu\'une fois. À chaque connexion, un nouveau code t\'est envoyé —\n' +
    'il n\'y a pas de mot de passe à retenir ni à conserver.\n';
  MailApp.sendEmail(email, sujet, corps);
}

// ---------- 2. Demande d'un code (connexions suivantes) ----------

function membresDemandeOtp(corps) {
  var email = String(corps.email || '').trim().toLowerCase();
  var m = trouverLigneMembre(email);

  // Réponse volontairement identique, que le compte existe ou non :
  // ça évite qu'un tiers déduise quelles adresses sont membres.
  var reponseGenerique = { ok: true };

  if (!m || m.valeurs[COL.statut - 1] !== 'valide') return reponseJSON(reponseGenerique);

  var expirationCompte = m.valeurs[COL.date_expiration - 1];
  if (expirationCompte && new Date(expirationCompte) < new Date()) {
    return reponseJSON({ ok: true, info: 'compte_expire' });
  }

  var dernierEnvoi = m.valeurs[COL.otp_dernier_envoi - 1];
  if (dernierEnvoi && (new Date() - new Date(dernierEnvoi)) < MEMBRES_OTP_DELAI_SEC * 1000) {
    return reponseJSON({ ok: true, info: 'patienter' });
  }

  var f = feuilleMembres();
  var code = codeOtp();
  var maintenant = new Date();
  f.getRange(m.ligne, COL.otp_code).setValue(code);
  f.getRange(m.ligne, COL.otp_expiration).setValue(new Date(maintenant.getTime() + MEMBRES_OTP_VALIDITE_MIN * 60 * 1000));
  f.getRange(m.ligne, COL.otp_tentatives).setValue(0);
  f.getRange(m.ligne, COL.otp_dernier_envoi).setValue(maintenant);

  envoyerEmailOtp(m.valeurs[COL.prenom - 1], email, code, false);
  return reponseJSON(reponseGenerique);
}

// ---------- 3. Vérification du code ----------

function membresVerifierOtp(corps) {
  var email = String(corps.email || '').trim().toLowerCase();
  var code = String(corps.code || '').trim();
  var m = trouverLigneMembre(email);
  if (!m || m.valeurs[COL.statut - 1] !== 'valide') {
    return reponseJSON({ ok: false, erreur: 'compte_inconnu' });
  }

  var f = feuilleMembres();
  var tentatives = Number(m.valeurs[COL.otp_tentatives - 1] || 0);
  if (tentatives >= MEMBRES_OTP_TENTATIVES) {
    return reponseJSON({ ok: false, erreur: 'trop_de_tentatives' });
  }

  var codeAttendu = String(m.valeurs[COL.otp_code - 1] || '');
  var expiration = m.valeurs[COL.otp_expiration - 1];
  var expire = !expiration || new Date(expiration) < new Date();

  if (!codeAttendu || expire || code !== codeAttendu) {
    f.getRange(m.ligne, COL.otp_tentatives).setValue(tentatives + 1);
    return reponseJSON({ ok: false, erreur: expire ? 'code_expire' : 'code_invalide' });
  }

  // Succès : le code est effacé (usage unique) et une session est ouverte.
  var maintenant = new Date();
  var expirationCompte = new Date(m.valeurs[COL.date_expiration - 1]);
  var expirationSession = new Date(maintenant.getTime() + MEMBRES_SESSION_J * 24 * 60 * 60 * 1000);
  if (expirationSession > expirationCompte) expirationSession = expirationCompte;

  var jetonSession = jetonAleatoire(32);
  f.getRange(m.ligne, COL.otp_code).setValue('');
  f.getRange(m.ligne, COL.otp_expiration).setValue('');
  f.getRange(m.ligne, COL.otp_tentatives).setValue(0);
  f.getRange(m.ligne, COL.session_token).setValue(jetonSession);
  f.getRange(m.ligne, COL.session_expiration).setValue(expirationSession);

  return reponseJSON({ ok: true, session: jetonSession });
}

// ---------- 4. Vérification de session + calcul des modules débloqués ----------

function membresVerifierSession(corps) {
  var token = String(corps.session || '').trim();
  if (!token) return reponseJSON({ ok: false });

  var f = feuilleMembres();
  var valeurs = f.getDataRange().getValues();
  for (var i = 1; i < valeurs.length; i++) {
    if (String(valeurs[i][COL.session_token - 1]) === token) {
      var expirationSession = valeurs[i][COL.session_expiration - 1];
      if (!expirationSession || new Date(expirationSession) < new Date()) {
        return reponseJSON({ ok: false, erreur: 'session_expiree' });
      }

      var dateValidation = new Date(valeurs[i][COL.date_validation - 1]);
      var joursEcoules = Math.floor((new Date() - dateValidation) / (24 * 60 * 60 * 1000));
      var semaineCourante = Math.floor(joursEcoules / 7) + 1;

      return reponseJSON({
        ok: true,
        prenom: valeurs[i][COL.prenom - 1],
        semaine_courante: semaineCourante,
        date_expiration: valeurs[i][COL.date_expiration - 1],
        programme: programmeDebloqueJusqua(semaineCourante)
      });
    }
  }
  return reponseJSON({ ok: false, erreur: 'session_inconnue' });
}

function programmeDebloqueJusqua(semaineCourante) {
  var f = feuilleProgramme();
  var valeurs = f.getDataRange().getValues();
  var resultat = [];
  for (var i = 1; i < valeurs.length; i++) {
    var semaine = Number(valeurs[i][0]);
    if (!semaine) continue;
    resultat.push({
      semaine: semaine,
      titre: valeurs[i][1],
      fichiers: String(valeurs[i][2] || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean),
      debloque: semaine <= semaineCourante
    });
  }
  resultat.sort(function (a, b) { return a.semaine - b.semaine; });
  return resultat;
}
