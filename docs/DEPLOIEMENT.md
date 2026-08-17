# Mise en ligne — Cloudflare

Hébergement gratuit, `fluentandforward` dans l'adresse, HTTPS et protection
réseau incluses. Aucun domaine à acheter pour démarrer.

Adresse en ligne : **`https://fluentandforward.queva-nicolas.workers.dev`**

## Ce qui a réellement été déployé

Cloudflare a utilisé son parcours **Workers** (`npx wrangler deploy`) plutôt que
Pages. Le résultat est un Worker servant des fichiers statiques : le
fonctionnement est le même, seule l'adresse diffère — `.workers.dev` au lieu de
`.pages.dev`. Le nom `fluentandforward` est bien présent.

Un domaine personnalisé pourra être branché dessus de la même façon.

### Vérifier que les en-têtes de sécurité sont bien appliqués

Le journal de déploiement lit 16 fichiers dans `landing/` mais n'en téléverse
que 15 : `_headers` est absent de la liste, signe qu'il a été consommé comme
configuration et non servi comme fichier. C'est le comportement attendu.

Pour le confirmer, ouvrir la console du navigateur sur le site en ligne, onglet
**Réseau**, cliquer sur la requête de la page, section **En-têtes de réponse**.
`Content-Security-Policy` et `Strict-Transport-Security` doivent y figurer.

En ligne de commande :

```
curl -sI https://fluentandforward.queva-nicolas.workers.dev/ | grep -i "content-security\|strict-transport"
```

Si ces en-têtes sont absents, c'est que le parcours Workers n'a pas pris
`_headers` en compte : il faut alors recréer le projet en **Pages** plutôt qu'en
Workers, ou déclarer les en-têtes dans `wrangler.jsonc`.

## Ne jamais mettre autre chose que du public dans `landing/`

**Tout fichier présent dans `landing/` est servi en ligne.** Le premier
déploiement publiait ainsi `README.md`, `DEPLOIEMENT.md` et les collecteurs, y
compris le numéro de téléphone qui y figurait en clair.

La documentation et les collecteurs vivent désormais dans `docs/`, qui n'est
jamais publié. Avant tout ajout de fichier, se demander : « est-ce que
j'accepte que n'importe qui le télécharge ? »

## Pourquoi Cloudflare Pages plutôt que GitHub Pages

| | Cloudflare Pages | GitHub Pages |
| --- | --- | --- |
| Prix | Gratuit | Gratuit |
| Nom choisi dans l'adresse | `fluentandforward.pages.dev` | dépend du nom de compte |
| Dépôt privé en formule gratuite | Oui | Non |
| En-têtes de sécurité personnalisés | Oui, via `_headers` | **Non** |
| Protection anti-déni de service | Incluse | Aucune |
| Certificat HTTPS | Automatique | Automatique |

Le point décisif est le fichier `_headers` : GitHub Pages ne permet pas de
définir d'en-têtes HTTP, donc ni politique de sécurité du contenu, ni HSTS,
ni protection contre l'affichage en iframe. C'est l'essentiel de la sécurité
d'un site statique, et Cloudflare est le seul des deux à l'autoriser.

## Marche à suivre

1. Créer un compte sur `dash.cloudflare.com` (gratuit, sans carte bancaire).
2. **Workers & Pages → Create → Pages → Connect to Git**, autoriser GitHub et
   choisir le dépôt `cours-d-anglais`.
3. Réglages de construction. **Les trois champs de commande doivent rester
   vides** : le site est déjà construit, il n'y a rien à compiler.

   | Champ | Valeur |
   | --- | --- |
   | Project name | `fluentandforward` |
   | Production branch | la branche qui contient le dossier `landing/` |
   | Framework preset | *None* |
   | Build command | **vide** |
   | Deploy command | **vide** |
   | Root directory | **vide** |
   | Build output directory | `landing` |

4. Cliquer sur **Save and Deploy**, puis attendre. Le déploiement prend
   généralement moins d'une minute.
5. Dans **Settings → Custom domains**, rien à faire tant qu'aucun domaine
   n'est acheté.

## Si le déploiement échoue

**`/bin/sh: 1: <un mot> : not found`**

Du texte a été saisi dans **Build command** ou **Deploy command**. Cloudflare
tente de l'exécuter comme une commande shell. Vider les deux champs dans
**Settings → Builds & deployments → Build configurations**, puis relancer avec
**Retry deployment**.

**`No build output directory found` ou site vide**

Le dossier `landing/` n'existe pas sur la branche de production. Vérifier que
**Production branch** pointe bien sur une branche qui le contient, et que
**Build output directory** vaut exactement `landing`.

**Le site s'affiche sans styles**

`Build output directory` a été laissé vide ou mis à `/`. Cloudflare sert alors
la racine du dépôt, où `index.html` n'existe pas.

Le nom du projet devient le sous-domaine : il doit donc être exactement
`fluentandforward` pour obtenir l'adresse voulue. S'il est déjà pris par un
autre utilisateur de Cloudflare, essayer `fluentandforward-fr` ou
`fluent-forward`.

Chaque `git push` sur `main` redéploie automatiquement.

## Passer le dépôt en privé

Cloudflare Pages fonctionne avec un dépôt privé, contrairement à GitHub Pages.
À faire dans **Settings → General → Change repository visibility** sur GitHub,
après avoir connecté Cloudflare.

**Ce que cela protège, et ce que cela ne protège pas.** Le dépôt privé empêche
de parcourir le code, l'historique et les fichiers de travail. Il ne cache
**pas** le contenu des pages servies : le numéro WhatsApp, présent dans le lien
du bouton, reste lisible par « afficher le code source » dans n'importe quel
navigateur. C'est inhérent à un lien cliquable, quel que soit l'hébergeur.

## Sécurité en place

Le fichier `_headers` applique à toutes les pages :

| En-tête | Ce qu'il empêche |
| --- | --- |
| `Content-Security-Policy` | L'exécution de tout script étranger à la page |
| `Strict-Transport-Security` | Toute connexion en clair pendant un an |
| `X-Content-Type-Options` | L'exécution d'un fichier déguisé en image |
| `X-Frame-Options` + `frame-ancestors` | L'affichage du site dans une iframe piégée |
| `Referrer-Policy` | La fuite de l'adresse complète vers les sites tiers |
| `Permissions-Policy` | L'accès caméra, micro, position, paiement |

La politique autorise `'unsafe-inline'` pour les **styles** uniquement — la page
utilise des attributs `style=`. Les **scripts**, eux, sont verrouillés sur
`'self'` : aucun script en ligne n'est accepté. C'est la raison pour laquelle
le script de `prospects.html` a été externalisé dans `assets/prospects.js`.

Cloudflare ajoute par-dessus, sans configuration : mitigation des attaques par
déni de service, certificat TLS renouvelé automatiquement, et redirection HTTP
vers HTTPS à activer dans **SSL/TLS → Edge Certificates → Always Use HTTPS**.

### À activer aussi

- **SSL/TLS → Overview → Full (strict)**.
- **Security → Bots → Bot Fight Mode**, qui écarte les robots les plus
  grossiers — utile contre l'aspiration d'adresses.

## Ce qui reste ouvert, volontairement

- **Le PDF est accessible à son adresse directe.** Le formulaire conditionne le
  bouton, pas le fichier. Un verrouillage réel exigerait un serveur qui exécute
  du code, donc un hébergement payant. C'est le fonctionnement normal de la
  quasi-totalité des pages de capture.
- **`prospects.html` est publique.** Elle n'affiche que la copie locale du
  navigateur qui la consulte : un visiteur n'y verrait que ses propres saisies,
  jamais celles des autres. Elle est exclue des moteurs de recherche par
  `X-Robots-Tag`.

## Le collecteur

Cloudflare Pages n'exécute pas de PHP : `enregistrer.php` est inutilisable ici.
Il faut donc l'option Google Apps Script décrite dans `docs/collecte/LISEZMOI.md`,
qui écrit dans une feuille Google Sheets.

L'adresse du déploiement Apps Script est déjà autorisée par la politique de
sécurité (`connect-src`). Aucune modification de `_headers` n'est nécessaire.

## Plus tard : brancher un vrai domaine

L'achat de `fluentandforward.com` ne change rien au site. Dans Cloudflare :
**Custom domains → Set up a domain**, puis suivre les enregistrements DNS
indiqués. Le certificat HTTPS est émis automatiquement, et
`fluentandforward.pages.dev` continue de fonctionner en parallèle.
