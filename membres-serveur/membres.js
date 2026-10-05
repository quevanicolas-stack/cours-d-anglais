// Logique de l'espace membres, partagée par les fonctions de functions/.
import programme from "./programme.json";
import { envoyerCourriel } from "./courriel.js";
import {
  JOUR_MS, maintenant, dans, echapper, empreinte, jetonAleatoire, lireCookie,
  COOKIE_SESSION, cookieSession, jetonPlausible,
} from "./outils.js";

export const DUREE_COMPTE_J = 180;
export const VALIDITE_LIEN_H = 24;
export const DELAI_ENTRE_LIENS_S = 30;
export const DUREE_ATTENTE_H = 6;

export function emailsAdmin(env) {
  return String(env.ADMIN_EMAILS || "contact@fluentandforward.com")
    .split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
}

export function estAdmin(env, membre) {
  return !!membre && emailsAdmin(env).includes(membre.email);
}

export async function membreParEmail(env, email) {
  return env.DB.prepare("SELECT * FROM membres WHERE email = ?").bind(email).first();
}

export function compteOuvert(membre) {
  return !!membre && membre.statut === "valide" && !!membre.date_expiration
    && new Date(membre.date_expiration) > new Date();
}

// ---------- Sessions (cookie HttpOnly, une par appareil) ----------

export async function sessionCourante(env, requete) {
  const jeton = lireCookie(requete, COOKIE_SESSION);
  if (!jetonPlausible(jeton)) return null;
  const ligne = await env.DB.prepare(
    `SELECT m.* FROM sessions s JOIN membres m ON m.id = s.membre_id
     WHERE s.jeton_hash = ? AND s.expire > ?`,
  ).bind(await empreinte(jeton), maintenant()).first();
  return compteOuvert(ligne) ? ligne : null;
}

export async function ouvrirSession(env, membre) {
  const jeton = jetonAleatoire(32);
  await env.DB.prepare("INSERT INTO sessions (jeton_hash, membre_id, cree, expire) VALUES (?, ?, ?, ?)")
    .bind(await empreinte(jeton), membre.id, maintenant(), membre.date_expiration).run();
  return cookieSession(jeton, membre.date_expiration);
}

// ---------- Programme ----------

export function semaineCourante(membre) {
  const jours = Math.floor((Date.now() - new Date(membre.date_validation)) / JOUR_MS);
  return Math.floor(jours / 7) + 1;
}

export function programmePour(membre, admin) {
  const semaine = semaineCourante(membre);
  return programme.map((bloc) => ({
    semaine: bloc.semaine,
    titre: `${bloc.module} — ${bloc.titre}`,
    fichiers: bloc.supports,
    debloque: admin || bloc.semaine <= semaine,
  }));
}

// Semaine à laquelle un support devient accessible (null s'il n'est pas au programme).
export function semaineDuSupport(fichier) {
  for (const bloc of programme) {
    if (bloc.supports.some((s) => s.fichier === fichier)) return bloc.semaine;
  }
  return null;
}

// ---------- Emails ----------

function gabarit(prenom, paragraphes, bouton, note) {
  const texte = [`Bonjour ${prenom},`, "", ...paragraphes, "", bouton ? bouton.url : "", "", note || ""].join("\n");
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#2C1810;max-width:560px">
<p>Bonjour ${echapper(prenom)},</p>${paragraphes.map((p) => `<p>${echapper(p)}</p>`).join("")}
${bouton ? `<p style="margin:26px 0"><a href="${echapper(bouton.url)}" style="background:#1B6B4A;color:#fff;padding:13px 26px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block">${echapper(bouton.libelle)}</a></p>` : ""}
${note ? `<p style="color:#777;font-size:13px">${echapper(note)}</p>` : ""}
<p style="color:#777;font-size:13px">Fluent &amp; Forward — Business English Accelerator</p></div>`;
  return { texte, html };
}

export async function envoyerLienConnexion(env, membre, origine, ticket, premiereFois) {
  const jeton = jetonAleatoire(32);
  await env.DB.batch([
    env.DB.prepare("INSERT INTO liens (jeton_hash, membre_id, expire) VALUES (?, ?, ?)")
      .bind(await empreinte(jeton), membre.id, dans(VALIDITE_LIEN_H * 3600 * 1000)),
    env.DB.prepare("UPDATE membres SET dernier_lien = ? WHERE id = ?").bind(maintenant(), membre.id),
    env.DB.prepare("DELETE FROM liens WHERE expire < ?").bind(maintenant()),
  ]);
  const url = `${origine}/membres/connexion.html?lien=${jeton}${ticket ? "&t=" + ticket : ""}`;
  const { texte, html } = gabarit(
    membre.prenom,
    [premiereFois
      ? "Ton compte vient d'être validé. Clique sur le bouton ci-dessous pour accéder à ton espace."
      : "Clique sur le bouton ci-dessous pour accéder à ton espace."],
    { url, libelle: "Accéder à mon espace" },
    `Ce lien est valable ${VALIDITE_LIEN_H} heures. Une fois connecté, tu le restes sur cet appareil jusqu'à la fin de ton accès. Si tu n'as pas demandé ce lien, ignore simplement cet email.`,
  );
  return envoyerCourriel(env, {
    a: membre.email,
    sujet: premiereFois ? "Ton accès Fluent & Forward est prêt" : "Ton lien de connexion Fluent & Forward",
    texte, html,
  });
}

export async function prevenirAdmin(env, membre, origine, jetonDecision) {
  const base = `${origine}/api/membres/decision?jeton=${jetonDecision}`;
  const texte = [
    "Nouvelle demande d'accès à l'espace membres.", "",
    `Prénom : ${membre.prenom}`, `Email  : ${membre.email}`, "",
    `Répondre : ${base}`, "",
    `Tous les membres : ${origine}/membres/admin.html`,
  ].join("\n");
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#2C1810">
<p>Nouvelle demande d'accès à l'espace membres.</p>
<p><b>Prénom :</b> ${echapper(membre.prenom)}<br><b>Email :</b> ${echapper(membre.email)}</p>
<p style="margin:22px 0"><a href="${echapper(base)}&choix=valider" style="background:#1B6B4A;color:#fff;padding:11px 22px;border-radius:8px;text-decoration:none;font-weight:bold">Valider</a>
&nbsp;&nbsp;<a href="${echapper(base)}&choix=refuser" style="color:#A8452F">Refuser</a></p>
<p style="color:#777;font-size:13px">Chaque bouton demande une confirmation avant d'agir. Liste complète des membres :
<a href="${echapper(origine)}/membres/admin.html">page d'administration</a>.</p></div>`;
  const destinataires = emailsAdmin(env);
  for (const a of destinataires) {
    await envoyerCourriel(env, { a, sujet: `Demande d'accès — ${membre.prenom}`, texte, html });
  }
}

export async function validerMembre(env, membre, origine) {
  const debut = maintenant();
  await env.DB.prepare(
    "UPDATE membres SET statut = 'valide', decision_hash = NULL, date_validation = ?, date_expiration = ? WHERE id = ?",
  ).bind(debut, dans(DUREE_COMPTE_J * JOUR_MS), membre.id).run();
  const a_jour = await env.DB.prepare("SELECT * FROM membres WHERE id = ?").bind(membre.id).first();
  return envoyerLienConnexion(env, a_jour, membre.site || origine, null, true);
}
