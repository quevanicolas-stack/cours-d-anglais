# Landing page « Stop Avoiding - English Essentials »

Page de capture pour Fluent & Forward. Le visiteur renseigne **prénom et adresse
email**, ce qui débloque le **téléchargement immédiat** du guide en PDF. Chaque
contact est enregistré dans un fichier de sauvegarde avec des statistiques.

Structure et textes conformes au brief `consigne_landing_page.pdf` du 16 août.
Contenu du guide repris intégralement de
`Stop Avoiding - English Essentials (modifiable).pptx`.

## Contenu du dossier

**`landing/` est publié tel quel : tout ce qui s'y trouve est accessible en
ligne.** La documentation et les collecteurs vivent donc dans `docs/`, hors du
dossier servi.

```
landing/                      ← publié
├── index.html                La landing (5 sections du brief)
├── stop-avoiding.html        Le guide — source unique, sert à générer le PDF
├── prospects.html            Page interne : contacts de secours + export CSV
├── mentions-legales.html     Mentions légales (à compléter)
├── _headers                  En-têtes de sécurité, lu au déploiement
└── assets/
    ├── style.css
    ├── script.js             Verrou du formulaire + téléchargement + collecte
    ├── prospects.js          Script de la page interne
    ├── favicon.svg
    ├── aurelie.jpg           Photo issue du brief
    └── stop-avoiding-english-essentials.pdf   Le fichier remis au prospect

docs/                         ← jamais publié
├── README.md                 Ce fichier
├── DEPLOIEMENT.md            Mise en ligne
├── TRANSFERT.md              Passage du projet sur les comptes d'Aurélie
└── collecte/
    ├── LISEZMOI.md           Comment mettre en place le fichier de sauvegarde
    ├── enregistrer.php       Collecteur pour hébergement PHP → CSV + JSON
    └── apps-script.gs        Collecteur pour hébergement statique → Google Sheets
```

## Consulter

```
python3 -m http.server 8000 --directory landing
```

## Mettre en ligne

Voir `docs/DEPLOIEMENT.md` : hébergement gratuit sur Cloudflare Pages, adresse
`https://fluentandforward.pages.dev`, en-têtes de sécurité via `_headers`.
Le collecteur doit alors être branché sur Google Apps Script — Cloudflare
Pages n'exécute pas de PHP.

## Les 5 sections

| Section | Contenu |
| --- | --- |
| 1 — Hero | Les deux statistiques en blocs distincts sur toute la largeur, le sous-titre, prénom + email, les trois consentements, bouton, ligne de réassurance |
| 2 — Dans le guide | Les 4 promesses du guide |
| 3 — Qui je suis | « Pourquoi m'écouter ? », bio d'Aurélie, photo |
| 4 — Deuxième appel à l'action | Formulaire identique au hero |
| 5 — Teasing | Business English Accelerator, cohorte du 14 septembre, bouton WhatsApp « Contactez-moi » |

Le guide se termine sur un bouton « Je réserve ma place » qui ouvre lui aussi
WhatsApp, avec un message de réservation. Le lien Systeme.io prévu dans le pptx
d'origine n'a plus lieu d'être.

## Le guide

`stop-avoiding.html` reprend les 7 slides du pptx, sans rien retirer ni ajouter :
couverture, « Ce n'est pas ton anglais, le problème », les 5 phrases de survie,
répondre sans paniquer, le mini-script de prise de contact, les 3 réflexes, et la
page « Et maintenant ? ».

**Régénérer le PDF après toute modification du HTML :**

```
python3 -m http.server 8000 --directory landing &
node -e "const{chromium}=require('playwright');(async()=>{
  const b=await chromium.launch();const p=await b.newPage();
  await p.goto('http://localhost:8000/stop-avoiding.html',{waitUntil:'networkidle'});
  await p.pdf({path:'landing/assets/stop-avoiding-english-essentials.pdf',
    format:'A4',printBackground:true,margin:{top:0,right:0,bottom:0,left:0}});
  await b.close();})()"
```

Ou à la main : ouvrir le HTML dans Chrome, `Ctrl/Cmd + P`, A4, marges « Aucune »,
« Graphiques d'arrière-plan » coché.

## La collecte — branchée

Le formulaire envoie chaque contact à un script Google Apps Script, qui remplit
une feuille Google Sheets privée : un onglet **Prospects** (une ligne par
demande, avec les trois consentements) et un onglet **Statistiques**, recalculé
à chaque envoi.

L'adresse du collecteur est renseignée dans `landing/assets/script.js` :

```js
collecteur: "https://script.google.com/macros/s/…/exec"
```

Le code du script est dans `docs/collecte/apps-script.gs`, la mise en place dans
`docs/collecte/LISEZMOI.md`. Ouvrir l'adresse `/exec` dans un navigateur affiche
le nombre de contacts enregistrés : c'est le moyen le plus rapide de vérifier que
le collecteur répond.

**Changer le code du script impose de redéployer** : dans Apps Script, *Déployer
→ Gérer les déploiements → crayon → Version : nouvelle version*. Modifier le code
sans redéployer ne change rien à ce que reçoit la landing. Tant que l'adresse
`/exec` reste la même, il n'y a rien à modifier ici.

Une variante PHP existe aussi (`docs/collecte/enregistrer.php`), pour un
hébergement mutualisé classique. Elle n'est pas utilisée aujourd'hui.

En secours, chaque contact est également conservé dans le navigateur du visiteur,
au cas où le collecteur serait injoignable. **Ce n'est pas de la collecte** : ces
copies restent chez lui. `prospects.html` ne montre que ce qui a été saisi sur
votre propre navigateur, et sert aux tests — la source de vérité est le tableur.

## Les trois consentements

Le formulaire recueille trois accords séparés, tous enregistrés avec le contact :

| Case | Statut | Effet |
| --- | --- | --- |
| Conservation des données pour la remise du guide | **Obligatoire** | Sans elle, le téléchargement est bloqué |
| Réception d'informations commerciales (prospection) | Facultatif | Enregistré en `oui`/`non` |
| Demande à être recontacté par Aurélie | Facultatif | Enregistré en `oui`/`non` |

Seule la première est bloquante : le RGPD interdit de conditionner la remise d'un
contenu à l'acceptation de la prospection. Les deux autres sont tracées
séparément dans le fichier de sauvegarde — c'est ce qui fait preuve en cas de
contrôle. Les statistiques comptent les acceptations de prospection et les
demandes de rappel.

## Contact WhatsApp

Le numéro d'Aurélie ne figure **que dans l'attribut `href` des boutons**, dans
`landing/index.html` et `landing/stop-avoiding.html`. Il n'est écrit en clair
nulle part, ni sur les pages, ni dans cette documentation.

Deux boutons ouvrent WhatsApp avec un message pré-rempli, prêt à envoyer depuis
le compte du visiteur :

- **« Contactez-moi »**, section 5 de la landing — message de prise de contact ;
- **« Je réserve ma place »**, dernière page du guide, donc aussi dans le PDF —
  message de réservation pour la cohorte.

Le numéro **n'est écrit en clair nulle part** : ni sur la landing, ni dans le
guide. Il ne figure que dans l'adresse du lien.

Les liens utilisent le schéma **`whatsapp://send?phone=…&text=…`**, qui bascule
directement dans l'application. L'adresse `https://wa.me/…` affichait une page
de redirection intermédiaire ; elle ne sert plus que de secours.

Sur la landing, ce secours est automatique : `assets/script.js` détecte que
l'application ne s'est pas ouverte au bout de 1,4 seconde et bascule alors sur
`wa.me`. L'adresse de repli est portée par l'attribut `data-repli` du bouton.

Dans le PDF, aucun script n'est possible : il n'y a donc pas de repli
automatique. Un lecteur PDF qui refuse d'ouvrir un lien hors `http` ne fera
rien au clic. C'est la contrepartie assumée de ne pas afficher le numéro.

Pour changer le numéro ou le message : ouvrir `landing/index.html` et
`landing/stop-avoiding.html`, modifier le paramètre `phone=` des liens
`whatsapp://` (et `data-repli` sur la landing), puis régénérer le PDF.

## Points à trancher

| Point | Détail |
| --- | --- |
| **Chiffres 78 % / 43 %** | Aucune source n'est citée dans le brief. Une statistique affichée en titre doit pouvoir être sourcée si on la conteste. |
| **Nom du guide** | Le brief l'appelle « Stop Avoiding - English Essentials » mais donne l'URL `…GuideStopAvoidingBusinessEssentials`. |
| **Photo** | Celle du brief. À confirmer qu'il s'agit bien d'une photo d'Aurélie et que les droits sont acquis, puisqu'elle illustre la fondatrice. |
| **Mentions légales** | Éditeur, hébergeur et prestataire de collecte restent à compléter. |
| **Ligne de réassurance** | Le brief disait « Reçu directement dans ta boîte mail en moins de 2 minutes ». Le mécanisme étant devenu un téléchargement direct, elle a été adaptée en « Téléchargement immédiat, dès que tes coordonnées sont renseignées ». |

## URL cible

Le brief demande : `FluentandForward_GuideStopAvoidingBusinessEssentials`.
Le dossier est publiable tel quel ; c'est le chemin d'hébergement qui porte ce nom.

## Conventions

- Tutoiement, conformément au brief.
- Charte identique aux slides : crème `#FAF7F2`, encre `#2C1810`, vert `#1B6B4A`,
  or `#C9A96E`.
- Polices DM Sans et Plus Jakarta Sans, avec repli système.
- Aucun framework, aucune dépendance externe hors polices.
