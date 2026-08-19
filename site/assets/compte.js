/* ==================================================================
   Fluent & Forward — demande d'accès à l'espace « Mon programme »

   Aucun compte n'est créé automatiquement : le formulaire enregistre une
   DEMANDE, qu'Aurélie valide manuellement avant d'ouvrir l'accès. C'est
   la règle posée dès le départ, et elle a une conséquence directe sur ce
   fichier — il n'y a volontairement aucun mot de passe ici. Tant qu'il
   n'existe pas de serveur pour le recevoir et le chiffrer, demander un
   mot de passe reviendrait à le stocker en clair dans le navigateur.
   Aurélie transmet ses identifiants au moment où elle valide la demande.
   ================================================================== */

(function () {
  "use strict";

  var REGLAGES = {
    // Même mécanique que la landing : tant que cette adresse est vide, les
    // demandes restent dans le navigateur. Y mettre l'adresse du script
    // Google en /exec pour qu'elles arrivent dans le tableur d'Aurélie.
    collecteur: ""
  };

  var CLE_LOCALE = "ff_demandes_acces";

  var formulaire = document.getElementById("formulaire-acces");
  if (!formulaire) return;

  function emailPlausible(valeur) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valeur);
  }

  function afficherErreur(champ, actif) {
    var message = document.getElementById(champ.getAttribute("aria-describedby"));
    if (message) message.classList.toggle("visible", actif);
    champ.setAttribute("aria-invalid", actif ? "true" : "false");
  }

  function enregistrerEnLocal(demande) {
    try {
      var liste = JSON.parse(localStorage.getItem(CLE_LOCALE) || "[]");
      liste.push(demande);
      localStorage.setItem(CLE_LOCALE, JSON.stringify(liste));
    } catch (e) {
      // Navigation privée ou stockage plein : on n'interrompt pas la demande.
    }
  }

  function envoyerAuCollecteur(demande) {
    if (!REGLAGES.collecteur) return Promise.resolve(false);
    return fetch(REGLAGES.collecteur, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(demande)
    }).then(function (r) { return r.ok; }).catch(function () { return false; });
  }

  var prenom = formulaire.querySelector("input[name=prenom]");
  var nom = formulaire.querySelector("input[name=nom]");
  var email = formulaire.querySelector("input[name=email]");
  var rgpd = formulaire.querySelector("input[name=rgpd]");
  var motivation = formulaire.querySelector("textarea[name=motivation]");
  var bouton = formulaire.querySelector("button[type=submit]");
  var libelleBouton = bouton.textContent.trim();

  [prenom, nom, email].forEach(function (champ) {
    champ.addEventListener("input", function () {
      if (champ.getAttribute("aria-invalid") === "true") afficherErreur(champ, false);
    });
  });
  rgpd.addEventListener("change", function () {
    if (rgpd.checked) afficherErreur(rgpd, false);
  });

  formulaire.addEventListener("submit", function (e) {
    e.preventDefault();

    var prenomVide = prenom.value.trim() === "";
    var nomVide = nom.value.trim() === "";
    var emailInvalide = !emailPlausible(email.value.trim());
    var rgpdRefuse = !rgpd.checked;

    afficherErreur(prenom, prenomVide);
    afficherErreur(nom, nomVide);
    afficherErreur(email, emailInvalide);
    afficherErreur(rgpd, rgpdRefuse);

    if (prenomVide || nomVide || emailInvalide || rgpdRefuse) {
      (prenomVide ? prenom : nomVide ? nom : emailInvalide ? email : rgpd).focus();
      return;
    }

    var demande = {
      type: "demande-acces",
      prenom: prenom.value.trim(),
      nom: nom.value.trim(),
      email: email.value.trim(),
      motivation: motivation ? motivation.value.trim() : "",
      consentementRgpd: true,
      date: new Date().toISOString(),
      statut: "en attente de validation",
      page: location.href
    };

    enregistrerEnLocal(demande);
    bouton.disabled = true;
    bouton.textContent = "Envoi de la demande…";

    envoyerAuCollecteur(demande).then(function () {
      formulaire.reset();
      bouton.disabled = false;
      bouton.textContent = libelleBouton;
      var zone = document.getElementById("retour-acces");
      if (zone) {
        zone.textContent = "Merci " + demande.prenom + ", ta demande est enregistrée. "
          + "Aurélie la valide à la main : tu recevras tes identifiants par email "
          + "à l'adresse " + demande.email + " une fois l'accès ouvert.";
        zone.classList.add("visible");
      }
    });
  });
})();
