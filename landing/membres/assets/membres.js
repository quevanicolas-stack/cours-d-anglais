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

  var CLE_CACHE = "ff_membre_cache";
  var CLE_ACCUEIL_VU = "ff_accueil_vu";
  var ACCUEIL_MIN_MS = 1600;

  function lireCache() {
    try { return JSON.parse(localStorage.getItem(CLE_CACHE) || "null"); } catch (e) { return null; }
  }

  function oublierSession() {
    try { localStorage.removeItem(CLE_SESSION); localStorage.removeItem(CLE_CACHE); } catch (e) {}
  }

  function echapper(texte) {
    return String(texte == null ? "" : texte).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  var CADENAS = '<svg class="cadenas" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/>' +
    '<path d="M8 11V7.5a4 4 0 0 1 8 0V11"/></svg>';

  // « Module 1 — Think & Speak… » → numéro « Module 1 » et titre séparés.
  function decouperTitre(bloc) {
    var titre = String(bloc.titre || "");
    var morceaux = titre.split(/\s+[—–-]\s+/);
    if (morceaux.length > 1) return { numero: morceaux[0], titre: morceaux.slice(1).join(" — ") };
    return { numero: "Semaine " + bloc.semaine, titre: titre || "Module " + bloc.semaine };
  }

  function typeSupport(fichier) {
    if (/seance|intro/i.test(fichier)) return { groupe: "Séances", libelle: "Séance commentée" };
    if (/vocabulaire/i.test(fichier)) return { groupe: "Ressources", libelle: "Fiche de vocabulaire" };
    if (/grammaire/i.test(fichier)) return { groupe: "Ressources", libelle: "Fiche de grammaire" };
    return { groupe: "Ressources", libelle: "Ressource" };
  }

  function initEspace() {
    var vueMenu = document.getElementById("vue-menu");
    if (!vueMenu) return;
    var vueModule = document.getElementById("vue-module");
    var vueErreur = document.getElementById("vue-erreur");
    var accueil = document.getElementById("accueil");

    var jeton = null;
    try { jeton = localStorage.getItem(CLE_SESSION); } catch (e) {}
    if (!jeton) { location.replace("connexion.html"); return; }

    var donnees = null;

    /* L'accueil s'affiche une fois par visite, assez longtemps pour se
       lire ; en revenant d'un cours, l'espace s'ouvre aussitôt. */
    var dejaVu = false;
    try { dejaVu = sessionStorage.getItem(CLE_ACCUEIL_VU) === "1"; } catch (e) {}
    var finAccueilMin = Date.now() + (dejaVu ? 0 : ACCUEIL_MIN_MS);

    function masquerAccueil() {
      setTimeout(function () {
        accueil.classList.add("cache");
        try { sessionStorage.setItem(CLE_ACCUEIL_VU, "1"); } catch (e) {}
      }, Math.max(0, finAccueilMin - Date.now()));
    }

    function montrer(vue) {
      [vueMenu, vueModule, vueErreur].forEach(function (v) { v.hidden = v !== vue; });
    }

    function afficherMenu() {
      document.getElementById("prenom-membre").textContent = donnees.prenom || "";
      var semaine = Number(donnees.semaine_courante) || 1;
      var resume = "Tu es en semaine " + semaine + " de ton parcours. Choisis un module pour voir ses séances et ses ressources.";
      if (donnees.date_expiration) {
        var fin = new Date(donnees.date_expiration);
        if (!isNaN(fin)) resume += " Accès ouvert jusqu'au " + fin.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) + ".";
      }
      document.getElementById("resume-parcours").textContent = resume;

      var html = "";
      (donnees.programme || []).forEach(function (bloc) {
        var t = decouperTitre(bloc);
        var nb = (bloc.fichiers || []).length;
        var ouvert = bloc.debloque && nb > 0;
        var etat = ouvert ? "Disponible" : (bloc.debloque ? "Bientôt" : "Semaine " + bloc.semaine);
        var detail = ouvert ? nb + (nb > 1 ? " supports" : " support")
          : (bloc.debloque ? "Contenu en préparation" : "Se débloque en semaine " + bloc.semaine);
        html += (ouvert
          ? '<a class="carte-module" href="#module-' + encodeURIComponent(bloc.semaine) + '">'
          : '<div class="carte-module verrouille" aria-disabled="true">' + CADENAS) +
          '<span class="numero">' + echapper(t.numero) + "</span>" +
          '<span class="titre">' + echapper(t.titre) + "</span>" +
          '<span class="meta"><span class="pastille-etat">' + etat + "</span>" + detail + "</span>" +
          (ouvert ? "</a>" : "</div>");
      });
      document.getElementById("grille-modules").innerHTML =
        html || '<p class="vide">Le programme n\'est pas encore disponible.</p>';
      montrer(vueMenu);
    }

    function afficherModule(semaine) {
      var bloc = (donnees.programme || []).filter(function (b) { return String(b.semaine) === semaine; })[0];
      if (!bloc || !bloc.debloque || !(bloc.fichiers || []).length) { afficherMenu(); return; }

      var t = decouperTitre(bloc);
      document.getElementById("module-oeil").textContent = t.numero + " · semaine " + bloc.semaine;
      document.getElementById("module-titre").textContent = t.titre;

      var groupes = { "Séances": "", "Ressources": "" };
      bloc.fichiers.forEach(function (item) {
        var type = typeSupport(item.fichier);
        groupes[type.groupe] += '<a class="support" href="cours/' + encodeURIComponent(item.fichier) + '">' +
          '<span><span class="nom">' + echapper(item.libelle) + '</span><span class="type">' + type.libelle + "</span></span>" +
          '<span class="aller">Ouvrir</span></a>';
      });
      var html = "";
      Object.keys(groupes).forEach(function (nom) {
        if (groupes[nom]) html += '<div class="groupe-supports"><h2>' + nom + "</h2>" + groupes[nom] + "</div>";
      });
      document.getElementById("supports").innerHTML = html;
      montrer(vueModule);
      window.scrollTo(0, 0);
    }

    function afficher() {
      if (!donnees) return;
      var m = /^#module-(.+)$/.exec(location.hash);
      if (m) afficherModule(decodeURIComponent(m[1])); else afficherMenu();
    }

    function charger() {
      appeler("verifier_session", { session: jeton }).then(function (reponse) {
        if (reponse.ok) {
          donnees = reponse;
          try { localStorage.setItem(CLE_CACHE, JSON.stringify(reponse)); } catch (e) {}
          afficher();
          masquerAccueil();
          return;
        }
        // Seul un refus explicite du serveur déconnecte. Une lenteur ou une
        // panne passagère ne doit jamais faire perdre la session.
        if (reponse.erreur === "session_inconnue" || reponse.erreur === "session_expiree") {
          oublierSession();
          location.replace("connexion.html");
          return;
        }
        if (!donnees) { montrer(vueErreur); masquerAccueil(); }
      });
    }

    /* En revenant d'un cours (bouton maison ou lien de retour), on
       rouvre le module d'où l'on venait plutôt que le menu. */
    var dernier = null;
    try { dernier = sessionStorage.getItem("ff_dernier_module"); } catch (e) {}
    if (!location.hash && dernier && document.referrer.indexOf("/membres/cours/") !== -1) {
      history.replaceState(null, "", "#module-" + encodeURIComponent(dernier));
    }
    document.getElementById("supports").addEventListener("click", function (evenement) {
      var m = /^#module-(.+)$/.exec(location.hash);
      if (m && evenement.target.closest(".support")) {
        try { sessionStorage.setItem("ff_dernier_module", decodeURIComponent(m[1])); } catch (e) {}
      }
    });

    var cache = lireCache();
    if (cache && cache.prenom) document.getElementById("accueil-prenom").textContent = ", " + cache.prenom;
    if (cache && cache.programme) {
      donnees = cache;
      afficher();
      masquerAccueil();
    }
    charger();

    window.addEventListener("hashchange", afficher);
    document.querySelector(".retour-menu").addEventListener("click", function (evenement) {
      evenement.preventDefault();
      history.pushState(null, "", location.pathname);
      afficher();
    });
    document.getElementById("reessayer").addEventListener("click", function () {
      accueil.classList.remove("cache");
      finAccueilMin = Date.now() + 600;
      charger();
    });
    document.getElementById("deconnexion").addEventListener("click", function () {
      oublierSession();
      location.href = "connexion.html";
    });
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
