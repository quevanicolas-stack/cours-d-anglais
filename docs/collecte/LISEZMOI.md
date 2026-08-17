# Collecte des prospects et fichier de sauvegarde

Le formulaire de la landing enregistre chaque contact, puis déclenche le
téléchargement du guide. Ce dossier contient les deux façons de constituer le
fichier de sauvegarde ; il faut en choisir **une**.

## Ce qui est enregistré

| Champ | Contenu |
| --- | --- |
| `date` | Horodatage de la demande |
| `prenom` | Prénom saisi |
| `email` | Adresse email saisie |
| `consentement_rgpd` | Toujours `oui` : une demande sans cet accord est refusée |
| `accepte_prospection` | `oui` / `non` — accord pour les informations commerciales |
| `demande_rappel` | `oui` / `non` — le prospect demande à être recontacté |
| `origine` | `hero` ou `bas-de-page`, selon le formulaire utilisé |
| `provenance` | Page depuis laquelle le visiteur est arrivé (`direct` si aucune) |

Statistiques calculées automatiquement : nombre de téléchargements, adresses
uniques, acceptations de prospection, demandes de rappel, répartition par jour
et par formulaire.

Les trois consentements sont conservés séparément : c'est ce qui permet de
prouver, contact par contact, ce qui a été accepté et ce qui ne l'a pas été.
Une personne qui n'a pas coché la prospection ne doit recevoir que le guide.

## Option A — Hébergement qui exécute PHP

À retenir si le site est hébergé chez OVH, o2switch, Ionos, Hostinger, LWS ou
équivalent. C'est l'option qui produit un vrai fichier de sauvegarde sur le
serveur.

1. Déposer `enregistrer.php` sur l'hébergement, par exemple dans
   `/collecte/enregistrer.php`.
2. Ouvrir le fichier et remplacer le domaine dans la constante `ORIGINES` par
   le domaine réel du site.
3. Dans `landing/assets/script.js`, renseigner :

   ```js
   collecteur: "https://ton-domaine.fr/collecte/enregistrer.php"
   ```

Le script crée alors, à la première demande :

```
collecte/donnees/prospects.csv       le fichier de sauvegarde, ouvrable dans Excel
collecte/donnees/statistiques.json   les compteurs
```

**Protéger le dossier `donnees/`.** Sans protection, `prospects.csv` est
téléchargeable par quiconque connaît l'adresse. Deux moyens :

- déplacer `DOSSIER` hors de la racine web (le plus sûr) ;
- ou déposer dans `collecte/donnees/` un fichier `.htaccess` contenant
  `Require all denied` (serveurs Apache).

## Option B — Hébergement statique (GitHub Pages, Netlify, Cloudflare Pages)

Ces hébergements n'exécutent aucun code : le fichier de sauvegarde doit vivre
ailleurs. `apps-script.gs` écrit dans une feuille Google Sheets, qui devient le
fichier de sauvegarde.

1. Créer une feuille Google Sheets vide.
2. Menu **Extensions → Apps Script**, coller le contenu de `apps-script.gs`.
3. **Déployer → Nouveau déploiement → Application Web** :
   - Exécuter en tant que : *moi* ;
   - Accès : *tout le monde*.
4. Copier l'URL de déploiement (`https://script.google.com/macros/s/…/exec`).
5. **Vérifier avant d'aller plus loin** : coller cette URL dans un navigateur.
   Elle doit afficher `Collecteur Fluent & Forward en ligne. Contacts
   enregistrés : 0`. Si une erreur d'autorisation s'affiche, c'est que l'accès
   n'est pas réglé sur *tout le monde* à l'étape 3.
6. Renseigner l'URL dans `landing/assets/script.js` :

   ```js
   collecteur: "https://script.google.com/macros/s/XXXXX/exec"
   ```

Deux onglets se remplissent tout seuls : **Prospects** et **Statistiques**.

## Si aucun collecteur n'est branché

Le formulaire continue de fonctionner : le contact est conservé dans le
navigateur du visiteur et le guide se télécharge normalement. Sur **votre**
navigateur, `prospects.html` affiche les contacts saisis depuis cet appareil et
permet de les exporter en CSV.

C'est un filet de sécurité pour les tests, **pas** un système de collecte : les
contacts saisis par les visiteurs restent sur leur propre machine et ne vous
parviennent pas. Il faut donc brancher l'option A ou B avant la mise en ligne.

## Ce que ce dispositif ne fait pas

**Le téléchargement n'est pas verrouillé côté serveur.** Le formulaire
conditionne le bouton, mais le PDF reste accessible à son adresse directe
(`assets/stop-avoiding-english-essentials.pdf`) pour qui la devine ou la trouve
dans le code de la page. C'est le fonctionnement normal d'un site statique, et
c'est le cas de la grande majorité des pages de capture.

Pour un verrouillage réel, il faut l'option A et servir le fichier par un script
qui vérifie l'enregistrement avant d'envoyer les octets — le PDF est alors placé
hors de la racine web. À demander si le besoin est réel.

**Aucun email n'est envoyé.** Le prospect repart avec le fichier, pas avec un
message. Pour lui écrire ensuite, il faut importer `prospects.csv` (ou la feuille
Google) dans l'outil d'emailing.
