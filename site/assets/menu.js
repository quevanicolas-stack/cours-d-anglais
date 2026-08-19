/* ==================================================================
   Fluent & Forward — menu latéral

   Le balisage du menu est présent dans chaque page : sans JavaScript,
   il reste une simple liste de liens utilisable. Ce fichier ne fait
   qu'ouvrir, fermer et signaler la page courante.
   ================================================================== */

(function () {
  "use strict";

  var menu = document.getElementById("menu-lateral");
  var ouvrir = document.getElementById("ouvrir-menu");
  var fermer = document.getElementById("fermer-menu");
  var voile = document.getElementById("voile-menu");

  function basculer(actif) {
    if (!menu) return;
    menu.classList.toggle("ouvert", actif);
    menu.setAttribute("aria-hidden", actif ? "false" : "true");
    if (ouvrir) ouvrir.setAttribute("aria-expanded", actif ? "true" : "false");
    if (voile) voile.hidden = !actif;
    document.body.style.overflow = actif ? "hidden" : "";
    if (actif) {
      var premier = menu.querySelector("a, button");
      if (premier) premier.focus();
    } else if (ouvrir) {
      ouvrir.focus();
    }
  }

  if (ouvrir) ouvrir.addEventListener("click", function () { basculer(true); });
  if (fermer) fermer.addEventListener("click", function () { basculer(false); });
  if (voile) voile.addEventListener("click", function () { basculer(false); });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && menu && menu.classList.contains("ouvert")) {
      basculer(false);
    }
  });

  /* Signale la page courante dans le menu, à partir du nom du fichier :
     une seule source de vérité, aucun risque d'oubli en ajoutant une page. */
  var page = location.pathname.split("/").pop() || "index.html";
  var liens = document.querySelectorAll("#menu-lateral a[href]");
  Array.prototype.forEach.call(liens, function (lien) {
    if (lien.getAttribute("href") === page) {
      lien.setAttribute("aria-current", "page");
    }
  });

  /* Année du pied de page. */
  var annee = document.querySelectorAll(".annee-courante");
  Array.prototype.forEach.call(annee, function (e) {
    e.textContent = new Date().getFullYear();
  });
})();
