const fs = require('node:fs');
const crypto = require('node:crypto');

const {
  DATA_DIR,
  CONTACTS_FILE,
  FLAGS_FILE,
  USERS_FILE,
  CAREERS_FILE,
  DEFAULT_FLAGS,
} = require('../config/env.cjs');

function ensureDataFiles() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(CONTACTS_FILE)) {
    fs.writeFileSync(CONTACTS_FILE, JSON.stringify([], null, 2));
  }

  if (!fs.existsSync(FLAGS_FILE)) {
    fs.writeFileSync(FLAGS_FILE, JSON.stringify(DEFAULT_FLAGS, null, 2));
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

  if (!fs.existsSync(CAREERS_FILE)) {
    fs.writeFileSync(CAREERS_FILE, JSON.stringify([], null, 2));
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

module.exports = {
  ensureDataFiles,
  readJson,
  writeJson,
};
