/* ==================================================================
   Fluent & Forward — défilement en escalier

   Chaque page occupe sa propre colonne, décalée d'un écran vers la
   droite par rapport à la précédente. La molette pilote un parcours en
   marches d'escalier :

       page 1 : on descend
       raccord : le défilement part sur le côté, sans descendre
       page 2 : on descend
       raccord : à nouveau sur le côté
       page 3 : on descend…

   La molette n'est jamais confisquée : c'est le défilement normal du
   document qui avance, on se contente de traduire sa position en
   déplacement horizontal ou vertical. Remonter refait le chemin en sens
   inverse, et la barre de défilement reste juste.

   L'effet est écarté sur écran étroit et si le système demande moins
   d'animations : les pages redeviennent alors de simples sections
   empilées, ce qu'elles sont déjà dans le HTML.
   ================================================================== */

(function () {
  "use strict";

  var scene = document.getElementById("defilement");
  if (!scene) return;

  var ecrans = Array.prototype.slice.call(scene.querySelectorAll(".ecran"));
  if (ecrans.length < 2) return;

  var liensAncres = document.querySelectorAll('a[href^="#"]');
  var moinsAnime = window.matchMedia("(prefers-reduced-motion: reduce)");
  var etroit = window.matchMedia("(max-width: 900px)");

  /* Longueur du raccord, en fraction de la hauteur de l'écran : c'est la
     quantité de défilement pendant laquelle on part sur le côté. */
  var RACCORD = 0.85;

  var actif = false;
  var cadre = null;
  var piste = null;
  var segments = [];
  var hauteurs = [];
  var totalParcours = 0;
  var hautCadre = 0;

  /* Hauteur réellement disponible sous le bandeau fixe : c'est elle qui
     sert d'unité de mesure, pas la hauteur de la fenêtre. */
  function hauteurUtile() {
    // La bande garde sa hauteur même quand elle s'efface — elle glisse,
    // elle ne se replie pas — donc la mesure reste stable au défilement.
    var bande = document.querySelector(".bande");
    var barre = document.querySelector(".entete");
    var chrome = (bande ? bande.offsetHeight : 0) + (barre ? barre.offsetHeight : 0);
    return Math.max(200, window.innerHeight - chrome);
  }

  function adoucir(p) {
    // Entrée et sortie douces : le déplacement latéral démarre et
    // s'achève sans à-coup, l'essentiel se joue au milieu.
    return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
  }

  /* ---------- Mise en place et retrait ---------- */

  function monter() {
    if (actif) return;

    cadre = document.createElement("div");
    cadre.className = "cadre-escalier";
    scene.parentNode.insertBefore(cadre, scene);
    cadre.appendChild(scene);

    piste = document.createElement("div");
    piste.className = "piste";
    while (scene.firstChild) piste.appendChild(scene.firstChild);
    scene.appendChild(piste);

    document.body.classList.add("mode-escalier");
    actif = true;
    mesurer();
  }

  function demonter() {
    if (!actif) return;

    document.body.classList.remove("mode-escalier");
    while (piste.firstChild) scene.appendChild(piste.firstChild);
    piste.parentNode.removeChild(piste);
    cadre.parentNode.insertBefore(scene, cadre);
    cadre.parentNode.removeChild(cadre);

    ecrans.forEach(function (e) {
      e.style.transform = "";
      e.style.left = "";
    });
    delete document.body.dataset.colonne;
    scene.style.height = "";
    piste = null;
    cadre = null;
    actif = false;
  }

  /* ---------- Découpage du parcours ---------- */

  function mesurer() {
    if (!actif) return;

    var largeur = window.innerWidth;
    var hauteurEcran = hauteurUtile();

    // Chaque page est posée dans sa colonne : une par écran de large.
    ecrans.forEach(function (ecran, i) {
      ecran.style.left = (i * largeur) + "px";
      ecran.style.transform = "none";
    });

    hauteurs = ecrans.map(function (ecran) {
      return Math.max(0, ecran.offsetHeight - hauteurEcran);
    });

    segments = [];
    var position = 0;
    ecrans.forEach(function (ecran, i) {
      segments.push({ type: "descente", page: i, debut: position, longueur: hauteurs[i] });
      position += hauteurs[i];
      if (i < ecrans.length - 1) {
        var longueur = Math.round(hauteurEcran * RACCORD);
        segments.push({ type: "raccord", page: i, debut: position, longueur: longueur });
        position += longueur;
      }
    });
    totalParcours = position;

    // Le cadre réserve la hauteur de défilement ; la scène y reste
    // collée le temps du parcours, puis se décolle et laisse venir le
    // pied de page.
    cadre.style.height = (totalParcours + hauteurEcran) + "px";
    hautCadre = cadre.getBoundingClientRect().top + window.pageYOffset;

    placer();
  }

  /* ---------- Position à un instant donné ---------- */

  function placer() {
    if (!actif) return;

    var largeur = window.innerWidth;
    var avance = Math.max(0, Math.min(totalParcours, window.pageYOffset - hautCadre));

    var segment = segments[segments.length - 1];
    for (var i = 0; i < segments.length; i++) {
      var s = segments[i];
      if (avance < s.debut + s.longueur || i === segments.length - 1) { segment = s; break; }
    }

    var colonne, pageActive;
    if (segment.type === "descente") {
      colonne = segment.page;
      pageActive = segment.page;
    } else {
      var p = segment.longueur ? (avance - segment.debut) / segment.longueur : 1;
      colonne = segment.page + adoucir(Math.max(0, Math.min(1, p)));
      // On considère la page suivante atteinte à mi-parcours du raccord.
      pageActive = segment.page + (p >= 0.5 ? 1 : 0);
    }

    piste.style.transform = "translate3d(" + (-colonne * largeur) + "px, 0, 0)";

    // Position exacte dans le parcours, en colonnes : 0 = première page,
    // 0,5 = à mi-raccord, 1 = deuxième page. La bande d'appel s'en sert
    // pour savoir si l'on a vraiment quitté la première page.
    document.body.dataset.colonne = colonne.toFixed(3);

    // Chaque page garde sa propre position verticale : celles déjà
    // parcourues restent en bas, celles à venir attendent en haut.
    ecrans.forEach(function (ecran, i) {
      var y;
      if (segment.type === "descente" && i === segment.page) {
        y = avance - segment.debut;
      } else if (i < (segment.type === "raccord" ? segment.page + 1 : segment.page)) {
        y = hauteurs[i];
      } else {
        y = 0;
      }
      ecran.style.transform = "translate3d(0, " + (-y) + "px, 0)";
    });

    marquerMenu(pageActive);
  }

  /* ---------- Page courante dans le menu ---------- */

  var liensMenu = document.querySelectorAll('#menu-lateral a[href^="#"]');
  var derniereMarque = -1;

  function marquerMenu(index) {
    if (index === derniereMarque) return;
    derniereMarque = index;
    Array.prototype.forEach.call(liensMenu, function (lien) {
      var id = lien.getAttribute("href").slice(1);
      if (ecrans[index] && ecrans[index].id === id) lien.setAttribute("aria-current", "page");
      else lien.removeAttribute("aria-current");
    });
  }

  /* ---------- Les ancres visent une position du parcours ---------- */

  function debutDePage(id) {
    for (var i = 0; i < ecrans.length; i++) {
      if (ecrans[i].id !== id) continue;
      for (var j = 0; j < segments.length; j++) {
        if (segments[j].type === "descente" && segments[j].page === i) {
          return hautCadre + segments[j].debut;
        }
      }
    }
    return null;
  }

  Array.prototype.forEach.call(liensAncres, function (lien) {
    lien.addEventListener("click", function (e) {
      if (!actif) return; // hors mode escalier, l'ancre native suffit
      var cible = debutDePage(lien.getAttribute("href").slice(1));
      if (cible === null) return;
      e.preventDefault();
      window.scrollTo({ top: cible, behavior: "smooth" });
    });
  });

  /* ---------- Suivi du défilement ---------- */

  var enAttente = false;
  function auDefilement() {
    if (enAttente) return;
    enAttente = true;
    window.requestAnimationFrame(function () {
      placer();
      enAttente = false;
    });
  }

  var minuterie = null;
  function auRedimensionnement() {
    clearTimeout(minuterie);
    minuterie = setTimeout(function () {
      arbitrer();
      if (actif) mesurer();
    }, 150);
  }

  /* ---------- Activation selon le contexte ---------- */

  function arbitrer() {
    if (moinsAnime.matches || etroit.matches) demonter();
    else monter();
  }

  window.addEventListener("scroll", auDefilement, { passive: true });
  window.addEventListener("resize", auRedimensionnement);
  if (moinsAnime.addEventListener) moinsAnime.addEventListener("change", arbitrer);
  if (etroit.addEventListener) etroit.addEventListener("change", arbitrer);

  arbitrer();

  // Les images et le calendrier changent la hauteur des pages après coup :
  // on remesure une fois tout chargé, sinon le parcours serait faux.
  window.addEventListener("load", function () { if (actif) mesurer(); });

  if ("ResizeObserver" in window) {
    var observateur = new ResizeObserver(function () { if (actif) mesurer(); });
    ecrans.forEach(function (e) { observateur.observe(e); });
  }

  /* ---------- Repli : suivi du menu hors mode escalier ----------
     Sur écran étroit, les pages redeviennent de simples sections : c'est
     leur passage devant la fenêtre qui dit où l'on se trouve. */

  if ("IntersectionObserver" in window) {
    var veille = new IntersectionObserver(function (entrees) {
      if (actif) return;
      entrees.forEach(function (entree) {
        if (!entree.isIntersecting) return;
        derniereMarque = -1;
        Array.prototype.forEach.call(liensMenu, function (lien) {
          if (lien.getAttribute("href").slice(1) === entree.target.id) {
            lien.setAttribute("aria-current", "page");
          } else {
            lien.removeAttribute("aria-current");
          }
        });
      });
    }, { threshold: .25, rootMargin: "-68px 0px -50% 0px" });

    ecrans.forEach(function (ecran) { veille.observe(ecran); });
  }
})();
