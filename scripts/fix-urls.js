/**
 * One-time fix: updates all photo URLs in Firestore from jsDelivr (broken spaces)
 * to raw.githubusercontent.com with properly encoded paths.
 *
 * Run: node scripts/fix-urls.js
 */

import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const GITHUB_OWNER  = 'yattish47';
const GITHUB_REPO   = 'edwin-portfolio';
const GITHUB_BRANCH = 'main';

const serviceAccount = JSON.parse(readFileSync(join(__dirname, 'serviceAccountKey.json'), 'utf8'));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

function rawUrl(githubPath) {
  const encoded = githubPath.split('/').map(segment => encodeURIComponent(segment)).join('/');
  return `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/${encoded}`;
}

const collectionsSnap = await db.collection('collections').get();

for (const colDoc of collectionsSnap.docs) {
  const photosSnap = await colDoc.ref.collection('photos').get();
  let coverUrl = '';

  for (const photoDoc of photosSnap.docs) {
    const { githubPath } = photoDoc.data();
    const url = rawUrl(githubPath);
    await photoDoc.ref.update({ url });
    if (!coverUrl) coverUrl = url;
    console.log(`  ✓ ${githubPath}`);
  }

  await colDoc.ref.update({ coverUrl });
  console.log(`✅ Updated "${colDoc.data().title}"\n`);
}

console.log('All URLs fixed!');
process.exit(0);
