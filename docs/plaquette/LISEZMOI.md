# Plaquettes immersives — comparatif de deux pistes

Deux versions **complètes et prêtes à l'emploi** de la page, même contenu, mêmes
animations, seuls les fonds changent :

- **Piste A — fonds codés** : décors dessinés en CSS/Canvas. Légers, adaptatifs
  (aucune image à charger, s'ajustent à tout écran), plus sobres.
- **Piste B — fonds images** : les visuels de ChatGPT (`docs/fonds/`). Plus
  riches, mais figés — compositions 16:9 à recadrer sur mobile, et plus lourds.

Les deux partagent : le contenu réel d'Aurélie, la bande d'appel, le menu à
droite, le calendrier, les 8 modules, l'espace membres, la fenêtre de rentrée,
les apparitions au défilement et le recul des fonds.

## Fichiers

```
docs/plaquette/
├── plaquette.css   Styles communs (contenu sur fond sombre, panneaux « verre »,
│                   apparitions, calendrier/modules/formulaires en version sombre)
├── fonds.css       Les fonds : recul commun, décors codés, voiles des images
├── moteur.js       Recul, poussière, apparitions, menu, bande, fenêtre, email
└── build.py        Assemble les deux plaquettes autonomes
```

## Régénérer

```
python3 docs/plaquette/build.py
```

Le script lit le contenu, les scripts du site (`site/assets/*`) et les fonds
(`docs/fonds/` via le JSON de data-URI du scratchpad), et écrit
`plaquette-codee.html` et `plaquette-images.html`. Les deux fichiers sont
autonomes (images en data-URI) : lourds, faits pour la comparaison, pas pour la
mise en ligne telle quelle.

## Une fois la piste choisie

Le gagnant sera intégré au vrai site (`site/index.html`), avec les images
servies comme fichiers séparés (pas en data-URI) et une version mobile des fonds.
Les strates et le tunnel devront être régénérés en pleine résolution d'abord
(voir `docs/fonds/LISEZMOI.md`).
