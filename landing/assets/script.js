/* ==================================================================
   Fluent & Forward — landing « Stop Avoiding - English Essentials »

   Le téléchargement du guide est conditionné au renseignement du
   prénom et de l'adresse email. À la validation :
     1. le contact est enregistré (collecteur distant + copie locale) ;
     2. le PDF est téléchargé immédiatement.
   ================================================================== */

(function () {
  "use strict";

  /* ------------------------------------------------------------------
     RÉGLAGES — le seul bloc à modifier

     fichier   : le PDF remis au prospect.
     collecteur: l'adresse qui reçoit et archive les contacts.
                 Tant qu'elle est vide, rien n'est envoyé : les contacts
                 sont conservés dans le navigateur et exportables en CSV
                 depuis prospects.html. Voir collecte/LISEZMOI.md pour
                 mettre en place le fichier de sauvegarde.
     ------------------------------------------------------------------ */
  var REGLAGES = {
    fichier: "assets/stop-avoiding-english-essentials.pdf",
    nomFichier: "Stop-Avoiding-English-Essentials.pdf",
    collecteur: ""
  };

  var CLE_LOCALE = "ff_prospects";

  /* ---------- Outils ---------- */

  function emailPlausible(valeur) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valeur);
  }

  function afficherErreur(champ, idMessage, actif) {
    var message = document.getElementById(idMessage);
    if (message) message.classList.toggle("visible", actif);
    if (champ) champ.setAttribute("aria-invalid", actif ? "true" : "false");
  }

  function afficherRetour(formulaire, texte) {
    var zone = formulaire.querySelector(".retour-formulaire");
    if (!zone) return;
    zone.textContent = texte;
    zone.classList.add("visible");
  }

  /* ---------- Copie locale de secours ----------
     Garantit qu'aucun contact n'est perdu si le collecteur distant
     est injoignable ou pas encore configuré. Exportable en CSV. */

  function enregistrerEnLocal(contact) {
    try {
      var liste = JSON.parse(localStorage.getItem(CLE_LOCALE) || "[]");
      liste.push(contact);
      localStorage.setItem(CLE_LOCALE, JSON.stringify(liste));
    } catch (e) {
      // Navigation privée ou stockage plein : on n'interrompt pas le parcours.
    }
  }

  /* ---------- Envoi au collecteur ---------- */

  function envoyerAuCollecteur(contact) {
    if (!REGLAGES.collecteur) return Promise.resolve(false);
    return fetch(REGLAGES.collecteur, {
      method: "POST",
      // text/plain évite la requête préalable CORS, que Google Apps Script
      // et la plupart des scripts d'hébergement mutualisé ne gèrent pas.
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(contact)
    }).then(function (reponse) {
      return reponse.ok;
    }).catch(function () {
      return false;
    });
  }

  /* ---------- Téléchargement ---------- */

  function telechargerGuide() {
    var lien = document.createElement("a");
    lien.href = REGLAGES.fichier;
    lien.download = REGLAGES.nomFichier;
    document.body.appendChild(lien);
    lien.click();
    document.body.removeChild(lien);
  }

  /* ---------- Formulaires ---------- */

  function initFormulaire(formulaire) {
    var prenom = formulaire.querySelector("input[name=prenom]");
    var email = formulaire.querySelector("input[name=email]");
    var rgpd = formulaire.querySelector("input[name=rgpd]");
    var prospection = formulaire.querySelector("input[name=prospection]");
    var rappel = formulaire.querySelector("input[name=rappel]");
    var bouton = formulaire.querySelector("button[type=submit]");
    var idErrPrenom = prenom.getAttribute("aria-describedby");
    var idErrEmail = email.getAttribute("aria-describedby");
    var idErrRgpd = rgpd.getAttribute("aria-describedby");
    var libelleBouton = bouton.textContent.trim();

    [[prenom, idErrPrenom], [email, idErrEmail]].forEach(function (paire) {
      paire[0].addEventListener("input", function () {
        if (paire[0].getAttribute("aria-invalid") === "true") {
          afficherErreur(paire[0], paire[1], false);
        }
      });
    });

    rgpd.addEventListener("change", function () {
      if (rgpd.checked) afficherErreur(rgpd, idErrRgpd, false);
    });

    formulaire.addEventListener("submit", function (evenement) {
      evenement.preventDefault();

      var prenomVide = prenom.value.trim() === "";
      var emailInvalide = !emailPlausible(email.value.trim());
      // Le consentement au traitement est la seule case obligatoire : le RGPD
      // interdit de conditionner la remise du guide à l'accord de prospection.
      var rgpdRefuse = !rgpd.checked;

      afficherErreur(prenom, idErrPrenom, prenomVide);
      afficherErreur(email, idErrEmail, emailInvalide);
      afficherErreur(rgpd, idErrRgpd, rgpdRefuse);

      if (prenomVide || emailInvalide || rgpdRefuse) {
        (prenomVide ? prenom : emailInvalide ? email : rgpd).focus();
        return;
      }

      var contact = {
        prenom: prenom.value.trim(),
        email: email.value.trim(),
        date: new Date().toISOString(),
        consentementRgpd: true,
        accepteProspection: !!(prospection && prospection.checked),
        demandeRappel: !!(rappel && rappel.checked),
        origine: formulaire.getAttribute("data-origine") || "inconnue",
        provenance: document.referrer || "direct",
        page: location.href
      };

      enregistrerEnLocal(contact);

      bouton.disabled = true;
      bouton.textContent = "Préparation du guide…";

      envoyerAuCollecteur(contact).then(function (transmis) {
        telechargerGuide();
        formulaire.reset();
        bouton.disabled = false;
        bouton.textContent = libelleBouton;
        afficherRetour(formulaire,
          transmis || !REGLAGES.collecteur
            ? "C'est parti, " + contact.prenom + " — ton guide est en cours de téléchargement."
            : "Ton guide est en cours de téléchargement. L'enregistrement du contact n'a pas abouti, il a été conservé localement.");
      });
    });
  }

  /* ---------- Année du pied de page ---------- */

  function initAnnee() {
    var cibles = document.querySelectorAll(".annee-courante");
    var annee = String(new Date().getFullYear());
    for (var i = 0; i < cibles.length; i++) cibles[i].textContent = annee;
  }

  document.addEventListener("DOMContentLoaded", function () {
    var formulaires = document.querySelectorAll(".formulaire-guide");
    for (var i = 0; i < formulaires.length; i++) initFormulaire(formulaires[i]);
    initAnnee();
  });
})();
