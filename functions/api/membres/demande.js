// Demande d'accès : enregistre la personne et prévient Aurélie.
import { json, lireJson, normaliserEmail, emailValide, jetonAleatoire, empreinte, maintenant } from "../../../membres-serveur/outils.js";
import { membreParEmail, compteOuvert, prevenirAdmin } from "../../../membres-serveur/membres.js";

export async function onRequestPost({ request, env, waitUntil }) {
  const corps = await lireJson(request);
  const prenom = String(corps.prenom ?? "").trim().slice(0, 80);
  const email = normaliserEmail(corps.email);
  if (!prenom || !emailValide(email)) return json({ ok: false, erreur: "prenom_ou_email_invalide" }, 400);

  const existant = await membreParEmail(env, email);
  if (existant && existant.statut === "en_attente") return json({ ok: true, info: "deja_en_attente" });
  if (compteOuvert(existant)) return json({ ok: true, info: "deja_membre" });

  const jeton = jetonAleatoire(32);
  const origine = new URL(request.url).origin;
  await env.DB.prepare(
    `INSERT INTO membres (email, prenom, statut, decision_hash, site, date_demande)
     VALUES (?, ?, 'en_attente', ?, ?, ?)
     ON CONFLICT(email) DO UPDATE SET prenom = excluded.prenom, statut = 'en_attente',
       decision_hash = excluded.decision_hash, site = excluded.site, date_demande = excluded.date_demande`,
  ).bind(email, prenom, await empreinte(jeton), origine, maintenant()).run();

  const membre = await membreParEmail(env, email);
  waitUntil(prevenirAdmin(env, membre, origine, jeton));
  return json({ ok: true });
}
