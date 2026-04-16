# Skygalaxy-backend

Dedicated backend for Skygalaxy- portfolio.

## APIs
- `POST /api/auth/login`
- `POST /api/contact`
- `GET /api/feature-flags`
- `PUT /api/feature-flags` (requires Bearer token)

## Run
```bash
npm run api:start
```

## Contact Email Setup (Gmail)
1. Copy `.env.example` to `.env` inside `Skygalaxy-backend/`.
2. Set `CORS_ORIGIN` to either `*` to allow all origins or a comma-separated list of allowed frontend origins, for example `http://localhost:4200,https://skygalaxyinfotech.com`.
3. Set `SMTP_PASS` to your Gmail App Password for `skygalaxyinfotech@gmail.com`.
4. Keep `MAIL_FROM` and `MAIL_TO` as `skygalaxyinfotech@gmail.com` (or change if needed).

After this, when contact form is submitted:
- Admin notification is sent to `MAIL_TO` with full contact details.
- Customer receives a thank-you email on the submitted email address.

## Migration Scripts
SQL files are in `jd-fortfoliw-backed/migrations/`.

Create a new migration file:
```bash
npm run db:migration:new -- add_table_name
```

Apply SQL manually to your DB engine (SQLite/PostgreSQL/MySQL) as per your deployment setup.
