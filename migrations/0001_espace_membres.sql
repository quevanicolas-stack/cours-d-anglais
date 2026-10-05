-- Espace membres Fluent & Forward — base Cloudflare D1.
-- À coller une fois dans la console de la base (D1 → la base → Console).

CREATE TABLE IF NOT EXISTS membres (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  email            TEXT NOT NULL UNIQUE,
  prenom           TEXT NOT NULL,
  statut           TEXT NOT NULL DEFAULT 'en_attente',  -- en_attente | valide | refuse | revoque
  decision_hash    TEXT,                                -- jeton des boutons Valider / Refuser (empreinte)
  site             TEXT,                                -- adresse du site d'où vient la demande
  date_demande     TEXT NOT NULL,
  date_validation  TEXT,                                -- départ des 180 jours et des semaines
  date_expiration  TEXT,
  dernier_lien     TEXT                                 -- anti-envois répétés
);

-- Liens de connexion envoyés par email : 24 h, réutilisables, plusieurs
-- valables à la fois (un ancien email ne périme pas).
CREATE TABLE IF NOT EXISTS liens (
  jeton_hash  TEXT PRIMARY KEY,
  membre_id   INTEGER NOT NULL,
  expire      TEXT NOT NULL
);

-- Une session par appareil connecté, jusqu'à la fin du compte.
CREATE TABLE IF NOT EXISTS sessions (
  jeton_hash  TEXT PRIMARY KEY,
  membre_id   INTEGER NOT NULL,
  cree        TEXT NOT NULL,
  expire      TEXT NOT NULL
);

-- Pages de connexion qui attendent l'ouverture du lien (cercle de chargement).
CREATE TABLE IF NOT EXISTS attentes (
  ticket_hash  TEXT PRIMARY KEY,
  membre_id    INTEGER NOT NULL,
  cree         TEXT NOT NULL,
  ouvert_le    TEXT
);

-- Journal des emails envoyés, visible dans la page d'administration.
CREATE TABLE IF NOT EXISTS envois (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  date          TEXT NOT NULL,
  destinataire  TEXT NOT NULL,
  sujet         TEXT NOT NULL,
  ok            INTEGER NOT NULL,
  erreur        TEXT
);

CREATE INDEX IF NOT EXISTS idx_sessions_membre ON sessions (membre_id);
CREATE INDEX IF NOT EXISTS idx_liens_membre ON liens (membre_id);
