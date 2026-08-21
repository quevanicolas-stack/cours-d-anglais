/* ==================================================================
   Fluent & Forward — les 8 modules du programme

   Dessine la grille des modules à partir de assets/donnees/modules.js :
   des cases compactes, à lire de haut en bas, réparties sur deux
   rangées de quatre sur écran large.
   ================================================================== */

(function () {
  "use strict";

  var zone = document.getElementById("liste-modules");
  if (!zone) return;

  var donnees = window.MODULES || { modules: [] };

  var grille = document.createElement("div");
  grille.className = "modules-grille";

  (donnees.modules || []).forEach(function (m) {
    var carte = document.createElement("article");
    carte.className = "module";

    var numero = document.createElement("span");
    numero.className = "module-numero";
    numero.textContent = m.numero;

    var titre = document.createElement("h3");
    // Les intitulés contiennent des esperluettes échappées.
    titre.innerHTML = m.titre;

    var texte = document.createElement("p");
    texte.textContent = m.description;

    carte.appendChild(numero);
    carte.appendChild(titre);
    carte.appendChild(texte);
    grille.appendChild(carte);
  });

  zone.appendChild(grille);
})();
