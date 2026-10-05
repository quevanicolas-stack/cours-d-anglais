// Envoi des emails par le serveur SMTP de la boîte contact@ (hébergée chez
// LWS) : les messages partent réellement de cette adresse, sans service
// tiers ni réglage DNS supplémentaire.
//
// Réglages (Cloudflare Pages → Settings → Variables and Secrets) :
//   SMTP_HOTE         serveur d'envoi indiqué par LWS
//   SMTP_PORT         465 (TLS direct, par défaut) ou 587 (STARTTLS)
//   SMTP_UTILISATEUR  l'adresse de la boîte, contact@fluentandforward.com
//   SMTP_MOT_DE_PASSE mot de passe de la boîte (à saisir comme « Secret »)
//   SMTP_SECURITE     facultatif : "aucune" sert uniquement aux tests locaux

import { connect } from "cloudflare:sockets";
import { maintenant, jetonAleatoire } from "./outils.js";

const NOM_EXPEDITEUR = "Fluent & Forward";

function base64Utf8(texte) {
  const octets = new TextEncoder().encode(texte);
  let binaire = "";
  for (let i = 0; i < octets.length; i += 0x8000) binaire += String.fromCharCode(...octets.subarray(i, i + 0x8000));
  return btoa(binaire);
}

function enLignes(b64) {
  return b64.replace(/.{1,76}/g, "$&\r\n");
}

function entete(texte) {
  return /^[\x20-\x7e]*$/.test(texte) ? texte : `=?UTF-8?B?${base64Utf8(texte)}?=`;
}

export function composerMessage({ de, a, repondreA, sujet, texte, html }) {
  const limite = "ff-" + jetonAleatoire(12);
  const domaine = de.split("@")[1] || "localhost";
  const lignes = [
    `From: "${NOM_EXPEDITEUR}" <${de}>`,
    `To: <${a}>`,
    `Reply-To: <${repondreA || de}>`,
    `Subject: ${entete(sujet)}`,
    `Date: ${new Date().toUTCString().replace("GMT", "+0000")}`,
    `Message-ID: <${jetonAleatoire(16)}@${domaine}>`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${limite}"`,
    "",
    `--${limite}`,
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    enLignes(base64Utf8(texte)),
    `--${limite}`,
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    enLignes(base64Utf8(html)),
    `--${limite}--`,
    "",
  ];
  return lignes.join("\r\n");
}

class ConnexionSmtp {
  constructor(socket) {
    this.brancher(socket);
    this.tampon = "";
  }

  brancher(socket) {
    this.socket = socket;
    this.lecteur = socket.readable.getReader();
    this.ecrivain = socket.writable.getWriter();
    this.decodeur = new TextDecoder();
  }

  async lireReponse() {
    // Une réponse peut tenir sur plusieurs lignes « 250-… » et se termine
    // par une ligne « 250 … ».
    for (;;) {
      const lignes = this.tampon.split("\r\n");
      for (let i = 0; i < lignes.length - 1; i++) {
        if (/^\d{3} /.test(lignes[i]) || /^\d{3}$/.test(lignes[i])) {
          const reponse = lignes.slice(0, i + 1).join("\n");
          this.tampon = lignes.slice(i + 1).join("\r\n");
          return { code: Number(lignes[i].slice(0, 3)), texte: reponse };
        }
      }
      const { value, done } = await this.lecteur.read();
      if (done) throw new Error("connexion SMTP fermée par le serveur");
      this.tampon += this.decodeur.decode(value, { stream: true });
    }
  }

  async commande(ligne, attendu, masque) {
    await this.ecrivain.write(new TextEncoder().encode(ligne + "\r\n"));
    const r = await this.lireReponse();
    if (!attendu.includes(r.code)) {
      throw new Error(`SMTP « ${masque || ligne.split(" ")[0]} » refusé : ${r.texte}`);
    }
    return r;
  }

  async passerEnTls() {
    this.lecteur.releaseLock();
    this.ecrivain.releaseLock();
    this.brancher(this.socket.startTls());
    this.tampon = "";
  }

  async fermer() {
    try { await this.commande("QUIT", [221]); } catch { /* sans importance */ }
    try { await this.socket.close(); } catch { /* idem */ }
  }
}

export async function envoyerSmtp(env, message) {
  const hote = env.SMTP_HOTE;
  const utilisateur = env.SMTP_UTILISATEUR;
  const motDePasse = env.SMTP_MOT_DE_PASSE;
  if (!hote || !utilisateur || !motDePasse) throw new Error("SMTP non configuré (SMTP_HOTE, SMTP_UTILISATEUR, SMTP_MOT_DE_PASSE)");
  const port = Number(env.SMTP_PORT || 465);
  const securite = env.SMTP_SECURITE || (port === 465 ? "tls" : "starttls");

  const socket = connect({ hostname: hote, port }, {
    secureTransport: securite === "tls" ? "on" : securite === "starttls" ? "starttls" : "off",
  });
  const smtp = new ConnexionSmtp(socket);
  try {
    let r = await smtp.lireReponse();
    if (r.code !== 220) throw new Error("SMTP : accueil inattendu " + r.texte);
    const nomLocal = (utilisateur.split("@")[1] || "localhost");
    r = await smtp.commande(`EHLO ${nomLocal}`, [250]);
    if (securite === "starttls") {
      await smtp.commande("STARTTLS", [220]);
      await smtp.passerEnTls();
      r = await smtp.commande(`EHLO ${nomLocal}`, [250]);
    }
    await smtp.commande("AUTH LOGIN", [334]);
    await smtp.commande(btoa(utilisateur), [334], "identifiant");
    await smtp.commande(btoa(motDePasse), [235], "mot de passe");
    await smtp.commande(`MAIL FROM:<${message.de}>`, [250]);
    await smtp.commande(`RCPT TO:<${message.a}>`, [250, 251]);
    await smtp.commande("DATA", [354]);
    // Une ligne commençant par un point est doublée (règle SMTP).
    const corps = composerMessage(message).replace(/\r\n\./g, "\r\n..");
    await smtp.commande(corps + "\r\n.", [250], "contenu du message");
  } finally {
    await smtp.fermer();
  }
}

// Envoie et note le résultat dans le journal (page d'administration).
export async function envoyerCourriel(env, { a, sujet, texte, html }) {
  const de = env.SMTP_UTILISATEUR;
  let erreur = null;
  try {
    await envoyerSmtp(env, { de, a, repondreA: env.REPONDRE_A || de, sujet, texte, html });
  } catch (e) {
    erreur = String(e && e.message || e);
  }
  try {
    await env.DB.prepare("INSERT INTO envois (date, destinataire, sujet, ok, erreur) VALUES (?, ?, ?, ?, ?)")
      .bind(maintenant(), a, sujet, erreur ? 0 : 1, erreur).run();
  } catch { /* le journal ne doit jamais bloquer un envoi */ }
  if (erreur) console.error("Envoi impossible à " + a + " : " + erreur);
  return !erreur;
}
