# VoltMart — Hardware & Books Marketplace

A full-stack marketplace where people buy and sell electronics hardware (Arduino, ESP32-CAM,
Raspberry Pi, sensors, motors, power, tools) and technical books. Includes a complete admin
control panel, seller listings with moderation, order management, and a built-in security /
intrusion-detection dashboard.

- **Client:** Next.js 14 (App Router) + React 18, plain CSS design system
- **Server:** Node.js + Express + MongoDB (Mongoose), JWT auth
- **Currency:** NPR (Rs.)

---

## Features

**Storefront**
- Home with featured / newest products, categories, trust badges
- Shop with search, category filter, condition filter, sorting and pagination
- Product detail: image gallery, specs, seller info, reviews & ratings, related products
- Cart (persisted in `localStorage`), checkout with COD / bank transfer
- Accounts: dashboard, order history with cancel, profile & password management
- Sell page: list an item, upload images, track listing status / rejection reason

**Admin panel** (`/admin`, admin role only)
- Dashboard: revenue, orders, products, users, 7-day sales chart, low stock, top sellers
- Products: approve / reject (with reason) / archive / feature
- Orders: update status and payment status, cancel restores stock
- Users: change role and active / suspended status
- Categories: full CRUD with icons and ordering
- Reviews: hide / show and reply
- Settings: branding, shipping fees, payment toggles, bank details, contact, announcement
- Security: threat summary, top attack signatures, filterable audit trail

**Security**
- Helmet headers, CORS locked to the storefront origin
- Rate limiting (global + stricter auth limits), account lockout after 5 failed logins (15 min)
- bcrypt password hashing (12 rounds)
- JWT access token + httpOnly refresh-token cookie with rotation
- NoSQL-injection stripping (`express-mongo-sanitize`) and XSS sanitisation (`xss`)
- Lightweight IDS that logs SQLi / XSS / path-traversal / command-injection / NoSQL probes
- Full audit trail of user and admin actions

---

## Project structure

```
startup/
  package.json            # root orchestrator (concurrently)
  server/                 # Express API
    src/
      config/             # env + db connection
      controllers/        # route handlers
      middleware/         # auth, security, rate limit, errors
      models/             # Mongoose models
      routes/             # route definitions
      validators/         # express-validator rules
      seed.js             # seeds admin, demo users, categories, products, settings
      index.js            # app entry
    uploads/              # local image storage fallback (dev)
  client/                 # Next.js storefront + admin
    app/
      (shop)/             # storefront route group
      admin/              # admin panel
      layout.jsx
      globals.css         # design system
    components/           # Navbar, Footer, ProductCard, ui
    context/AppContext.jsx
    lib/                  # api client + formatters
```

---

## Prerequisites

- Node.js 18+ (tested on Node 24)
- MongoDB 6+ running locally, or a MongoDB Atlas connection string
- npm 9+

---

## Quick start

```bash
# 1. install dependencies for both apps
npm run install:all

# 2. configure the server environment
#    copy server/.env.example to server/.env and set JWT secrets / admin account
#    (a working server/.env is already present in this repo for local dev)

# 3. seed the database (admin + demo users, categories, 30 products, settings)
npm run seed

# 4. run API (http://localhost:5000) and storefront (http://localhost:3000)
npm run dev
```

Useful scripts (run from the repo root):

| Script | Description |
| --- | --- |
| `npm run install:all` | Install server + client dependencies |
| `npm run dev` | Run API and storefront together |
| `npm run dev:api` | API only (nodemon, port 5000) |
| `npm run dev:web` | Storefront only (port 3000) |
| `npm run seed` | Seed / upsert admin, demo users, categories, products, settings |
| `npm run build` | Production build of the Next.js client |
| `npm start` | Run both apps in production mode |

---

## Accounts (created by `npm run seed`)

| Role | Email | Password |
| --- | --- | --- |
| Admin | `j07089832@gmail.com` | `pratima@@@1234` |
| Seller (demo) | `seller@voltmart.demo` | `seller123` |
| Buyer (demo) | `buyer@voltmart.demo` | `buyer123` |

Change the admin password and JWT secrets before going live.

---

## Environment variables

**server/.env**

| Variable | Purpose |
| --- | --- |
| `PORT` | API port (default 5000) |
| `NODE_ENV` | `development` / `production` |
| `MONGODB_URI` | Mongo connection string |
| `JWT_SECRET` / `JWT_REFRESH_SECRET` | Token signing secrets (use long random strings) |
| `JWT_EXPIRES_IN` / `JWT_REFRESH_EXPIRES_IN` | Token lifetimes |
| `CLIENT_URL` | Allowed CORS origin (the storefront URL) |
| `ADMIN_NAME` / `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Seed admin account |
| `CLOUDINARY_*` | Optional. Leave blank to store uploads in `server/uploads` |

Generate secrets with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

**client/.env.local** (optional)

| Variable | Purpose |
| --- | --- |
| `API_PROXY_TARGET` | Upstream API for the Next.js `/api` rewrite (default `http://localhost:5000`) |
| `NEXT_PUBLIC_SITE_NAME` | Display name fallback |

The client talks to the API through Next.js rewrites (`/api/*`, `/uploads/*`, `/health`),
so no CORS setup is needed in the browser and the same code works in production.

---

## Local MongoDB (Windows note)

If you installed MongoDB from the ZIP archive, register it as a service once:

```
mongod --config C:\mongodb\mongod.cfg --install
```

Then start it with `net start MongoDB`. Data lives in `C:\mongodb\data` and logs in
`C:\mongodb\log\mongod.log` when using the sample config.

---

## Production deployment

**Database** — create a free MongoDB Atlas cluster and set `MONGODB_URI` to the SRV string.

**API (Render / Railway / Fly.io)**
1. Root/working dir: `server`
2. Build: `npm install` — Start: `npm start`
3. Set all `server/.env` variables (`NODE_ENV=production`, real secrets, `CLIENT_URL` = storefront URL)
4. Run `npm run seed` once (or set `ADMIN_*` and seed from a shell)
5. For persistent image uploads either configure Cloudinary or attach a disk to `/uploads`

**Storefront (Vercel or any Node host)**
1. Root/working dir: `client`
2. Build: `npm run build` — Start: `npm start`
3. Set `API_PROXY_TARGET` to the deployed API URL so `/api` rewrites point at it

Because the storefront proxies `/api` server-side, the browser only ever talks to the
storefront origin — keep `CLIENT_URL` on the API in sync with that origin.

---

## API overview

Base path: `/api`

| Area | Endpoints |
| --- | --- |
| Auth | `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me`, `PUT /auth/profile`, `PUT /auth/password` |
| Products | `GET /products`, `GET /products/:slugOrId`, `GET /products/:id/related`, `GET /products/:id/reviews`, `POST /products/reviews`, `GET /products/mine/list`, `POST /products`, `PUT /products/:id`, `DELETE /products/:id` |
| Categories | `GET /categories`, `POST/PUT/DELETE /categories/:id` (admin) |
| Orders | `POST /orders`, `GET /orders/mine`, `GET /orders/:id`, `PATCH /orders/:id/cancel` |
| Uploads | `POST /uploads/images`, `DELETE /uploads/:id` |
| Admin | `GET /admin/stats`, `/admin/users`, `/admin/products`, `/admin/orders`, `/admin/reviews`, `/admin/settings`, `/admin/audit-logs`, `/admin/security` |
| Health | `GET /health` |

All responses are `{ success, data, ... }` (list endpoints also return `pagination`).

---

## Notes

- Emails are normalised with `validator`'s `normalizeEmail` on save and on login. Note that
  for Gmail this strips dots in the local part (`first.last@gmail.com` becomes
  `firstlast@gmail.com`), so the seeded admin email is stored normalised.
- Uploads fall back to local disk when Cloudinary is not configured — fine for development,
  but use Cloudinary or a persistent volume in production.
