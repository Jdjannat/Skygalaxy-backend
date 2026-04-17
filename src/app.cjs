const express = require('express');

const {
  CONTACTS_FILE,
  FLAGS_FILE,
  USERS_FILE,
  CAREERS_FILE,
  AUTH_TOKEN,
  MAIL_FROM,
  MAIL_TO,
  SMTP_SERVICE,
  SMTP_USER,
  SMTP_PASS,
  CONTACT_EMAIL_SYNC,
  MAX_ATTACHMENT_SIZE_MB,
  MAX_ATTACHMENT_SIZE_BYTES,
  CONTACT_REQUEST_TIMEOUT_MS,
  ALLOWED_ORIGINS,
  ALLOW_ALL_ORIGINS,
  DEFAULT_FLAGS,
} = require('./config/env.cjs');
const { ensureDataFiles, readJson, writeJson } = require('./data/store.cjs');
const { validateEmail } = require('./utils/validators.cjs');
const { createRequireAuth } = require('./middleware/auth.cjs');
const { createCorsMiddleware } = require('./middleware/cors.cjs');
const { createUploadMiddleware } = require('./middleware/upload.cjs');
const { createContactEmailSender } = require('./services/email.service.cjs');
const { registerAuthRoutes } = require('./routes/auth.routes.cjs');
const { registerContactRoutes } = require('./routes/contact.routes.cjs');
const { registerFeatureFlagRoutes } = require('./routes/feature-flags.routes.cjs');
const { registerCareersRoutes } = require('./routes/careers.routes.cjs');

function createApp() {
  const app = express();
  const requireAuth = createRequireAuth(AUTH_TOKEN);
  const corsMiddleware = createCorsMiddleware({
    allowAllOrigins: ALLOW_ALL_ORIGINS,
    allowedOrigins: ALLOWED_ORIGINS,
  });
  const { upload, uploadErrorHandler } = createUploadMiddleware(
    MAX_ATTACHMENT_SIZE_BYTES,
    MAX_ATTACHMENT_SIZE_MB
  );
  const sendContactEmails = createContactEmailSender({
    mailFrom: MAIL_FROM,
    mailTo: MAIL_TO,
    smtpService: SMTP_SERVICE,
    smtpUser: SMTP_USER,
    smtpPass: SMTP_PASS,
  });

  ensureDataFiles();

  app.use(express.json({ limit: '1mb' }));
  app.use(corsMiddleware);

  app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'API is running' });
  });

  registerAuthRoutes(app, {
    readJson,
    usersFile: USERS_FILE,
    authToken: AUTH_TOKEN,
  });

  registerContactRoutes(app, {
    upload,
    requireAuth,
    readJson,
    writeJson,
    contactsFile: CONTACTS_FILE,
    validateEmail,
    sendContactEmails,
    sendEmailSync: CONTACT_EMAIL_SYNC,
    requestTimeoutMs: CONTACT_REQUEST_TIMEOUT_MS,
  });

  registerFeatureFlagRoutes(app, {
    readJson,
    writeJson,
    flagsFile: FLAGS_FILE,
    defaultFlags: DEFAULT_FLAGS,
    requireAuth,
  });


  registerCareersRoutes(app, {
    requireAuth,
    readJson,
    writeJson,
    careersFile: CAREERS_FILE,
  });

  app.use(uploadErrorHandler);

  return app;
}

module.exports = {
  createApp,
};
