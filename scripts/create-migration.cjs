const fs = require('node:fs');
const path = require('node:path');

const migrationName = process.argv[2];

if (!migrationName) {
  console.error('Usage: node scripts/create-migration.cjs <migration_name>');
  process.exit(1);
}

const migrationsDir = path.join(__dirname, '..', 'migrations');
if (!fs.existsSync(migrationsDir)) {
  fs.mkdirSync(migrationsDir, { recursive: true });
}

const files = fs.readdirSync(migrationsDir);
const numbers = files
  .map((file) => Number(file.split('_')[0]))
  .filter((value) => Number.isFinite(value));

const nextNumber = (Math.max(0, ...numbers) + 1).toString().padStart(3, '0');
const cleanName = migrationName.trim().toLowerCase().replace(/\s+/g, '_');
const fileName = `${nextNumber}_${cleanName}.sql`;
const filePath = path.join(migrationsDir, fileName);

const template = `-- ${fileName}\n-- Write your SQL migration here.\n\n`;
fs.writeFileSync(filePath, template);

console.log(`Created migration: ${fileName}`);
