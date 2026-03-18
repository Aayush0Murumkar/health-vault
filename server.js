require('dotenv').config();

const express    = require('express');
const cors       = require('cors');
const path       = require('path');
const rateLimit  = require('express-rate-limit');

// ── Validate required env vars ────────────────────────────────────────────────
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 16) {
    console.error('❌  JWT_SECRET is missing or too short. Set it in your .env file.');
    process.exit(1);
}

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Global rate limit: 200 requests per IP per minute ─────────────────────────
app.use(rateLimit({
    windowMs: 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests. Slow down.' }
}));

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',   // tighten in production
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ── Health check (no auth) ────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/auth',      require('./routes/auth'));
app.use('/profile',   require('./routes/profile'));
app.use('/files',     require('./routes/files'));
app.use('/nominees',  require('./routes/nominees'));
app.use('/logs',      require('./routes/logs'));

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`\n✅  Health Vault API running on http://localhost:${PORT}`);
    console.log(`   GET  /health          — liveness probe`);
    console.log(`   POST /auth/send-otp   — request OTP`);
    console.log(`   POST /auth/verify-otp — verify OTP → JWT`);
    console.log(`   GET  /profile         — get user profile`);
    console.log(`   PUT  /profile         — update user profile`);
    console.log(`   GET  /files           — list files`);
    console.log(`   POST /files           — upload file`);
    console.log(`   GET  /files/:id/download`);
    console.log(`   DEL  /files/:id       — delete file`);
    console.log(`   GET  /nominees        — list nominees`);
    console.log(`   POST /nominees        — add nominee`);
    console.log(`   DEL  /nominees/:id    — remove nominee`);
    console.log(`   GET  /logs            — audit log\n`);
});

module.exports = app;
