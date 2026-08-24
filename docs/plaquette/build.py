# -*- coding: utf-8 -*-
# Assemble les deux plaquettes : même contenu, fonds différents (codés / images).
import base64, json, pathlib

SITE = pathlib.Path("/workspace/cours-d-anglais/site")
GPT  = pathlib.Path("/tmp/claude-0/-home-user-solaire974/9803162d-3d0f-5f65-bc2f-77946c8ad852/scratchpad/gpt")
HERE = pathlib.Path("/tmp/claude-0/-home-user-solaire974/9803162d-3d0f-5f65-bc2f-77946c8ad852/scratchpad/plaquette")

def lire(p): return pathlib.Path(p).read_text(encoding="utf-8")
def datauri(p, mt):
    return "data:%s;base64,%s" % (mt, base64.b64encode(pathlib.Path(p).read_bytes()).decode())

IMG = json.loads((GPT / "fonds-datauri.json").read_text())
PORTRAIT = datauri(SITE / "assets/aurelie.jpg", "image/jpeg")

CSS   = lire(HERE / "plaquette.css")
FONDS = lire(HERE / "fonds.css")

JS = "\n".join(lire(SITE / f) for f in [
    "assets/donnees/sessions.js", "assets/donnees/modules.js",
    "assets/calendrier.js", "assets/programme.js", "assets/compte.js",
]) + "\n" + lire(HERE / "moteur.js")

# ------------------------------------------------------------------ CHROME
CHROME = """
<a class="saut-contenu" href="#accueil">Aller au contenu</a>
<div class="bande" id="bande"><a href="#formation">Inscris-toi à la formation</a></div>
<header class="entete"><div class="barre">
  <a class="marque" href="#accueil">Fluent &amp; Forward</a>
  <button class="bouton-menu" id="ouvrir-menu" aria-label="Ouvrir le menu" aria-expanded="false" aria-controls="menu-lateral">
    <span></span><span></span><span></span></button>
</div></header>
<nav class="menu-lateral" id="menu-lateral" aria-hidden="true" aria-label="Menu principal">
  <div class="menu-tete"><span class="marque">Fluent &amp; Forward</span>
    <button class="fermer-menu" id="fermer-menu" aria-label="Fermer le menu">&times;</button></div>
  <ul class="menu-liens">
    <li><a href="#accueil">Accueil</a></li>
    <li><a href="#formation">Business English Accelerator</a></li>
    <li><a href="#a-propos">À propos de moi</a></li>
    <li><a href="#mon-accelerateur">Mon Accélérateur</a></li>
  </ul>
  <div class="menu-pied"><a class="bouton bouton-or" href="#mon-accelerateur">Connexion</a>
    <p class="note">L'espace membres du programme.</p></div>
</nav>
<button class="voile" id="voile-menu" hidden aria-label="Fermer le menu"></button>
"""

# ------------------------------------------------------------------ CONTENU
def C_ACCUEIL():
    return """
  <div class="chapitre-contenu"><div class="heros"><div class="contenu contenu-etroit centre">
    <h1 data-reveal>Combien d'opportunités professionnelles vous ont échappé parce que l'anglais vous a manqué au moment décisif ?</h1>
    <p class="chapeau" data-reveal data-delai="1">En 8 semaines, parlez business en anglais avec la même aisance qu'en français et ne laissez plus jamais une réunion, un client ou une opportunité filer à cause de la langue.</p>
    <p class="appel" data-reveal data-delai="2">Rejoins le <strong>Business English Accelerator Program</strong>.</p>
    <div class="cadran" data-reveal data-delai="3"><a class="bouton bouton-or" href="#formation">Voir les prochaines sessions</a></div>
  </div></div></div>"""

def C_FORMATION():
    return """
  <div class="chapitre-contenu">
    <section class="bloc"><div class="contenu">
      <span class="oeil" data-reveal>Le programme</span>
      <h2 data-reveal>Business English Accelerator</h2>
      <p class="sur-titre" data-reveal data-delai="1">L'anglais professionnel, quand ça compte vraiment.</p>
      <p class="chapeau" data-reveal data-delai="1" style="margin-top:18px">Un programme intensif de 8 semaines pour cadres et indépendants francophones qui veulent défendre leur expertise en anglais avec la même autorité qu'en français — en réunion, au téléphone, ou face à un client.</p>
    </div></section>

    <section class="bloc-court"><div class="contenu">
      <div class="verre" data-reveal>
        <h3 class="titre-bloc">Le format</h3>
        <ul class="format">
          <li>8 semaines, structurées en 8 modules progressifs</li>
          <li>Leçons en vidéo courtes, à votre rythme, accessibles à tout moment depuis votre espace personnel</li>
          <li>Sessions live en groupe toutes les semaines, pour pratiquer à l'oral dans des mises en situation réelles</li>
          <li>2 coachings individuels avec moi, en semaine 4 et semaine 8, pour ajuster le programme à votre réalité professionnelle</li>
          <li>Un Kit de Vocabulaire par module, en deux niveaux : l'essentiel à retenir tout de suite, et pour aller plus loin si vous voulez approfondir</li>
          <li>Nombre de participants limité par groupe, pour un accompagnement réellement personnalisé</li>
        </ul>
      </div>
    </div></section>

    <section class="bloc"><div class="contenu">
      <h3 class="titre-bloc" data-reveal>Le contenu — 8 modules</h3>
      <div id="liste-modules" data-reveal data-delai="1"></div>
    </div></section>

    <section class="bloc-court"><div class="contenu contenu-etroit">
      <div class="verre" data-reveal>
        <h3 class="titre-bloc">Pour qui ?</h3>
        <p class="chapeau" style="margin-top:14px">Ce programme s'adresse aux professionnels francophones qui maîtrisent déjà leur métier, mais dont l'anglais reste un frein à l'oral dans un contexte professionnel : cadres, indépendants, entrepreneurs, qui négocient, présentent ou échangent régulièrement avec des interlocuteurs anglophones ou qui souhaitent s'ouvrir à une clientèle anglophone.</p>
      </div>
    </div></section>

    <section class="bloc"><div class="contenu">
      <div class="calendrier-tete" data-reveal>
        <div><span class="oeil">Prochaines sessions</span><h3 class="titre-bloc">Les trois prochains mois</h3></div>
        <p class="legende"><span><i class="jeton jeton-vert"></i> Places disponibles</span><span><i class="jeton jeton-rouge"></i> Session complète</span></p>
      </div>
      <div id="calendrier" data-reveal data-delai="1"></div>
      <div id="liste-sessions" data-reveal></div>
      <p class="encart a-confirmer" data-reveal style="margin-top:32px">Les sessions affichées sont des exemples, mis en place pour montrer le fonctionnement du calendrier. Elles seront remplacées par les vraies dates d'Aurélie.</p>
    </div></section>

    <section class="bloc"><div class="contenu contenu-etroit centre">
      <h3 class="titre-bloc" data-reveal>Tarif et inscription</h3>
      <p class="chapeau" data-reveal data-delai="1" style="margin-top:14px">Places limitées par session, pour garantir un accompagnement individualisé. Le tarif et les modalités de paiement vous sont communiqués sur demande.</p>
      <p data-reveal data-delai="2" style="margin-top:28px"><a class="bouton bouton-or a-confirmer" href="https://wa.me/262693441835?text=Bonjour%20Aur%C3%A9lie%2C%20je%20souhaite%20r%C3%A9server%20un%20appel%20de%20pr%C3%A9-inscription%20au%20Business%20English%20Accelerator." rel="noopener">Réserver un appel de pré-inscription</a></p>
    </div></section>
  </div>"""

def C_APROPOS():
    return """
  <div class="chapitre-contenu">
    <section class="bloc"><div class="contenu">
      <span class="oeil" data-reveal>À propos de moi</span>
      <h2 data-reveal>De la réalité à la formation</h2>
      <div class="portrait-texte">
        <div data-reveal data-delai="1">
          <p style="margin-top:18px">Avant d'enseigner l'anglais professionnel, je l'ai vécu de l'intérieur. 12 ans dans le secteur bancaire international et l'immobilier de luxe, où chaque réunion, chaque négociation, chaque email engageait quelque chose de concret et ne laissait pas de place à l'approximation.</p>
          <p>Bilingue anglais-français, aujourd'hui, je mets cette double culture au service de professionnels francophones qui maîtrisent leur métier, mais cherchent encore l'aisance pour le défendre avec la même autorité en anglais.</p>
          <p>Certifiée TEFL niveau 5, je ne suis pas seulement formatrice : je suis passée par les mêmes salles de réunion que vous.</p>
        </div>
        <img class="portrait" data-reveal data-delai="2" src="__PORTRAIT__" alt="Portrait d'Aurélie Queva, formatrice en anglais professionnel">
      </div>
    </div></section>

    <section class="bloc-court"><div class="contenu contenu-etroit">
      <div class="verre" data-reveal>
        <h3 class="titre-bloc">Ma méthode</h3>
        <p style="margin-top:14px">Je ne crois pas à l'anglais appris hors-sol — les listes de vocabulaire sans contexte, la grammaire pour la grammaire. Ma méthode s'appuie sur le Task-Based Learning : vous apprenez en faisant, à partir de situations réelles de votre quotidien professionnel — un email à rédiger, une réunion à préparer, un client à convaincre.</p>
        <p>Chaque module part d'une tâche concrète, pas d'une règle abstraite. Vous ne mémorisez pas une leçon : vous vous entraînez à résoudre une situation que vous rencontrerez réellement — pour qu'au moment où ça compte, le réflexe soit déjà là.</p>
      </div>
    </div></section>

    <section class="bloc"><div class="contenu">
      <h3 class="titre-bloc" data-reveal>Pour qui ?</h3>
      <div class="grille grille-2">
        <article class="carte cadran" data-reveal data-delai="1">
          <span class="pastille">Professionnel individuel</span>
          <p style="margin-top:16px">Vous êtes cadre, indépendant ou entrepreneur, et l'anglais vous freine à l'oral dans votre quotidien professionnel — réunions, appels, présentations. Vous voulez progresser à votre rythme, dans un petit groupe, avec un accompagnement individualisé.</p>
          <p style="margin-top:20px"><a class="bouton bouton-or a-confirmer" href="https://wa.me/262693441835?text=Bonjour%20Aur%C3%A9lie%2C%20je%20souhaite%20d%C3%A9couvrir%20le%20Business%20English%20Accelerator." rel="noopener">Découvrir le Business English Accelerator</a></p>
        </article>
        <article class="carte cadran" data-reveal data-delai="2">
          <span class="pastille">Entreprise</span>
          <p style="margin-top:16px">Vos équipes échangent régulièrement avec des interlocuteurs anglophones et l'anglais professionnel devient un enjeu collectif — pas seulement individuel. Chaque entreprise a ses propres réalités métier, ses interlocuteurs, ses urgences : la formation est donc conçue sur mesure, à partir des besoins concrets de vos équipes.</p>
          <p style="margin-top:20px"><a class="bouton bouton-clair" href="https://wa.me/262693441835?text=Bonjour%20Aur%C3%A9lie%2C%20je%20souhaite%20discuter%20d%27un%20projet%20de%20formation%20pour%20mon%20%C3%A9quipe." rel="noopener">Discutons de votre projet</a></p>
        </article>
      </div>
    </div></section>
  </div>""".replace("__PORTRAIT__", PORTRAIT)

def C_MEMBRES():
    return """
  <div class="chapitre-contenu"><section class="bloc"><div class="contenu">
    <div style="max-width:720px">
      <span class="oeil" data-reveal>Espace membres</span>
      <h2 data-reveal>Mon Accélérateur</h2>
      <p class="chapeau" data-reveal data-delai="1" style="margin-top:16px">L'espace personnel des participants au Business English Accelerator : les modules, les leçons vidéo et les Kits de Vocabulaire. Les comptes ne se créent pas tout seuls — chaque demande est validée à la main par Aurélie avant qu'un accès soit ouvert.</p>
    </div>
    <div class="colonnes" style="margin-top:44px">
      <section class="verre" data-reveal>
        <h3 class="titre-bloc">J'ai déjà un compte</h3>
        <p style="margin-top:8px;color:var(--muted)">Se connecter pour retrouver ses modules.</p>
        <form id="formulaire-connexion" novalidate>
          <div class="champ"><label for="identifiant">Adresse email</label><input type="email" id="identifiant" name="identifiant" autocomplete="username" disabled></div>
          <div class="champ"><label for="motdepasse">Mot de passe</label><input type="password" id="motdepasse" name="motdepasse" autocomplete="current-password" disabled></div>
          <p style="margin-top:22px"><button type="submit" class="bouton bouton-or" disabled aria-disabled="true" style="width:100%">Se connecter</button></p>
        </form>
        <div class="encart" style="margin-top:24px"><h3>Pas encore actif</h3>
          <p style="color:var(--muted)">La connexion suppose un serveur capable de vérifier un mot de passe. Tant qu'il n'existe pas, ce formulaire reste volontairement inactif plutôt que de faire semblant de fonctionner.</p></div>
      </section>
      <section class="verre" data-reveal data-delai="1">
        <h3 class="titre-bloc">Demander un accès</h3>
        <p style="margin-top:8px;color:var(--muted)">Quelques informations suffisent. Aurélie valide la demande, puis envoie les identifiants par email.</p>
        <form id="formulaire-acces" novalidate>
          <div class="champ"><label for="prenom">Prénom</label><input type="text" id="prenom" name="prenom" autocomplete="given-name" aria-describedby="erreur-prenom"><p class="erreur" id="erreur-prenom">Merci d'indiquer votre prénom.</p></div>
          <div class="champ"><label for="nom">Nom</label><input type="text" id="nom" name="nom" autocomplete="family-name" aria-describedby="erreur-nom"><p class="erreur" id="erreur-nom">Merci d'indiquer votre nom.</p></div>
          <div class="champ"><label for="email">Adresse email</label><input type="email" id="email" name="email" autocomplete="email" aria-describedby="erreur-email"><p class="erreur" id="erreur-email">Cette adresse ne semble pas valide.</p><p class="aide">C'est à cette adresse que les identifiants seront envoyés.</p></div>
          <div class="champ"><label for="motivation">En deux mots, votre besoin (facultatif)</label><textarea id="motivation" name="motivation" placeholder="Réunions en anglais, appels clients, présentations…"></textarea></div>
          <div class="case"><input type="checkbox" id="rgpd" name="rgpd" aria-describedby="erreur-rgpd"><label for="rgpd">J'accepte que ces informations soient conservées pour traiter ma demande d'accès.</label></div>
          <p class="erreur" id="erreur-rgpd">Cette autorisation est nécessaire pour enregistrer la demande.</p>
          <p style="margin-top:24px"><button type="submit" class="bouton bouton-or" style="width:100%">Envoyer ma demande</button></p>
          <p class="retour-formulaire" id="retour-acces" role="status"></p>
        </form>
      </section>
    </div>
    <p class="encart a-confirmer" data-reveal style="margin-top:40px">À décider avant la mise en ligne : où arrivent les demandes d'accès. Le plus simple est de les diriger vers le même tableur Google que les contacts de la landing, dans un onglet séparé. Il suffira d'indiquer l'adresse du script dans <code>assets/compte.js</code>.</p>
  </div></section></div>"""

FOOTER = """
<footer class="pied"><div class="contenu">
  <div class="pied-haut">
    <div><span class="marque">Fluent &amp; Forward</span>
      <p class="pied-guide"><a class="bouton bouton-or" href="https://fluentandforward.pages.dev" rel="noopener">Télécharge ton guide gratuit</a></p></div>
    <div><span class="pied-titre">Contact</span><div class="ronds">
      <button class="rond" type="button" data-email data-objet="Renseignement — Business English Accelerator" aria-label="Écrire un email à Aurélie" title="Écrire un email">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21.4 2.6 2.9 9.4c-.9.3-.9 1.6 0 1.9l6.4 2.2 2.2 6.4c.3.9 1.6.9 1.9 0l6.8-18.5c.3-.7-.4-1.4-1.1-1.1z"/></svg></button>
      <a class="rond" href="https://www.linkedin.com/in/ameer-aurelie" rel="noopener" aria-label="LinkedIn d'Aurélie" title="LinkedIn">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.98 3.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM3 9h4v12H3zM10 9h3.8v1.7h.05c.53-.95 1.83-1.95 3.76-1.95 4.02 0 4.76 2.5 4.76 5.76V21h-4v-5.6c0-1.34-.03-3.06-1.9-3.06-1.9 0-2.2 1.45-2.2 2.96V21h-4z"/></svg></a>
      <a class="rond" href="https://www.instagram.com/businessenglish_byaurelie" rel="noopener" aria-label="Instagram d'Aurélie" title="Instagram">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 8.2a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4z"/><path d="M12 4c-2.6 0-2.9 0-3.9.06-1 .05-1.6.2-2 .37-.5.2-.85.43-1.2.79-.36.35-.6.7-.79 1.2-.16.4-.32 1-.37 2C3.7 9.4 3.7 9.7 3.7 12s0 2.6.06 3.6c.05 1 .2 1.6.37 2 .2.5.43.85.79 1.2.35.36.7.6 1.2.79.4.16 1 .32 2 .37 1 .06 1.3.06 3.9.06s2.9 0 3.9-.06c1-.05 1.6-.2 2-.37.5-.2.85-.43 1.2-.79.36-.35.6-.7.79-1.2.16-.4.32-1 .37-2 .06-1 .06-1.3.06-3.6s0-2.6-.06-3.6c-.05-1-.2-1.6-.37-2a3.3 3.3 0 0 0-.79-1.2 3.3 3.3 0 0 0-1.2-.79c-.4-.16-1-.32-2-.37C14.9 4 14.6 4 12 4z"/><circle cx="17.2" cy="6.8" r="1.2"/></svg></a>
    </div></div>
  </div>
  <div class="pied-bas"><span>&copy; <span class="annee-courante">2026</span> Fluent &amp; Forward. Tous droits réservés.</span><span><a href="https://fluentandforward.pages.dev" rel="noopener">Mentions légales à venir</a></span></div>
</div></footer>

<div class="fenetre" id="fenetre-rentree" hidden role="dialog" aria-modal="true" aria-labelledby="titre-fenetre">
  <div class="fenetre-fond" data-fermer></div>
  <div class="fenetre-boite"><button class="fenetre-fermer" data-fermer aria-label="Fermer">&times;</button>
    <span class="pastille">Rentrée septembre 2026</span><h2 id="titre-fenetre">&minus;50 % pour la rentrée</h2>
    <p style="margin-top:12px">Plus que quelques places disponibles sur la prochaine session du Business English Accelerator.</p>
    <p style="margin-top:22px"><a class="bouton bouton-or" href="#formation" data-fermer>Voir le programme</a></p></div>
</div>
"""

# ------------------------------------------------------------------ FONDS
FOND_CODE = {
"accueil": """<div class="fond-stage c-ouverture">
  <div class="fond-plan c-masse c-masse-g" style="--k:-40;--s:.05"></div>
  <div class="fond-plan c-masse c-masse-d" style="--k:-70;--s:.05"></div>
  <div class="fond-plan" style="--k:-30;--s:.55"><div class="c-anneau" style="width:56vmin;height:56vmin"></div></div>
  <div class="fond-plan" style="--k:-52;--s:.8"><div class="c-anneau" style="width:78vmin;height:78vmin;border-color:rgba(201,169,110,.26)"></div></div>
  <div class="fond-plan" style="--k:-80;--s:1.1"><div class="c-anneau" style="width:104vmin;height:104vmin;border-color:rgba(201,169,110,.16)"></div></div>
  <div class="fond-plan c-soleil" style="--k:-120;--s:-.28"></div>
</div>""",
"formation": """<div class="fond-stage c-perspective">
  <div class="fond-plan c-horizon" style="--k:60;--s:.1"></div>
  <div class="c-grille"></div>
  <div class="fond-plan" style="--k:-90;--s:.14"><div class="c-plaque" style="left:12vw;top:22vh;width:24vw;height:15vw"></div></div>
  <div class="fond-plan" style="--k:-140;--s:.22"><div class="c-plaque" style="right:11vw;top:16vh;width:20vw;height:13vw"></div></div>
</div>""",
"a-propos": """<div class="fond-stage c-strates">
  <div class="fond-plan c-halo c-halo-1" style="--k:-30;--s:.08"></div>
  <div class="fond-plan c-halo c-halo-2" style="--k:-56;--s:.1"></div>
  <div class="fond-plan c-strate" style="--k:24;--s:.2;opacity:.5"><svg width="820" height="560" viewBox="0 0 820 560"><path d="M50,300 C180,150 400,170 520,270 C640,370 740,300 780,200" stroke="rgba(201,169,110,.5)" stroke-width="1.1"/><path d="M40,370 C190,240 420,250 560,330 C700,410 760,360 800,280" stroke="rgba(201,169,110,.4)" stroke-width="1.1"/></svg></div>
  <div class="fond-plan c-strate" style="--k:-40;--s:.5"><svg width="640" height="440" viewBox="0 0 640 440"><path d="M40,220 C150,110 320,120 410,200 C500,280 580,220 600,150" stroke="#E4C88E" stroke-width="1.4"/><path d="M30,280 C160,180 340,190 450,250 C560,310 590,270 610,210" stroke="rgba(228,200,142,.7)" stroke-width="1.2"/></svg></div>
  <div class="fond-plan c-voile-droite" style="--k:-10"></div>
</div>""",
"mon-accelerateur": """<div class="fond-stage c-tunnel">
  <div class="c-cadre" style="width:20vmin;height:14vmin;--s:5.2"></div>
  <div class="c-cadre" style="width:34vmin;height:23vmin;--s:3.4;border-color:rgba(201,169,110,.3)"></div>
  <div class="c-cadre" style="width:52vmin;height:35vmin;--s:2.2;border-color:rgba(201,169,110,.22)"></div>
  <div class="c-cadre" style="width:74vmin;height:50vmin;--s:1.5;border-color:rgba(201,169,110,.14)"></div>
  <div class="fond-plan c-coeur" style="--k:0;--s:.5"></div>
</div>""",
}

def fond_img(img, voile):
    return ('<div class="fond-stage"><div class="ibg" style="background-image:url(%s)"></div>'
            '<div class="ibg-voile %s"></div></div>' % (img, voile))
FOND_IMG = {
"accueil":         fond_img(IMG["1-ouverture"],   "voile-haut"),
"formation":       fond_img(IMG["2-perspective"], "voile-bas"),
"a-propos":        fond_img(IMG["3-strates"],     "voile-droite"),
"mon-accelerateur":fond_img(IMG["4-tunnel"],      "voile-vignette"),
}

CONTENU = {"accueil":C_ACCUEIL(), "formation":C_FORMATION(), "a-propos":C_APROPOS(), "mon-accelerateur":C_MEMBRES()}
LABEL   = {"accueil":"ACCUEIL","formation":"BUSINESS ENGLISH ACCELERATOR","a-propos":"À PROPOS","mon-accelerateur":"ESPACE MEMBRES"}

def chapitres(fonds):
    out = []
    for cid in ["accueil","formation","a-propos","mon-accelerateur"]:
        out.append('<section class="chapitre" id="%s" aria-label="%s">\n%s\n%s\n</section>'
                   % (cid, LABEL[cid], fonds[cid], CONTENU[cid]))
    return "\n".join(out)

def page(titre, fonds, note):
    return """<title>%s</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,700;1,400&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap" rel="stylesheet">
<style>%s
%s
/* Bandeau d'aperçu (test seulement) */
.note-test{position:fixed;bottom:16px;left:50%%;transform:translateX(-50%%);z-index:150;font-family:var(--titre);
  font-size:.7rem;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);background:rgba(4,16,9,.62);
  backdrop-filter:blur(8px);padding:7px 16px;border-radius:999px;border:1px solid var(--line);text-align:center;max-width:92vw}
</style>
<canvas id="poussiere"></canvas>
%s
<main>%s</main>
%s
<p class="note-test">%s</p>
<script>%s</script>
""" % (titre, CSS, FONDS, CHROME, chapitres(fonds), FOOTER, note, JS)

(HERE / "plaquette-codee.html").write_text(
    page("Fluent &amp; Forward — plaquette (fonds codés)", FOND_CODE,
         "Piste A — fonds codés · plaquette prête à l'emploi"), encoding="utf-8")
(HERE / "plaquette-images.html").write_text(
    page("Fluent &amp; Forward — plaquette (images)", FOND_IMG,
         "Piste B — fonds images ChatGPT · plaquette prête à l'emploi"), encoding="utf-8")

import os
for f in ["plaquette-codee.html","plaquette-images.html"]:
    print(f, os.path.getsize(HERE / f)//1024, "Ko")
