/* ==================================================================
   Fluent & Forward — passage d'une page à l'autre

   Les quatre pages du menu sont réunies dans un seul document et se
   parcourent en descendant. Entre deux pages, la suivante entre décalée
   sur le côté puis se remet d'aplomb à mesure qu'on descend : à droite
   pour la deuxième page, à gauche pour la troisième, et ainsi de suite.

   Le décalage est piloté par la position de défilement, pas par une
   animation à durée fixe : il suit le mouvement de la molette et
   s'inverse si l'on remonte.
   ================================================================== */

(function () {
  "use strict";

  var ecrans = document.querySelectorAll(".ecran[data-sens]");
  var liens = document.querySelectorAll('#menu-lateral a[href^="#"]');

  /* ---------- Décalage latéral ---------- */

  var moinsAnime = window.matchMedia("(prefers-reduced-motion: reduce)");

  // Décalage maximal, en pourcentage de la largeur de la fenêtre.
  var AMPLITUDE = 16;

  function adoucir(p) {
    // Sortie cubique : le gros du rattrapage se fait tôt, la fin est douce.
    return 1 - Math.pow(1 - p, 3);
  }

  function placer() {
    var hauteur = window.innerHeight;

    Array.prototype.forEach.call(ecrans, function (ecran) {
      var sens = ecran.getAttribute("data-sens") === "droite" ? 1 : -1;
      var boite = ecran.getBoundingClientRect();

      var decalage;
      if (boite.top >= hauteur) {
        // Pas encore en vue : on la garde au maximum de son décalage.
        decalage = AMPLITUDE;
      } else if (boite.bottom <= 0) {
        // Déjà passée : en place, plus rien à corriger.
        decalage = 0;
      } else {
        // 0 quand le haut de la page entre par le bas de l'écran,
        // 1 quand il atteint le haut : le rattrapage se fait sur une
        // hauteur d'écran, donc pendant la fin de la page précédente.
        var avancement = Math.max(0, Math.min(1, (hauteur - boite.top) / hauteur));
        decalage = (1 - adoucir(avancement)) * AMPLITUDE;
      }

      ecran.style.transform = decalage
        ? "translate3d(" + (sens * decalage) + "vw, 0, 0)"
        : "none";
    });
  }

  var enAttente = false;
  function auDefilement() {
    if (enAttente) return;
    enAttente = true;
    window.requestAnimationFrame(function () {
      placer();
      enAttente = false;
    });
  }

  function activerEffet() {
    if (moinsAnime.matches) {
      document.body.classList.add("sans-effet");
      window.removeEventListener("scroll", auDefilement);
      window.removeEventListener("resize", auDefilement);
      Array.prototype.forEach.call(ecrans, function (e) { e.style.transform = ""; });
      return;
    }
    document.body.classList.remove("sans-effet");
    window.addEventListener("scroll", auDefilement, { passive: true });
    window.addEventListener("resize", auDefilement);
    placer();
  }

  if (ecrans.length) {
    activerEffet();
    // Le réglage système peut changer en cours de route.
    if (moinsAnime.addEventListener) {
      moinsAnime.addEventListener("change", activerEffet);
    }
  }

  /* ---------- Page courante dans le menu ----------
     Les pages ne sont plus des fichiers distincts : c'est la position de
     défilement qui dit où l'on se trouve. */

  if (liens.length && "IntersectionObserver" in window) {
    var cibles = [];
    Array.prototype.forEach.call(liens, function (lien) {
      var cible = document.querySelector(lien.getAttribute("href"));
      if (cible) cibles.push({ lien: lien, cible: cible });
    });

    var visibles = {};

    var observateur = new IntersectionObserver(function (entrees) {
      entrees.forEach(function (e) {
        visibles[e.target.id] = e.isIntersecting ? e.intersectionRatio : 0;
      });

      var meilleur = null;
      cibles.forEach(function (c) {
        var part = visibles[c.cible.id] || 0;
        if (!meilleur || part > meilleur.part) meilleur = { c: c, part: part };
      });

      cibles.forEach(function (c) {
        if (meilleur && meilleur.part > 0 && c === meilleur.c) {
          c.lien.setAttribute("aria-current", "page");
        } else {
          c.lien.removeAttribute("aria-current");
        }
      });
    }, {
      // Le seuil multiple permet de comparer les parts visibles entre elles.
      threshold: [0, .1, .25, .5, .75, 1],
      rootMargin: "-68px 0px 0px 0px" // hauteur de la barre supérieure
    });

    cibles.forEach(function (c) { observateur.observe(c.cible); });
  }
})();
