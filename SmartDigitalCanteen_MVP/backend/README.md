# Smart Digital Canteen — Backend (Express + MongoDB)

## Setup
1. Copy `.env.example` to `.env` and tweak if needed:
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/canteen_db
ADMIN_PASSWORD=demo_password
JWT_SECRET=your_jwt_secret
```
2. Install & run:
```
cd backend
npm install
npm run dev
```

### Seed data
```
npm run seed
```

### API
- `GET /api/menu?category=Lunch&search=burger&specials=true`
- `GET /api/menu/:id`
- `POST /api/menu` (admin, header `x-admin-key`)
- `PUT /api/menu/:id` (admin)
- `DELETE /api/menu/:id` (admin)

- `POST /api/orders` `{ customerName, items: [{ menuItemId, qty }] }`
- `GET /api/orders/:id`
- `GET /api/orders?customerName=Raiyan`
- `PATCH /api/orders/:id/cancel`

- `GET /api/admin/orders` (admin) — active orders
- `PATCH /api/admin/orders/:id/status` (admin) — body `{ status }`
- `GET /api/admin/report/daily` (admin)

Admin auth: send header `x-admin-key: <ADMIN_PASSWORD>`.

### Feedback
- `POST /api/feedbacks` `{ orderId, rating, comment }`
- `GET /api/feedbacks?orderId=...`

### Admin Menu (mirrored)
- `POST /api/admin/menu` (admin)
- `PUT /api/admin/menu/:id` (admin)
- `DELETE /api/admin/menu/:id` (admin)
