# ClipBoard



> Secure local file & text transfer via 6-digit PIN. No cloud. No login. No trace.

Built with **React + Vite** (frontend) and **Node.js + Express** (backend).

---

## 🗂️ Project Structure

```
filebeam/
├── backend/          ← Express API server
│   ├── server.js
│   ├── package.json
│   └── uploads/      ← Temporary file storage (auto-cleaned)
│
└── frontend/         ← React + Vite app
    ├── src/
    │   ├── pages/
    │   │   ├── HomePage.jsx     ← Landing page with animated beam
    │   │   ├── SendPage.jsx     ← Upload file or text → get PIN
    │   │   └── ReceivePage.jsx  ← Enter PIN → download/view content
    │   ├── components/
    │   │   └── Layout.jsx       ← Nav + footer
    │   ├── App.jsx
    │   └── main.jsx
    └── package.json
```

---

## 🚀 Setup & Run

### Step 1 — Start the backend

```bash
cd backend
npm install
npm start
# API running at http://localhost:5000
```

### Step 2 — Start the frontend

```bash
cd frontend
npm install
npm run dev
# App running at http://localhost:5173
```

### Step 3 — Open on your devices

| Device | URL |
|--------|-----|
| 💻 PC | `http://localhost:5173` |
| 📱 Mobile | `http://<YOUR-PC-IP>:5173` |

> Find your PC IP: run `ipconfig` (Windows) or `ifconfig` (Mac/Linux)

### Firewall (Windows) — allow port 5173

```
netsh advfirewall firewall add rule name="FileBeam-Frontend" dir=in action=allow protocol=TCP localport=5173
netsh advfirewall firewall add rule name="FileBeam-Backend" dir=in action=allow protocol=TCP localport=5000
```

---

## 📖 How It Works

1. Open **Send** on mobile → upload a file or paste text
2. A **6-digit PIN** is generated → valid for 10 minutes
3. Open **Receive** on PC → enter the PIN
4. Content downloads/displays → **PIN and file auto-deleted**

---

## 🔐 Security

- One-time PIN — each PIN works exactly once
- Auto-expiry — files deleted after 10 min if not received
- Auto-delete — file wiped immediately after download
- Local only — nothing leaves your network
- Random filenames — files stored with UUID names

---
