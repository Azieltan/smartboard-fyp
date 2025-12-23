const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const example = path.join(root, '.env.example');
const dest = path.join(root, '.env');

if (!fs.existsSync(example)) {
  console.error('.env.example not found');
  process.exit(1);
}

if (fs.existsSync(dest)) {
  console.log('.env already exists — leaving it untouched.');
  process.exit(0);
}

fs.copyFileSync(example, dest);
console.log('Created .env from .env.example — please fill in secrets (do NOT commit .env)');
