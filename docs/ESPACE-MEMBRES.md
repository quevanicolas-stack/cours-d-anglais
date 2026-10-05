# Espace membres

Accès aux modules du Business English Accelerator, réservé aux personnes
dont le compte a été validé par Aurélie. Pas de mot de passe stocké : une
connexion se fait avec un code à usage unique envoyé par email (OTP),
régénéré à chaque fois.

## Parcours

1. **Demande** — `landing/membres/inscription.html`. La personne indique
   son prénom et son email. La demande est enregistrée dans l'onglet
   « Membres » du classeur, et Aurélie reçoit un email avec deux liens :
   *Valider* / *Refuser*.
2. **Décision d'Aurélie** — un clic sur *Valider* déclenche l'envoi du
   premier code de connexion par email, et fixe la date de validation
   (point de départ du calcul des 180 jours et des semaines). Un clic sur
   *Refuser* ne déclenche aucun email vers la personne.
3. **Connexion** — `landing/membres/connexion.html`. Email, puis code à
   6 chiffres reçu par email (valable 10 minutes, usage unique). Les
   connexions suivantes n'ont plus besoin d'Aurélie : un nouveau code est
   renvoyé à chaque fois.
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
- Le module 1 (séances 1 à 3) publié dans `landing/membres/cours/`, et
  l'onglet « Programme » doit contenir une ligne semaine 1 pointant
  dessus (détail exact dans le fichier `.gs`).

**Tant que le script n'est pas ajouté côté Google, les trois pages
affichent une erreur réseau** — c'est attendu, il n'y a rien à corriger
dans le code pour ça.

## Narration audio des séances 2 et 3

Les fichiers reçus intègrent le lecteur de narration (bouton rond en haut
à droite, anneau de progression) mais **aucun fichier audio n'est encore
fourni** : les diapositives 03, 07, 11 et 14 attendent des fichiers dans
un dossier `audio/` à côté du HTML (`page-03-partie-1.mp3`, etc. — noms
exacts dans les attributs `data-audio` de chaque diapositive). Sans ces
fichiers, le bouton s'affiche mais n'a rien à lire. À fournir
séparément : les diapositives concernées et les durées attendues sont
déjà posées dans le HTML (`data-durs`).

## Ajouter un futur module

1. Publier ses fichiers HTML dans `landing/membres/cours/` (commit + push
   — c'est la seule étape qui touche au code).
2. Ajouter une ligne dans l'onglet « Programme » du classeur : numéro de
   semaine, titre, noms de fichiers séparés par des virgules. **Aucun
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
