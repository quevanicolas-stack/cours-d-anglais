// Demande d'un lien de connexion, depuis la page de connexion.
import { json, lireJson, normaliserEmail, emailValide, empreinte, jetonPlausible, maintenant, dans, JOUR_MS } from "../../../membres-serveur/outils.js";
import {
  membreParEmail, compteOuvert, envoyerLienConnexion, emailsAdmin, DELAI_ENTRE_LIENS_S,
} from "../../../membres-serveur/membres.js";

export async function onRequestPost({ request, env, waitUntil }) {
  const corps = await lireJson(request);
  const email = normaliserEmail(corps.email);
  if (!emailValide(email)) return json({ ok: false, erreur: "email_invalide" }, 400);

  // L'adresse d'administration a toujours un compte ouvert.
  if (emailsAdmin(env).includes(email)) {
    await env.DB.prepare(
      `INSERT INTO membres (email, prenom, statut, date_demande, date_validation, date_expiration)
       VALUES (?, 'Aurélie', 'valide', ?, ?, ?)
       ON CONFLICT(email) DO UPDATE SET statut = 'valide', date_expiration = excluded.date_expiration`,
    ).bind(email, maintenant(), maintenant(), dans(3650 * JOUR_MS)).run();
  }

  const membre = await membreParEmail(env, email);
  // Même réponse que l'adresse soit membre ou non : on ne révèle pas qui a un compte.
  if (!compteOuvert(membre)) {
    if (membre && membre.statut === "valide") return json({ ok: true, info: "compte_expire" });
    return json({ ok: true });
  }
  const ticket = jetonPlausible(corps.ticket) ? corps.ticket : null;
  if (ticket) {
    await env.DB.prepare("INSERT OR IGNORE INTO attentes (ticket_hash, membre_id, cree) VALUES (?, ?, ?)")
      .bind(await empreinte(ticket), membre.id, maintenant()).run();
  }
  if (membre.dernier_lien && Date.now() - new Date(membre.dernier_lien) < DELAI_ENTRE_LIENS_S * 1000) {
    return json({ ok: true, info: "patienter" });
  }
  // Marqué tout de suite, pour qu'un double clic n'envoie pas deux emails.
  await env.DB.prepare("UPDATE membres SET dernier_lien = ? WHERE id = ?").bind(maintenant(), membre.id).run();
  waitUntil(envoyerLienConnexion(env, membre, new URL(request.url).origin, ticket, false));
  return json({ ok: true });
}
