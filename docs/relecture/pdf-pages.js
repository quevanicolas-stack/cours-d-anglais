/* Génère un PDF par page visible du site, pour relecture et annotation.
   Chaque bloc reçoit un numéro discret : Aurélie peut désigner précisément
   ce qu'elle veut changer sans décrire l'endroit. */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');

const RACINE = '/workspace/cours-d-anglais/site';
const DEST = '/workspace/cours-d-anglais/docs/relecture';
const TYPES = { '.html':'text/html','.css':'text/css','.js':'application/javascript',
                '.svg':'image/svg+xml','.jpg':'image/jpeg' };
const serveur = http.createServer((q,r)=>{
  let f = path.join(RACINE, decodeURIComponent(q.url.split('#')[0].split('?')[0]));
  if (f.endsWith('/')) f += 'index.html';
  if (!f.startsWith(RACINE) || !fs.existsSync(f)) { r.writeHead(404); return r.end('404'); }
  r.writeHead(200, {'Content-Type': TYPES[path.extname(f)]||'text/plain'});
  r.end(fs.readFileSync(f));
});

// fichier, ancre de la section à isoler (null = toute la page), nom du PDF
const PAGES = [
  ['index.html', 'accueil',   '1-Accueil',          'Accueil'],
  ['index.html', 'formation', '2-Formation',        'Formation'],
  ['index.html', 'a-propos',  '3-A-propos-de-moi',  'À propos de moi'],
  ['index.html', 'programme', '4-Mon-programme',    'Mon programme'],
  ['connexion.html', null,    '5-Connexion',        'Connexion'],
  ['mentions-legales.html', null, '6-Mentions-legales', 'Mentions légales'],
];

const STYLE_RELECTURE = `
  /* Habillage propre à la relecture : rien de tout ceci n'existe sur le site. */
  .entete, .menu-lateral, .voile, .pied, .saut-contenu { display: none !important; }
  .ecran[data-sens] { transform: none !important; }
  body { background: #FAF7F2 !important; }

  .bloc-repere { position: relative; }
  .bloc-repere > .ref-bloc {
    position: absolute;
    top: 10px;
    left: 10px;
    z-index: 5;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-weight: 800;
    font-size: 11px;
    letter-spacing: .08em;
    color: #8a6d3a;
    background: rgba(201,169,110,.30);
    border: 1px solid rgba(201,169,110,.75);
    border-radius: 5px;
    padding: 2px 7px;
  }
  /* Sur fond vert, le repère doit rester lisible. */
  .section-verte > .ref-bloc, .heros > .ref-bloc {
    color: #F3E4C6;
    background: rgba(201,169,110,.28);
  }
  .section, .heros { break-inside: auto; }
`;

(async () => {
  fs.mkdirSync(DEST, { recursive: true });
  await new Promise(r => serveur.listen(8092, r));
  const nav = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });

  for (const [fichier, ancre, nomPdf, titre] of PAGES) {
    const page = await nav.newPage({ viewport: { width: 1200, height: 900 } });
    await page.route('https://fonts.googleapis.com/**', r => r.abort());
    await page.goto('http://localhost:8092/' + fichier);
    // Le calendrier et les modules sont dessinés par script : on attend
    // qu'ils soient là, sinon le PDF sortirait avec des trous.
    if (ancre === 'formation') await page.waitForSelector('.session');
    if (ancre === 'programme') await page.waitForSelector('.module');
    await page.waitForTimeout(600);

    const blocs = await page.evaluate(({ style, ancre }) => {
      const s = document.createElement('style');
      s.textContent = style;
      document.head.appendChild(s);

      // N'garder que la section demandée.
      if (ancre) {
        document.querySelectorAll('.ecran').forEach(e => {
          if (e.id !== ancre) e.remove();
        });
      }

      const racine = ancre ? document.getElementById(ancre) : document.querySelector('main');
      const blocs = racine.querySelectorAll(':scope > section, :scope > .heros');
      let n = 0;
      blocs.forEach(b => {
        n++;
        b.classList.add('bloc-repere');
        const tag = document.createElement('span');
        tag.className = 'ref-bloc';
        tag.textContent = 'BLOC ' + n;
        b.insertBefore(tag, b.firstChild);
      });
      return n;
    }, { style: STYLE_RELECTURE, ancre });

    await page.pdf({
      path: path.join(DEST, nomPdf + '.pdf'),
      format: 'A4',
      landscape: true,
      printBackground: true,
      margin: { top: '14mm', bottom: '14mm', left: '8mm', right: '8mm' },
      displayHeaderFooter: true,
      headerTemplate: `<div style="width:100%;padding:0 12mm;font-family:Helvetica,sans-serif;font-size:8px;color:#7a6a5c;display:flex;justify-content:space-between;">
        <span>Fluent &amp; Forward — ${titre}</span><span>Relecture du site · août 2026</span></div>`,
      footerTemplate: `<div style="width:100%;padding:0 12mm;font-family:Helvetica,sans-serif;font-size:8px;color:#7a6a5c;text-align:right;">
        page <span class="pageNumber"></span> / <span class="totalPages"></span></div>`,
    });

    const taille = Math.round(fs.statSync(path.join(DEST, nomPdf + '.pdf')).size / 1024);
    console.log(`${nomPdf.padEnd(22)} ${String(blocs).padStart(2)} blocs   ${String(taille).padStart(4)} Ko`);
    await page.close();
  }

  await nav.close(); serveur.close();
})();
