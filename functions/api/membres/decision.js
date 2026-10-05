// Boutons « Valider / Refuser » de l'email envoyé à Aurélie. Le lien ouvre
// une page de confirmation : un logiciel qui parcourt les liens d'un email
// (antivirus, aperçu) ne doit jamais valider ou refuser à sa place.
import { pageSimple, echapper, empreinte, jetonPlausible } from "../../../membres-serveur/outils.js";
import { validerMembre } from "../../../membres-serveur/membres.js";

async function demandeDuJeton(env, jeton) {
  if (!jetonPlausible(jeton)) return null;
  return env.DB.prepare("SELECT * FROM membres WHERE decision_hash = ?").bind(await empreinte(jeton)).first();
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const jeton = url.searchParams.get("jeton");
  const choix = url.searchParams.get("choix") === "refuser" ? "refuser" : "valider";
  const membre = await demandeDuJeton(env, jeton);
  if (!membre || membre.statut !== "en_attente") {
    return pageSimple("Demande déjà traitée", `<p>Ce lien a déjà servi ou n'est plus valable.</p>
      <p><a href="/membres/admin.html">Voir tous les membres</a></p>`);
  }
  const qui = `<b>${echapper(membre.prenom)}</b> (${echapper(membre.email)})`;
  return pageSimple(choix === "valider" ? "Valider cet accès ?" : "Refuser cet accès ?", `
    <p>Demande de ${qui}.</p>
    <form method="post">
      <input type="hidden" name="jeton" value="${echapper(jeton)}">
      <button class="${choix === "valider" ? "vert" : "rouge"}" name="choix" value="${choix}">
        ${choix === "valider" ? "Valider et envoyer son lien" : "Refuser la demande"}</button>
      <button name="choix" value="${choix === "valider" ? "refuser" : "valider"}" style="background:none;color:#6b5a4f;text-decoration:underline">
        ${choix === "valider" ? "Plutôt refuser" : "Plutôt valider"}</button>
    </form>`);
}

export async function onRequestPost({ request, env }) {
  const formulaire = await request.formData();
  const jeton = String(formulaire.get("jeton") || "");
  const choix = formulaire.get("choix");
  const membre = await demandeDuJeton(env, jeton);
  if (!membre || membre.statut !== "en_attente") {
    return pageSimple("Demande déjà traitée", "<p>Ce lien a déjà servi ou n'est plus valable.</p>");
  }
  const qui = `${echapper(membre.prenom)} (${echapper(membre.email)})`;
  if (choix === "refuser") {
    await env.DB.prepare("UPDATE membres SET statut = 'refuse', decision_hash = NULL WHERE id = ?").bind(membre.id).run();
    return pageSimple("Demande refusée", `<p>La demande de ${qui} est refusée. Aucun email ne lui a été envoyé.</p>
      <p><a href="/membres/admin.html">Voir tous les membres</a></p>`);
  }
  const envoye = await validerMembre(env, membre, new URL(request.url).origin);
  return pageSimple("Accès validé", `<p>Le compte de ${qui} est validé pour 180 jours.</p>
    <p>${envoye ? "Son lien de connexion vient de lui être envoyé." : "<b>Attention :</b> l'email n'a pas pu partir. Le détail est dans la page d'administration."}</p>
    <p><a href="/membres/admin.html">Voir tous les membres</a></p>`);
}
