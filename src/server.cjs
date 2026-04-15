const express = require('express');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const nodemailer = require('nodemailer');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const app = express();

const PORT = process.env.API_PORT || 5000;
const DATA_DIR = path.join(__dirname, '..', 'data');
const CONTACTS_FILE = path.join(DATA_DIR, 'contacts.json');
const FLAGS_FILE = path.join(DATA_DIR, 'feature-flags.json');
const USERS_FILE = path.join(DATA_DIR, 'user.json');

const AUTH_TOKEN = process.env.AUTH_TOKEN || 'jd_infotech_admin_token';
const MAIL_FROM = process.env.MAIL_FROM || 'skygalaxyinfotech@gmail.com';
const MAIL_TO = process.env.MAIL_TO || 'skygalaxyinfotech@gmail.com';
const SMTP_SERVICE = process.env.SMTP_SERVICE || 'gmail';
const SMTP_USER = process.env.SMTP_USER || 'skygalaxyinfotech@gmail.com';
const SMTP_PASS = process.env.SMTP_PASS || '';

const defaultFlags = {
  adminPanel: true,
  portfolioManagement: true,
  servicesManagement: true,
  teamManagement: true,
  testimonialManagement: true,
  blogManagement: true,
};

function ensureDataFiles() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(CONTACTS_FILE)) {
    fs.writeFileSync(CONTACTS_FILE, JSON.stringify([], null, 2));
  }

  if (!fs.existsSync(FLAGS_FILE)) {
    fs.writeFileSync(FLAGS_FILE, JSON.stringify(defaultFlags, null, 2));
  }

  if (!fs.existsSync(USERS_FILE)) {
    const defaultUsers = [
      {
        id: crypto.randomUUID(),
        username: 'admin',
        email: 'admin@jdinfotech.com',
        password: 'admin123',
        role: 'admin',
      },
    ];
    fs.writeFileSync(USERS_FILE, JSON.stringify(defaultUsers, null, 2));
  }
}

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function validateEmail(email) {
  return /^\S+@\S+\.\S+$/.test(email);
}

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '').trim();

  if (token !== AUTH_TOKEN) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized request',
    });
  }

  next();
}

function canSendEmail() {
  return Boolean(SMTP_USER && SMTP_PASS);
}

function createTransporter() {
  return nodemailer.createTransport({
    service: SMTP_SERVICE,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
}

async function sendContactEmails(contact) {
  if (!canSendEmail()) {
    console.warn('Email not sent: SMTP_PASS is missing in jd-fortfoliw-backed/.env');
    return {
      skipped: true,
      reason: 'SMTP_PASS is missing',
    };
  }

  const transporter = createTransporter();

  const adminSubject = `New Contact Form: ${contact.name}`;
  const adminText = [
    'You received a new contact form submission.',
    '',
    `Name: ${contact.name}`,
    `Email: ${contact.email}`,
    `Phone: ${contact.phone || '-'}`,
    `Company: ${contact.company || '-'}`,
    `Requirement: ${contact.requirement}`,
    `Message: ${contact.message}`,
    `Submitted At: ${contact.createdAt}`,
  ].join('\n');

  const customerSubject = 'Thank you for contacting JD Infotech';
  const customerText = [
    `Hello ${contact.name},`,
    '',
    'Thank you for contacting us. We have received your request and will get back to you soon.',
    '',
    'Your submitted details:',
    `Requirement: ${contact.requirement}`,
    `Message: ${contact.message}`,
    '',
    'Regards,',
    'JD Infotech Team',
  ].join('\n');

  const adminMailResult = await transporter.sendMail({
    from: MAIL_FROM,
    to: MAIL_TO,
    replyTo: contact.email,
    subject: adminSubject,
    text: adminText,
  });

  const customerMailResult = await transporter.sendMail({
    from: MAIL_FROM,
    to: contact.email,
    subject: customerSubject,
    text: customerText,
  });

  return {
    skipped: false,
    admin: {
      accepted: adminMailResult.accepted,
      rejected: adminMailResult.rejected,
      messageId: adminMailResult.messageId,
      response: adminMailResult.response,
    },
    customer: {
      accepted: customerMailResult.accepted,
      rejected: customerMailResult.rejected,
      messageId: customerMailResult.messageId,
      response: customerMailResult.response,
    },
  };
}

ensureDataFiles();

app.use(express.json({ limit: '1mb' }));
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
});

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'API is running' });
});

app.post('/api/auth/login', (req, res) => {
  const { emailOrUsername, password } = req.body || {};

  if (!emailOrUsername || !password) {
    return res.status(400).json({
      success: false,
      message: 'emailOrUsername and password are required',
    });
  }

  const normalizedInput = String(emailOrUsername).trim().toLowerCase();
  const users = readJson(USERS_FILE, []);
  const matchedUser = Array.isArray(users)
    ? users.find((user) => {
        if (!user || typeof user !== 'object') {
          return false;
        }

        const usernameMatch =
          typeof user.username === 'string' &&
          user.username.toLowerCase() === normalizedInput;
        const emailMatch =
          typeof user.email === 'string' &&
          user.email.toLowerCase() === normalizedInput;
        const passwordMatch =
          typeof user.password === 'string' &&
          user.password === String(password);

        return (usernameMatch || emailMatch) && passwordMatch;
      })
    : undefined;

  if (!matchedUser) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email/username or password',
    });
  }

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      token: AUTH_TOKEN,
      user: {
        username: matchedUser.username,
        email: matchedUser.email,
      },
    },
  });
});

app.post('/api/contact', async (req, res) => {
  const { name, email, phone, company, requirement, message } = req.body || {};

  if (!name || !email || !requirement || !message) {
    return res.status(400).json({
      success: false,
      message: 'name, email, requirement and message are required',
    });
  }

  if (!validateEmail(String(email))) {
    return res.status(400).json({
      success: false,
      message: 'Invalid email format',
    });
  }

  const contacts = readJson(CONTACTS_FILE, []);
  const newContact = {
    id: crypto.randomUUID(),
    name: String(name).trim(),
    email: String(email).trim().toLowerCase(),
    phone: phone ? String(phone).trim() : '',
    company: company ? String(company).trim() : '',
    requirement: String(requirement).trim(),
    message: String(message).trim(),
    createdAt: new Date().toISOString(),
  };

  contacts.push(newContact);
  writeJson(CONTACTS_FILE, contacts);

  let mailResult;
  try {
    mailResult = await sendContactEmails(newContact);
  } catch (error) {
    console.error('Contact email sending failed:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Contact saved, but email sending failed. Please check SMTP settings.',
    });
  }

  console.log('Contact email status:', JSON.stringify(mailResult));

  res.status(201).json({
    success: true,
    message: 'Thank you for contacting us. We will get back to you soon.',
    data: {
      id: newContact.id,
      mail: mailResult,
    },
  });
});

app.get('/api/feature-flags', (req, res) => {
  const flags = readJson(FLAGS_FILE, defaultFlags);
  res.json({ success: true, data: flags });
});

app.put('/api/feature-flags', requireAuth, (req, res) => {
  const incoming = req.body || {};
  const current = readJson(FLAGS_FILE, defaultFlags);
  const updated = { ...current, ...incoming };

  Object.keys(defaultFlags).forEach((key) => {
    updated[key] = Boolean(updated[key]);
  });

  writeJson(FLAGS_FILE, updated);

  res.json({
    success: true,
    message: 'Feature flags updated',
    data: updated,
  });
});

app.listen(PORT, () => {
  console.log(`API server is running on http://localhost:${PORT}`);
});
