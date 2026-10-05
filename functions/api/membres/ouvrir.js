// Ouverture du lien reçu par email : connecte ce navigateur, et la page de
// connexion restée en attente (ticket) si le lien en porte un.
import { json, lireJson, empreinte, jetonPlausible, maintenant } from "../../../membres-serveur/outils.js";
import { compteOuvert, ouvrirSession } from "../../../membres-serveur/membres.js";

export async function onRequestPost({ request, env }) {
  const corps = await lireJson(request);
  if (!jetonPlausible(corps.lien)) return json({ ok: false, erreur: "lien_invalide" }, 400);

  const ligne = await env.DB.prepare(
    "SELECT l.expire AS lien_expire, m.* FROM liens l JOIN membres m ON m.id = l.membre_id WHERE l.jeton_hash = ?",
  ).bind(await empreinte(corps.lien)).first();
  if (!ligne) return json({ ok: false, erreur: "lien_invalide" }, 400);
  if (new Date(ligne.lien_expire) < new Date()) return json({ ok: false, erreur: "lien_expire" }, 400);
  if (!compteOuvert(ligne)) return json({ ok: false, erreur: "compte_expire" }, 403);

  if (jetonPlausible(corps.t)) {
    await env.DB.prepare(
      "UPDATE attentes SET ouvert_le = ? WHERE ticket_hash = ? AND membre_id = ? AND ouvert_le IS NULL",
    ).bind(maintenant(), await empreinte(corps.t), ligne.id).run();
  }
  return json({ ok: true }, 200, { "Set-Cookie": await ouvrirSession(env, ligne) });
}
