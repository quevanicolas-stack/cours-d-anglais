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
   lien de connexion (valable 3 jours) et fixe la date de validation
   (point de départ des 180 jours et des semaines). Un clic sur *Refuser*
   n'envoie rien à la personne.
3. **Connexion** — le lien ouvre `landing/membres/connexion.html`, qui
   connecte et redirige vers l'espace. Les fois suivantes, la personne
   indique son email sur cette même page et reçoit aussitôt un nouveau
   lien (valable 30 minutes), sans repasser par Aurélie. Une fois connectée,
   elle le reste 14 jours sur cet appareil : la page de connexion l'envoie
   alors directement dans son espace.
4. **Espace** — `landing/membres/espace.html`. Liste les modules,
   débloqués semaine par semaine à partir de **la date de validation du
   compte de cette personne** (calendrier individuel, pas une cohorte
   commune).

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

- Séance 1 : lecteur d'origine (lecture automatique à l'arrivée sur la
  diapositive, puis bouton de relecture). Nouveaux enregistrements sur
  les diapositives 02, 03, 05, 06, 08, 11 et 14 ; les diapositives 04 et
  10, sans nouvel enregistrement, gardent leur ancien son.
- Séances 2 et 3 : lecteur à bouton rond (anneau de progression), sur
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
  14 jours ou jusqu'à l'expiration du compte (180 jours), le plus court
  des deux l'emportant. Elle est vérifiée à chaque chargement de
  `espace.html` contre la feuille « Membres ».
- **Pas de limite de débit agressive** sur les demandes de code : un
  envoi par minute et par adresse, 5 essais par code. Suffisant contre un
  usage maladroit, pas conçu pour résister à une attaque déterminée — à
  surveiller si le nombre de membres grandit.
