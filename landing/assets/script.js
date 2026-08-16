/* ==================================================================
   Fluent & Forward — landing page « Stop Avoiding »
   Validation du formulaire et point de branchement du service d'emails.
   ================================================================== */

(function () {
  "use strict";

  /* ------------------------------------------------------------------
     POINT DE BRANCHEMENT UNIQUE

     Tant que `fournisseur` vaut "aucun", le formulaire valide les champs
     puis affiche un message de démonstration : rien n'est envoyé nulle part.

     Pour brancher le service d'emailing choisi (Brevo, Mailchimp,
     ConvertKit, Systeme.io, Formspree…), il suffit de renseigner ce bloc.
     Aucune autre ligne du fichier n'est à modifier.

       fournisseur : "aucun" | "endpoint"
       endpoint    : URL de collecte fournie par le service
       methode     : "POST" dans la quasi-totalité des cas
       format      : "json" ou "form" selon ce qu'attend le service
       champs      : correspondance entre les noms de champs du formulaire
                     et ceux attendus par le service. À gauche le nom local,
                     à droite le nom attendu côté service.

     Exemples de valeurs pour `endpoint` :
       Formspree   https://formspree.io/f/xxxxxxxx          (format "json")
       Web3Forms   https://api.web3forms.com/submit          (format "json")
       Brevo       URL du formulaire double opt-in généré    (format "form")
       ConvertKit  https://api.convertkit.com/v3/forms/ID/subscribe (format "json")

     L'envoi automatique du guide se règle dans le service lui-même
     (email de bienvenue avec le PDF en pièce jointe ou en lien).
     ------------------------------------------------------------------ */
  var SERVICE = {
    fournisseur: "aucun",
    endpoint: "",
    methode: "POST",
    format: "json",
    champs: {
      prenom: "prenom",
      email: "email"
    }
  };

  /* ---------- Utilitaires ---------- */

  function afficherErreur(champ, identifiantErreur, actif) {
    var message = document.getElementById(identifiantErreur);
    if (message) message.classList.toggle("visible", actif);
    if (champ) champ.setAttribute("aria-invalid", actif ? "true" : "false");
  }

  // Contrôle volontairement permissif : on écarte les fautes de frappe
  // évidentes sans rejeter les adresses exotiques mais valides.
  function emailPlausible(valeur) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valeur);
  }

  function afficherRetour(element, texte, type) {
    if (!element) return;
    element.textContent = texte;
    element.classList.remove("succes", "echec");
    element.classList.add("visible", type);
  }

  /* ---------- Envoi vers le service ---------- */

  function envoyerAuService(donnees) {
    var corps;
    var options = { method: SERVICE.methode, headers: {} };

    if (SERVICE.format === "json") {
      options.headers["Content-Type"] = "application/json";
      options.headers["Accept"] = "application/json";
      corps = JSON.stringify(donnees);
    } else {
      corps = new URLSearchParams(donnees).toString();
      options.headers["Content-Type"] = "application/x-www-form-urlencoded";
    }
    options.body = corps;

    return fetch(SERVICE.endpoint, options).then(function (reponse) {
      if (!reponse.ok) throw new Error("Réponse " + reponse.status);
      return reponse;
    });
  }

  /* ---------- Formulaire ---------- */

  function initFormulaire() {
    var formulaire = document.getElementById("formulaire-guide");
    if (!formulaire) return;

    var prenom = document.getElementById("prenom");
    var email = document.getElementById("email");
    var consentement = document.getElementById("consentement");
    var bouton = document.getElementById("bouton-envoi");
    var retour = document.getElementById("retour-formulaire");

    // La validation d'un champ déjà signalé se rafraîchit à la saisie.
    [prenom, email].forEach(function (champ) {
      champ.addEventListener("input", function () {
        if (champ.getAttribute("aria-invalid") === "true") {
          afficherErreur(champ, "erreur-" + champ.id, false);
        }
      });
    });
    consentement.addEventListener("change", function () {
      if (consentement.checked) afficherErreur(null, "erreur-consentement", false);
    });

    formulaire.addEventListener("submit", function (evenement) {
      evenement.preventDefault();

      var prenomVide = prenom.value.trim() === "";
      var emailInvalide = !emailPlausible(email.value.trim());
      var consentementManquant = !consentement.checked;

      afficherErreur(prenom, "erreur-prenom", prenomVide);
      afficherErreur(email, "erreur-email", emailInvalide);
      afficherErreur(null, "erreur-consentement", consentementManquant);

      if (prenomVide || emailInvalide || consentementManquant) {
        (prenomVide ? prenom : emailInvalide ? email : consentement).focus();
        return;
      }

      var donnees = {};
      donnees[SERVICE.champs.prenom] = prenom.value.trim();
      donnees[SERVICE.champs.email] = email.value.trim();

      // Aucun service branché : on confirme la validation sans rien envoyer.
      if (SERVICE.fournisseur === "aucun" || !SERVICE.endpoint) {
        afficherRetour(retour,
          "Formulaire valide. Aucun service d'emailing n'est encore branché : " +
          "renseignez le bloc SERVICE dans assets/script.js pour activer l'envoi réel.",
          "succes");
        return;
      }

      bouton.disabled = true;
      bouton.textContent = "Envoi en cours…";

      envoyerAuService(donnees)
        .then(function () {
          formulaire.reset();
          afficherRetour(retour,
            "C'est envoyé. Le guide arrive dans votre boîte, sous une minute. " +
            "Pensez à regarder les indésirables si vous ne le voyez pas.",
            "succes");
        })
        .catch(function () {
          afficherRetour(retour,
            "L'envoi n'a pas abouti. Réessayez dans un instant.",
            "echec");
        })
        .then(function () {
          bouton.disabled = false;
          bouton.textContent = "Envoyez-moi le guide";
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
    initFormulaire();
    initAnnee();
  });
})();
