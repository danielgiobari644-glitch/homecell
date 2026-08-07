import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = __dirname;
const distDir = path.join(rootDir, 'dist');

console.log('Starting cross-platform build...');

// Ensure dist directory exists and clean old contents if any
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir, { recursive: true });

// List of files and extensions to copy into dist
const filesToCopy = [
  'index.html',
  'favicon.jpg',
  'manifest.json',
  'sw.js',
  'netlify.toml',
  'firebase-applet-config.json',
  'firebase-blueprint.json',
  'firestore.rules'
];

// Copy explicitly listed files
filesToCopy.forEach(file => {
  const src = path.join(rootDir, file);
  const dest = path.join(distDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`Copied: ${file}`);
  }
});

// Copy all root level .js files (excluding build.js itself if desired, though harmless)
const allFiles = fs.readdirSync(rootDir);
allFiles.forEach(file => {
  if (file.endsWith('.js') && file !== 'build.js') {
    const src = path.join(rootDir, file);
    const dest = path.join(distDir, file);
    fs.copyFileSync(src, dest);
    console.log(`Copied JS module: ${file}`);
  }
});

console.log('Cross-platform build completed successfully!');
