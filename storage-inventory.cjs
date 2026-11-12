'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { ethers } = require('ethers');
const privateDir = path.resolve(process.cwd(), 'private');
const institutionsFile = path.resolve(process.env.CERTIVERF_INSTITUTIONS_FILE || path.join(privateDir, 'institutions.json'));
const inventoryFile = path.resolve(process.env.CERTIVERF_INVENTORY_FILE || path.join(privateDir, 'inventory.jsonl'));
function safeFileName(value) { return path.basename(String(value || 'certificate.pdf')).replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120); }
function getInstitution(address) {
  if (!ethers.isAddress(address)) return null;
  const entries = JSON.parse(fs.readFileSync(institutionsFile, 'utf8'));
  if (!Array.isArray(entries)) throw new Error('Institution mapping must be a JSON array');
  const matches = entries.filter(x => ethers.isAddress(x.wallet) && x.wallet.toLowerCase() === address.toLowerCase());
  if (matches.length !== 1) return null;
  const x = matches[0];
  if (!/^[A-Z0-9_-]{2,24}$/.test(x.code) || typeof x.name !== 'string' || !x.name.trim()) throw new Error('Invalid institution mapping');
  return { code: x.code, name: x.name.trim() };
}
function appendInventory(record) {
  fs.mkdirSync(path.dirname(inventoryFile), { recursive: true, mode: 0o700 });
  const row = { version: 1, recordId: crypto.randomUUID(), ...record };
  fs.appendFileSync(inventoryFile, JSON.stringify(row) + '\n', { encoding: 'utf8', mode: 0o600 });
  return row;
}
module.exports = { getInstitution, appendInventory, safeFileName, inventoryFile };
