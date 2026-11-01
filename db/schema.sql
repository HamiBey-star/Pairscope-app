-- Cloudflare D1 schema used by functions/api/votes.js (binding name: DB).
-- Safe to run more than once. It does not change an existing table.
CREATE TABLE IF NOT EXISTS votes (
  token TEXT NOT NULL,   -- "<chain>:<address>" or address
  voter TEXT NOT NULL,   -- sha-256 of (VOTE_SALT + IP + user agent), first 32 hex chars
  type  TEXT NOT NULL,   -- rocket | fire | poop | flag
  PRIMARY KEY (token, voter)
);
CREATE INDEX IF NOT EXISTS votes_token ON votes (token);
