/* ==================================================================
   Fluent & Forward — bande d'appel, fenêtre de rentrée, contacts

   1. La bande « Inscris-toi à la formation » reste affichée tant qu'on
      est sur la première page. Passé cela, elle s'efface en descendant
      et revient dès que l'on remonte.

   2. La fenêtre de la rentrée s'affiche une fois par navigateur ; on la
      referme et elle ne revient plus.

   3. L'adresse email n'est écrite nulle part dans la page : elle est
      recomposée au moment du clic, pour ne pas être moissonnée par les
      robots qui parcourent le code source.
   ================================================================== */

(function () {
  "use strict";

  /* ---------- 1. La bande ---------- */

  var bande = document.getElementById("bande-inscription");

  if (bande) {
    var dernierY = window.pageYOffset;
    var attente = false;

    /* Où l'on se trouve.

       En mode escalier, defilement.js publie la position exacte dans le
       parcours, exprimée en colonnes : tant qu'elle est sous 1, la
       première page n'est pas encore entièrement quittée — raccord
       compris. Mesurer la position de la page ne marcherait pas : en
       escalier, elle se déplace latéralement, pas vers le haut.

       En mode empilé, la page défile normalement : sa position suffit. */
    var premierePage = document.getElementById("accueil");

    function surPremierePage() {
      var colonne = document.body.dataset.colonne;
      if (colonne !== undefined) return parseFloat(colonne) < 0.999;
      if (!premierePage) return window.pageYOffset < 40;
      return premierePage.getBoundingClientRect().bottom > 0;
    }

    function reglerBande() {
      var y = window.pageYOffset;
      var monte = y < dernierY - 4;
      var descend = y > dernierY + 4;

      if (surPremierePage() || monte || y < 40) {
        bande.classList.remove("bande-cachee");
      } else if (descend) {
        bande.classList.add("bande-cachee");
      }

      dernierY = y;
      attente = false;
    }

    window.addEventListener("scroll", function () {
      if (attente) return;
      attente = true;
      window.requestAnimationFrame(reglerBande);
    }, { passive: true });

    reglerBande();
  }

  /* ---------- 2. La fenêtre de la rentrée ---------- */

  var fenetre = document.getElementById("fenetre-rentree");
  var CLE_FENETRE = "ff_fenetre_rentree";

  if (fenetre) {
    var dejaVue = false;
    try { dejaVue = localStorage.getItem(CLE_FENETRE) === "vu"; } catch (e) {}

    function fermerFenetre() {
      fenetre.hidden = true;
      try { localStorage.setItem(CLE_FENETRE, "vu"); } catch (e) {}
    }

    if (!dejaVue) {
      // Laisser la page s'afficher avant de la recouvrir : une fenêtre
      // qui surgit immédiatement se referme sans être lue.
      setTimeout(function () { fenetre.hidden = false; }, 2200);
    }

    Array.prototype.forEach.call(fenetre.querySelectorAll("[data-fermer]"), function (b) {
      b.addEventListener("click", fermerFenetre);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !fenetre.hidden) fermerFenetre();
    });
  }

  /* ---------- 3. L'adresse email, recomposée au clic ---------- */

  var BOITE = ["aurelieeflcoach", "gmail", "com"];

  Array.prototype.forEach.call(document.querySelectorAll("[data-email]"), function (bouton) {
    bouton.addEventListener("click", function (e) {
      e.preventDefault();
      var objet = bouton.getAttribute("data-objet") || "Renseignement";
      window.location.href = "mailto:" + BOITE[0] + "@" + BOITE[1] + "." + BOITE[2]
        + "?subject=" + encodeURIComponent(objet);
    });
  });
})();
