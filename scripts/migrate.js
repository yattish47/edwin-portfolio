/**
 * One-time migration: creates Firestore collection/photo documents pointing
 * to the existing photos already in /public/assets/ via jsDelivr CDN URLs.
 *
 * No file uploads needed — photos are already in the repo.
 *
 * BEFORE RUNNING:
 *   1. Edit the GITHUB and FIREBASE config sections below.
 *   2. Download a Firebase service account key:
 *      Firebase Console → Project Settings → Service Accounts → Generate New Private Key
 *   3. Save the JSON as: scripts/serviceAccountKey.json
 *   4. Run: node scripts/migrate.js
 */

import admin from 'firebase-admin';
import { readdirSync, statSync } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Config — edit these ───────────────────────────────────────────────────────

const GITHUB_OWNER  = 'yattish';   // e.g. 'yattish'
const GITHUB_REPO   = 'edwin-portfolio';   // e.g. 'edwin-portfolio'
const GITHUB_BRANCH = 'main';

// ─── Init ─────────────────────────────────────────────────────────────────────

const SERVICE_ACCOUNT_PATH = join(__dirname, 'serviceAccountKey.json');

let serviceAccount;
try {
  const { readFileSync } = await import('fs');
  serviceAccount = JSON.parse(readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));
} catch {
  console.error('\n❌  Could not load scripts/serviceAccountKey.json');
  console.error('   Download it from: Firebase Console → Project Settings → Service Accounts\n');
  process.exit(1);
}

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

// ─── Helpers ──────────────────────────────────────────────────────────────────

const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.JPG', '.JPEG', '.PNG', '.WEBP']);

function rawGitHubUrl(filePath) {
  const encoded = filePath.split('/').map(s => encodeURIComponent(s)).join('/');
  return `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/${encoded}`;
}

// ─── Migration ────────────────────────────────────────────────────────────────

const ASSETS_DIR = join(__dirname, '..', 'public', 'assets');
const entries = readdirSync(ASSETS_DIR);
const folders = entries.filter(name => statSync(join(ASSETS_DIR, name)).isDirectory());

console.log(`\nFound ${folders.length} collection folders.\n`);

let collectionOrder = 0;

for (const folderName of folders) {
  const folderPath = join(ASSETS_DIR, folderName);
  const photoFiles = readdirSync(folderPath)
    .filter(f => IMAGE_EXTS.has(extname(f)))
    .sort((a, b) => {
      const na = parseInt(a), nb = parseInt(b);
      return (!isNaN(na) && !isNaN(nb)) ? na - nb : a.localeCompare(b);
    });

  if (photoFiles.length === 0) {
    console.log(`⚠️  Skipping "${folderName}" (no images found)`);
    continue;
  }

  console.log(`📁  Migrating "${folderName}" (${photoFiles.length} photos)...`);

  const colRef = db.collection('collections').doc();
  let coverUrl = '';

  for (let i = 0; i < photoFiles.length; i++) {
    const filename = photoFiles[i];
    const githubPath = `public/assets/${folderName}/${filename}`;
    const url = rawGitHubUrl(githubPath);

    await colRef.collection('photos').add({
      url,
      filename,
      githubPath,
      order: i,
      uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    if (i === 0) coverUrl = url;
    process.stdout.write(`   ✓ ${filename}\n`);
  }

  await colRef.set({
    title: folderName.replace(/_/g, "'"),
    coverUrl,
    photoCount: photoFiles.length,
    order: collectionOrder,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log(`   ✅  Done.\n`);
  collectionOrder++;
}

console.log('Migration complete! Open the Firebase console to verify the data.\n');
process.exit(0);
