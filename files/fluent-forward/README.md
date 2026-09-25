# Fluent & Forward — supports de cours

Supports de présentation du programme Business English Accelerator.

## Contenu

| Fichier | Rôle |
|---|---|
| `module1-seance1.html` | source unique — c'est le fichier qu'on modifie |
| `module1-seance1.pdf` | export, 15 slides 16:9 |
| `module1-seance2.html` | source unique, 16 slides 16:9 — pas encore de PDF exporté. « The 3 Pillars of Business English » (Clarity, Confidence, Connection). Récupéré après une session où le fichier n'avait pas été poussé sur le dépôt — voir la note en bas de fichier. |
| `module1-seance3.html` | source unique, 16 slides 16:9 — pas encore de PDF exporté. « Structuring Simple Professional Sentences ». Dernière séance du module 1 : contient l'exercice de la semaine (« Your 60-Second Business Introduction »). Module 1 complet. Même récupération que la séance 2. |
| `module2-seance1.html` | source unique, 9 slides 16:9 — pas encore de PDF exporté |
| `module2-seance2.html` | source unique, 11 slides 16:9 — pas encore de PDF exporté. Diapositive 9 (« Deux réflexes de plus ») reformulée : nouvelle remarque sur la variation des débuts de phrase, avec exemples (« What I do is… », « My role involves… », « Basically, I… »). La lettre isolée *I* n'est plus en italique — classe `.i-mark` (Plus Jakarta Sans 700, non italique) pour bien la distinguer visuellement. Récupéré après une session où le fichier n'avait pas été poussé sur le dépôt. |
| `module2-seance3.html` | source unique, 11 slides 16:9 — pas encore de PDF exporté. « Speaking Up — Responding Without Searching for Your Words ». Dernière séance du module 2 : contient l'exercice de la semaine (« Write 3 Emails — Real Situations »). Module 2 complet. Même récupération que les séances précédentes.
| `module3-seance1.html` | source unique, 8 slides 16:9 — pas encore de PDF exporté. Construit à partir du brief PDF fourni (script, points clés, exemples). |
| `module3-seance2.html` | source unique, 9 slides 16:9 — pas encore de PDF exporté. |
| `module3-seance3.html` | source unique, 8 slides 16:9 — pas encore de PDF exporté. |
| `module3-seance4.html` | source unique, 8 slides 16:9 — pas encore de PDF exporté. |
| `module3-seance5.html` | source unique, 12 slides 16:9 — pas encore de PDF exporté. Dernière séance du module 3 : contient aussi le récapitulatif du module et l'exercice de la semaine. |
| `module4-intro.html` | source unique, 4 slides 16:9 — pas encore de PDF exporté. Module 4 (« immersion complète », contenu tout en anglais à partir d'ici) : introduction courte, hors numérotation des séances (ex-`module4-seance1.html`, renommé). |
| `module4-seance1.html` | source unique, 13 slides 16:9 — pas encore de PDF exporté. Introduit le badge marron `.badge.marron` (`--marron:#6B4226`, la teinte « Entreprise » du site), réservé aux diapositives « Language Focus » (grammaire/vocabulaire). Ex-`module4-seance2.html`, décalé d'un cran. |
| `module4-seance2.html` | source unique, 13 slides 16:9 — pas encore de PDF exporté. Ex-`module4-seance3.html`, décalé d'un cran. |
| `module4-seance3.html` | source unique, 11 slides 16:9 — pas encore de PDF exporté. Dernière séance du module 4 : contient aussi le récapitulatif du module et la tâche de coaching (« Your 2-Minute Presentation — Recorded »). Module 4 complet, 3 séances + une intro. Ex-`module4-seance4.html`, décalé d'un cran. |
| `module5-seance1.html` | source unique, 5 slides 16:9 — pas encore de PDF exporté. Module 5 (« Networking like a pro ») : 4 séances au total selon le brief. |
| `module5-seance2.html` | source unique, 10 slides 16:9 — pas encore de PDF exporté. Ajoute la règle CSS `.col.on` (mise en valeur d'une colonne dans `.cols`, reprise du module 3 — manquante dans la lignée module 4/5 jusqu'ici, corrigée ici). |
| `module5-seance3.html` | source unique, 9 slides 16:9 — pas encore de PDF exporté. « LinkedIn in English » : les 4 éléments clés du profil, verbes d'action (Language Focus), messages de connexion, engagement avec le contenu, relance. |
| `module5-seance4.html` | source unique, 10 slides 16:9 — pas encore de PDF exporté. Dernière séance du module 5 : « Staying in the Flow » — 8 idiomes de networking sur 2 diapositives, stratégies pour les incompréhensions, survivre à un accent marqué, récapitulatif du module, tâche live (« Your Networking Toolkit »). Module 5 complet. |
| `module6-seance1.html` | source unique, 4 slides 16:9 — pas encore de PDF exporté. Module 6 (« Sales & Negotiation English ») : 4 séances au total selon le brief. Séance d'introduction courte, sur le même format que module4-intro/module5-seance1. |
| `module6-seance2.html` | source unique, 9 slides 16:9 — pas encore de PDF exporté. « The Sales Conversation » : les 5 étapes d'une vente, prospection (email + LinkedIn), Language Focus sur les réflexes de politesse français à ne pas traduire mot à mot, questions de découverte, présentation de l'offre. |
| `module6-seance3.html` | source unique, 7 slides 16:9 — pas encore de PDF exporté. « Handling Objections Like a Pro » : la méthode ACCA (Acknowledge/Clarify/Counter/Act), les 5 objections les plus courantes avec réponses mot à mot sur 2 diapositives, ce qu'il ne faut jamais faire face à une objection. |
| `module6-seance4.html` | source unique, 9 slides 16:9 — pas encore de PDF exporté. Dernière séance du module 6 : « The Art of Closing & Negotiating in English » — 4 techniques de closing, règles de négociation, expressions clés, sécuriser la relation après la vente, récapitulatif du module, tâche live (« Your Sales Script, Written & Recorded »). Module 6 complet — c'est le dernier module construit pour l'instant : il en reste 2, en attente du retour d'Aurélie. |

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

## Incident : module1-seance2/3 et module2-seance2/3 non poussés

Ces quatre fichiers avaient été construits dans une session antérieure
mais jamais commités sur ce dépôt — seul `module1-seance1.html` et
`module2-seance1.html` avaient été poussés. Ils n'existaient donc que
dans les fichiers livrés à l'utilisateur, pas dans Git. Récupérés à
partir d'une archive fournie par l'utilisateur et poussés ici. Réflexe
à garder : pousser chaque séance sur le dépôt dès sa construction, pas
seulement la livrer.
