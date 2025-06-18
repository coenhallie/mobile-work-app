/**
 * Script to set the window title in tauri.conf.json
 * Usage: node set-window-title.js "Your Window Title"
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get the window title from command line arguments
const windowTitle = process.argv[2] || 'HandyApp';

// Path to tauri.conf.json
const tauriConfigPath = path.join(
  __dirname,
  '..',
  'src-tauri',
  'tauri.conf.json'
);

// Read the current config
try {
  const configData = fs.readFileSync(tauriConfigPath, 'utf8');
  const config = JSON.parse(configData);

  // Create a backup of the original file
  fs.writeFileSync(`${tauriConfigPath}.bak`, configData);

  // Update the window title
  if (config.app && config.app.windows && config.app.windows.length > 0) {
    config.app.windows[0].title = windowTitle;

    // Write the updated config back to the file
    fs.writeFileSync(tauriConfigPath, JSON.stringify(config, null, 2));

    console.log(`Window title set to: "${windowTitle}"`);
  } else {
    console.error(
      'Error: Could not find windows configuration in tauri.conf.json'
    );
    process.exit(1);
  }
} catch (error) {
  console.error('Error updating tauri.conf.json:', error.message);
  process.exit(1);
}
