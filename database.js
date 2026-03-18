const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'health_vault.db');

let db;

function getDb() {
    if (!db) {
        db = new Database(DB_PATH);
        db.pragma('journal_mode = WAL');   // faster concurrent reads
        db.pragma('foreign_keys = ON');
        initSchema();
    }
    return db;
}

function initSchema() {
    db.exec(`
        -- ── Users ──────────────────────────────────────────────────────────────
        CREATE TABLE IF NOT EXISTS users (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            phone       TEXT    NOT NULL UNIQUE,
            name        TEXT    NOT NULL DEFAULT '',
            blood_group TEXT    NOT NULL DEFAULT '',
            chronic     TEXT    NOT NULL DEFAULT '',
            allergies   TEXT    NOT NULL DEFAULT '',
            medication  TEXT    NOT NULL DEFAULT '',
            created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
            updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
        );

        -- ── OTP store ───────────────────────────────────────────────────────────
        -- One active OTP per phone number; replaced on each new request.
        CREATE TABLE IF NOT EXISTS otps (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            phone       TEXT    NOT NULL UNIQUE,
            code        TEXT    NOT NULL,
            attempts    INTEGER NOT NULL DEFAULT 0,
            expires_at  TEXT    NOT NULL,
            created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
        );

        -- ── Files ───────────────────────────────────────────────────────────────
        CREATE TABLE IF NOT EXISTS files (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            original_name TEXT  NOT NULL,
            stored_name TEXT    NOT NULL UNIQUE,   -- UUID-based filename on disk
            mime_type   TEXT    NOT NULL,
            size_bytes  INTEGER NOT NULL,
            category    TEXT    NOT NULL DEFAULT 'Other',
            file_type   TEXT    NOT NULL DEFAULT 'Other',  -- PDF | Image | Other
            uploaded_at TEXT    NOT NULL DEFAULT (datetime('now'))
        );

        -- ── Nominees ────────────────────────────────────────────────────────────
        CREATE TABLE IF NOT EXISTS nominees (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            name        TEXT    NOT NULL,
            relationship TEXT   NOT NULL DEFAULT '',
            phone       TEXT    NOT NULL,
            email       TEXT    NOT NULL DEFAULT '',
            created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
        );

        -- ── Audit Logs ──────────────────────────────────────────────────────────
        CREATE TABLE IF NOT EXISTS audit_logs (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
            action      TEXT    NOT NULL,
            detail      TEXT    NOT NULL DEFAULT '',
            ip          TEXT    NOT NULL DEFAULT '',
            created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
        );
    `);
}

// ── Prepared-statement helpers ──────────────────────────────────────────────

const q = {
    // Users
    findUserByPhone:    () => getDb().prepare('SELECT * FROM users WHERE phone = ?'),
    findUserById:       () => getDb().prepare('SELECT * FROM users WHERE id = ?'),
    createUser:         () => getDb().prepare('INSERT INTO users (phone) VALUES (?) RETURNING *'),
    updateUser:         () => getDb().prepare(`
        UPDATE users SET name=?, blood_group=?, chronic=?, allergies=?, medication=?,
        updated_at=datetime('now') WHERE id=? RETURNING *
    `),

    // OTPs
    upsertOtp:          () => getDb().prepare(`
        INSERT INTO otps (phone, code, expires_at, attempts)
        VALUES (?, ?, ?, 0)
        ON CONFLICT(phone) DO UPDATE SET
            code=excluded.code, expires_at=excluded.expires_at, attempts=0,
            created_at=datetime('now')
    `),
    findOtp:            () => getDb().prepare('SELECT * FROM otps WHERE phone = ?'),
    incrementOtpAttempts: () => getDb().prepare('UPDATE otps SET attempts = attempts + 1 WHERE phone = ?'),
    deleteOtp:          () => getDb().prepare('DELETE FROM otps WHERE phone = ?'),

    // Files
    insertFile:         () => getDb().prepare(`
        INSERT INTO files (user_id, original_name, stored_name, mime_type, size_bytes, category, file_type)
        VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING *
    `),
    listFiles:          () => getDb().prepare('SELECT * FROM files WHERE user_id = ? ORDER BY uploaded_at DESC'),
    findFile:           () => getDb().prepare('SELECT * FROM files WHERE id = ? AND user_id = ?'),
    deleteFile:         () => getDb().prepare('DELETE FROM files WHERE id = ? AND user_id = ?'),

    // Nominees
    insertNominee:      () => getDb().prepare(`
        INSERT INTO nominees (user_id, name, relationship, phone, email)
        VALUES (?, ?, ?, ?, ?) RETURNING *
    `),
    listNominees:       () => getDb().prepare('SELECT * FROM nominees WHERE user_id = ? ORDER BY created_at ASC'),
    deleteNominee:      () => getDb().prepare('DELETE FROM nominees WHERE id = ? AND user_id = ?'),
    findNominee:        () => getDb().prepare('SELECT * FROM nominees WHERE id = ? AND user_id = ?'),

    // Audit
    insertLog:          () => getDb().prepare(`
        INSERT INTO audit_logs (user_id, action, detail, ip) VALUES (?, ?, ?, ?)
    `),
    listLogs:           () => getDb().prepare(`
        SELECT * FROM audit_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 100
    `),
};

module.exports = { getDb, q };
