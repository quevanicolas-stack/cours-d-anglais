# Site Fluent & Forward

Coaching d'anglais professionnel d'Aurélie Queva : Coaching 1:1, Business
Accelerator, et volet entreprise. Domaine visé : `fluentandforward.com`
(hébergement Cloudflare Pages, projet `fluentandforward`).

**Ce fichier documente la structure telle qu'elle est aujourd'hui.** Une
version bien plus ancienne et beaucoup plus simple (une seule page de
capture pour un guide PDF) a longtemps vécu ici — elle a depuis été
entièrement remplacée par le site multi-pages ci-dessous.

## Contenu du dossier

**`landing/` est publié tel quel : tout ce qui s'y trouve est accessible en
ligne.** La documentation reste dans `docs/`, hors du dossier servi.

```
source/                       ← jamais publié, fabrique landing/index.html
├── maquette.tpl.html         Le modèle : c'est ici qu'on modifie le site
├── data-uris.json            Images encodées, embarquées dans la page
├── construire.py             Remplace les marqueurs, écrit landing/index.html
└── LISEZMOI.md               Détail du fonctionnement et des réglages

landing/                      ← publié
├── index.html                Page d'accueil (généré depuis source/, ne pas éditer à la main)
├── faq.html                  Foire aux questions
├── mentions-legales.html
├── politique-confidentialite.html
├── robots.txt / sitemap.xml
├── _headers                  En-têtes de sécurité (CSP, etc.), lus au déploiement
├── _redirects                Redirections Cloudflare Pages
├── guide/                    Page de capture du guide gratuit + PDF
├── parcours-7f2q.html        Ancien tableau de bord interne (parcours visiteurs), superseded
├── suiviparcours/            Lien court vers le tableau de bord live (Apps Script)
└── assets/                   Polices locales, images, scripts

docs/                         ← jamais publié
├── README.md                 Ce fichier
├── DEPLOIEMENT.md            Mise en ligne (toujours valable : repo, branche, dossier landing)
├── TRANSFERT.md              Passage du projet sur les comptes d'Aurélie
└── collecte/                 Ancienne doc de collecte — voir avertissement ci-dessous
```

## Reconstruire le site

```
python3 source/construire.py
```

Le script s'arrête net si un marqueur n'a pas été remplacé. Voir
`source/LISEZMOI.md` pour le détail des réglages (prix, dates, liens, clé
Turnstile…).

## La collecte et le suivi — ATTENTION, ne correspond plus à `docs/collecte/`

Le site utilise aujourd'hui un **unique projet Google Apps Script** (côté
Google, pas dans ce dépôt) qui sert plusieurs rôles à la fois :

- publier les sessions disponibles (lues depuis l'onglet « Sessions » du
  classeur Google Sheets d'Aurélie) ;
- recevoir les inscriptions et redémarrer vers les liens de paiement Stripe ;
- enregistrer chaque étape du parcours visiteur (onglet « Parcours ») pour
  le tableau de bord ;
- servir le tableau de bord lui-même en HTML (`?vue=tableau`), accessible
  via le lien court `landing/suiviparcours/`.

Le fichier `docs/collecte/apps-script.gs` est l'**ancienne** version
(simple collecteur PHP/Sheets pour la landing de capture d'origine) : il ne
reflète plus le fonctionnement actuel et ne doit pas servir de référence. Le
code Apps Script réel n'est pas versionné dans ce dépôt — il vit uniquement
dans le projet Apps Script lié au classeur « Prospects Fluent & Forward ».
Si une copie de sauvegarde du script actuel est utile, la coller dans un
nouveau fichier ici plutôt que d'écraser `apps-script.gs`.

## Mise en ligne

Voir `docs/DEPLOIEMENT.md` — toujours à jour : dépôt `cours-d-anglais`,
branche `main`, dossier de construction `landing`, projet Cloudflare Pages
`fluentandforward`.
