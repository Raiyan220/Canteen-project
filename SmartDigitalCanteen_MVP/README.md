# Smart Digital Canteen System — MERN MVP

This is a complete MVP following an MVC-friendly MERN layout with polling-based live order tracking.

## Quick Start
### 1) Backend
```
cd backend
cp .env.example .env   # edit if needed
npm install
npm run seed           # populate sample menu
npm run dev            # API on http://localhost:5000
```

### 2) Frontend
```
cd frontend
npm install
npm run dev            # UI on http://localhost:5173
```

Ensure MongoDB is running locally (default URI in `.env`).

## Deployment (Simple Guide)
- **Backend**: Host on Render/Railway/Heroku. Set env `MONGO_URI`, `ADMIN_PASSWORD`, `PORT`. Run `npm start`.
- **Frontend**: Build with `npm run build`, then host the `dist/` folder on Vercel/Netlify. Set `VITE_API_URL` to your backend URL.
- **Admin usage**: In the Admin page, set your admin key to match backend `ADMIN_PASSWORD`.

## Testing Checklist
- [ ] Menu displays items, category filter and search work
- [ ] Can add to cart, update quantities, see total
- [ ] Place order returns an order ID and ETA
- [ ] Order tracker updates (every 5s polling) through statuses
- [ ] Admin orders table shows new order
- [ ] Admin can change status to Preparing → Ready → Collected
- [ ] Cancel order works only while Pending
- [ ] Order history lists past orders for a name and allows reorder
- [ ] Favorites (♥) persists locally
- [ ] Admin can CRUD menu items
- [ ] Daily report shows totals and top-selling items

## Project Structure
- `backend/` — Express, Mongoose models, routes, controllers
- `frontend/` — React (Vite), Tailwind, components & pages
- `seed/` — sample data
- `public/images/` — placeholder images

## Notes
- Admin authentication uses a simple header `x-admin-key`. For production, switch to JWT.
- Live updates use polling for simplicity (Socket.IO can be added later).
