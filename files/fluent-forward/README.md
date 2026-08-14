# Fluent & Forward — supports de cours

Supports de présentation du programme Business English Accelerator.

## Contenu

| Fichier | Rôle |
|---|---|
| `module1-seance1.html` | source unique — c'est le fichier qu'on modifie |
| `module1-seance1.pdf` | export, 15 slides 16:9 |

## Règle de travail

Le HTML est la source. Le PDF en est l'export : on ne le modifie jamais
directement, on le regénère.

Regénérer le PDF : ouvrir le HTML dans Chrome, `Ctrl/Cmd + P`, destination
« Enregistrer au format PDF », marges « Aucune », cocher « Graphiques
d'arrière-plan ».

## Récupération en début de session

```
curl https://raw.githubusercontent.com/quevanicolas-stack/NOM_DU_DEPOT/main/module1-seance1.html
```

## Repères dans le fichier

- Couleurs : bloc `:root` en haut du CSS
- Un slide = une balise `<section class="slide">`, classe `dark` pour fond vert
- Numérotation des slides : automatique
- Emplacements vidéo : `<div class="media">` sur les slides 02 et 09
