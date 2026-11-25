# Smart Digital Canteen (`Canteen-project`) — MERN Stack MVP

A full-stack **Smart Digital Canteen** ordering and management platform built with the **MERN** stack (`MongoDB`, `Express`, `React`, `Node.js`) inside [`SmartDigitalCanteen_MVP/`](SmartDigitalCanteen_MVP/). It supports digital menu browsing, authenticated & guest ordering, polling-based live order tracking, and an admin management dashboard.

---

## Features

- **Digital Menu & Filtering (`/`):** Browse menu items with category filters and search (`/api/menu`).
- **Authenticated & Guest Ordering:** Register/log in with JWT authentication (`/api/auth`, `/login`, `/register`) or place orders as a guest (`/api/guest`).
- **Cart & Live Order Tracking (`/history`):** Add/update items, place orders (`/api/orders`), and track order status updates via polling.
- **Admin Dashboard (`/admin`):** Protected admin endpoints (`/api/admin`) for managing menu items, orders, and super-admin setup.
- **Feedback Support:** Built-in customer feedback submission and persistence (`Feedback` model).

---

## Tech Stack

- **Frontend (`SmartDigitalCanteen_MVP/frontend/`):** React 18, Vite 5, React Router, Tailwind CSS, Axios, Framer Motion
- **Backend (`SmartDigitalCanteen_MVP/backend/`):** Node.js, Express, MongoDB (`Mongoose`), JWT (`jsonwebtoken`), `bcryptjs`, CORS, Morgan

---

## Project Structure

```text
└── SmartDigitalCanteen_MVP/
    ├── backend/
    │   ├── app.js           # Express app & API route mounting (/api/menu, /orders, /admin, /auth, /guest)
    │   ├── server.js        # Server entrypoint
    │   ├── models/          # Admin, Feedback, GuestUser, MenuItem, Order, User
    │   ├── routes/          # adminRoutes, authRoutes, feedbackRoutes, guestRoutes, menuRoutes, orderRoutes
    │   ├── controllers/     # Route business logic
    │   ├── seed/            # Sample menu seeder (npm run seed)
    │   └── scripts/         # Super-admin bootstrap script
    └── frontend/
        └── src/pages/       # Home, Login, Register, OrderHistory, AdminDashboard
```

---

## Running Locally

```bash
cd SmartDigitalCanteen_MVP
```

### 1. Backend
```bash
cd backend
npm install
npm run seed          # populate sample menu items
npm run dev           # starts API server (http://localhost:5000)
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev           # starts Vite dev server (http://localhost:5173)
```

Or run both together from `SmartDigitalCanteen_MVP/` with `npm start` (via `concurrently`). See [SmartDigitalCanteen_MVP/README.md](SmartDigitalCanteen_MVP/README.md) for deployment notes.
