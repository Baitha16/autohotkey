# License Management System

Express API + React frontend for license code management, deployable on Vercel.

## Folder Structure

```
api/index.js                  # Express API (Vercel serverless)
frontend/
├── index.html                # Vite entry
├── src/
│   ├── main.jsx              # React entry
│   ├── App.jsx               # Root component
│   ├── components/           # UI components
│   │   ├── Login.jsx         # Admin login
│   │   ├── Dashboard.jsx     # Main dashboard
│   │   ├── StatsBar.jsx      # Statistics cards
│   │   ├── Toolbar.jsx       # Action toolbar
│   │   ├── LicenseTable.jsx  # License table
│   │   ├── Modals.jsx        # Confirm/Prompt modals
│   │   └── Toast.jsx         # Toast notifications
│   ├── hooks/                # Custom hooks
│   └── lib/
│       └── api.js            # API client
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
ahk-client/main.ahk           # AutoHotkey client
supabase/migrations/          # Database schema
```

## Local Development

### 1. Setup environment

Copy `.env.example` to `.env` and fill in your Supabase credentials:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ADMIN_KEY=your-secret-admin-key
```

### 2. Run database migrations

Open **SQL Editor** in Supabase dashboard and paste `supabase/migrations/001_create_licenses.sql`.

### 3. Start backend

```bash
npm install
npm run dev
```

### 4. Start frontend (separate terminal)

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:5173` and proxies API calls to Express on `http://localhost:3000`.

## Deploy to Vercel

```bash
npm install -g vercel
vercel
```

Set environment variables in Vercel dashboard:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_KEY`

## API Reference

All endpoints return JSON with `success` boolean. Admin endpoints require `x-api-key` header.

| Endpoint | Method | Auth | Purpose |
|---|---|---|---|
| `/api/verify-license` | POST | Public | Validate and use a license |
| `/api/generate-trial` | POST | Public | Generate 1-hour trial |
| `/api/licenses` | GET | Admin | List all licenses |
| `/api/generate-code` | POST | Admin | Create a new license |
| `/api/extend-license` | POST | Admin | Extend license expiration |
| `/api/suspend-license` | POST | Admin | Toggle suspend/unsuspend |
| `/api/licenses` | DELETE | Admin | Delete a license |

## AutoHotkey Client

Edit `BASE_URL` in `ahk-client/main.ahk` to point to your server URL.
