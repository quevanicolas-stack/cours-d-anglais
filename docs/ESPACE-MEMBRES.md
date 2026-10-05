# Espace membres

Accès aux modules du Business English Accelerator, réservé aux personnes
dont le compte a été validé par Aurélie. Pas de mot de passe ni de code
à recopier : on se connecte en cliquant sur un lien reçu par email,
valable une seule fois.

## Parcours

1. **Demande** — `landing/membres/inscription.html`. La personne indique
   son prénom et son email. La demande est enregistrée dans l'onglet
   « Membres » du classeur, et Aurélie reçoit un email avec deux boutons :
   *Valider* / *Refuser*.
2. **Décision d'Aurélie** — un clic sur *Valider* envoie à la personne un
   lien de connexion et fixe la date de validation (point de départ des
   180 jours et des semaines). Un clic sur *Refuser* n'envoie rien.
3. **Connexion** — la personne indique son email sur
   `landing/membres/connexion.html` et reçoit aussitôt un lien, sans
   repasser par Aurélie. La page affiche un cercle de chargement et se
   connecte d'elle-même dès que le lien est ouvert, où que ce soit
   (application mail, téléphone, autre onglet) : le lien porte un ticket
   propre à la page qui attend, que le serveur garde six heures en cache.
   - Un lien vaut 24 heures et peut être rouvert pendant ce temps.
   - Redemander un lien ne périme pas les précédents : le même lien est
     renvoyé, sa validité repartant pour 24 heures.
   - Une fois connectée, la personne le reste sur chaque appareil jusqu'à
     la fin de son accès ; plusieurs appareils peuvent l'être ensemble.
     Seuls la fin du compte ou un statut changé par Aurélie dans
     l'onglet « Membres » déconnectent.
4. **Espace** — `landing/membres/espace.html`, en trois temps :
   - un écran d'accueil, affiché une fois par visite, le temps que le
     serveur réponde (il met souvent deux à quatre secondes) ;
   - le menu des modules : une carte par ligne de l'onglet « Programme »,
     disponible ou verrouillée selon la semaine ;
   - le détail d'un module : séances puis ressources.
   Le programme est gardé dans le navigateur : en revenant d'un cours,
   l'espace s'affiche aussitôt et se met à jour en arrière-plan. Les
   semaines se comptent à partir de **la date de validation du compte**
   de chaque personne.
   Seul un refus explicite du serveur (session inconnue ou expirée)
   déconnecte : une lenteur ou une panne passagère affiche « Réessayer ».

Pour que le menu montre dès maintenant les modules à venir (verrouillés),
il suffit d'ajouter leurs lignes dans « Programme » : semaine, titre sous
la forme `Module 2 — Titre`, et la colonne fichiers laissée vide tant que
les supports ne sont pas publiés (la carte affiche alors « Bientôt » une
fois la semaine atteinte).

## Ce qui a été livré maintenant

- Les trois pages ci-dessus, plus `landing/membres/assets/membres.js`
  et `membres.css`.
- Le code serveur : `docs/collecte/espace-membres-apps-script.gs` — à
  ajouter au projet Apps Script existant (celui qui gère déjà le guide),
  **pas encore fait**. Les instructions précises sont en tête de ce
  fichier : deux nouveaux onglets dans le classeur (« Membres » et
  « Programme »), deux lignes à ajouter dans le `doPost`/`doGet`
  existants, deux constantes à renseigner (email d'Aurélie, adresse
  `/exec`).
- Le module 1 complet publié dans `landing/membres/cours/` : les trois
  séances (avec narration audio), le Vocabulary Kit et la fiche de
  grammaire (`module1-vocabulaire.html`, `module1-grammaire.html`).
  L'onglet « Programme » doit contenir une ligne semaine 1 pointant sur
  les cinq (détail exact et format dans le fichier `.gs`).

**Tant que le script n'est pas ajouté côté Google, les pages affichent
une erreur réseau** — c'est attendu, il n'y a rien à corriger dans le
code pour ça.

## Narration audio

Les audios sont rangés par séance dans `files/fluent-forward/audio/`
(`module1-seance1/`, `module1-seance2/`, …) : deux séances peuvent ainsi
avoir chacune leur `page-03.mp3` sans s'écraser.

- Séance 1 : enregistrements des diapositives 02, 03, 05, 06, 08, 11
  et 14 ; les anciens sons (04 et 10) ont été retirés.
- Les trois séances : même lecteur à bouton rond (lecture, pause,
  relecture) (anneau de progression), sur
  les diapositives indiquées par leurs attributs `data-audio`.

## Publier les supports (`source/publier_cours.py`)

Les copies servies aux membres (`landing/membres/cours/`) se fabriquent,
elles ne se modifient pas à la main :

    python3 source/publier_cours.py

Le script repart des sources de `files/fluent-forward/` et les adapte au
site : polices du site au lieu de Google Fonts, vidéos intégrées sorties
en fichiers (`video/`), bouton « retour à mon espace » dans la barre de
navigation des séances, copie des audios. Sans ces adaptations, la
politique de sécurité du site bloquerait polices et vidéos.

## Ajouter un futur module

1. Ajouter ses fichiers à la liste `PUBLIES` de `source/publier_cours.py`,
   lancer le script, puis commit + push — c'est la seule étape qui touche
   au code.
2. Ajouter une ligne dans l'onglet « Programme » du classeur : numéro de
   semaine, titre, et dans la colonne « fichiers » la liste
   `nom-du-fichier.html|Libellé affiché` pour chaque fichier, séparés par
   des points-virgules (voir l'exemple en tête de `.gs`). **Aucun
   redéploiement de script nécessaire** — Aurélie peut le faire seule,
   directement dans Google Sheets.

## Limites, en toute franchise

- **Le verrouillage est le même type que celui du PDF du guide** (voir
  `DEPLOIEMENT.md`, section « Ce qui reste ouvert, volontairement ») :
  l'adresse exacte d'un fichier dans `landing/membres/cours/` reste
  techniquement joignable par qui la devine ou la trouve dans le code
  de la page — elle est seulement non indexée (`X-Robots-Tag`) et jamais
  liée publiquement. Un verrou réel demanderait un hébergement qui
  exécute du code à chaque requête de fichier, ce qui changerait toute
  l'architecture (voir le choix fait au départ : rester sur le Google
  Apps Script existant plutôt que Cloudflare Workers + base de données).
- **La session est un jeton dans le navigateur** (`localStorage`), valable
  jusqu'à l'expiration du compte. Elle est
  vérifiée à chaque chargement de `espace.html` contre la feuille
  « Membres ». Quelqu'un qui a accès à l'appareil a donc accès à
  l'espace : « Se déconnecter » efface la session.
- **Pas de limite de débit agressive** sur les demandes de code : un
  envoi par minute et par adresse, 5 essais par code. Suffisant contre un
  usage maladroit, pas conçu pour résister à une attaque déterminée — à
  surveiller si le nombre de membres grandit.
