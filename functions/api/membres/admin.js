// Page d'administration : liste des membres et actions d'Aurélie.
import { json, lireJson, memeOrigine, normaliserEmail, emailValide, maintenant, JOUR_MS } from "../../../membres-serveur/outils.js";
import {
  sessionCourante, estAdmin, membreParEmail, validerMembre, DUREE_COMPTE_J,
} from "../../../membres-serveur/membres.js";

async function admin(env, request) {
  const membre = await sessionCourante(env, request);
  return estAdmin(env, membre) ? membre : null;
}

export async function onRequestGet({ request, env }) {
  if (!(await admin(env, request))) return json({ ok: false, erreur: "non_autorise" }, 403);
  const membres = await env.DB.prepare(
    `SELECT m.id, m.email, m.prenom, m.statut, m.date_demande, m.date_validation, m.date_expiration,
       (SELECT COUNT(*) FROM sessions s WHERE s.membre_id = m.id AND s.expire > ?) AS appareils
     FROM membres m ORDER BY CASE m.statut WHEN 'en_attente' THEN 0 ELSE 1 END, m.date_demande DESC`,
  ).bind(maintenant()).all();
  const envois = await env.DB.prepare("SELECT date, destinataire, sujet, ok, erreur FROM envois ORDER BY id DESC LIMIT 25").all();
  return json({ ok: true, membres: membres.results, envois: envois.results });
}

export async function onRequestPost({ request, env }) {
  if (!memeOrigine(request)) return json({ ok: false, erreur: "origine" }, 403);
  if (!(await admin(env, request))) return json({ ok: false, erreur: "non_autorise" }, 403);
  const corps = await lireJson(request);
  const origine = new URL(request.url).origin;

  if (corps.action === "ajouter") {
    const email = normaliserEmail(corps.email);
    const prenom = String(corps.prenom ?? "").trim().slice(0, 80);
    if (!prenom || !emailValide(email)) return json({ ok: false, erreur: "prenom_ou_email_invalide" }, 400);
    await env.DB.prepare(
      `INSERT INTO membres (email, prenom, statut, site, date_demande) VALUES (?, ?, 'en_attente', ?, ?)
       ON CONFLICT(email) DO UPDATE SET prenom = excluded.prenom`,
    ).bind(email, prenom, origine, maintenant()).run();
    const membre = await membreParEmail(env, email);
    const envoye = await validerMembre(env, membre, origine);
    return json({ ok: true, envoye });
  }

  const membre = await env.DB.prepare("SELECT * FROM membres WHERE id = ?").bind(Number(corps.id) || 0).first();
  if (!membre) return json({ ok: false, erreur: "membre_inconnu" }, 404);

  if (corps.action === "valider") {
    const envoye = await validerMembre(env, membre, origine);
    return json({ ok: true, envoye });
  }
  if (corps.action === "refuser") {
    await env.DB.prepare("UPDATE membres SET statut = 'refuse', decision_hash = NULL WHERE id = ?").bind(membre.id).run();
    return json({ ok: true });
  }
  if (corps.action === "revoquer") {
    await env.DB.batch([
      env.DB.prepare("UPDATE membres SET statut = 'revoque' WHERE id = ?").bind(membre.id),
      env.DB.prepare("DELETE FROM sessions WHERE membre_id = ?").bind(membre.id),
      env.DB.prepare("DELETE FROM liens WHERE membre_id = ?").bind(membre.id),
    ]);
    return json({ ok: true });
  }
  if (corps.action === "prolonger") {
    const base = Math.max(Date.now(), new Date(membre.date_expiration || 0).getTime());
    const expiration = new Date(base + DUREE_COMPTE_J * JOUR_MS).toISOString();
    await env.DB.batch([
      env.DB.prepare("UPDATE membres SET statut = 'valide', date_expiration = ? WHERE id = ?").bind(expiration, membre.id),
      env.DB.prepare("UPDATE sessions SET expire = ? WHERE membre_id = ?").bind(expiration, membre.id),
    ]);
    return json({ ok: true });
  }
  return json({ ok: false, erreur: "action_inconnue" }, 400);
}
