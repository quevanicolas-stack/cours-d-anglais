/* ==================================================================
   Fluent & Forward — sessions de formation

   CE FICHIER EST LE SEUL À METTRE À JOUR pour faire vivre le calendrier
   de la page Formation. Aucune autre page n'a besoin d'être touchée.

   Il est écrit en JavaScript plutôt qu'en JSON pour une raison pratique :
   ainsi le calendrier fonctionne même en ouvrant les fichiers directement
   depuis l'ordinateur, sans serveur.

   À terme, c'est l'export du calendrier d'Aurélie (Google Agenda, .ics)
   qui régénérera automatiquement ce fichier. La forme des données
   ci-dessous ne changera pas : seule la liste sera réécrite.

   Chaque session :
     id              identifiant court, unique, sans espace ni accent
     titre           nom affiché
     format          en visio, en présentiel, petit groupe…
     rythme          fréquence et horaires
     debut / fin     dates au format AAAA-MM-JJ (la fin peut égaler le début)
     placesTotal     nombre de places ouvertes
     placesRestantes 0 = session complète, affichée en rouge

   ATTENTION : les sessions ci-dessous sont des EXEMPLES, mis en place
   pour montrer le fonctionnement du calendrier. Elles doivent être
   remplacées par les vraies dates avant toute mise en ligne.
   ================================================================== */

window.SESSIONS = {
  miseAJour: "2026-08-19",

  sessions: [
    {
      id: "atelier-stop-avoiding-aout",
      titre: "Atelier « Stop Avoiding » — prendre la parole sans bloquer",
      format: "Visio, groupe de 12",
      rythme: "Une séance de 2 h, jeudi 18 h – 20 h",
      debut: "2026-08-27",
      fin: "2026-08-27",
      placesTotal: 12,
      placesRestantes: 0
    },
    {
      id: "bea-septembre",
      titre: "Business English Accelerator — cohorte de septembre",
      format: "Visio, petit groupe de 8 maximum",
      rythme: "2 séances d'1 h 15 par semaine, mardi et jeudi à 18 h",
      debut: "2026-09-14",
      fin: "2026-11-06",
      placesTotal: 8,
      placesRestantes: 3
    },
    {
      id: "intensif-septembre",
      titre: "Intensif « réunions et négociations »",
      format: "Visio, groupe de 6",
      rythme: "Deux journées complètes, 9 h – 16 h",
      debut: "2026-09-28",
      fin: "2026-09-29",
      placesTotal: 6,
      placesRestantes: 0
    },
    {
      id: "bea-octobre",
      titre: "Business English Accelerator — cohorte d'octobre",
      format: "Visio, petit groupe de 8 maximum",
      rythme: "2 séances d'1 h 15 par semaine, lundi et mercredi à 12 h 30",
      debut: "2026-10-12",
      fin: "2026-12-04",
      placesTotal: 8,
      placesRestantes: 8
    },
    {
      id: "atelier-email-octobre",
      titre: "Atelier « écrire un email qui passe »",
      format: "Visio, groupe de 12",
      rythme: "Une séance de 2 h, mardi 12 h – 14 h",
      debut: "2026-10-20",
      fin: "2026-10-20",
      placesTotal: 12,
      placesRestantes: 5
    }
  ]
};
