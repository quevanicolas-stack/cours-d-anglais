/* ==================================================================
   Fluent & Forward — moteur de la plaquette

   Un seul fichier : recul des fonds au défilement, poussière dorée,
   apparition du contenu, page courante dans le menu, bande d'appel,
   ouverture du menu, fenêtre de rentrée, adresse email recomposée.
   ================================================================== */
(function () {
  "use strict";
  var reduit = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Recul des fonds + page courante ---------- */
  var chapitres = [].slice.call(document.querySelectorAll(".chapitre"));
  var stages = chapitres.map(function (c) { return c.querySelector(".fond-stage"); });
  var liensMenu = [].slice.call(document.querySelectorAll('#menu-lateral a[href^="#"]'));

  function born(x, a, b) { return Math.max(a, Math.min(b, x)); }
  var derniereMarque = "";

  function placer() {
    var vh = innerHeight, actif = null, best = -1;
    chapitres.forEach(function (ch, i) {
      var r = ch.getBoundingClientRect();
      var p = born(-r.top / Math.max(1, r.height - vh), 0, 1);
      if (stages[i]) stages[i].style.setProperty("--p", p.toFixed(4));
      var vis = Math.min(r.bottom, vh) - Math.max(r.top, 0);
      if (vis > best) { best = vis; actif = ch.id; }
    });
    if (actif && actif !== derniereMarque) {
      derniereMarque = actif;
      liensMenu.forEach(function (l) {
        l.toggleAttribute("aria-current", l.getAttribute("href") === "#" + actif);
        if (l.getAttribute("href") === "#" + actif) l.setAttribute("aria-current", "page");
        else l.removeAttribute("aria-current");
      });
    }
    return actif;
  }

  /* ---------- Poussière dorée ---------- */
  var toile = document.getElementById("poussiere"), ctx = toile && toile.getContext("2d"), pts = [], N = 120;
  function semer() {
    if (!toile) return;
    toile.width = innerWidth; toile.height = innerHeight; pts = [];
    for (var i = 0; i < N; i++) pts.push({ x: Math.random(), y: Math.random() * 2, d: .25 + Math.random() * .75, or: Math.random() < .6 });
  }
  function dessiner() {
    if (!ctx) return;
    var w = toile.width, h = toile.height, y0 = pageYOffset;
    ctx.clearRect(0, 0, w, h);
    pts.forEach(function (p) {
      var y = (p.y * h - y0 * p.d * .08) % (h + 40); if (y < -20) y += h + 40;
      ctx.beginPath(); ctx.arc(p.x * w, y, p.d * 1.4, 0, 6.2832);
      ctx.fillStyle = p.or ? "rgba(201,169,110," + (.1 + p.d * .34) + ")" : "rgba(243,238,230," + (.07 + p.d * .24) + ")";
      ctx.fill();
    });
  }

  /* ---------- Bande d'appel ---------- */
  var bande = document.getElementById("bande");
  var accueil = document.getElementById("accueil");
  var dernierY = pageYOffset;
  function reglerBande() {
    if (!bande) return;
    var y = pageYOffset, monte = y < dernierY - 4, descend = y > dernierY + 4;
    var surAccueil = accueil ? accueil.getBoundingClientRect().bottom > innerHeight * 0.5 : y < 60;
    if (surAccueil || monte || y < 40) bande.classList.remove("cachee");
    else if (descend) bande.classList.add("cachee");
    dernierY = y;
  }

  /* ---------- Boucle de défilement ---------- */
  var attente = false;
  function surDefilement() {
    if (attente) return; attente = true;
    requestAnimationFrame(function () { placer(); if (!reduit) dessiner(); reglerBande(); attente = false; });
  }
  semer(); placer(); dessiner();
  addEventListener("scroll", surDefilement, { passive: true });
  addEventListener("resize", function () { semer(); placer(); dessiner(); });

  /* ---------- Apparition du contenu ---------- */
  var aReveler = [].slice.call(document.querySelectorAll("[data-reveal]"));
  if ("IntersectionObserver" in window && !reduit) {
    var obs = new IntersectionObserver(function (entrees) {
      entrees.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("vu"); obs.unobserve(e.target); } });
    }, { threshold: .16, rootMargin: "0px 0px -8% 0px" });
    aReveler.forEach(function (el) { obs.observe(el); });
  } else {
    aReveler.forEach(function (el) { el.classList.add("vu"); });
  }

  /* ---------- Menu ---------- */
  var menu = document.getElementById("menu-lateral"),
      ouvrir = document.getElementById("ouvrir-menu"),
      fermer = document.getElementById("fermer-menu"),
      voile = document.getElementById("voile-menu");
  function basculer(actif) {
    if (!menu) return;
    menu.classList.toggle("ouvert", actif);
    menu.setAttribute("aria-hidden", actif ? "false" : "true");
    if (ouvrir) ouvrir.setAttribute("aria-expanded", actif ? "true" : "false");
    if (voile) voile.hidden = !actif;
    document.body.style.overflow = actif ? "hidden" : "";
  }
  if (ouvrir) ouvrir.addEventListener("click", function () { basculer(true); });
  if (fermer) fermer.addEventListener("click", function () { basculer(false); });
  if (voile) voile.addEventListener("click", function () { basculer(false); });
  if (menu) menu.addEventListener("click", function (e) { if (e.target.closest("a[href^='#']")) basculer(false); });
  addEventListener("keydown", function (e) { if (e.key === "Escape" && menu && menu.classList.contains("ouvert")) basculer(false); });

  /* ---------- Fenêtre de rentrée (une fois par navigateur) ---------- */
  var fenetre = document.getElementById("fenetre-rentree"), CLE = "ff_fenetre_rentree";
  if (fenetre) {
    var vu = false; try { vu = localStorage.getItem(CLE) === "vu"; } catch (e) {}
    function fermerFenetre() { fenetre.hidden = true; try { localStorage.setItem(CLE, "vu"); } catch (e) {} }
    if (!vu) setTimeout(function () { fenetre.hidden = false; }, 2400);
    [].forEach.call(fenetre.querySelectorAll("[data-fermer]"), function (b) { b.addEventListener("click", fermerFenetre); });
    addEventListener("keydown", function (e) { if (e.key === "Escape" && !fenetre.hidden) fermerFenetre(); });
  }

  /* ---------- Adresse email recomposée au clic ---------- */
  var BOITE = ["aurelieeflcoach", "gmail", "com"];
  [].forEach.call(document.querySelectorAll("[data-email]"), function (b) {
    b.addEventListener("click", function (e) {
      e.preventDefault();
      var objet = b.getAttribute("data-objet") || "Renseignement";
      location.href = "mailto:" + BOITE[0] + "@" + BOITE[1] + "." + BOITE[2] + "?subject=" + encodeURIComponent(objet);
    });
  });

  /* ---------- Année ---------- */
  [].forEach.call(document.querySelectorAll(".annee-courante"), function (e) { e.textContent = new Date().getFullYear(); });
})();
