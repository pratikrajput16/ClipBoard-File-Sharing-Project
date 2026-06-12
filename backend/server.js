const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 5000;
const UPLOAD_DIR = path.join(__dirname, 'uploads');
const HISTORY_FILE = path.join(__dirname, 'history.json');
const PIN_EXPIRY_MS = 10 * 60 * 1000;

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

// ─── History helpers ───────────────────────────────────────────────────────────
function loadHistory() {
  try {
    if (fs.existsSync(HISTORY_FILE)) return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
  } catch {}
  return [];
}

function saveHistory(history) {
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
}

function addToHistory(entry) {
  const history = loadHistory();
  history.unshift(entry); // newest first
  if (history.length > 200) history.splice(200); // cap at 200
  saveHistory(history);
}

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// ─── In-memory store ───────────────────────────────────────────────────────────
const store = new Map();

// ─── Multer config ─────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const uid = crypto.randomBytes(10).toString('hex');
    cb(null, uid + path.extname(file.originalname));
  }
});
const upload = multer({ storage, limits: { fileSize: 100 * 1024 * 1024 } });

// ─── Helpers ───────────────────────────────────────────────────────────────────
function generatePIN() {
  let pin;
  do { pin = Math.floor(100000 + Math.random() * 900000).toString(); }
  while (store.has(pin));
  return pin;
}

function scheduleExpiry(pin) {
  setTimeout(() => {
    const entry = store.get(pin);
    if (!entry) return;
    if (entry.type === 'file') {
      const fp = path.join(UPLOAD_DIR, entry.filename);
      if (fs.existsSync(fp)) fs.unlinkSync(fp);
    }
    // Mark as expired in history
    const history = loadHistory();
    const rec = history.find(h => h.pin === pin);
    if (rec && rec.status === 'pending') {
      rec.status = 'expired';
      saveHistory(history);
    }
    store.delete(pin);
    console.log(`[EXPIRED] PIN ${pin}`);
  }, PIN_EXPIRY_MS);
}

function isExpired(entry) {
  return Date.now() > entry.expiry;
}

function getFileExtension(filename) {
  return filename.split('.').pop().toUpperCase() || 'FILE';
}

// ─── Routes ────────────────────────────────────────────────────────────────────

app.get('/api/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

// Upload a file
app.post('/api/upload/file', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file provided' });

  const pin = generatePIN();
  const expiry = Date.now() + PIN_EXPIRY_MS;
  const now = Date.now();

  store.set(pin, {
    type: 'file',
    filename: req.file.filename,
    originalName: req.file.originalname,
    size: req.file.size,
    mimeType: req.file.mimetype,
    expiry,
    createdAt: now
  });

  // Save to history
  addToHistory({
    id: crypto.randomBytes(6).toString('hex'),
    pin,
    type: 'file',
    filename: req.file.originalname,
    fileExtension: getFileExtension(req.file.originalname),
    mimeType: req.file.mimetype,
    size: req.file.size,
    status: 'pending',
    createdAt: now,
    sentAt: null
  });

  scheduleExpiry(pin);
  console.log(`[FILE UPLOAD] "${req.file.originalname}" → PIN: ${pin}`);

  res.json({ pin, expiry, type: 'file', filename: req.file.originalname, size: req.file.size });
});

// Upload text
app.post('/api/upload/text', (req, res) => {
  const { text } = req.body;
  if (!text || typeof text !== 'string') return res.status(400).json({ error: 'No text provided' });
  if (text.length > 50000) return res.status(400).json({ error: 'Text too long (max 50,000 chars)' });

  const pin = generatePIN();
  const expiry = Date.now() + PIN_EXPIRY_MS;
  const now = Date.now();

  store.set(pin, { type: 'text', text, length: text.length, expiry, createdAt: now });

  addToHistory({
    id: crypto.randomBytes(6).toString('hex'),
    pin,
    type: 'text',
    preview: text.slice(0, 80),
    length: text.length,
    status: 'pending',
    createdAt: now,
    sentAt: null
  });

  scheduleExpiry(pin);
  console.log(`[TEXT UPLOAD] ${text.length} chars → PIN: ${pin}`);

  res.json({ pin, expiry, type: 'text', length: text.length });
});

// Check PIN
app.get('/api/check/:pin', (req, res) => {
  const entry = store.get(req.params.pin);
  if (!entry) return res.status(404).json({ error: 'Invalid or expired PIN' });
  if (isExpired(entry)) {
    store.delete(req.params.pin);
    return res.status(410).json({ error: 'PIN has expired' });
  }

  const base = {
    type: entry.type,
    expiry: entry.expiry,
    expiresIn: Math.round((entry.expiry - Date.now()) / 1000),
    createdAt: entry.createdAt
  };

  if (entry.type === 'file') {
    res.json({ ...base, filename: entry.originalName, size: entry.size, mimeType: entry.mimeType });
  } else {
    res.json({ ...base, length: entry.length, preview: entry.text.slice(0, 120) });
  }
});

// Receive content
app.get('/api/receive/:pin', (req, res) => {
  const entry = store.get(req.params.pin);
  if (!entry) return res.status(404).json({ error: 'Invalid or expired PIN' });
  if (isExpired(entry)) {
    store.delete(req.params.pin);
    return res.status(410).json({ error: 'PIN has expired' });
  }

  // Update history status
  const history = loadHistory();
  const rec = history.find(h => h.pin === req.params.pin);
  if (rec) { rec.status = 'received'; rec.sentAt = Date.now(); saveHistory(history); }

  if (entry.type === 'text') {
    const { text } = entry;
    store.delete(req.params.pin);
    console.log(`[TEXT RECEIVED] PIN: ${req.params.pin}`);
    return res.json({ type: 'text', text });
  }

  if (entry.type === 'file') {
    const filePath = path.join(UPLOAD_DIR, entry.filename);
    if (!fs.existsSync(filePath)) {
      store.delete(req.params.pin);
      return res.status(404).json({ error: 'File missing on server' });
    }
    console.log(`[FILE DOWNLOAD] "${entry.originalName}" PIN: ${req.params.pin}`);
    res.download(filePath, entry.originalName, (err) => {
      if (!err) {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        store.delete(req.params.pin);
        console.log(`[DELETED] "${entry.originalName}" after download`);
      }
    });
  }
});

// ─── History endpoints ─────────────────────────────────────────────────────────

// Get full history
app.get('/api/history', (req, res) => {
  res.json(loadHistory());
});

// Clear all history
app.delete('/api/history', (req, res) => {
  saveHistory([]);
  res.json({ success: true });
});

// Delete single history entry
app.delete('/api/history/:id', (req, res) => {
  const history = loadHistory().filter(h => h.id !== req.params.id);
  saveHistory(history);
  res.json({ success: true });
});

// Stats
app.get('/api/stats', (req, res) => {
  const active = Array.from(store.values()).filter(e => !isExpired(e));
  const history = loadHistory();
  res.json({
    activePins: active.length,
    totalTransfers: history.length,
    received: history.filter(h => h.status === 'received').length,
    expired: history.filter(h => h.status === 'expired').length,
  });
});

app.listen(PORT, () => {
  console.log(`\n🚀 FileBeam API running on http://localhost:${PORT}`);
  console.log(`📡 History stored at: ${HISTORY_FILE}\n`);
});
