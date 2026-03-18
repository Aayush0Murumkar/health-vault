# Health Vault — Backend API

A Node.js + Express REST API backed by SQLite for the Health Vault mobile app.

---

## Stack

| Layer        | Choice              |
|--------------|---------------------|
| Runtime      | Node.js ≥ 18        |
| Framework    | Express 4           |
| Database     | SQLite (better-sqlite3) |
| Auth         | OTP → JWT (7-day)   |
| File storage | Local disk (multer) |
| SMS (opt.)   | Twilio              |

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Create your .env
cp .env.example .env
# Open .env and set JWT_SECRET to a long random string

# 3. Start (dev mode with auto-reload)
npm run dev

# 4. Start (production)
npm start
```

The server starts on **http://localhost:3001** by default.

---

## Authentication Flow

```
Client                        Server
  │                              │
  │  POST /auth/send-otp         │
  │  { phone: "+91..." }  ──────►│  generates 6-digit OTP
  │                              │  saves to DB (10 min TTL)
  │◄── { dev_otp: "123456" } ───│  (dev mode only — printed + returned)
  │                              │
  │  POST /auth/verify-otp       │
  │  { phone, otp }       ──────►│  validates OTP
  │◄── { token, user }   ───────│  returns JWT + user profile
  │                              │
  │  GET /profile                │
  │  Authorization: Bearer <tok>►│
  │◄── { ...profile }   ────────│
```

All routes except `/auth/*` and `/health` require `Authorization: Bearer <token>`.

---

## API Reference

### Auth

| Method | Path                 | Body                  | Description                   |
|--------|----------------------|-----------------------|-------------------------------|
| POST   | /auth/send-otp       | `{ phone }`           | Send OTP (dev: returned inline)|
| POST   | /auth/verify-otp     | `{ phone, otp }`      | Verify OTP → JWT              |

### Profile

| Method | Path       | Body                                              | Description    |
|--------|------------|---------------------------------------------------|----------------|
| GET    | /profile   | —                                                 | Get profile    |
| PUT    | /profile   | `{ name, blood_group, chronic, allergies, medication }` | Update profile |

### Files

| Method | Path                    | Body / Query                    | Description      |
|--------|-------------------------|---------------------------------|------------------|
| GET    | /files                  | `?type=PDF&category=...&q=...`  | List files       |
| POST   | /files                  | multipart: `file`, `category`   | Upload file      |
| GET    | /files/:id/download     | —                               | Download file    |
| DELETE | /files/:id              | —                               | Delete file      |

**Allowed MIME types:** `application/pdf`, `image/jpeg`, `image/png`, `image/webp`, `image/gif`  
**Max size:** 10 MB (configurable via `MAX_FILE_SIZE_MB` in `.env`)

### Nominees

| Method | Path             | Body                                    | Description       |
|--------|------------------|-----------------------------------------|-------------------|
| GET    | /nominees        | —                                       | List nominees     |
| POST   | /nominees        | `{ name, relationship, phone, email }`  | Add nominee       |
| DELETE | /nominees/:id    | —                                       | Remove nominee    |

### Logs

| Method | Path   | Description                    |
|--------|--------|--------------------------------|
| GET    | /logs  | Last 100 audit events for user |

---

## Connecting the Frontend

Replace the in-memory `store` in the frontend with API calls. Example (login):

```js
// 1. Request OTP
await fetch('http://localhost:3001/auth/send-otp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ phone: '+919876543210' })
});

// 2. Verify OTP → get token
const { token, user } = await fetch('http://localhost:3001/auth/verify-otp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ phone: '+919876543210', otp: '123456' })
}).then(r => r.json());

// Store token, attach to all subsequent requests
const authHeaders = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`
};

// 3. Upload a file
const form = new FormData();
form.append('file', fileInput.files[0]);
form.append('category', 'Lab Report');
await fetch('http://localhost:3001/files', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: form
});

// 4. Download a file (opens save dialog)
window.open(`http://localhost:3001/files/3/download?token=${token}`);
```

---

## Production Checklist

- [ ] Set `JWT_SECRET` to a 64-char random string
- [ ] Set `USE_REAL_SMS=true` and configure Twilio credentials
- [ ] Set `CORS_ORIGIN` to your frontend domain
- [ ] Move `uploads/` and `health_vault.db` to a persistent volume
- [ ] Add HTTPS (nginx / Caddy reverse proxy)
- [ ] Consider S3/R2 for file storage at scale

---

## Project Structure

```
health-vault-backend/
├── server.js          ← Express app entry point
├── database.js        ← SQLite schema + prepared statements
├── middleware/
│   └── auth.js        ← JWT verification middleware
├── routes/
│   ├── auth.js        ← OTP send + verify
│   ├── profile.js     ← GET / PUT user profile
│   ├── files.js       ← Upload / download / delete
│   ├── nominees.js    ← CRUD nominees
│   └── logs.js        ← Audit log read
├── uploads/           ← Stored files (git-ignored)
├── health_vault.db    ← SQLite database (git-ignored)
├── .env.example       ← Environment variable template
└── package.json
```
