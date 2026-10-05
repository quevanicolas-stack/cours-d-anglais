// Verrou réel des supports de cours : seul un membre connecté dont la
// semaine est atteinte reçoit le fichier. Les autres sont renvoyés vers
// la connexion ou vers leur espace.
import { sessionCourante, semaineCourante, semaineDuSupport, estAdmin } from "../../../membres-serveur/membres.js";

export async function onRequest({ request, env, next }) {
  const url = new URL(request.url);
  // Pages sert aussi les pages sans leur extension (« module1-seance1 ») :
  // un nom sans point est une page HTML, contrôlée comme telle.
  let fichier = decodeURIComponent(url.pathname.split("/").pop() || "");
  const page = !fichier.includes(".") || fichier.endsWith(".html");
  if (page && fichier && !fichier.endsWith(".html")) fichier += ".html";

  const membre = await sessionCourante(env, request);
  if (!membre) {
    if (page) return Response.redirect(`${url.origin}/membres/connexion`, 302);
    return new Response("Connexion requise", { status: 401 });
  }
  if (page && !estAdmin(env, membre)) {
    const semaine = semaineDuSupport(fichier);
    if (semaine === null || semaine > semaineCourante(membre)) {
      return Response.redirect(`${url.origin}/membres/espace`, 302);
    }
  }
  const reponse = await next();
  const copie = new Response(reponse.body, reponse);
  // Contenu réservé : jamais gardé par un cache partagé.
  copie.headers.set("Cache-Control", page ? "private, no-store" : "private, max-age=86400");
  return copie;
}
