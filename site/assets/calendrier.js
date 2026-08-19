/* ==================================================================
   Fluent & Forward — calendrier des sessions

   Lit les données de assets/donnees/sessions.js et dessine :
     - trois mois glissants, à partir du mois en cours ;
     - la liste détaillée des sessions de cette période.

   Vert : il reste des places. Rouge : la session est complète.
   Le jour de démarrage est plein, les jours suivants sont teintés.
   ================================================================== */

(function () {
  "use strict";

  var MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet",
              "août", "septembre", "octobre", "novembre", "décembre"];
  var MOIS_COURT = ["janv", "févr", "mars", "avr", "mai", "juin", "juil",
                    "août", "sept", "oct", "nov", "déc"];
  var JOURS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
  var NB_MOIS = 3;

  var zoneCalendrier = document.getElementById("calendrier");
  var zoneSessions = document.getElementById("liste-sessions");
  if (!zoneCalendrier && !zoneSessions) return;

  var donnees = window.SESSIONS || { sessions: [] };

  /* Construit une date locale : « 2026-09-14 » ne doit pas basculer
     d'un jour selon le fuseau, comme le ferait new Date(chaine). */
  function versDate(chaine) {
    var p = String(chaine).split("-");
    return new Date(+p[0], +p[1] - 1, +p[2]);
  }

  function memeJour(a, b) {
    return a.getFullYear() === b.getFullYear()
        && a.getMonth() === b.getMonth()
        && a.getDate() === b.getDate();
  }

  var sessions = (donnees.sessions || []).map(function (s) {
    return {
      brut: s,
      debut: versDate(s.debut),
      fin: versDate(s.fin || s.debut),
      complete: !(s.placesRestantes > 0)
    };
  }).sort(function (a, b) { return a.debut - b.debut; });

  /* ---------- Fenêtre des trois mois ---------- */

  var aujourdhui = new Date();
  aujourdhui.setHours(0, 0, 0, 0);
  var premierMois = new Date(aujourdhui.getFullYear(), aujourdhui.getMonth(), 1);
  var finFenetre = new Date(aujourdhui.getFullYear(), aujourdhui.getMonth() + NB_MOIS, 0);

  /* ---------- Le calendrier ---------- */

  function etatDuJour(jour) {
    var etat = null;
    sessions.forEach(function (s) {
      if (jour < s.debut || jour > s.fin) return;
      var debut = memeJour(jour, s.debut);
      // Un jour de démarrage prime sur un jour de session en cours ;
      // à égalité, une session ayant des places prime sur une complète.
      if (!etat
          || (debut && !etat.debut)
          || (debut === etat.debut && !s.complete && etat.complete)) {
        etat = { debut: debut, complete: s.complete, titre: s.brut.titre };
      }
    });
    return etat;
  }

  function dessinerMois(decalage) {
    var ancre = new Date(premierMois.getFullYear(), premierMois.getMonth() + decalage, 1);
    var annee = ancre.getFullYear();
    var mois = ancre.getMonth();
    var nbJours = new Date(annee, mois + 1, 0).getDate();
    // getDay() : 0 = dimanche. La semaine commence lundi.
    var decalageDebut = (new Date(annee, mois, 1).getDay() + 6) % 7;

    var bloc = document.createElement("div");
    bloc.className = "mois";

    var titre = document.createElement("h3");
    titre.textContent = MOIS[mois] + " " + annee;
    bloc.appendChild(titre);

    var table = document.createElement("table");
    table.setAttribute("aria-label", "Sessions de " + MOIS[mois] + " " + annee);

    var thead = document.createElement("thead");
    var ligneJours = document.createElement("tr");
    JOURS.forEach(function (j) {
      var th = document.createElement("th");
      th.scope = "col";
      th.textContent = j;
      ligneJours.appendChild(th);
    });
    thead.appendChild(ligneJours);
    table.appendChild(thead);

    var tbody = document.createElement("tbody");
    var ligne = document.createElement("tr");
    var colonne = 0;
    var compteur = 0;

    function nouvelleCase(contenu, classe, infobulle) {
      var td = document.createElement("td");
      var cellule = document.createElement("span");
      cellule.className = "jour " + classe;
      cellule.textContent = contenu;
      if (infobulle) {
        cellule.title = infobulle;
        td.setAttribute("aria-label", infobulle);
      }
      td.appendChild(cellule);
      ligne.appendChild(td);
      colonne++;
      if (colonne === 7) {
        tbody.appendChild(ligne);
        ligne = document.createElement("tr");
        colonne = 0;
      }
    }

    for (var v = 0; v < decalageDebut; v++) nouvelleCase("·", "jour-vide", "");

    for (var d = 1; d <= nbJours; d++) {
      var jour = new Date(annee, mois, d);
      var etat = etatDuJour(jour);
      var classe = "";
      var bulle = "";

      if (etat) {
        var couleur = etat.complete ? "complet" : "libre";
        classe = etat.debut ? "jour-debut jour-debut-" + couleur
                            : "jour-pendant-" + couleur;
        bulle = etat.titre + (etat.debut ? " — démarrage" : "")
              + (etat.complete ? " (complet)" : " (places disponibles)");
        compteur++;
      }
      nouvelleCase(String(d), classe, bulle);
    }

    while (colonne > 0 && colonne < 7) nouvelleCase("·", "jour-vide", "");
    if (ligne.children.length) tbody.appendChild(ligne);
    table.appendChild(tbody);
    bloc.appendChild(table);

    if (compteur === 0) {
      var vide = document.createElement("p");
      vide.className = "mois-vide";
      vide.textContent = "Aucune session ce mois-ci.";
      bloc.appendChild(vide);
    }

    return bloc;
  }

  if (zoneCalendrier) {
    var grille = document.createElement("div");
    grille.className = "mois-grille";
    for (var m = 0; m < NB_MOIS; m++) grille.appendChild(dessinerMois(m));
    zoneCalendrier.appendChild(grille);
  }

  /* ---------- La liste détaillée ---------- */

  function dessinerSession(s) {
    var carte = document.createElement("article");
    carte.className = "session" + (s.complete ? " session-complete" : "");

    var date = document.createElement("div");
    date.className = "session-date";
    date.innerHTML = '<span class="jour-chiffre">' + s.debut.getDate() + '</span>'
                   + '<span class="mois-court">' + MOIS_COURT[s.debut.getMonth()] + '</span>';

    var detail = document.createElement("div");
    detail.className = "session-detail";
    var h3 = document.createElement("h3");
    h3.textContent = s.brut.titre;
    var p = document.createElement("p");
    var duree = memeJour(s.debut, s.fin)
      ? "Le " + s.debut.getDate() + " " + MOIS[s.debut.getMonth()]
      : "Du " + s.debut.getDate() + " " + MOIS[s.debut.getMonth()]
        + " au " + s.fin.getDate() + " " + MOIS[s.fin.getMonth()];
    p.textContent = duree + " · " + s.brut.format + " · " + s.brut.rythme;
    detail.appendChild(h3);
    detail.appendChild(p);

    var etat = document.createElement("div");
    etat.className = "session-etat";
    var etiquette = document.createElement("span");
    etiquette.className = "etiquette " + (s.complete ? "etiquette-complete" : "etiquette-libre");
    etiquette.textContent = s.complete ? "Complet" : "Places disponibles";
    etat.appendChild(etiquette);
    if (!s.complete) {
      var reste = document.createElement("span");
      reste.className = "reste";
      reste.textContent = s.brut.placesRestantes + " place"
        + (s.brut.placesRestantes > 1 ? "s" : "") + " sur " + s.brut.placesTotal;
      etat.appendChild(reste);
    }

    carte.appendChild(date);
    carte.appendChild(detail);
    carte.appendChild(etat);
    return carte;
  }

  if (zoneSessions) {
    // On garde les sessions qui touchent la fenêtre et ne sont pas passées.
    var visibles = sessions.filter(function (s) {
      return s.fin >= aujourdhui && s.debut <= finFenetre;
    });

    if (!visibles.length) {
      var rien = document.createElement("p");
      rien.className = "chapeau";
      rien.textContent = "Aucune session n'est programmée sur les trois prochains mois. "
        + "Les prochaines dates seront annoncées ici.";
      zoneSessions.appendChild(rien);
    } else {
      var liste = document.createElement("div");
      liste.className = "sessions";
      visibles.forEach(function (s) { liste.appendChild(dessinerSession(s)); });
      zoneSessions.appendChild(liste);
    }

    if (donnees.miseAJour) {
      var maj = document.createElement("p");
      maj.className = "mise-a-jour";
      var d = versDate(donnees.miseAJour);
      maj.textContent = "Disponibilités mises à jour le " + d.getDate() + " "
        + MOIS[d.getMonth()] + " " + d.getFullYear() + ".";
      zoneSessions.appendChild(maj);
    }
  }
})();
