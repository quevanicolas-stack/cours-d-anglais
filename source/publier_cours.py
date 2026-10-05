#!/usr/bin/env python3
"""Publie les supports de cours dans l'espace membres.

Source : files/fluent-forward/ (les fichiers qu'on modifie).
Sortie : landing/membres/cours/ (ce que le site sert aux membres).

Ne jamais modifier les copies de landing/membres/cours/ à la main :
modifier la source, puis relancer `python3 source/publier_cours.py`.

Adaptations faites à la publication, imposées par la politique de
sécurité du site (landing/_headers) ou par la navigation :
- polices Google remplacées par celles servies par le site ;
- vidéos intégrées (data:video) sorties en fichiers dans video/,
  le navigateur refusant une vidéo intégrée sur le site ;
- bouton « retour à mon espace » ajouté à la barre de navigation
  des séances, pour circuler sans changer d'onglet.
"""
import base64
import pathlib
import re
import shutil

RACINE = pathlib.Path(__file__).resolve().parent.parent
SOURCE = RACINE / "files" / "fluent-forward"
SORTIE = RACINE / "landing" / "membres" / "cours"

# Fichiers publiés, dans l'ordre du programme. Ajouter ici chaque
# nouveau support au moment où il doit devenir accessible.
PUBLIES = [
    "module1-seance1.html",
    "module1-seance2.html",
    "module1-seance3.html",
    "module1-vocabulaire.html",
    "module1-grammaire.html",
]

POLICES_GOOGLE = re.compile(
    r'<link rel="preconnect" href="https://fonts\.googleapis\.com">\n'
    r'<link rel="preconnect" href="https://fonts\.gstatic\.com" crossorigin>\n'
    r'<link href="https://fonts\.googleapis\.com/css2\?[^"]*" rel="stylesheet">\n'
)
POLICES_SITE = '<link rel="stylesheet" href="../../assets/polices/polices.css">\n'

VIDEO = re.compile(r'src="data:video/([a-z0-9]+);base64,([A-Za-z0-9+/=]+)"')

BOUTON_RETOUR = (
    '<div id="nav">\n'
    '  <a id="retourEspace" class="navbtn" href="../espace.html" '
    'aria-label="Retour à mon espace" title="Retour à mon espace">\n'
    '    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" '
    'stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 11.5 12 4.5l8.5 7"/>'
    '<path d="M6 10v9.5h12V10"/></svg>\n'
    '  </a>\n'
)


def publier(nom):
    texte = (SOURCE / nom).read_text(encoding="utf-8")
    base = nom[:-len(".html")]

    if "fonts.googleapis.com" in texte:
        texte, n = POLICES_GOOGLE.subn(POLICES_SITE, texte)
        assert n == 1, f"{nom} : liens de polices Google inattendus"

    videos = list(VIDEO.finditer(texte))
    for i, m in enumerate(videos, 1):
        chemin = f"video/{base}-{i}.{m.group(1)}"
        (SORTIE / chemin).write_bytes(base64.b64decode(m.group(2)))
    for i, m in reversed(list(enumerate(videos, 1))):
        texte = texte[:m.start()] + f'src="video/{base}-{i}.{m.group(1)}"' + texte[m.end():]

    if '<div id="nav">\n' in texte:
        texte = texte.replace('<div id="nav">\n', BOUTON_RETOUR, 1)

    (SORTIE / nom).write_text(texte, encoding="utf-8")
    print(f"publié : {nom}" + (f" ({len(videos)} vidéo)" if videos else ""))


def main():
    (SORTIE / "video").mkdir(parents=True, exist_ok=True)
    for nom in PUBLIES:
        publier(nom)
    shutil.copytree(SOURCE / "audio", SORTIE / "audio", dirs_exist_ok=True)
    print("audios copiés")


if __name__ == "__main__":
    main()
