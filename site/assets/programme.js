/* ==================================================================
   Fluent & Forward — page « Mon programme »

   Dessine la liste des modules à partir de assets/donnees/modules.js.
   Un module disponible s'ouvre pour montrer ses séances.

   Aucun verrou d'accès n'est posé pour l'instant : tout est consultable.
   Le jour où l'accès sera réservé aux comptes validés, c'est ici que le
   contrôle viendra se greffer — mais côté serveur, pas ici : un verrou
   écrit en JavaScript se contourne en trois clics.
   ================================================================== */

(function () {
  "use strict";

  var zone = document.getElementById("liste-modules");
  if (!zone) return;

  var donnees = window.MODULES || { modules: [] };

  function dessiner(m) {
    var ouvrable = m.etat === "disponible" && m.seances && m.seances.length;

    var carte = document.createElement("article");
    carte.className = "module" + (m.etat === "disponible" ? "" : " module-a-venir");

    var numero = document.createElement("span");
    numero.className = "module-numero";
    numero.textContent = m.numero;

    var detail = document.createElement("div");
    var h3 = document.createElement("h3");
    h3.textContent = m.titre;
    var p = document.createElement("p");
    p.textContent = m.resume;
    detail.appendChild(h3);
    detail.appendChild(p);

    var etat = document.createElement("div");
    var etiquette = document.createElement("span");
    etiquette.className = "etiquette "
      + (m.etat === "disponible" ? "etiquette-libre" : "etiquette-complete");
    etiquette.textContent = m.etat === "disponible" ? "Disponible" : "En préparation";
    etat.appendChild(etiquette);

    carte.appendChild(numero);
    carte.appendChild(detail);
    carte.appendChild(etat);

    if (!ouvrable) return [carte];

    // Les séances sont repliées par défaut : la liste des huit modules doit
    // rester lisible d'un coup d'œil.
    var seances = document.createElement("ul");
    seances.className = "seances";
    seances.id = "seances-" + m.numero;
    seances.hidden = true;
    m.seances.forEach(function (s) {
      var li = document.createElement("li");
      li.textContent = s;
      seances.appendChild(li);
    });

    var bascule = document.createElement("button");
    bascule.className = "bascule-seances";
    bascule.setAttribute("aria-expanded", "false");
    bascule.setAttribute("aria-controls", seances.id);
    bascule.textContent = "Voir les " + m.seances.length + " séances";
    bascule.addEventListener("click", function () {
      var ouvert = seances.hidden;
      seances.hidden = !ouvert;
      bascule.setAttribute("aria-expanded", ouvert ? "true" : "false");
      bascule.textContent = ouvert
        ? "Masquer les séances"
        : "Voir les " + m.seances.length + " séances";
    });
    detail.appendChild(bascule);

    return [carte, seances];
  }

  var liste = document.createElement("div");
  liste.className = "modules";
  (donnees.modules || []).forEach(function (m) {
    dessiner(m).forEach(function (n) { liste.appendChild(n); });
  });
  zone.appendChild(liste);
})();
