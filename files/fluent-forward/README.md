# Fluent & Forward — supports de cours

Supports de présentation du programme Business English Accelerator.

## Contenu

| Fichier | Rôle |
|---|---|
| `module1-seance1.html` | source unique — c'est le fichier qu'on modifie |
| `module1-seance1.pdf` | export, 15 slides 16:9 |
| `module2-seance1.html` | source unique, 9 slides 16:9 — pas encore de PDF exporté |
| `module3-seance1.html` | source unique, 8 slides 16:9 — pas encore de PDF exporté. Construit à partir du brief PDF fourni (script, points clés, exemples). |
| `module3-seance2.html` | source unique, 9 slides 16:9 — pas encore de PDF exporté. Le module 3 a 5 séances de contenu au total ; les séances 3 à 5 restent à construire. |

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
- `module1-seance1.html` est au format présentation plein écran : une
  seule diapositive visible à la fois (classe `active`), navigation par
  les flèches `#prevBtn`/`#nextBtn`, au clavier ou au doigt. C'est ce
  format-là qui fait référence, à ne pas remplacer par la version à
  simple défilement.

## Narration audio (module1-seance1.html)

Sept diapositives (02, 03, 04, 08, 10, 11, 14) portent une narration :
balises `<audio class="voix">` embarquées en base64 (aucun fichier
externe), lues automatiquement au premier passage sur la diapositive.
Le déclenchement observe la classe `active` posée par le script de
navigation (`MutationObserver`, dans un second `<script>` séparé du
premier pour ne rien risquer d'y casser) plutôt que le défilement, pour
rester valable quel que soit le moyen de navigation utilisé. La
diapositive 08 enchaîne quatre extraits à la suite.

Le bouton rond `.rejouer` (en haut à droite, au-dessus du badge)
n'apparaît qu'à la fin de la lecture — la première fois naturellement,
ou tout de suite si le navigateur a refusé la lecture automatique
(cas fréquent tant qu'aucun geste n'a eu lieu sur la page). Un clic
relance la narration depuis le début.

Pour ajouter ou remplacer une narration : convertir le fichier audio
en MP3 mono (`ffmpeg -i source.wav -codec:a libmp3lame -b:a 96k -ac 1
sortie.mp3` suffit très largement pour de la voix), l'encoder en
base64 (`base64 -w0 sortie.mp3`), et coller le résultat dans l'attribut
`src` d'un `<audio class="voix"><source src="data:audio/mpeg;base64,…">`
placé juste après `<header class="chrome">` de la diapositive visée.
