// Interrogé par la page de connexion pendant qu'elle attend l'ouverture du lien.
import { json, empreinte, jetonPlausible, dans } from "../../../membres-serveur/outils.js";
import { compteOuvert, ouvrirSession, sessionCourante, DUREE_ATTENTE_H } from "../../../membres-serveur/membres.js";

export async function onRequestGet({ request, env }) {
  // Lien ouvert dans un autre onglet de ce navigateur : le cookie est déjà là.
  if (await sessionCourante(env, request)) return json({ ok: true });
  const ticket = new URL(request.url).searchParams.get("ticket");
  if (!jetonPlausible(ticket)) return json({ ok: false, erreur: "ticket_inconnu" }, 400);
  const hash = await empreinte(ticket);
  const ligne = await env.DB.prepare(
    `SELECT a.ouvert_le, m.* FROM attentes a JOIN membres m ON m.id = a.membre_id
     WHERE a.ticket_hash = ? AND a.cree > ?`,
  ).bind(hash, dans(-DUREE_ATTENTE_H * 3600 * 1000)).first();
  if (!ligne) return json({ ok: false, erreur: "ticket_inconnu" });
  if (!ligne.ouvert_le) return json({ ok: false, erreur: "en_attente" });
  if (!compteOuvert(ligne)) return json({ ok: false, erreur: "compte_expire" });

  await env.DB.prepare("DELETE FROM attentes WHERE ticket_hash = ?").bind(hash).run();
  return json({ ok: true }, 200, { "Set-Cookie": await ouvrirSession(env, ligne) });
}
