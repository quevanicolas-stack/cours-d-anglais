<?php
/* ==================================================================
   Fluent & Forward — collecteur de prospects

   Reçoit un contact envoyé par la landing page et l'ajoute au fichier
   de sauvegarde prospects.csv, puis met à jour statistiques.json.

   À déposer sur un hébergement qui exécute PHP (OVH, o2switch, Ionos,
   Hostinger, LWS…). GitHub Pages n'exécute pas PHP : dans ce cas,
   utiliser apps-script.gs à la place. Voir LISEZMOI.md.
   ================================================================== */

declare(strict_types=1);

// --- Réglages ------------------------------------------------------
// Dossier de stockage. Le placer HORS de la racine web si l'hébergement
// le permet, pour que les fichiers ne soient pas téléchargeables.
const DOSSIER   = __DIR__ . '/donnees';
const FICHIER   = DOSSIER . '/prospects.csv';
const STATS     = DOSSIER . '/statistiques.json';
// Domaines autorisés à envoyer des contacts. Remplacer par le domaine réel.
const ORIGINES  = ['https://fluentandforward.com', 'http://localhost:8000'];

// --- Garde-fous ----------------------------------------------------
$origine = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origine, ORIGINES, true)) {
    header('Access-Control-Allow-Origin: ' . $origine);
}
header('Content-Type: application/json; charset=utf-8');

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    http_response_code(405);
    exit(json_encode(['erreur' => 'Méthode non autorisée']));
}

$brut = file_get_contents('php://input');
if ($brut === false || strlen($brut) > 4096) {
    http_response_code(400);
    exit(json_encode(['erreur' => 'Requête invalide']));
}

$contact = json_decode($brut, true);
if (!is_array($contact)) {
    http_response_code(400);
    exit(json_encode(['erreur' => 'JSON illisible']));
}

// --- Validation ----------------------------------------------------
$prenom = trim((string)($contact['prenom'] ?? ''));
$email  = trim((string)($contact['email'] ?? ''));

if ($prenom === '' || mb_strlen($prenom) > 80) {
    http_response_code(422);
    exit(json_encode(['erreur' => 'Prénom manquant ou trop long']));
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL) || mb_strlen($email) > 160) {
    http_response_code(422);
    exit(json_encode(['erreur' => 'Adresse email invalide']));
}

$origineForm = substr((string)($contact['origine'] ?? 'inconnue'), 0, 40);
$provenance  = substr((string)($contact['provenance'] ?? 'direct'), 0, 300);

// Consentements. Le traitement est obligatoire côté formulaire ; la prospection
// et la demande de rappel sont facultatives et doivent être tracées séparément,
// c'est ce qui fait preuve en cas de contrôle.
$rgpd        = !empty($contact['consentementRgpd']) ? 'oui' : 'non';
$prospection = !empty($contact['accepteProspection']) ? 'oui' : 'non';
$rappel      = !empty($contact['demandeRappel']) ? 'oui' : 'non';

if ($rgpd !== 'oui') {
    http_response_code(422);
    exit(json_encode(['erreur' => 'Consentement au traitement manquant']));
}

// --- Écriture du fichier de sauvegarde -----------------------------
if (!is_dir(DOSSIER) && !mkdir(DOSSIER, 0750, true) && !is_dir(DOSSIER)) {
    http_response_code(500);
    exit(json_encode(['erreur' => 'Stockage indisponible']));
}

$nouveau = !file_exists(FICHIER);
$fp = fopen(FICHIER, 'a');
if ($fp === false) {
    http_response_code(500);
    exit(json_encode(['erreur' => 'Écriture impossible']));
}

// Le verrou évite deux écritures simultanées qui se mélangeraient.
flock($fp, LOCK_EX);

if ($nouveau) {
    // BOM UTF-8 : sans lui, Excel affiche les accents de travers.
    fwrite($fp, "\xEF\xBB\xBF");
    fputcsv($fp, ['date', 'prenom', 'email', 'consentement_rgpd', 'accepte_prospection', 'demande_rappel', 'origine', 'provenance'], ';');
}

fputcsv($fp, [
    date('Y-m-d H:i:s'),
    $prenom,
    $email,
    $rgpd,
    $prospection,
    $rappel,
    $origineForm,
    $provenance,
], ';');

flock($fp, LOCK_UN);
fclose($fp);

// --- Statistiques ---------------------------------------------------
$stats = ['total' => 0, 'par_jour' => [], 'par_origine' => [], 'emails_uniques' => 0,
          'accepte_prospection' => 0, 'demande_rappel' => 0];
if (file_exists(STATS)) {
    $lu = json_decode((string)file_get_contents(STATS), true);
    if (is_array($lu)) { $stats = $lu + $stats; }
}

$jour = date('Y-m-d');
$stats['total'] = ($stats['total'] ?? 0) + 1;
$stats['par_jour'][$jour] = ($stats['par_jour'][$jour] ?? 0) + 1;
$stats['par_origine'][$origineForm] = ($stats['par_origine'][$origineForm] ?? 0) + 1;
if ($prospection === 'oui') { $stats['accepte_prospection'] = ($stats['accepte_prospection'] ?? 0) + 1; }
if ($rappel === 'oui')      { $stats['demande_rappel'] = ($stats['demande_rappel'] ?? 0) + 1; }
$stats['derniere_maj'] = date('c');

// Compte les adresses distinctes en relisant le fichier de sauvegarde.
$uniques = [];
if (($fh = fopen(FICHIER, 'r')) !== false) {
    fgetcsv($fh, 0, ';'); // en-tête
    while (($ligne = fgetcsv($fh, 0, ';')) !== false) {
        if (isset($ligne[2])) { $uniques[strtolower($ligne[2])] = true; }
    }
    fclose($fh);
}
$stats['emails_uniques'] = count($uniques);

file_put_contents(STATS, json_encode($stats, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);

echo json_encode(['ok' => true, 'total' => $stats['total']]);
