/* ==================================================================
   Fluent & Forward — espace membres
   Inscription, connexion par code à usage unique (OTP), et affichage
   du programme débloqué. Aucun mot de passe n'est jamais stocké ni
   saisi : un nouveau code à six chiffres est envoyé par email à
   chaque connexion.
   ================================================================== */

(function () {
  "use strict";

  /* ------------------------------------------------------------------
     RÉGLAGE — le seul bloc à modifier.
     Adresse /exec du script du site (ADRESSE_COLLECTEUR dans
     source/maquette.tpl.html), complété par docs/collecte/
     espace-membres-apps-script.gs. Attention : le « collecteur » de
     landing/guide/assets/script.js est un AUTRE projet Apps Script.
     ------------------------------------------------------------------ */
  var COLLECTEUR = "https://script.google.com/macros/s/AKfycbwK0XxvWhNiwoWVsROAHi7EFQFRMymFOcH5gxV-KSZ3C5F39DPcT1YxSp83iJq9oMbO/exec";

  var CLE_SESSION = "ff_membre_session";

  function emailPlausible(valeur) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valeur);
  }

  /* Appels en GET : c'est le chemin dont la page d'accueil lit déjà la
     réponse sans souci (sessions disponibles). La réponse d'un POST vers
     Apps Script, elle, n'était pas toujours lisible par le navigateur :
     la demande partait bien, mais la page affichait une erreur. */
  function appeler(op, donnees) {
    var params = new URLSearchParams(Object.assign({ membre: "1", op: op }, donnees));
    return fetch(COLLECTEUR + "?" + params.toString(), { cache: "no-store" })
      .then(function (reponse) { return reponse.text(); })
      .then(function (texte) {
        try { return JSON.parse(texte); } catch (e) { return { ok: false, erreur: "reponse" }; }
      })
      .catch(function () { return { ok: false, erreur: "reseau" }; });
  }

  function afficherErreur(champ, idMessage, actif) {
    var message = document.getElementById(idMessage);
    if (message) message.classList.toggle("visible", actif);
    if (champ) champ.setAttribute("aria-invalid", actif ? "true" : "false");
  }

  function afficherRetour(zone, texte, estErreur) {
    if (!zone) return;
    zone.textContent = texte;
    zone.classList.add("visible");
    zone.classList.toggle("est-erreur", !!estErreur);
  }

  /* ---------- Page inscription.html ---------- */

  function initInscription() {
    var formulaire = document.getElementById("formulaire-inscription");
    if (!formulaire) return;

    var prenom = formulaire.querySelector("input[name=prenom]");
    var email = formulaire.querySelector("input[name=email]");
    var bouton = formulaire.querySelector("button[type=submit]");
    var retour = formulaire.querySelector(".retour");
    var libelle = bouton.textContent.trim();

    formulaire.addEventListener("submit", function (evenement) {
      evenement.preventDefault();
      var prenomVide = prenom.value.trim() === "";
      var emailInvalide = !emailPlausible(email.value.trim());
      afficherErreur(prenom, "erreur-prenom", prenomVide);
      afficherErreur(email, "erreur-email", emailInvalide);
      if (prenomVide || emailInvalide) { (prenomVide ? prenom : email).focus(); return; }

      bouton.disabled = true;
      bouton.textContent = "Envoi de la demande…";

      appeler("demande_compte", { prenom: prenom.value.trim(), email: email.value.trim(), origine: location.origin })
        .then(function (reponse) {
          bouton.disabled = false;
          bouton.textContent = libelle;
          if (!reponse.ok) {
            afficherRetour(retour, "La demande n'a pas pu être envoyée. Réessaie dans un instant.", true);
            return;
          }
          formulaire.reset();
          if (reponse.info === "deja_membre") {
            afficherRetour(retour, "Cette adresse a déjà un compte actif — rendez-vous sur la page de connexion.");
          } else if (reponse.info === "deja_en_attente") {
            afficherRetour(retour, "Une demande est déjà en attente de validation pour cette adresse.");
          } else {
            afficherRetour(retour, "Demande envoyée. Dès qu'Aurélie l'aura validée, tu recevras par email un lien pour accéder à ton espace.");
          }
        });
    });
  }

  /* ---------- Page connexion.html ---------- */

  function initConnexion() {
    var etapeEmail = document.getElementById("etape-email");
    var etapeEnvoye = document.getElementById("etape-envoye");
    var etapeLien = document.getElementById("etape-lien");
    if (!etapeEmail || !etapeEnvoye || !etapeLien) return;

    var formEmail = document.getElementById("formulaire-email");
    var champEmail = formEmail.querySelector("input[name=email]");
    var boutonEmail = formEmail.querySelector("button[type=submit]");
    var retourEmail = formEmail.querySelector(".retour");
    var emailAffiche = document.getElementById("email-affiche");
    var retourEnvoye = document.getElementById("retour-envoye");
    var renvoyer = document.getElementById("renvoyer-lien");
    var emailCourant = "";

    function montrer(etape) {
      etapeEmail.hidden = etape !== etapeEmail;
      etapeEnvoye.hidden = etape !== etapeEnvoye;
      etapeLien.hidden = etape !== etapeLien;
    }

    /* 1. Arrivée par le lien reçu par email */
    var lien = new URLSearchParams(location.search).get("lien");
    if (lien) {
      // Le jeton ne doit pas rester dans l'historique ni dans un favori.
      history.replaceState(null, "", location.pathname);
      montrer(etapeLien);
      appeler("ouvrir_lien", { lien: lien }).then(function (reponse) {
        if (reponse.ok && reponse.session) {
          try { localStorage.setItem(CLE_SESSION, reponse.session); } catch (e) {}
          location.replace("espace.html");
          return;
        }
        var messages = {
          lien_expire: "Ce lien a expiré. Indique ton email ci-dessous pour en recevoir un nouveau.",
          lien_invalide: "Ce lien a déjà servi ou n'est plus valable. Indique ton email ci-dessous pour en recevoir un nouveau.",
          compte_expire: "Ton accès de 180 jours est terminé. Contacte Aurélie pour le renouveler.",
          reseau: "Connexion impossible pour le moment. Vérifie ta connexion internet et rouvre le lien."
        };
        montrer(etapeEmail);
        afficherRetour(retourEmail, messages[reponse.erreur] || messages.lien_invalide, true);
      });
    } else {
      /* 2. Déjà connecté sur cet appareil : on entre directement. */
      var session = null;
      try { session = localStorage.getItem(CLE_SESSION); } catch (e) {}
      if (session) { location.replace("espace.html"); return; }
    }

    /* 3. Demande d'un lien */
    function demanderLien() {
      return appeler("demande_lien", { email: emailCourant, origine: location.origin });
    }

    formEmail.addEventListener("submit", function (evenement) {
      evenement.preventDefault();
      var invalide = !emailPlausible(champEmail.value.trim());
      afficherErreur(champEmail, "erreur-email-connexion", invalide);
      if (invalide) { champEmail.focus(); return; }

      emailCourant = champEmail.value.trim();
      boutonEmail.disabled = true;
      boutonEmail.textContent = "Envoi du lien…";

      demanderLien().then(function (reponse) {
        boutonEmail.disabled = false;
        boutonEmail.textContent = "Recevoir mon lien";
        if (!reponse.ok) {
          afficherRetour(retourEmail, "Le lien n'a pas pu être envoyé. Réessaie dans un instant.", true);
          return;
        }
        if (reponse.info === "compte_expire") {
          afficherRetour(retourEmail, "Ton accès de 180 jours est terminé. Contacte Aurélie pour le renouveler.", true);
          return;
        }
        // Même écran que l'adresse soit membre ou non : on ne révèle pas qui a un compte.
        emailAffiche.textContent = emailCourant;
        retourEnvoye.classList.remove("visible");
        montrer(etapeEnvoye);
      });
    });

    renvoyer.addEventListener("click", function (evenement) {
      evenement.preventDefault();
      demanderLien().then(function (reponse) {
        if (reponse.info === "patienter") {
          afficherRetour(retourEnvoye, "Un lien vient d'être envoyé : patiente une minute avant d'en redemander un.");
        } else if (reponse.ok) {
          afficherRetour(retourEnvoye, "Nouveau lien envoyé.");
        } else {
          afficherRetour(retourEnvoye, "Le lien n'a pas pu être envoyé. Réessaie dans un instant.", true);
        }
      });
    });
  }

  /* ---------- Page espace.html ---------- */

  function initEspace() {
    var zone = document.getElementById("zone-programme");
    if (!zone) return;

    var jeton = null;
    try { jeton = localStorage.getItem(CLE_SESSION); } catch (e) {}

    if (!jeton) { window.location.href = "connexion.html"; return; }

    appeler("verifier_session", { session: jeton }).then(function (reponse) {
      if (!reponse.ok) {
        try { localStorage.removeItem(CLE_SESSION); } catch (e) {}
        window.location.href = "connexion.html";
        return;
      }

      document.getElementById("prenom-membre").textContent = reponse.prenom;

      var html = "";
      (reponse.programme || []).forEach(function (bloc) {
        html += '<div class="semaine-bloc">';
        html += '<div class="semaine-titre">Semaine ' + bloc.semaine + "</div>";
        bloc.fichiers.forEach(function (item) {
          if (bloc.debloque) {
            html += '<div class="module-carte"><div><div class="module-nom">' + item.libelle + "</div>" +
              '<div class="module-etat">Disponible</div></div>' +
              '<a class="bouton bouton-vert" href="cours/' + encodeURIComponent(item.fichier) + '">Ouvrir</a></div>';
          } else {
            html += '<div class="module-carte verrouille"><div><div class="module-nom">' + item.libelle + "</div>" +
              '<div class="module-etat">Se débloque en semaine ' + bloc.semaine + "</div></div>" +
              '<span class="cadenas" aria-hidden="true">🔒</span></div>';
          }
        });
        html += "</div>";
      });
      zone.innerHTML = html || "<p>Le programme n'est pas encore disponible.</p>";
    });

    var boutonDeco = document.getElementById("deconnexion");
    if (boutonDeco) {
      boutonDeco.addEventListener("click", function () {
        try { localStorage.removeItem(CLE_SESSION); } catch (e) {}
        window.location.href = "connexion.html";
      });
    }
  }

  function initAnnee() {
    var cibles = document.querySelectorAll(".annee-courante");
    var annee = String(new Date().getFullYear());
    for (var i = 0; i < cibles.length; i++) cibles[i].textContent = annee;
  }

  document.addEventListener("DOMContentLoaded", function () {
    initInscription();
    initConnexion();
    initEspace();
    initAnnee();
  });
})();
