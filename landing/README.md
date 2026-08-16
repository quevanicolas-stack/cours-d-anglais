# Landing page « Stop Avoiding - English Essentials »

Page de capture pour Fluent & Forward. Le visiteur renseigne **prénom et adresse
email**, ce qui débloque le **téléchargement immédiat** du guide en PDF. Chaque
contact est enregistré dans un fichier de sauvegarde avec des statistiques.

Structure et textes conformes au brief `consigne_landing_page.pdf` du 16 août.
Contenu du guide repris intégralement de
`Stop Avoiding - English Essentials (modifiable).pptx`.

## Contenu du dossier

```
landing/
├── index.html                La landing (5 sections du brief)
├── stop-avoiding.html        Le guide — source unique, sert à générer le PDF
├── prospects.html            Page interne : contacts de secours + export CSV
├── mentions-legales.html     Mentions légales (à compléter)
├── assets/
│   ├── style.css
│   ├── script.js             Verrou du formulaire + téléchargement + collecte
│   ├── favicon.svg
│   ├── aurelie.jpg           Photo issue du brief
│   └── stop-avoiding-english-essentials.pdf   Le fichier remis au prospect
└── collecte/
    ├── LISEZMOI.md           Comment mettre en place le fichier de sauvegarde
    ├── enregistrer.php       Collecteur pour hébergement PHP → CSV + JSON
    └── apps-script.gs        Collecteur pour hébergement statique → Google Sheets
```

## Consulter

```
python3 -m http.server 8000 --directory landing
```

## Les 5 sections

| Section | Contenu |
| --- | --- |
| 1 — Hero | Le chiffre 78 % / 43 %, le sous-titre, prénom + email, bouton, ligne de réassurance |
| 2 — Dans le guide | Les 4 promesses du guide |
| 3 — Qui je suis | « Pourquoi m'écouter ? », bio d'Aurélie, photo |
| 4 — Deuxième appel à l'action | Formulaire identique au hero |
| 5 — Teasing | Business English Accelerator, prochaine cohorte |

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

## Brancher la collecte — à faire avant la mise en ligne

Une seule ligne à renseigner dans `assets/script.js` :

```js
collecteur: ""   // ← l'adresse du collecteur
```

Deux options, détaillées dans `collecte/LISEZMOI.md` :

- **hébergement PHP** → `enregistrer.php` crée `prospects.csv` et `statistiques.json` ;
- **hébergement statique** (GitHub Pages, Netlify) → `apps-script.gs` remplit une
  feuille Google Sheets avec un onglet Prospects et un onglet Statistiques.

Tant que rien n'est branché, le guide se télécharge quand même et le contact est
conservé dans le navigateur du visiteur. **Ce n'est pas de la collecte** : ces
contacts restent chez lui. `prospects.html` ne montre que ce qui a été saisi sur
votre propre navigateur, et sert aux tests.

## Points à trancher

| Point | Détail |
| --- | --- |
| **Date de cohorte** | Le brief indique le **14 septembre**, le pptx le **10 septembre**. La landing affiche le 14 en surligné doré, en attente d'arbitrage. Les deux documents doivent s'accorder. |
| **Chiffres 78 % / 43 %** | Aucune source n'est citée dans le brief. Une statistique affichée en titre doit pouvoir être sourcée si on la conteste. |
| **Nom du guide** | Le brief l'appelle « Stop Avoiding - English Essentials » mais donne l'URL `…GuideStopAvoidingBusinessEssentials`. |
| **Lien Systeme.io** | La dernière page du guide contient un bouton « Je réserve ma place » dont le lien reste à renseigner. |
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
