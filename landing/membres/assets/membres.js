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

  function appeler(action, donnees) {
    return fetch(COLLECTEUR, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(Object.assign({ type: "membre", action: action }, donnees))
    }).then(function (reponse) { return reponse.json(); })
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

      appeler("demande_compte", { prenom: prenom.value.trim(), email: email.value.trim() })
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
            afficherRetour(retour, "Demande envoyée. Tu recevras un email dès qu'Aurélie l'aura validée.");
          }
        });
    });
  }

  /* ---------- Page connexion.html ---------- */

  function initConnexion() {
    var etapeEmail = document.getElementById("etape-email");
    var etapeCode = document.getElementById("etape-code");
    if (!etapeEmail || !etapeCode) return;

    var formEmail = document.getElementById("formulaire-email");
    var champEmail = formEmail.querySelector("input[name=email]");
    var boutonEmail = formEmail.querySelector("button[type=submit]");
    var retourEmail = formEmail.querySelector(".retour");

    var formCode = document.getElementById("formulaire-code");
    var champCode = formCode.querySelector("input[name=code]");
    var boutonCode = formCode.querySelector("button[type=submit]");
    var retourCode = formCode.querySelector(".retour");
    var emailAffiche = document.getElementById("email-affiche");
    var renvoyer = document.getElementById("renvoyer-code");

    var emailCourant = "";

    function demanderCode() {
      return appeler("demande_otp", { email: emailCourant });
    }

    formEmail.addEventListener("submit", function (evenement) {
      evenement.preventDefault();
      var invalide = !emailPlausible(champEmail.value.trim());
      afficherErreur(champEmail, "erreur-email-connexion", invalide);
      if (invalide) { champEmail.focus(); return; }

      emailCourant = champEmail.value.trim();
      boutonEmail.disabled = true;
      boutonEmail.textContent = "Envoi du code…";

      demanderCode().then(function (reponse) {
        boutonEmail.disabled = false;
        boutonEmail.textContent = "Recevoir mon code";
        if (!reponse.ok) {
          afficherRetour(retourEmail, "Le code n'a pas pu être envoyé. Réessaie dans un instant.", true);
          return;
        }
        if (reponse.info === "compte_expire") {
          afficherRetour(retourEmail, "Ce compte a dépassé sa durée d'accès de 180 jours. Contacte Aurélie pour le renouveler.", true);
          return;
        }
        // Réponse volontairement identique si l'email n'est pas membre :
        // on passe à l'étape suivante dans tous les cas.
        emailAffiche.textContent = emailCourant;
        etapeEmail.hidden = true;
        etapeCode.hidden = false;
        champCode.focus();
      });
    });

    formCode.addEventListener("submit", function (evenement) {
      evenement.preventDefault();
      var code = champCode.value.trim();
      if (!/^\d{6}$/.test(code)) {
        afficherRetour(retourCode, "Le code comporte 6 chiffres.", true);
        return;
      }

      boutonCode.disabled = true;
      boutonCode.textContent = "Vérification…";

      appeler("verifier_otp", { email: emailCourant, code: code }).then(function (reponse) {
        boutonCode.disabled = false;
        boutonCode.textContent = "Me connecter";
        if (!reponse.ok) {
          var messages = {
            code_invalide: "Ce code est incorrect.",
            code_expire: "Ce code a expiré, demande-en un nouveau.",
            trop_de_tentatives: "Trop d'essais : demande un nouveau code.",
            compte_inconnu: "Aucun compte validé pour cette adresse."
          };
          afficherRetour(retourCode, messages[reponse.erreur] || "Code incorrect.", true);
          return;
        }
        try { localStorage.setItem(CLE_SESSION, reponse.session); } catch (e) {}
        window.location.href = "espace.html";
      });
    });

    renvoyer.addEventListener("click", function (evenement) {
      evenement.preventDefault();
      afficherRetour(retourCode, "Nouveau code envoyé.");
      demanderCode();
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
              '<a class="bouton bouton-vert" href="cours/' + encodeURIComponent(item.fichier) + '" target="_blank" rel="noopener">Ouvrir</a></div>';
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
