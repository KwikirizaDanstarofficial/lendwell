import { safeStorage, app } from 'electron';
import path from 'path';
import fs from 'fs';

const VAULT_PATH = path.join(app.getPath('userData'), 'vault.enc');
const PLAIN_PATH = path.join(app.getPath('userData'), 'vault.json');

function encryptionAvailable(): boolean {
  try {
    return safeStorage.isEncryptionAvailable();
  } catch {
    return false;
  }
}

export function vaultExists(): boolean {
  return fs.existsSync(VAULT_PATH) || fs.existsSync(PLAIN_PATH);
}

export function writeVault(data: Record<string, string>): void {
  if (encryptionAvailable()) {
    const encrypted = safeStorage.encryptString(JSON.stringify(data));
    fs.writeFileSync(VAULT_PATH, encrypted);
    if (fs.existsSync(PLAIN_PATH)) fs.unlinkSync(PLAIN_PATH);
  } else {
    console.warn('[VAULT] OS encryption unavailable — using plain JSON fallback.');
    fs.writeFileSync(PLAIN_PATH, JSON.stringify(data, null, 2));
    if (fs.existsSync(VAULT_PATH)) fs.unlinkSync(VAULT_PATH);
  }
}

export function readVault(): Record<string, string> {
  if (fs.existsSync(VAULT_PATH)) {
    if (!encryptionAvailable()) {
      throw new Error('[Vault] Encrypted vault exists but OS encryption is unavailable.');
    }
    const encrypted = fs.readFileSync(VAULT_PATH);
    const decrypted = safeStorage.decryptString(Buffer.from(encrypted));
    return JSON.parse(decrypted);
  }
  if (fs.existsSync(PLAIN_PATH)) {
    return JSON.parse(fs.readFileSync(PLAIN_PATH, 'utf-8'));
  }
  throw new Error('[Vault] No vault found. User must log in first.');
}

export function clearVault(): void {
  if (fs.existsSync(VAULT_PATH)) fs.unlinkSync(VAULT_PATH);
  if (fs.existsSync(PLAIN_PATH)) fs.unlinkSync(PLAIN_PATH);
}
