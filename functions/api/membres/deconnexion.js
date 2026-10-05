import { json, lireCookie, COOKIE_SESSION, cookieEffacement, empreinte, jetonPlausible, memeOrigine } from "../../../membres-serveur/outils.js";

export async function onRequestPost({ request, env }) {
  if (!memeOrigine(request)) return json({ ok: false }, 403);
  const jeton = lireCookie(request, COOKIE_SESSION);
  if (jetonPlausible(jeton)) {
    await env.DB.prepare("DELETE FROM sessions WHERE jeton_hash = ?").bind(await empreinte(jeton)).run();
  }
  return json({ ok: true }, 200, { "Set-Cookie": cookieEffacement() });
}
