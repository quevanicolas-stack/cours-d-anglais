# Le site

Le site vit dans `site/`, **à côté** de `landing/` et sans aucun lien technique
avec lui : sa propre feuille de style, ses propres scripts. Modifier l'un ne peut
pas casser l'autre, et la landing n'a été touchée en rien.

Rien n'est publié. La branche `main` n'a pas bougé, donc Cloudflare continue de
servir uniquement la landing.

Contenu et structure conformes à la consigne d'Aurélie. Les quatre pages du
menu vivent dans `index.html` ; seules les mentions légales restent un fichier
à part.

```
site/
├── index.html            Les quatre pages du menu, à la suite
├── mentions-legales.html
└── assets/
    ├── style.css         Charte identique à la landing
    ├── menu.js           Ouverture du panneau, page courante, année
    ├── defilement.js     Défilement en escalier
    ├── bandeau.js        Bande d'appel, fenêtre de rentrée, contacts
    ├── calendrier.js     Dessine le calendrier et la liste des sessions
    ├── programme.js      Dessine les 8 modules
    ├── compte.js         Formulaire de demande d'accès
    ├── aurelie.jpg
    ├── favicon.svg
    └── donnees/
        ├── sessions.js   ← les dates de formation
        └── modules.js    ← les 8 modules du programme

docs/relecture/            Un PDF par page, pour les corrections d'Aurélie
```

## Les quatre pages

| | Page | Contenu |
|---|---|---|
| 1 | Accueil | La question d'ouverture, la promesse en 8 semaines, le cadran « Voir les prochaines sessions » |
| 2 | Business English Accelerator | Le format, les 8 modules, pour qui, le calendrier, tarif et inscription |
| 3 | À propos de moi | Le parcours, la photo, la méthode, les deux cadrans « Pour qui » |
| 4 | Mon Accélérateur | L'espace membres : connexion et demande d'accès |

Le bouton **Connexion**, en bas du panneau, mène à la page 4 — c'est la même
chose, mis à portée de clic depuis n'importe où.

## La bande et la barre

**La bande d'appel** occupe toute la largeur, tout en haut : « Inscris-toi à la
formation ». Elle ne bouge pas tant qu'on est sur la première page — raccord
compris —, s'efface ensuite quand on descend, et revient dès qu'on remonte.

**La barre** reste fixe sous elle : la marque à gauche, les trois traits à
droite. Le panneau glisse depuis la droite, du côté du bouton qui l'ouvre.

Quand la bande s'efface, la barre **ne remonte pas** : sa place reste réservée
et se remplit du fond de page, crème comme la barre. Faire remonter la barre
laisserait sa ligne de séparation flotter au-dessus d'un vide — c'est laid, et
ça obligerait à recalculer tout le parcours en plein défilement.

## La fenêtre de la rentrée

« −50 % pour la rentrée septembre 2026 ». Elle s'affiche au bout de deux
secondes, une seule fois par navigateur : refermée, elle ne revient pas. Le
texte se change dans `index.html`, la temporisation dans `bandeau.js`.

## Les contacts du pied de page

Trois boutons ronds : email, LinkedIn, Instagram. **L'adresse email n'est écrite
nulle part dans le code de la page** — elle est recomposée au moment du clic,
pour ne pas être moissonnée par les robots qui lisent le code source. Vérifié :
la chaîne `aurelieeflcoach` n'apparaît pas dans le HTML servi.

Les adresses LinkedIn et Instagram ont été débarrassées de leurs paramètres de
suivi (`utm_source`, `igsi`…), qui ne servent qu'à Instagram et LinkedIn pour
savoir d'où vient le clic.

## Le défilement en escalier

Les quatre entrées du menu — Accueil, Formation, À propos de moi, Mon programme —
ne sont plus quatre fichiers mais quatre sections du même document. Chacune
occupe **sa propre colonne**, décalée d'un écran vers la droite par rapport à la
précédente, comme des plages de cellules en diagonale dans un tableur :

```
        colonne 1     colonne 2     colonne 3     colonne 4
        ┌─────────┐
        │ Accueil │
        │    ↓    │
        └─────────┘──▶┌───────────┐
                      │ Formation │
                      │     ↓     │
                      └───────────┘──▶┌──────────┐
                                      │ À propos │
                                      │    ↓     │  ──▶  Mon programme
                                      └──────────┘
```

On descend la page 1 normalement. Arrivé en bas, **le défilement part sur le côté
au lieu de continuer vers le bas** : la page 1 sort par la gauche pendant que la
page 2 entre par la droite. Puis la descente reprend. Et ainsi de suite jusqu'à
la dernière page, après laquelle le pied de page apparaît.

La molette n'est jamais confisquée : c'est le défilement normal du document qui
avance, `defilement.js` se contente de traduire sa position en déplacement
horizontal ou vertical. Conséquences utiles : la barre de défilement reste juste,
remonter refait le chemin en sens inverse, et rien ne se bloque si un script
tombe en panne.

Le raccord dure 85 % d'une hauteur d'écran — c'est la quantité de molette
pendant laquelle on va sur le côté. Une valeur à ajuster d'un chiffre dans
`defilement.js` (`RACCORD`) si l'effet paraît trop long ou trop bref.

**L'effet est écarté sur écran étroit (moins de 900 px) et si le système demande
moins d'animations.** Les pages redeviennent alors de simples sections empilées,
ce qu'elles sont déjà dans le HTML : sur téléphone, on descend tout droit. C'est
volontaire — l'escalier suppose une souris ou un pavé tactile, et un écran assez
large pour que le mouvement latéral se lise.

Connexion et mentions légales restent des fichiers distincts : la première est
détachée en bas du menu, la seconde n'a pas vocation à être parcourue.

Pour ajouter une page : écrire une `<section class="ecran" id="…">` de plus dans
`index.html` et une entrée dans le menu. La colonne, le raccord et le suivi de la
page courante s'appliquent tout seuls.

### Ce que l'escalier coûte

À savoir avant de le garder :

- la navigation au clavier peut amener le focus sur une page qui n'est pas à
  l'écran, sans que le parcours suive ;
- la fonction « rechercher dans la page » du navigateur peut trouver un mot dans
  une colonne voisine sans pouvoir y aller ;
- le parcours est plus long qu'un empilement classique — environ onze écrans de
  molette pour tout voir.

Rien de rédhibitoire pour un site vitrine, mais ce sont les raisons pour
lesquelles peu de sites font ça, et il vaut mieux le savoir maintenant qu'après
la mise en ligne.

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
