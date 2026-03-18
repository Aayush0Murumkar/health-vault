/**
 * db.js — SQLite database setup via better-sqlite3
 *
 * Tables
 * ──────
 *  users        — registered users (phone-based auth)
 *  otps         — short-lived OTP codes for login
 *  records      — uploaded medical files
 *  nominees     — emergency contacts / nominees per user
 *  audit_logs   — immutable activity log
 */

const Database = require('better-sqlite3');
const path = require('path');
require('dotenv').config();

const DB_PATH = process.env.DB_PATH || './health_vault.db';

const db = new Database(path.resolve(DB_PATH));

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ─── MIGRATIONS ──────────────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            TEXT PRIMARY KEY,
    phone         TEXT UNIQUE NOT NULL,
    name          TEXT NOT NULL DEFAULT 'New User',
    blood_group   TEXT NOT NULL DEFAULT 'Unknown',
    chronic       TEXT,
    allergies     TEXT,
    medication    TEXT,
    language      TEXT NOT NULL DEFAULT 'en',
    created_at    INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at    INTEGER NOT NULL DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS otps (
    id         TEXT PRIMARY KEY,
    phone      TEXT NOT NULL,
    code       TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    used       INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS records (
    id            TEXT PRIMARY KEY,
    user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    original_name TEXT NOT NULL,
    stored_name   TEXT NOT NULL,
    mime_type     TEXT NOT NULL,
    size_bytes    INTEGER NOT NULL,
    category      TEXT NOT NULL DEFAULT 'Other',
    file_type     TEXT NOT NULL DEFAULT 'Other',
    uploaded_at   INTEGER NOT NULL DEFAULT (unixepoch()),

    CHECK (category IN ('Lab Report', 'Prescription', 'Scan / Imaging', 'Other')),
    CHECK (file_type IN ('PDF', 'Image', 'Other'))
  );

  CREATE TABLE IF NOT EXISTS nominees (
    id         TEXT PRIMARY KEY,
    user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name       TEXT NOT NULL,
    relation   TEXT NOT NULL DEFAULT '',
    phone      TEXT NOT NULL,
    email      TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id         TEXT PRIMARY KEY,
    user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action     TEXT NOT NULL,
    meta       TEXT,
    ip         TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  );

  -- Indexes for common queries
  CREATE INDEX IF NOT EXISTS idx_records_user   ON records(user_id);
  CREATE INDEX IF NOT EXISTS idx_nominees_user  ON nominees(user_id);
  CREATE INDEX IF NOT EXISTS idx_logs_user      ON audit_logs(user_id);
  CREATE INDEX IF NOT EXISTS idx_otps_phone     ON otps(phone);
`);

module.exports = db;
