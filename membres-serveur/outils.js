// Utilitaires partagés par les fonctions de l'espace membres.

export const JOUR_MS = 24 * 3600 * 1000;

export function maintenant() {
  return new Date().toISOString();
}

export function dans(ms) {
  return new Date(Date.now() + ms).toISOString();
}

export function json(donnees, statut = 200, entetes = {}) {
  return new Response(JSON.stringify(donnees), {
    status: statut,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...entetes },
  });
}

export async function lireJson(requete) {
  try {
    return await requete.json();
  } catch {
    return {};
  }
}

export function echapper(texte) {
  return String(texte ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

export function emailValide(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) && email.length <= 200;
}

export function normaliserEmail(email) {
  return String(email ?? "").trim().toLowerCase();
}

export function jetonAleatoire(octets = 32) {
  const b = new Uint8Array(octets);
  crypto.getRandomValues(b);
  return btoa(String.fromCharCode(...b)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// Les jetons ne sont jamais conservés en clair : seulement leur empreinte.
export async function empreinte(texte) {
  const h = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(String(texte)));
  return [...new Uint8Array(h)].map((o) => o.toString(16).padStart(2, "0")).join("");
}

export function jetonPlausible(jeton) {
  return /^[A-Za-z0-9_-]{24,100}$/.test(String(jeton ?? ""));
}

export function lireCookie(requete, nom) {
  const brut = requete.headers.get("Cookie") || "";
  for (const morceau of brut.split(";")) {
    const [cle, ...reste] = morceau.trim().split("=");
    if (cle === nom) return reste.join("=");
  }
  return null;
}

export const COOKIE_SESSION = "ff_session";

export function cookieSession(jeton, expireIso) {
  const maxAge = Math.max(0, Math.floor((new Date(expireIso) - Date.now()) / 1000));
  return `${COOKIE_SESSION}=${jeton}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

export function cookieEffacement() {
  return `${COOKIE_SESSION}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

// Une requête qui modifie quelque chose doit venir du site lui-même.
export function memeOrigine(requete) {
  const origine = requete.headers.get("Origin");
  return !origine || origine === new URL(requete.url).origin;
}

export function pageSimple(titre, corps, statut = 200) {
  return new Response(
    `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>${echapper(titre)} — Fluent &amp; Forward</title>
<link rel="stylesheet" href="/assets/polices/polices.css">
<style>
body{margin:0;font-family:'DM Sans',system-ui,sans-serif;background:#FAF7F2;color:#2C1810;line-height:1.6}
.carte{max-width:520px;margin:12vh auto 0;background:#fff;border:1px solid rgba(44,24,16,.13);border-radius:14px;padding:34px 30px;box-shadow:0 18px 44px rgba(11,42,32,.08)}
.oeil{font:700 .68rem 'Plus Jakarta Sans',sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#1B6B4A}
h1{font:800 1.5rem 'Plus Jakarta Sans',sans-serif;letter-spacing:-.02em;margin:10px 0 12px}
button{font:700 1rem 'Plus Jakarta Sans',sans-serif;border:0;border-radius:10px;padding:14px 22px;cursor:pointer;margin:18px 10px 0 0}
.vert{background:#1B6B4A;color:#fff}.rouge{background:#A8452F;color:#fff}
a{color:#1B6B4A}
</style></head><body><div class="carte"><span class="oeil">Espace membres</span>
<h1>${echapper(titre)}</h1>${corps}</div></body></html>`,
    { status: statut, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } },
  );
}
