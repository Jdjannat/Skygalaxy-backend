const path = require('node:path');

require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const PORT = Number(process.env.PORT || process.env.API_PORT || 5000);
const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(__dirname, '..', '..', 'data');

const CONTACTS_FILE = path.join(DATA_DIR, 'contacts.json');
const FLAGS_FILE = path.join(DATA_DIR, 'feature-flags.json');
const USERS_FILE = path.join(DATA_DIR, 'user.json');
const CAREERS_FILE = path.join(DATA_DIR, 'careers.json');

const AUTH_TOKEN = process.env.AUTH_TOKEN || 'skygalaxy_infotech_admin_token';
const MAIL_FROM = process.env.MAIL_FROM || 'skygalaxyinfotech@gmail.com';
const MAIL_TO = process.env.MAIL_TO || 'skygalaxyinfotech@gmail.com';
const SMTP_SERVICE = process.env.SMTP_SERVICE || 'gmail';
const SMTP_USER = process.env.SMTP_USER || 'skygalaxyinfotech@gmail.com';
const SMTP_PASS = process.env.SMTP_PASS || '';
const CONTACT_EMAIL_SYNC = String(process.env.CONTACT_EMAIL_SYNC || 'false') === 'true';

const parsedAttachmentSizeMb = Number(process.env.MAX_ATTACHMENT_SIZE_MB || 8);
const MAX_ATTACHMENT_SIZE_MB =
  Number.isFinite(parsedAttachmentSizeMb) && parsedAttachmentSizeMb > 0
    ? parsedAttachmentSizeMb
    : 8;
const MAX_ATTACHMENT_SIZE_BYTES = Math.floor(MAX_ATTACHMENT_SIZE_MB * 1024 * 1024);
const parsedContactRequestTimeoutMs = Number(process.env.CONTACT_REQUEST_TIMEOUT_MS || 20000);
const CONTACT_REQUEST_TIMEOUT_MS =
  Number.isFinite(parsedContactRequestTimeoutMs) && parsedContactRequestTimeoutMs > 0
    ? parsedContactRequestTimeoutMs
    : 20000;

const ALLOWED_ORIGINS = String(process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const ALLOW_ALL_ORIGINS = ALLOWED_ORIGINS.includes('*');

const DEFAULT_FLAGS = {
  adminPanel: true,
  portfolioManagement: true,
  servicesManagement: true,
  teamManagement: true,
  testimonialManagement: true,
  blogManagement: true,
};

module.exports = {
  PORT,
  DATA_DIR,
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
};
