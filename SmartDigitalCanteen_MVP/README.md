# CrimsonBite — Smart Digital Canteen System (MERN)

Redesigned Crimson Red & HCI-accessible MERN web application with live polling order tracking, accessible preference controls, guest & authenticated checkout, and an end-to-end kitchen/admin dashboard.

## Quick Start

### 1) Backend
```bash
cd backend
npm install
npm run seed           # optional: populates sample menu (also auto-seeds if empty)
npm run dev            # API on http://localhost:5000
```

### 2) Frontend
```bash
cd frontend
npm install
npm run dev            # UI on http://localhost:5173
```

## Single-Service Production Build (Render)
```bash
npm run build          # installs dependencies & builds frontend/dist
npm run start:prod     # serves API (/api/*) + frontend/dist via Express
```

Required environment variables on Render:
- `MONGO_URI` — MongoDB Atlas connection string
- `ADMIN_PASSWORD` — Passkey required to unlock `/admin`
- `JWT_SECRET` — Signing secret for `/api/auth` tokens
