# Espace membres

Accès aux modules du Business English Accelerator, réservé aux personnes
dont le compte a été validé par Aurélie. Pas de mot de passe ni de code
à recopier : on se connecte en cliquant sur un lien reçu par email.

Tout tourne sur Cloudflare Pages, avec le site : le code serveur est dans
`functions/` (exécuté par Cloudflare à chaque requête), les membres dans
une base Cloudflare D1, et les emails partent du serveur d'envoi de la
boîte contact@fluentandforward.com chez LWS. Les autres formulaires du
site (guide, test de niveau, inscriptions, sessions, parcours) restent sur
Google Apps Script, inchangés.

## Parcours

1. **Demande** — `landing/membres/inscription.html`. La personne indique
   son prénom et son email. Aurélie reçoit un email avec deux boutons :
   *Valider* / *Refuser*. Chacun ouvre une page de confirmation : un
   antivirus qui parcourt les liens d'un email ne peut rien décider à sa
   place.
2. **Validation** — la personne reçoit un lien de connexion. La date de
   validation lance les 180 jours d'accès et le calendrier des semaines.
3. **Connexion** — `landing/membres/connexion.html`. La personne indique
   son email et reçoit aussitôt un lien, sans repasser par Aurélie. La
   page affiche un cercle de chargement et se connecte d'elle-même dès que
   le lien est ouvert, où que ce soit (application mail, téléphone, autre
   onglet). L'attente est mémorisée : on la retrouve en revenant sur la
   page.
   - Un lien vaut 24 heures et peut être rouvert pendant ce temps ; en
     redemander un ne périme pas les précédents.
   - La connexion tient dans un cookie sécurisé (`HttpOnly`), un par
     appareil, jusqu'à la fin des 180 jours. Seuls « Se déconnecter », la
     fin de l'accès ou une révocation par Aurélie déconnectent.
4. **Espace** — `landing/membres/espace.html` : écran d'accueil, menu des
   modules (disponibles ou verrouillés selon la semaine), puis détail d'un
   module (séances, ressources).

## Verrou des cours

`functions/membres/cours/_middleware.js` s'exécute avant chaque fichier
de `landing/membres/cours/` : sans connexion, une séance renvoie vers la
page de connexion et un audio est refusé ; une séance d'une semaine pas
encore atteinte renvoie vers l'espace. Le verrou est réel, contrairement
à l'ancien système où il suffisait de connaître l'adresse d'un fichier.

## Administration (Aurélie)

`landing/membres/admin.html`, accessible depuis le lien « Administration »
de l'espace quand on est connecté avec une adresse de `ADMIN_EMAILS`
(contact@fluentandforward.com par défaut). Aurélie se connecte comme un
membre : son compte est ouvert automatiquement.

- Liste des membres : demandes en attente, comptes actifs, expirés,
  refusés ou révoqués, nombre d'appareils connectés.
- Actions : valider, refuser, prolonger de 180 jours, révoquer
  (déconnecte aussitôt tous les appareils), ajouter un membre directement.
- Journal des derniers emails, avec l'erreur exacte si un envoi échoue.

## Programme et publication des supports

Le programme est dans `membres-serveur/programme.json` : une entrée par
semaine, avec ses supports dans l'ordre d'affichage. C'est ce fichier qui
décide de ce que voit chaque membre et de ce que le verrou laisse passer.

Les copies servies aux membres (`landing/membres/cours/`) se fabriquent,
elles ne se modifient pas à la main :

    python3 source/publier_cours.py

Le script lit le programme, repart des sources de `files/fluent-forward/`
et les adapte au site : polices du site au lieu de Google Fonts, vidéos
intégrées sorties en fichiers (`video/`), bouton « retour à mon espace »
dans la barre des séances, copie des audios.

**Ajouter un module** : ajouter son entrée dans `programme.json`, lancer
le script, commit + push. Le module apparaît verrouillé dans le menu
jusqu'à sa semaine.

## Narration audio

Les audios sont rangés par séance dans `files/fluent-forward/audio/`
(`module1-seance1/`, `module1-seance2/`, …). Les trois séances du
module 1 ont le même lecteur à bouton rond (lecture, pause, relecture,
anneau de progression), sur les diapositives indiquées par leurs
attributs `data-audio`.

## Mise en route dans Cloudflare (une seule fois)

La liaison à la base et les réglages non secrets sont déclarés dans
`wrangler.jsonc`, à la racine du dépôt : ce fichier fait foi pour le
projet Pages `fluentandforward`, ils ne se modifient plus dans le tableau
de bord. Reste à faire dans Cloudflare :

1. **Créer les tables** — Storage & databases → D1 SQL database →
   `fluentandforward-membres` → *Console* : coller tout le contenu de
   `migrations/0001_espace_membres.sql`, exécuter.
2. **Mot de passe de la boîte mail** — Workers & Pages → projet Pages
   `fluentandforward` → Settings → Variables and Secrets : ajouter
   `SMTP_MOT_DE_PASSE`, type **Secret**, en Production et en Preview.
3. **Redéployer** — Deployments → *Retry deployment*.

Le serveur d'envoi (`SMTP_HOTE` dans `wrangler.jsonc`) est
`mail77.lwspanel.com`, port 465 (SSL) : c'est le nom propre du serveur
LWS de la boîte contact@, celui que couvre son certificat (l'alias
`mail.fluentandforward.com` risque d'être refusé par la vérification de
certificat de Cloudflare). Si LWS déplace la boîte, reprendre le nom
indiqué dans son panneau, rubrique « Serveur sortant ». Si un email ne part pas, la page
d'administration affiche l'erreur exacte. « certificat » : mettre dans
`SMTP_HOTE` le nom de serveur que LWS indique dans son panneau (celui que
couvre son certificat). « mot de passe refusé » : vérifier le secret.

**Ancien projet Workers** : le dépôt était aussi déployé par un projet
*Workers* `fluentandforward` (vestige du premier déploiement, adresse en
`.workers.dev`). `wrangler.jsonc` étant désormais une configuration Pages,
ses constructions échouent : c'est attendu. Le supprimer (Workers & Pages
→ le projet Workers → Settings → Delete) ; il servait d'ailleurs les cours
sans verrou.

## Tester en local

    cp -r landing functions membres-serveur migrations wrangler.jsonc /tmp/essai/
    # dans /tmp/essai : remplacer les variables SMTP par celles d'un faux
    # serveur local (SMTP_SECURITE = "aucune"), puis
    npx wrangler d1 execute fluentandforward-membres --local --file migrations/0001_espace_membres.sql
    npx wrangler pages dev

Avec `SMTP_SECURITE = "aucune"`, les emails peuvent être reçus par un
faux serveur local (par exemple `aiosmtpd`).

## Limites, en toute franchise

- **La connexion tient dans un cookie, par appareil** : quelqu'un qui a
  accès à l'appareil a accès à l'espace. « Se déconnecter » efface le
  cookie et la session côté serveur.
- **Un lien n'est pas lié à un appareil** : qui reçoit l'email peut
  l'ouvrir n'importe où pendant 24 heures. C'est le principe de la
  connexion par email.
- **Limite d'envoi** : un lien toutes les 30 secondes par adresse, pas de
  limite par adresse IP. Suffisant à l'échelle actuelle.
