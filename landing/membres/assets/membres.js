/* ==================================================================
   Fluent & Forward — espace membres
   Inscription, connexion par lien envoyé par email, et programme
   débloqué semaine par semaine. Le serveur est celui du site
   (Cloudflare Pages, dossier functions/) : la session tient dans un
   cookie sécurisé que le navigateur garde tout seul, aucun mot de
   passe n'est jamais demandé.
   ================================================================== */

(function () {
  "use strict";

  function emailPlausible(valeur) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valeur);
  }

  function appeler(action, donnees, methode) {
    var url = "/api/membres/" + action;
    var options = { method: methode || "POST", credentials: "same-origin", cache: "no-store" };
    if (options.method === "GET") {
      if (donnees) url += "?" + new URLSearchParams(donnees).toString();
    } else {
      options.headers = { "Content-Type": "application/json" };
      options.body = JSON.stringify(donnees || {});
    }
    return fetch(url, options)
      .then(function (reponse) {
        return reponse.text().then(function (texte) {
          var donneesReponse;
          try { donneesReponse = JSON.parse(texte); } catch (e) { donneesReponse = { ok: false, erreur: "reponse" }; }
          donneesReponse.statut = reponse.status;
          return donneesReponse;
        });
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

      appeler("demande", { prenom: prenom.value.trim(), email: email.value.trim() })
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

  function entrer() {
    try { localStorage.removeItem("ff_membre_attente"); } catch (e) {}
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
        appeler("ouvrir", donnees).then(function (reponse) {
          if (reponse.ok) { entrer(); return; }
          if (reponse.erreur === "reseau" || reponse.erreur === "reponse") {
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
    } else {
      /* 2. Déjà connecté sur cet appareil : on entre directement. */
      appeler("session", null, "GET").then(function (reponse) {
        if (reponse.ok && !attente) entrer();
      });
    }

    /* 3. Attente : la page interroge le serveur jusqu'à ce que le lien
       soit ouvert, ici ou sur un autre appareil. L'attente est mémorisée :
       en revenant sur la page (après être allé lire ses emails, ou si le
       téléphone a rechargé l'onglet), on la retrouve telle quelle. */
    var CLE_ATTENTE = "ff_membre_attente";
    var DUREE_TICKET_MS = 30 * 60 * 1000;      // au-delà, on repart du formulaire
    var ATTENTE_ACTIVE_MS = 30 * 60 * 1000;     // au-delà, on arrête d'interroger

    function memoriserAttente() {
      try {
        localStorage.setItem(CLE_ATTENTE, JSON.stringify({ email: emailCourant, ticket: ticket, debut: Date.now() }));
      } catch (e) {}
    }

    function oublierAttente() {
      try { localStorage.removeItem(CLE_ATTENTE); } catch (e) {}
    }

    function attenteMemorisee() {
      try {
        var a = JSON.parse(localStorage.getItem(CLE_ATTENTE) || "null");
        if (a && a.email && a.ticket && Date.now() - a.debut < DUREE_TICKET_MS) return a;
      } catch (e) {}
      oublierAttente();
      return null;
    }


    function arreterAttente() {
      if (attente) { clearTimeout(attente.minuteur); attente.actif = false; attente = null; }
    }

    function finAttente() {
      arreterAttente();
      cercleAttente.classList.add("arrete");
      titreAttente.textContent = "Toujours là quand tu veux";
      afficherRetour(retourEnvoye, "Le lien reste valable 24 heures : clique dessus quand tu le souhaites.");
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
        if (document.hidden) { etat.minuteur = setTimeout(tour, 8000); return; }
        var ecoule = Date.now() - etat.debut;
        if (ecoule > ATTENTE_ACTIVE_MS) { finAttente(); return; }
        appeler("attendre", { ticket: ticket }, "GET").then(function (reponse) {
          if (!etat.actif) return;
          if (reponse.ok) { entrer(); return; }
          if (reponse.erreur === "ticket_inconnu") {
            oublierAttente();
            finAttente();
            return;
          }
          etat.minuteur = setTimeout(tour, ecoule < 2 * 60 * 1000 ? 2000 : 4000);
        });
      }
      tour();
    }

    // Retour sur l'onglet : on vérifie tout de suite plutôt qu'au prochain tour.
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden && attente) attendre();
    });

    function demanderLien() {
      return appeler("lien", { email: emailCourant, ticket: ticket });
    }

    function ecranAttente(texteTitre) {
      emailAffiche.textContent = emailCourant;
      retourEnvoye.classList.remove("visible");
      reprendre.hidden = true;
      cercleAttente.classList.remove("arrete");
      titreAttente.textContent = texteTitre;
      montrer(etapeEnvoye);
    }

    formEmail.addEventListener("submit", function (evenement) {
      evenement.preventDefault();
      var invalide = !emailPlausible(champEmail.value.trim());
      afficherErreur(champEmail, "erreur-email-connexion", invalide);
      if (invalide) { champEmail.focus(); return; }

      emailCourant = champEmail.value.trim();
      ticket = nouveauTicket();
      ecranAttente("Envoi de ton lien…");   // le cercle tourne dès le clic

      demanderLien().then(function (reponse) {
        if (!reponse.ok) {
          montrer(etapeEmail);
          afficherRetour(retourEmail, "Le lien n'a pas pu être envoyé : le serveur ne répond pas. Réessaie dans un instant.", true);
          return;
        }
        if (reponse.info === "compte_expire") {
          montrer(etapeEmail);
          afficherRetour(retourEmail, "Ton accès de 180 jours est terminé. Contacte Aurélie pour le renouveler.", true);
          return;
        }
        // Même écran que l'adresse soit membre ou non : on ne révèle pas qui a un compte.
        memoriserAttente();
        if (reponse.info === "patienter") {
          afficherRetour(retourEnvoye, "Un lien t'a été envoyé il y a quelques secondes : utilise le dernier email reçu.");
        }
        attendre();
      });
    });

    document.getElementById("renvoyer-lien").addEventListener("click", function (evenement) {
      evenement.preventDefault();
      demanderLien().then(function (reponse) {
        if (reponse.info === "patienter") {
          afficherRetour(retourEnvoye, "Un lien vient d'être envoyé : patiente quelques secondes avant d'en redemander un.");
        } else if (reponse.ok) {
          memoriserAttente();
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
      oublierAttente();
      montrer(etapeEmail);
      champEmail.focus();
    });

    reprendre.addEventListener("click", attendre);

    // Une attente en cours ? On la reprend là où on l'avait laissée.
    if (!lien) {
      var enCours = attenteMemorisee();
      if (enCours) {
        emailCourant = enCours.email;
        ticket = enCours.ticket;
        champEmail.value = enCours.email;
        ecranAttente("En attente de ta connexion…");
        var minutes = Math.max(1, Math.round((Date.now() - enCours.debut) / 60000));
        afficherRetour(retourEnvoye, "Un lien t'a été envoyé il y a " + minutes + " minute" + (minutes > 1 ? "s" : "") +
          ". Rien reçu ? Renvoie-le avec le bouton ci-dessous.");
        attendre();
      }
    }
  }


  /* ---------- Page espace.html ---------- */

  var CLE_CACHE = "ff_membre_cache";
  var CLE_ACCUEIL_VU = "ff_accueil_vu";
  var ACCUEIL_MIN_MS = 900;

  function lireCache() {
    try { return JSON.parse(localStorage.getItem(CLE_CACHE) || "null"); } catch (e) { return null; }
  }

  function oublierCache() {
    try { localStorage.removeItem(CLE_CACHE); } catch (e) {}
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
      appeler("session", null, "GET").then(function (reponse) {
        if (reponse.ok) {
          document.getElementById("lien-admin").hidden = !reponse.admin;
          donnees = reponse;
          try { localStorage.setItem(CLE_CACHE, JSON.stringify(reponse)); } catch (e) {}
          afficher();
          masquerAccueil();
          return;
        }
        // Seul un refus explicite du serveur déconnecte. Une lenteur ou une
        // panne passagère ne doit jamais faire perdre la session.
        if (reponse.statut === 401) {
          oublierCache();
          location.replace("connexion.html");
          return;
        }
        if (!donnees) {
          document.getElementById("detail-erreur").textContent =
            "Code : " + (reponse.erreur || "inconnu") + " — " + ({
              reponse: "le serveur a renvoyé une réponse illisible (statut " + reponse.statut + ")",
              reseau: "serveur injoignable ou connexion internet coupée"
            }[reponse.erreur] || reponse.detail || "");
          montrer(vueErreur);
          masquerAccueil();
        }
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
      oublierCache();
      appeler("deconnexion").then(function () { location.href = "connexion.html"; });
    });
  }

  /* ---------- Page admin.html ---------- */

  function dateCourte(iso) {
    if (!iso) return "—";
    var d = new Date(iso);
    return isNaN(d) ? "—" : d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
  }

  var STATUTS = { en_attente: "En attente", valide: "Actif", refuse: "Refusé", revoque: "Révoqué" };

  function initAdmin() {
    var zone = document.getElementById("admin");
    if (!zone) return;
    var liste = document.getElementById("liste-membres");
    var envois = document.getElementById("liste-envois");
    var resume = document.getElementById("admin-resume");

    function boutons(m) {
      var expire = m.date_expiration && new Date(m.date_expiration) < new Date();
      var b = [];
      if (m.statut === "en_attente") b.push(["valider", "Valider", "vert"], ["refuser", "Refuser", "rouge"]);
      else if (m.statut === "valide") {
        if (expire) b.push(["prolonger", "Rouvrir 180 jours", "vert"]);
        else b.push(["prolonger", "Prolonger de 180 jours", ""]);
        b.push(["revoquer", "Révoquer", "rouge"]);
      } else b.push(["valider", "Valider", "vert"]);
      return b.map(function (x) {
        return '<button type="button" class="' + x[2] + '" data-action="' + x[0] + '" data-id="' + m.id + '">' + x[1] + "</button>";
      }).join("");
    }

    function charger() {
      appeler("admin", null, "GET").then(function (r) {
        if (r.statut === 401 || r.statut === 403) { location.replace("connexion.html"); return; }
        if (!r.ok) { resume.textContent = "La liste n'a pas pu être chargée (" + (r.erreur || "erreur") + ")."; return; }
        var attente = r.membres.filter(function (m) { return m.statut === "en_attente"; }).length;
        var actifs = r.membres.filter(function (m) { return m.statut === "valide" && new Date(m.date_expiration) > new Date(); }).length;
        resume.textContent = actifs + " membre" + (actifs > 1 ? "s" : "") + " actif" + (actifs > 1 ? "s" : "") +
          (attente ? " · " + attente + " demande" + (attente > 1 ? "s" : "") + " en attente" : "") + ".";
        liste.innerHTML = r.membres.map(function (m) {
          var expire = m.statut === "valide" && m.date_expiration && new Date(m.date_expiration) < new Date();
          var libelle = expire ? "Expiré" : (STATUTS[m.statut] || m.statut);
          var quand = m.statut === "en_attente" ? "Demande du " + dateCourte(m.date_demande)
            : m.statut === "valide" ? "Accès jusqu'au " + dateCourte(m.date_expiration) + " · " + m.appareils + " appareil" + (m.appareils > 1 ? "s" : "") + " connecté" + (m.appareils > 1 ? "s" : "")
            : "Demande du " + dateCourte(m.date_demande);
          return '<div class="ligne-membre"><div class="qui"><b>' + echapper(m.prenom) +
            '<span class="statut-membre ' + (expire ? "" : echapper(m.statut)) + '">' + libelle + "</span></b>" +
            "<span>" + echapper(m.email) + '</span></div><div class="quand">' + quand + "</div>" +
            '<div class="boutons">' + boutons(m) + "</div></div>";
        }).join("") || '<p class="vide">Aucun membre pour le moment.</p>';
        envois.innerHTML = r.envois.map(function (e) {
          return '<div class="envoi">' + dateCourte(e.date) + " · " + echapper(e.destinataire) + " · " + echapper(e.sujet) +
            (e.ok ? "" : '<span class="erreur-envoi">Échec : ' + echapper(e.erreur) + "</span>") + "</div>";
        }).join("") || '<p class="vide">Aucun email envoyé pour le moment.</p>';
      });
    }

    liste.addEventListener("click", function (evenement) {
      var bouton = evenement.target.closest("button[data-action]");
      if (!bouton) return;
      var action = bouton.getAttribute("data-action");
      if (action === "revoquer" && !confirm("Révoquer cet accès ? La personne sera déconnectée de tous ses appareils.")) return;
      bouton.disabled = true;
      appeler("admin", { action: action, id: Number(bouton.getAttribute("data-id")) }).then(function (r) {
        if (!r.ok) alert("Action impossible (" + (r.erreur || "erreur") + ").");
        else if (r.envoye === false) alert("C'est fait, mais l'email n'a pas pu partir : voir « Derniers emails envoyés ».");
        charger();
      });
    });

    var formulaire = document.getElementById("formulaire-ajout");
    var retour = document.getElementById("retour-ajout");
    formulaire.addEventListener("submit", function (evenement) {
      evenement.preventDefault();
      var prenom = formulaire.prenom.value.trim();
      var email = formulaire.email.value.trim();
      if (!prenom || !emailPlausible(email)) { afficherRetour(retour, "Indique un prénom et une adresse email valide.", true); return; }
      appeler("admin", { action: "ajouter", prenom: prenom, email: email }).then(function (r) {
        if (!r.ok) { afficherRetour(retour, "Ajout impossible (" + (r.erreur || "erreur") + ").", true); return; }
        formulaire.reset();
        afficherRetour(retour, r.envoye ? "Membre ajouté : son lien de connexion est parti." : "Membre ajouté, mais l'email n'a pas pu partir.", !r.envoye);
        charger();
      });
    });

    charger();
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
    initAdmin();
    initAnnee();
  });
})();
