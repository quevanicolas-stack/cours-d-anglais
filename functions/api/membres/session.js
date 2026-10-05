// Qui est connecté, et quel programme lui est ouvert.
import { json } from "../../../membres-serveur/outils.js";
import { sessionCourante, semaineCourante, programmePour, estAdmin } from "../../../membres-serveur/membres.js";

export async function onRequestGet({ request, env }) {
  const membre = await sessionCourante(env, request);
  if (!membre) return json({ ok: false, erreur: "non_connecte" }, 401);
  const admin = estAdmin(env, membre);
  return json({
    ok: true,
    prenom: membre.prenom,
    admin,
    semaine_courante: semaineCourante(membre),
    date_expiration: admin ? null : membre.date_expiration,
    programme: programmePour(membre, admin),
  });
}
