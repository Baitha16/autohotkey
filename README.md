# Membership License System

Supabase Edge Functions + AutoHotkey client for license code management.

## Folder Structure

```
supabase/
├── migrations/
│   └── 001_create_licenses.sql   # Database schema
├── functions/
│   ├── _shared/
│   │   ├── cors.ts               # CORS headers
│   │   ├── supabase.ts           # Supabase client
│   │   └── validation.ts         # Input validation
│   ├── generate-code/            # POST /generate-code
│   ├── login/                    # POST /login
│   ├── extend-license/           # POST /extend-license
│   ├── suspend-license/          # POST /suspend-license
│   └── delete-license/           # POST /delete-license
├── config.toml
ahk-client/
├── membership.ahk                # Reusable membership API module
└── main.ahk                      # Your main script (separate from membership)
```

## Deployment

### 1. Create Supabase project

Go to [supabase.com](https://supabase.com) and create a new project.

### 2. Run migrations

Open **SQL Editor** in Supabase dashboard and paste the contents of `001_create_licenses.sql`.

### 3. Deploy Edge Functions

Install Supabase CLI:

```bash
npm install -g supabase
```

Link your project:

```bash
cd supabase
supabase login
supabase link --project-ref your-project-ref
```

Deploy all functions:

```bash
supabase functions deploy generate-code
supabase functions deploy login
supabase functions deploy extend-license
supabase functions deploy suspend-license
supabase functions deploy delete-license
```

Set `verify_jwt = false` in `config.toml` (already done) so functions are publicly accessible.

### 4. Use in AutoHotkey

Edit `BASE_URL` in `ahk-client/membership.ahk` to point to your Supabase project URL.

```ahk
global BASE_URL := "https://your-project-ref.supabase.co/functions/v1"
```

Then `#Include "membership.ahk"` in your main script and call the functions directly.

## API Reference

All endpoints return JSON with `success` boolean.

| Endpoint | Method | Purpose |
|---|---|---|
| `/generate-code` | POST | Create a new license |
| `/verify-license` | POST | Validate and use a license |
| `/extend-license` | POST | Extend license expiration |
| `/suspend-license` | POST | Suspend a license |
| `/delete-license` | POST | Delete a license |
