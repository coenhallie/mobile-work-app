/**
 * Script to restore the original tauri.conf.json from backup
 * Usage: node restore-config.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to tauri.conf.json and its backup
const tauriConfigPath = path.join(
  __dirname,
  '..',
  'src-tauri',
  'tauri.conf.json'
);
const backupPath = `${tauriConfigPath}.bak`;

// Check if backup exists
if (fs.existsSync(backupPath)) {
  try {
    // Restore from backup
    fs.copyFileSync(backupPath, tauriConfigPath);
    console.log('Restored original tauri.conf.json from backup');

    // Remove the backup file
    fs.unlinkSync(backupPath);
    console.log('Removed backup file');
  } catch (error) {
    console.error('Error restoring configuration:', error.message);
    process.exit(1);
  }
} else {
  console.log('No backup file found, nothing to restore');
}
