# Le site — première proposition

Le site vit dans `site/`, **à côté** de `landing/` et sans aucun lien technique
avec lui : sa propre feuille de style, ses propres scripts. Modifier l'un ne peut
pas casser l'autre, et la landing n'a été touchée en rien.

Rien n'est publié. La branche `main` n'a pas bougé, donc Cloudflare continue de
servir uniquement la landing.

```
site/
├── index.html            Les quatre pages du menu, à la suite
├── connexion.html        Connexion + demande d'accès
├── mentions-legales.html Reprises de la landing, adaptées au site
└── assets/
    ├── style.css         Charte identique à la landing
    ├── menu.js           Ouverture du menu, page courante, année
    ├── defilement.js     Décalage latéral entre les pages
    ├── calendrier.js     Dessine le calendrier et la liste des sessions
    ├── programme.js      Dessine les modules
    ├── compte.js         Formulaire de demande d'accès
    ├── aurelie.jpg
    ├── favicon.svg
    └── donnees/
        ├── sessions.js   ← les dates de formation
        └── modules.js    ← les modules du programme

docs/relecture/            Un PDF par page, pour les corrections d'Aurélie
```

## Une seule page qui défile

Les quatre entrées du menu — Accueil, Formation, À propos de moi, Mon programme —
ne sont plus quatre fichiers mais quatre sections du même document, parcourues en
descendant. Le menu ne charge plus de page : il fait glisser jusqu'à la bonne
section.

Entre deux sections, la suivante entre décalée sur le côté puis se remet d'aplomb
à mesure qu'on descend : **à droite** pour Formation, **à gauche** pour À propos,
**à droite** pour Mon programme. Le décalage suit la position de défilement, il
n'a pas de durée propre : il s'inverse si l'on remonte, et se rattrape sur la
hauteur d'un écran, c'est-à-dire pendant la fin de la section précédente.

Deux garde-fous : `overflow-x: clip` empêche le décalage de créer une barre de
défilement horizontale, et le réglage système « réduire les animations » le
neutralise entièrement — les sections restent alors simplement les unes sous les
autres.

Connexion et mentions légales restent des fichiers distincts : la première est
détachée en bas du menu, la seconde n'a pas vocation à être parcourue.

Pour ajouter une section, il suffit d'écrire un `<section class="ecran"
id="…" data-sens="droite|gauche">` dans `index.html` et une entrée dans le menu :
le décalage et le suivi de la page courante s'appliquent tout seuls.

## Les PDF de relecture

`docs/relecture/` contient un PDF par page visible, en A4 paysage pour que la
mise en page corresponde à ce qu'on voit à l'écran. Chaque grand bloc porte un
repère « BLOC 1 », « BLOC 2 »… : Aurélie peut désigner précisément ce qu'elle veut
changer sans avoir à décrire l'endroit.

Ces repères et l'en-tête de relecture n'existent que dans les PDF, jamais sur le
site. Les PDF sont regénérés par `pdf-pages.js` après chaque modification du
contenu — ils ne se mettent pas à jour tout seuls.

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
- **L'adresse du site.** Les noms de domaine `fluentandforward.fr` et `.com`
  seront pris avant la publication, prévue à la mi-septembre. Ils devront être
  achetés au nom d'Aurélie. En attendant, l'adresse n'a pas d'importance : rien
  n'est en ligne.
- **Où arrivent les demandes d'accès** : le tableur Google existant, dans un
  onglet séparé, est le plus simple.
