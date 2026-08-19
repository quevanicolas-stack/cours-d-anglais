# Le site — première proposition

Le site vit dans `site/`, **à côté** de `landing/` et sans aucun lien technique
avec lui : sa propre feuille de style, ses propres scripts. Modifier l'un ne peut
pas casser l'autre, et la landing n'a été touchée en rien.

Rien n'est publié. La branche `main` n'a pas bougé, donc Cloudflare continue de
servir uniquement la landing.

```
site/
├── index.html            Accueil
├── formation.html        Descriptif + calendrier des sessions
├── a-propos.html         À propos d'Aurélie
├── programme.html        Les modules
├── connexion.html        Connexion + demande d'accès
├── mentions-legales.html Reprises de la landing, adaptées au site
└── assets/
    ├── style.css         Charte identique à la landing
    ├── menu.js           Ouverture du menu, page courante, année
    ├── calendrier.js     Dessine le calendrier et la liste des sessions
    ├── programme.js      Dessine les modules
    ├── compte.js         Formulaire de demande d'accès
    ├── aurelie.jpg
    ├── favicon.svg
    └── donnees/
        ├── sessions.js   ← les dates de formation
        └── modules.js    ← les modules du programme
```

## Les deux fichiers à faire vivre

Tout le contenu qui bouge est isolé dans `assets/donnees/`. Aucune page HTML n'a
besoin d'être ouverte pour ajouter une session ou un module.

**`sessions.js`** — une entrée par session : titre, format, rythme, dates de début
et de fin, places totales et places restantes. `placesRestantes: 0` bascule la
session en rouge, partout, automatiquement. C'est ce fichier que l'export du
calendrier d'Aurélie viendra réécrire plus tard ; la forme des données ne
changera pas.

**`modules.js`** — une entrée par module : numéro, titre, résumé, état
(`disponible` ou `en-preparation`) et liste des séances. Un module passe de
« En préparation » à « Disponible » en changeant un mot.

Ces fichiers sont écrits en JavaScript et non en JSON, pour que le site
fonctionne aussi en ouvrant les fichiers directement depuis l'ordinateur, sans
serveur.

## Le calendrier

Trois mois glissants à partir du mois en cours. Le jour de démarrage d'une
session est en couleur pleine, les jours suivants sont teintés — on voit d'un
coup d'œil quand ça commence et combien de temps ça dure. Vert : il reste des
places. Rouge : complet. Survoler une date affiche l'intitulé de la session.

Sous le calendrier, la même information en liste détaillée, avec le nombre de
places restantes. La liste sert aussi de version lisible sur mobile, où la grille
se met en colonne.

## L'accès aux modules

**Aucun verrou n'est posé pour l'instant** : tout est consultable, comme demandé.
La page Connexion existe et présente les deux moitiés du dispositif — se
connecter, et demander un accès.

Le formulaire de connexion est volontairement **inactif** : vérifier un mot de
passe suppose un serveur, et faire semblant serait pire que de ne rien faire.

Le formulaire de demande d'accès, lui, fonctionne. Il ne demande **pas de mot de
passe** : tant qu'il n'existe pas de serveur pour le recevoir et le chiffrer, un
mot de passe saisi ici finirait en clair dans le navigateur. Aurélie transmet les
identifiants au moment où elle valide la demande — ce qui correspond exactement à
la règle voulue : aucune création de compte automatique.

Les demandes sont pour l'instant conservées dans le navigateur qui les envoie.
Pour qu'elles remontent à Aurélie, il suffira d'indiquer l'adresse du script
Google dans `assets/compte.js`, comme pour la landing.

### Quand viendra le vrai verrou

À prévoir dès maintenant dans les choix techniques : **un verrou écrit en
JavaScript ne protège rien.** Masquer les modules côté navigateur se contourne en
ouvrant les outils de développement. Le jour où l'accès devra être réellement
réservé, il faudra soit un hébergement capable d'exécuter du code côté serveur,
soit un service d'authentification externe. C'est le seul point du projet qui
demandera de sortir du tout-statique.

## Ce qui reste à écrire avec Aurélie

Les passages surlignés en doré dans les pages, même convention que sur la
landing :

- **Formation** — tarifs des cohortes et des ateliers, conditions entreprises,
  règlement et annulation ;
- **À propos de moi** — tout le parcours ; c'est la page que les prospects lisent
  avant de s'inscrire, elle doit venir d'elle ;
- **À propos de moi** — présentiel proposé ou non, niveaux acceptés, langue des
  séances ;
- **Mon programme** — les modules 4 à 8 sont des propositions ; les titres 1 à 3
  reprennent les thèmes du guide « Stop Avoiding » ;
- **Formation** — les sessions affichées sont des exemples ;
- **Mentions légales** — l'hébergeur, à renseigner selon le choix retenu.

## Points à trancher

- **La landing reste-t-elle séparée ?** Aujourd'hui l'accueil renvoie vers
  `fluentandforward.pages.dev` par un bouton. On peut la garder à part — c'est
  une page de capture, elle a sa propre logique — ou l'intégrer au site plus tard.
- **L'adresse du site.** Si le site prend `fluentandforward.pages.dev`, la landing
  devra déménager, par exemple sur une sous-adresse.
- **Où arrivent les demandes d'accès** : le tableur Google existant, dans un
  onglet séparé, est le plus simple.
