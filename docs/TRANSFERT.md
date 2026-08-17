# Transférer le projet à Aurélie

Objectif : qu'Aurélie soit propriétaire de tout — le code, l'hébergement, les
contacts — et que le site reste accessible à la **même adresse** pendant
l'opération.

Quatre comptes sont concernés. Un seul est déjà à elle.

| Élément | Aujourd'hui | Après le transfert |
|---|---|---|
| Dépôt du code (GitHub) | compte de Nicolas | compte d'Aurélie |
| Hébergement (Cloudflare Pages) | compte de Nicolas | compte d'Aurélie |
| Tableur des contacts (Google) | compte de Nicolas | compte d'Aurélie |
| Numéro WhatsApp | déjà Aurélie | inchangé |

## Avant de commencer

Aurélie crée trois comptes gratuits, avec **la même adresse email
professionnelle** pour s'y retrouver plus tard :

- un compte **GitHub** — github.com ;
- un compte **Cloudflare** — dash.cloudflare.com ;
- un compte **Google**, si elle veut séparer le tableur de ses contacts de sa
  boîte personnelle. Son compte existant convient très bien.

Elle communique ensuite son identifiant GitHub à Nicolas.

## 1. Le tableur des contacts

À faire **en premier** : c'est la seule étape sans aucun risque de coupure, et
elle donne l'adresse dont on aura besoin à l'étape 4.

Sur le compte Google d'Aurélie :

1. créer un tableur vierge, le nommer par exemple « Prospects Fluent & Forward » ;
2. menu **Extensions → Apps Script** — le script doit impérativement être créé
   depuis le tableur, sinon il n'a rien où écrire ;
3. coller tout le contenu de `docs/collecte/apps-script.gs`, enregistrer ;
4. **Déployer → Nouveau déploiement → Application web**, exécuter en tant
   qu'elle-même, accès **Tout le monde** ;
5. autoriser l'accès quand Google le demande (l'avertissement « application non
   vérifiée » est normal : c'est son propre script — *Paramètres avancés →
   Accéder au projet*) ;
6. **vérifier** : ouvrir l'adresse `/exec` dans un navigateur. Elle doit afficher
   `Rattachement au tableur : OK`. Ajouter `?essai=1` à la fin de l'adresse écrit
   une ligne d'essai dans le tableur — la preuve que la chaîne fonctionne. La
   ligne ESSAI se supprime ensuite à la main ;
7. conserver l'adresse `/exec`, elle sert à l'étape 4.

**Reprendre les contacts déjà collectés** : dans l'ancien tableur, *Fichier →
Télécharger → CSV* sur l'onglet Prospects, puis dans le nouveau tableur
*Fichier → Importer → Ajouter les lignes à la feuille active*. À faire au tout
dernier moment, pour n'oublier aucun contact arrivé entre-temps.

Une fois le nouveau collecteur en service et les contacts recopiés, l'ancien
tableur et son script peuvent être supprimés.

## 2. Le dépôt GitHub

Depuis le compte de Nicolas :

**Settings** du dépôt → tout en bas, **Danger Zone** → **Transfer ownership** →
saisir le nom d'utilisateur GitHub d'Aurélie.

Elle reçoit une invitation par email et doit l'accepter — le transfert n'est
effectif qu'après. Nicolas peut rester **collaborateur** (*Settings → Collaborators*)
s'il continue à s'occuper du site ; il n'en est simplement plus propriétaire.

GitHub redirige automatiquement l'ancienne adresse vers la nouvelle, donc rien ne
casse immédiatement. Mais le lien avec Cloudflare, lui, devra être refait — c'est
l'étape suivante.

## 3. L'hébergement Cloudflare

Cloudflare **ne permet pas** de transférer un projet Pages d'un compte à un autre.
Il faut le supprimer d'un côté et le recréer de l'autre. L'adresse
`fluentandforward.pages.dev` se libère à la suppression et se récupère en
recréant un projet portant **exactement le même nom**.

Prévoir de faire les deux dans la foulée, le même jour : entre les deux, le site
est hors ligne, et le nom est théoriquement réservable par quelqu'un d'autre.

1. **Nicolas** — dash.cloudflare.com → *Workers & Pages* → projet
   `fluentandforward` → *Settings* → *Delete project*.
2. **Aurélie** — dans son propre compte : *Workers & Pages* → *Create* →
   onglet **Pages** → *Connect to Git* → autoriser Cloudflare sur son GitHub →
   choisir le dépôt `cours-d-anglais`.
3. Réglages du projet, à recopier à l'identique :
   - **Project name** : `fluentandforward` — c'est lui qui donne l'adresse ;
   - **Production branch** : `main` ;
   - **Framework preset** : *None* ;
   - **Build command** : **laisser vide** ;
   - **Build output directory** : `landing`.
4. *Save and Deploy*. Le site revient sur https://fluentandforward.pages.dev.

Ne rien écrire dans le champ *Build command* : le site est fait de fichiers
statiques, il n'y a rien à construire. Toute phrase saisie dans ce champ serait
exécutée comme une commande et ferait échouer le déploiement.

## 4. Rebrancher la collecte

Une seule ligne à changer dans `landing/assets/script.js` :

```js
collecteur: "https://script.google.com/macros/s/…/exec"
```

Y mettre l'adresse obtenue à l'étape 1. Enregistrer, *commit*, *push* sur `main` :
Cloudflare redéploie tout seul en une minute environ.

**Vérification finale**, sur le site en ligne : remplir le formulaire avec une
vraie adresse, confirmer que le PDF arrive et qu'une ligne apparaît dans le
nouveau tableur d'Aurélie.

## 5. Les mentions légales

Elles sont obligatoires et doivent désigner Aurélie comme éditrice. À compléter
dans `landing/mentions-legales.html`, aux trois endroits signalés en jaune :

- **Éditeur** : nom et prénom, statut juridique, adresse, email de contact,
  numéro SIRET, et le numéro de déclaration d'activité de formation s'il existe ;
- **Hébergeur** : Cloudflare, Inc. — 101 Townsend Street, San Francisco,
  CA 94107, États-Unis ;
- l'encadré d'introduction, à supprimer une fois le reste rempli.

Tant que ces mentions portent le nom de quelqu'un d'autre — ou personne — c'est
Aurélie qui est en défaut vis-à-vis de ses propres prospects.

## Ce qui reste à trancher, indépendamment du transfert

- **Les statistiques 78 % et 43 %** affichées en haut de page n'ont pas de source
  citée. Les chiffres avancés dans une accroche commerciale doivent pouvoir être
  justifiés : retrouver l'étude d'origine, ou reformuler.
- **La photo** `assets/aurelie.jpg` : confirmer qu'Aurélie en détient les droits.
- **Un nom de domaine** (`fluentandforward.com` ou `.fr`) reste facultatif.
  S'il est acheté un jour, il doit l'être **à son nom**, et se branche sur le
  projet Cloudflare en quelques minutes — voir `DEPLOIEMENT.md`.

## Un point à connaître sur le collecteur

L'adresse du script Google est écrite dans le JavaScript de la page : c'est
inévitable, c'est le navigateur du visiteur qui l'appelle. Elle est donc lisible
par n'importe qui, et quelqu'un de mal intentionné pourrait y envoyer de fausses
lignes. Rien de sensible ne fuit — le script ne sait qu'**écrire**, jamais lire
ni renvoyer les contacts déjà enregistrés. Si le tableur se remplissait un jour
de lignes fantaisistes, il suffit de créer un nouveau déploiement : l'ancienne
adresse cesse aussitôt de fonctionner, et on met la nouvelle dans `script.js`.
