# Landing page « Stop Avoiding »

Page de capture d'emails pour Fluent & Forward — Business English Accelerator.
Le visiteur laisse prénom et email, reçoit en échange le guide « Stop Avoiding ».

## Contenu du dossier

```
landing/
├── index.html            La landing page
├── stop-avoiding.html    Le guide — source unique, à exporter en PDF
├── mentions-legales.html Mentions légales (à compléter)
└── assets/
    ├── style.css         Charte reprise du support de cours
    └── script.js         Validation du formulaire + branchement du service d'emails
```

## Consulter

```
python3 -m http.server 8000 --directory landing
```

puis `http://localhost:8000`.

## Le guide « Stop Avoiding »

Onze pages A4, construites à partir du Module 1 (séances 1 à 3) :

1. Couverture
2. Pourquoi vous évitez — la boucle longue et ses quatre étapes
3. La règle — School English contre Business English
4. Situations 1 à 4 — demander, contredire, annoncer une mauvaise nouvelle, avouer qu'on n'a pas compris
5. Situations 5 à 8 — prendre la parole, proposer, refuser, demander un délai
6. Situations 9 à 12 — relancer, remercier, reprendre la parole, se présenter
7. Citation — *Clarity beats vocabulary*
8. Bonus — les 6 faux-amis structurels
9. Bonus — le rituel de 2 minutes
10. Bonus — les 3 questions de contrôle
11. La suite — le programme

Sept des douze situations et l'intégralité des faux-amis viennent des supports
existants. Les cinq situations ajoutées (04, 05, 07, 08, 11) traitent
spécifiquement de l'évitement, qui est l'angle du guide.

### Régénérer le PDF

Même convention que les supports de cours : **le HTML est la source, le PDF en est
l'export.** Ouvrir `stop-avoiding.html` dans Chrome, `Ctrl/Cmd + P`, destination
« Enregistrer au format PDF », format A4, marges « Aucune », cocher « Graphiques
d'arrière-plan ».

Le PDF obtenu est le fichier à envoyer aux inscrits.

## Brancher la collecte d'emails

Le formulaire valide les champs mais **n'envoie rien pour l'instant** : il affiche
un message le signalant. Tout se règle dans un bloc unique en haut de
`assets/script.js` :

```js
var SERVICE = {
  fournisseur: "aucun",   // passer à "endpoint" une fois l'URL renseignée
  endpoint: "",           // URL fournie par le service
  methode: "POST",
  format: "json",         // "json" ou "form" selon le service
  champs: { prenom: "prenom", email: "email" }
};
```

Aucune autre ligne n'est à modifier. Exemples d'`endpoint` :

| Service | Endpoint | Format |
| --- | --- | --- |
| Formspree | `https://formspree.io/f/xxxxxxxx` | `json` |
| Web3Forms | `https://api.web3forms.com/submit` | `json` |
| Brevo | URL du formulaire double opt-in généré | `form` |
| ConvertKit | `https://api.convertkit.com/v3/forms/ID/subscribe` | `json` |

**L'envoi automatique du guide se règle dans le service lui-même**, pas dans le
code : email de bienvenue contenant le PDF en pièce jointe ou en lien de
téléchargement.

Si `champs` doit changer de noms (certains services imposent `first_name`,
`email_address`…), il suffit de modifier la partie droite de chaque paire.

## Informations à confirmer avant la mise en ligne

Surlignées en doré sur la page, repérables par la classe `a-confirmer` :

```
grep -rn "a-confirmer" landing/
```

| Information | Où |
| --- | --- |
| Rythme hebdomadaire (nombre de lives, durée) | `index.html`, encart programme |
| Nombre de séances individuelles incluses | `index.html`, encart programme |
| Date de la prochaine cohorte | `index.html`, encart programme |
| Nombre de places | `index.html`, encart programme |
| Tarif | `index.html`, encart programme |
| Fréquence réelle des emails envoyés | `index.html`, questions fréquentes |
| Financement (CPF, OPCO) | `index.html`, questions fréquentes |
| Éditeur, hébergeur, prestataire d'emailing | `mentions-legales.html` |

### Points de vigilance

- **Financement.** Ne mentionner CPF ou OPCO que si l'activité est déclarée en
  organisme de formation — et Qualiopi pour le CPF. Sinon, supprimer la question.
- **Nombre de pages annoncé.** La page promet un guide de 11 pages : si le guide
  est modifié, mettre les deux en accord.
- **Témoignages.** Il n'y en a volontairement aucun : mieux vaut aucune preuve
  sociale qu'une preuve sociale inventée. À ajouter dès que de vrais retours
  d'apprenants sont disponibles, ce qui augmentera nettement la conversion.

## Conventions

- Contenus, libellés et commentaires de code en français ; les phrases d'exemple
  restent en anglais, c'est le sujet.
- Charte identique au support de cours (bloc `:root` de `module1-seance1.html`) :
  crème `#FAF7F2`, encre `#2C1810`, vert `#1B6B4A`, or `#C9A96E`.
- Polices DM Sans et Plus Jakarta Sans, chargées depuis Google Fonts comme dans
  les supports, avec une pile de repli système si le réseau est indisponible.
- Aucune autre dépendance externe, aucun framework.
