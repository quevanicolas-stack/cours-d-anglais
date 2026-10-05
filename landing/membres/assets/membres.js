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

  function nouveauTicket() {
    var alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    var octets = new Uint8Array(32);
    (window.crypto || window.msCrypto).getRandomValues(octets);
    var s = "";
    for (var i = 0; i < octets.length; i++) s += alphabet.charAt(octets[i] % alphabet.length);
    return s;
  }

  function sessionLocale() {
    try { return localStorage.getItem(CLE_SESSION); } catch (e) { return null; }
  }

  function entrer(session) {
    try { localStorage.setItem(CLE_SESSION, session); } catch (e) {}
    location.replace("espace.html");
  }

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
    var titreAttente = document.getElementById("attente-titre");
    var reprendre = document.getElementById("reprendre-attente");
    var cercleAttente = etapeEnvoye.querySelector(".cercle");
    var chapeau = document.getElementById("chapeau-connexion");
    var lienInscription = document.getElementById("lien-inscription");

    var emailCourant = "";
    var ticket = null;
    var attente = null;

    function montrer(etape) {
      etapeEmail.hidden = etape !== etapeEmail;
      etapeEnvoye.hidden = etape !== etapeEnvoye;
      etapeLien.hidden = etape !== etapeLien;
      chapeau.hidden = etape !== etapeEmail;
      lienInscription.hidden = etape !== etapeEmail;
    }

    /* 1. Arrivée par le lien reçu par email */
    var params = new URLSearchParams(location.search);
    var lien = params.get("lien");
    var ticketLien = params.get("t");
    if (lien) {
      // Le jeton ne doit rester ni dans l'historique ni dans un favori ;
      // il est gardé en mémoire pour pouvoir réessayer.
      history.replaceState(null, "", location.pathname);
      var retourLien = document.getElementById("retour-lien");
      var reessayerLien = document.getElementById("reessayer-lien");
      var ouvrir = function () {
        reessayerLien.hidden = true;
        retourLien.classList.remove("visible");
        var donnees = { lien: lien };
        if (ticketLien) donnees.t = ticketLien;
        appeler("ouvrir_lien", donnees).then(function (reponse) {
          if (reponse.ok && reponse.session) { entrer(reponse.session); return; }
          if (reponse.erreur === "reseau" || reponse.erreur === "reponse" || reponse.erreur === "serveur") {
            afficherRetour(retourLien, "Le serveur ne répond pas pour le moment.", true);
            reessayerLien.hidden = false;
            return;
          }
          var messages = {
            lien_expire: "Ce lien a dépassé ses 24 heures. Indique ton email pour en recevoir un nouveau.",
            lien_invalide: "Ce lien n'est plus valable : un lien plus récent l'a peut-être remplacé. Indique ton email pour en recevoir un nouveau.",
            compte_expire: "Ton accès de 180 jours est terminé. Contacte Aurélie pour le renouveler."
          };
          montrer(etapeEmail);
          afficherRetour(retourEmail, messages[reponse.erreur] || messages.lien_invalide, true);
        });
      };
      reessayerLien.addEventListener("click", ouvrir);
      montrer(etapeLien);
      ouvrir();
    } else if (sessionLocale()) {
      /* 2. Déjà connecté sur cet appareil : on entre directement. */
      location.replace("espace.html");
      return;
    }

    /* 3. Attente : la page interroge le serveur jusqu'à ce que le lien
       soit ouvert, ici ou sur un autre appareil. */
    function arreterAttente() {
      if (attente) { clearTimeout(attente.minuteur); attente.actif = false; attente = null; }
    }

    function finAttente() {
      arreterAttente();
      cercleAttente.classList.add("arrete");
      titreAttente.textContent = "Toujours là quand tu veux";
      afficherRetour(retourEnvoye, "Le lien reste valable 24 heures : clique dessus quand tu le souhaites, puis reviens sur cette page ou ouvre ton espace depuis l'email.");
      reprendre.hidden = false;
    }

    function attendre() {
      arreterAttente();
      cercleAttente.classList.remove("arrete");
      titreAttente.textContent = "En attente de ta connexion…";
      reprendre.hidden = true;
      var etat = { actif: true, debut: Date.now(), minuteur: null };
      attente = etat;

      function tour() {
        if (!etat.actif) return;
        var session = sessionLocale();
        if (session) { entrer(session); return; }  // lien ouvert dans un autre onglet
        var ecoule = Date.now() - etat.debut;
        if (ecoule > 20 * 60 * 1000) { finAttente(); return; }
        appeler("attendre_lien", { ticket: ticket }).then(function (reponse) {
          if (!etat.actif) return;
          if (reponse.ok && reponse.session) { entrer(reponse.session); return; }
          etat.minuteur = setTimeout(tour, ecoule < 2 * 60 * 1000 ? 2500 : 6000);
        });
      }
      etat.minuteur = setTimeout(tour, 2500);
    }

    window.addEventListener("storage", function (evenement) {
      if (evenement.key === CLE_SESSION && evenement.newValue && attente) entrer(evenement.newValue);
    });

    function demanderLien() {
      return appeler("demande_lien", { email: emailCourant, origine: location.origin, ticket: ticket });
    }

    formEmail.addEventListener("submit", function (evenement) {
      evenement.preventDefault();
      var invalide = !emailPlausible(champEmail.value.trim());
      afficherErreur(champEmail, "erreur-email-connexion", invalide);
      if (invalide) { champEmail.focus(); return; }

      emailCourant = champEmail.value.trim();
      ticket = nouveauTicket();
      boutonEmail.disabled = true;
      boutonEmail.textContent = "Envoi du lien…";

      demanderLien().then(function (reponse) {
        boutonEmail.disabled = false;
        boutonEmail.textContent = "Recevoir mon lien";
        if (!reponse.ok) {
          afficherRetour(retourEmail, "Le lien n'a pas pu être envoyé : le serveur ne répond pas. Réessaie dans un instant.", true);
          return;
        }
        if (reponse.info === "compte_expire") {
          afficherRetour(retourEmail, "Ton accès de 180 jours est terminé. Contacte Aurélie pour le renouveler.", true);
          return;
        }
        // Même écran que l'adresse soit membre ou non : on ne révèle pas qui a un compte.
        emailAffiche.textContent = emailCourant;
        retourEnvoye.classList.remove("visible");
        if (reponse.info === "patienter") {
          afficherRetour(retourEnvoye, "Un lien t'a été envoyé il y a quelques secondes : utilise le dernier email reçu.");
        }
        montrer(etapeEnvoye);
        attendre();
      });
    });

    document.getElementById("renvoyer-lien").addEventListener("click", function (evenement) {
      evenement.preventDefault();
      demanderLien().then(function (reponse) {
        if (reponse.info === "patienter") {
          afficherRetour(retourEnvoye, "Un lien vient d'être envoyé : patiente quelques secondes avant d'en redemander un.");
        } else if (reponse.ok) {
          afficherRetour(retourEnvoye, "Nouveau lien envoyé. Les liens précédents restent valables.");
        } else {
          afficherRetour(retourEnvoye, "Le lien n'a pas pu être envoyé. Réessaie dans un instant.", true);
        }
        attendre();
      });
    });

    document.getElementById("changer-email").addEventListener("click", function (evenement) {
      evenement.preventDefault();
      arreterAttente();
      montrer(etapeEmail);
      champEmail.focus();
    });

    reprendre.addEventListener("click", attendre);
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
