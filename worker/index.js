// Point d'entrée du site sur Cloudflare Workers (compte d'Aurélie, domaine
// www.fluentandforward.com). Les fichiers du site sont servis tels quels
// depuis landing/ ; seuls l'API de l'espace membres et le verrou des cours
// passent par ce code (voir run_worker_first dans wrangler.jsonc).
//
// Les gestionnaires sont ceux de functions/, écrits au format Pages : on
// leur fournit le même contexte (request, env, waitUntil, next).
import * as demande from "../functions/api/membres/demande.js";
import * as decision from "../functions/api/membres/decision.js";
import * as lien from "../functions/api/membres/lien.js";
import * as ouvrir from "../functions/api/membres/ouvrir.js";
import * as attendre from "../functions/api/membres/attendre.js";
import * as session from "../functions/api/membres/session.js";
import * as deconnexion from "../functions/api/membres/deconnexion.js";
import * as admin from "../functions/api/membres/admin.js";
import * as verrouCours from "../functions/membres/cours/_middleware.js";

const ROUTES = {
  "/api/membres/demande": demande,
  "/api/membres/decision": decision,
  "/api/membres/lien": lien,
  "/api/membres/ouvrir": ouvrir,
  "/api/membres/attendre": attendre,
  "/api/membres/session": session,
  "/api/membres/deconnexion": deconnexion,
  "/api/membres/admin": admin,
};

function gestionnaire(module, methode) {
  const nom = "onRequest" + methode.charAt(0) + methode.slice(1).toLowerCase();
  return module[nom] || module.onRequest || null;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const contexte = {
      request,
      env,
      waitUntil: (promesse) => ctx.waitUntil(promesse),
      next: () => env.ASSETS.fetch(request),
    };

    const module = ROUTES[url.pathname.replace(/\/$/, "")];
    if (module) {
      const traiter = gestionnaire(module, request.method);
      if (!traiter) return new Response("Méthode non autorisée", { status: 405 });
      return traiter(contexte);
    }
    if (url.pathname.startsWith("/api/membres/")) return new Response("Introuvable", { status: 404 });
    if (url.pathname.startsWith("/membres/cours/")) return verrouCours.onRequest(contexte);
    return env.ASSETS.fetch(request);
  },
};
