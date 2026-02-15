import fs from 'node:fs';

// Minimal sanity check to catch missing .env setup.
const example = fs.readFileSync(new URL('../.env.example', import.meta.url), 'utf8');
const required = [];
for (const line of example.split(/\r?\n/)) {
  if (!line || line.startsWith('#')) continue;
  const m = line.match(/^([A-Z0-9_]+)=/);
  if (m) required.push(m[1]);
}

const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`Missing env vars: ${missing.join(', ')}`);
  process.exit(1);
}
console.log('env ok');
