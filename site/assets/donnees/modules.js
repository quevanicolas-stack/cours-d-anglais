/* ==================================================================
   Fluent & Forward — modules du programme

   Comme pour les sessions, c'est le seul fichier à modifier pour faire
   évoluer la page « Mon programme ». Les modules s'ajoutent au fur et à
   mesure de leur création : il suffit d'en écrire un de plus dans la
   liste, la page se met à jour toute seule.

   Chaque module :
     numero   affiché dans la pastille
     titre    nom du module
     resume   deux phrases, ce qu'on y travaille
     etat     "disponible" ou "en-preparation"
     seances  liste des séances ; laisser vide tant qu'elles ne sont pas écrites

   Les titres ci-dessous reprennent les thèmes du guide « Stop Avoiding ».
   Ils sont à valider et à compléter avec Aurélie.
   ================================================================== */

window.MODULES = {
  titreProgramme: "Business English Accelerator",
  duree: "8 semaines",

  modules: [
    {
      numero: 1,
      titre: "Sortir du silence",
      resume: "Pourquoi on se tait alors qu'on comprend tout, et les cinq phrases "
            + "de survie qui permettent de rester dans la conversation au lieu d'en sortir.",
      etat: "disponible",
      seances: [
        "Ce n'est pas ton anglais, le problème",
        "Les cinq phrases de survie",
        "Mise en situation : rester dans l'échange"
      ]
    },
    {
      numero: 2,
      titre: "Répondre sans paniquer",
      resume: "Gagner du temps, faire répéter, reformuler : les manières d'occuper "
            + "les trois secondes pendant lesquelles on cherche ses mots.",
      etat: "disponible",
      seances: [
        "Gagner du temps proprement",
        "Faire répéter sans s'excuser",
        "Reformuler pour vérifier"
      ]
    },
    {
      numero: 3,
      titre: "Tenir une réunion",
      resume: "Le mini-script de réunion : ouvrir, intervenir, contredire, conclure. "
            + "On répète chaque étape jusqu'à ce qu'elle vienne sans réfléchir.",
      etat: "disponible",
      seances: [
        "Le mini-script complet",
        "Prendre la parole en premier",
        "Exprimer un désaccord sans agressivité"
      ]
    },
    {
      numero: 4,
      titre: "L'écrit qui obtient une réponse",
      resume: "Emails, comptes rendus, messages courts. Ce qui fait qu'un email "
            + "en anglais reçoit une réponse rapide plutôt qu'un silence poli.",
      etat: "en-preparation",
      seances: []
    },
    {
      numero: 5,
      titre: "Présenter et convaincre",
      resume: "Structurer une présentation, tenir son rythme, gérer les questions "
            + "à la fin — le moment que tout le monde redoute.",
      etat: "en-preparation",
      seances: []
    },
    {
      numero: 6,
      titre: "Négocier",
      resume: "Poser un cadre, dire non, proposer une alternative. Le vocabulaire "
            + "et surtout les tournures qui évitent de paraître brutal.",
      etat: "en-preparation",
      seances: []
    },
    {
      numero: 7,
      titre: "Les trois réflexes à garder",
      resume: "Ce qui reste une fois la formation terminée : la routine à tenir "
            + "pour que les acquis ne s'effacent pas en trois mois.",
      etat: "en-preparation",
      seances: []
    },
    {
      numero: 8,
      titre: "À définir",
      resume: "Emplacement libre, à remplir avec Aurélie selon les besoins qui "
            + "reviennent le plus souvent chez les participants.",
      etat: "en-preparation",
      seances: []
    }
  ]
};
