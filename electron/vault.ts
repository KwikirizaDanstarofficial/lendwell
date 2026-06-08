import { safeStorage, app } from 'electron';
import path from 'path';
import fs from 'fs';

const VAULT_PATH = path.join(app.getPath('userData'), 'vault.enc');

export function vaultExists(): boolean {
  return fs.existsSync(VAULT_PATH);
}

export function writeVault(data: Record<string, string>): void {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('[Vault] OS encryption not available on this system.');
  }
  const encrypted = safeStorage.encryptString(JSON.stringify(data));
  fs.writeFileSync(VAULT_PATH, encrypted);
}

export function readVault(): Record<string, string> {
  if (!vaultExists()) {
    throw new Error('[Vault] No vault found. User must log in first.');
  }
  const encrypted = fs.readFileSync(VAULT_PATH);
  const decrypted = safeStorage.decryptString(Buffer.from(encrypted));
  return JSON.parse(decrypted);
}

export function clearVault(): void {
  if (vaultExists()) {
    fs.unlinkSync(VAULT_PATH);
  }
}
