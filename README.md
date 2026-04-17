# Skygalaxy-backend

Dedicated backend for Skygalaxy- portfolio.

## APIs
- `POST /api/auth/login`
- `POST /api/contact`
- `GET /api/inquiries` (requires Bearer token)
- `PUT /api/inquiries/:id` (requires Bearer token)
- `DELETE /api/inquiries/:id` (requires Bearer token)
- `GET /api/careers` (requires Bearer token)
- `GET /api/careers/:id` (requires Bearer token)
- `POST /api/careers` (requires Bearer token)
- `PUT /api/careers/:id` (requires Bearer token)
- `DELETE /api/careers/:id` (requires Bearer token)
- `GET /api/feature-flags`
- `PUT /api/feature-flags` (requires Bearer token)

## Career Payload
Career APIs use these fields:
- `jobTitle`
- `department`
- `location`
- `employmentType`
- `status`
- `experience`
- `fullDescription`

For `POST /api/careers`, all fields are required.
For `PUT /api/careers/:id`, send one or more of these fields.

## Contact API with Optional Attachment
Send contact requests as `multipart/form-data` with file field name `attachment`.

- Attachment is optional.
- Attachment is kept in memory only and sent in admin email.
- Attachment is not written to server storage.
- Max size is controlled by `MAX_ATTACHMENT_SIZE_MB` (default `8`).
- Contact response speed is controlled by `CONTACT_EMAIL_SYNC`.
	- `false` (recommended): API responds immediately and email is sent in background.
	- `true`: API waits for SMTP and can take longer if email provider is slow.

Frontend example:

```js
const formData = new FormData();
formData.append('name', values.name);
formData.append('email', values.email);
formData.append('phone', values.phone || '');
formData.append('company', values.company || '');
formData.append('requirement', values.requirement);
formData.append('message', values.message);

if (values.attachmentFile) {
	formData.append('attachment', values.attachmentFile);
}

await fetch('https://skygalaxy-backend.onrender.com/api/contact', {
	method: 'POST',
	body: formData,
});
```

Important for frontend:
- Do not manually set `Content-Type` for `FormData` requests.
- Let browser/axios set the multipart boundary automatically.
- If boundary is wrong or body stream is incomplete, request can stay pending until timeout.

Server safety timeout:
- `CONTACT_REQUEST_TIMEOUT_MS` (default `20000`) controls how long server waits for multipart body before returning `408`.

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
