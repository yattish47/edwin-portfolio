import { auth, db } from '../src/js/firebase.js';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import {
  collection, addDoc, getDocs, doc, deleteDoc, updateDoc,
  query, orderBy, serverTimestamp, writeBatch
} from 'firebase/firestore';

// ─── GitHub config (from Vite environment variables) ─────────────────────────

function getGitHubConfig() {
  return {
    owner:  import.meta.env.VITE_GH_OWNER  || '',
    repo:   import.meta.env.VITE_GH_REPO   || '',
    branch: import.meta.env.VITE_GH_BRANCH || 'main',
    token:  import.meta.env.VITE_GH_TOKEN  || '',
  };
}

function isGitHubConfigured() {
  const { owner, repo, token } = getGitHubConfig();
  return owner && repo && token;
}

function jsDelivrUrl(path) {
  const { owner, repo, branch } = getGitHubConfig();
  return `https://cdn.jsdelivr.net/gh/${owner}/${repo}@${branch}/${path}`;
}

// ─── GitHub REST API ──────────────────────────────────────────────────────────

async function ghRequest(path, method = 'GET', body = null) {
  const { token } = getGitHubConfig();
  const res = await fetch(`https://api.github.com${path}`, {
    method,
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `GitHub API error ${res.status}`);
  }
  return res.status === 204 ? null : res.json();
}

async function getFileSha(filePath) {
  const { owner, repo, branch } = getGitHubConfig();
  try {
    const data = await ghRequest(`/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`);
    return data.sha;
  } catch {
    return null;
  }
}

async function commitFile(filePath, base64Content, commitMessage) {
  const { owner, repo, branch } = getGitHubConfig();
  const sha = await getFileSha(filePath);
  const body = { message: commitMessage, content: base64Content, branch };
  if (sha) body.sha = sha;
  return ghRequest(`/repos/${owner}/${repo}/contents/${filePath}`, 'PUT', body);
}

async function deleteFile(filePath, commitMessage) {
  const { owner, repo, branch } = getGitHubConfig();
  const sha = await getFileSha(filePath);
  if (!sha) return;
  return ghRequest(`/repos/${owner}/${repo}/contents/${filePath}`, 'DELETE', {
    message: commitMessage,
    sha,
    branch,
  });
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ─── Views ────────────────────────────────────────────────────────────────────

const views = {
  login: document.getElementById('view-login'),
  dashboard: document.getElementById('view-dashboard'),
  collection: document.getElementById('view-collection'),
};

function showView(name) {
  Object.values(views).forEach(v => v.classList.add('hidden'));
  views[name].classList.remove('hidden');
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

onAuthStateChanged(auth, user => {
  if (user) showDashboard();
  else showView('login');
});

document.getElementById('login-form').addEventListener('submit', async e => {
  e.preventDefault();
  const errorEl = document.getElementById('login-error');
  errorEl.classList.add('hidden');
  try {
    await signInWithEmailAndPassword(
      auth,
      document.getElementById('email').value,
      document.getElementById('password').value
    );
  } catch {
    errorEl.textContent = 'Invalid email or password.';
    errorEl.classList.remove('hidden');
  }
});

document.getElementById('sign-out-btn').addEventListener('click', () => signOut(auth));
document.getElementById('sign-out-btn-2').addEventListener('click', () => signOut(auth));

// ─── Dashboard ────────────────────────────────────────────────────────────────

async function showDashboard() {
  showView('dashboard');
  await loadCollections();
}

async function loadCollections() {
  const grid = document.getElementById('collection-grid');
  grid.innerHTML = `<div class="col-span-full flex justify-center py-10">
    <div class="animate-spin h-8 w-8 border-4 border-white border-t-transparent rounded-full"></div>
  </div>`;

  const snap = await getDocs(query(collection(db, 'collections'), orderBy('order')));
  const cols = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  grid.innerHTML = '';

  if (cols.length === 0) {
    grid.innerHTML = '<div class="col-span-full text-center py-10 text-gray-400">No collections yet. Create one!</div>';
    return;
  }

  cols.forEach(col => {
    const card = document.createElement('div');
    card.className = 'bg-gray-800 rounded-lg overflow-hidden cursor-pointer relative group';
    card.innerHTML = `
      <div class="h-44 overflow-hidden bg-gray-700">
        ${col.coverUrl
          ? `<img src="${col.coverUrl}" alt="${col.title}" class="w-full h-full object-cover">`
          : `<div class="w-full h-full flex items-center justify-center text-gray-500 text-sm">No photos</div>`}
      </div>
      <div class="p-3">
        <p class="font-semibold truncate">${col.title}</p>
        <p class="text-sm text-gray-400">${col.photoCount ?? 0} photo${(col.photoCount ?? 0) !== 1 ? 's' : ''}</p>
      </div>
      <button class="js-del-col absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full w-7 h-7 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-lg leading-none" title="Delete collection">×</button>
    `;
    card.addEventListener('click', e => {
      if (e.target.closest('.js-del-col')) return;
      openCollection(col.id, col.title);
    });
    card.querySelector('.js-del-col').addEventListener('click', async () => {
      if (!confirm(`Delete "${col.title}" and all its photos?\n\nThis cannot be undone.`)) return;
      await deleteCollection(col.id);
      await loadCollections();
    });
    grid.appendChild(card);
  });
}

async function deleteCollection(collectionId) {
  const photosSnap = await getDocs(collection(db, 'collections', collectionId, 'photos'));
  const batch = writeBatch(db);
  for (const photoDoc of photosSnap.docs) {
    try {
      await deleteFile(photoDoc.data().githubPath, `Remove photo from ${collectionId}`);
    } catch { /* already gone */ }
    batch.delete(photoDoc.ref);
  }
  batch.delete(doc(db, 'collections', collectionId));
  await batch.commit();
}

document.getElementById('new-collection-btn').addEventListener('click', async () => {
  const title = prompt("Collection name (e.g. \"Sarah's Wedding 2025\"):");
  if (!title?.trim()) return;

  const snap = await getDocs(collection(db, 'collections'));
  const docRef = await addDoc(collection(db, 'collections'), {
    title: title.trim(),
    coverUrl: '',
    photoCount: 0,
    order: snap.size,
    createdAt: serverTimestamp(),
  });
  openCollection(docRef.id, title.trim());
});

// ─── Collection Detail ────────────────────────────────────────────────────────

let currentCollectionId = null;

async function openCollection(collectionId, title) {
  currentCollectionId = collectionId;
  showView('collection');
  document.getElementById('col-title').value = title;
  document.getElementById('upload-progress').classList.add('hidden');
  await loadPhotos(collectionId);
}

async function loadPhotos(collectionId) {
  const grid = document.getElementById('photo-grid');
  grid.innerHTML = `<div class="col-span-full flex justify-center py-10">
    <div class="animate-spin h-8 w-8 border-4 border-white border-t-transparent rounded-full"></div>
  </div>`;

  const snap = await getDocs(query(collection(db, 'collections', collectionId, 'photos'), orderBy('order')));
  const photos = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  grid.innerHTML = '';

  if (photos.length === 0) {
    grid.innerHTML = '<div class="col-span-full text-center py-6 text-gray-400">No photos yet. Upload some above!</div>';
    return;
  }

  photos.forEach(photo => {
    const card = document.createElement('div');
    card.className = 'relative group rounded-lg overflow-hidden bg-gray-800';
    card.innerHTML = `
      <img src="${photo.url}" alt="" class="w-full h-36 object-cover">
      <button class="js-del-photo absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full w-7 h-7 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-lg leading-none" title="Delete photo">×</button>
    `;
    card.querySelector('.js-del-photo').addEventListener('click', async () => {
      if (!confirm('Delete this photo?')) return;
      await deletePhoto(collectionId, photo.id, photo.githubPath);
      await loadPhotos(collectionId);
    });
    grid.appendChild(card);
  });
}

async function deletePhoto(collectionId, photoId, githubPath) {
  try {
    await deleteFile(githubPath, `Remove photo: ${githubPath}`);
  } catch { /* file may not exist */ }
  await deleteDoc(doc(db, 'collections', collectionId, 'photos', photoId));
  await syncCollectionMeta(collectionId);
}

async function syncCollectionMeta(collectionId) {
  const snap = await getDocs(collection(db, 'collections', collectionId, 'photos'));
  const photos = snap.docs.map(d => d.data());
  await updateDoc(doc(db, 'collections', collectionId), {
    photoCount: photos.length,
    coverUrl: photos[0]?.url ?? '',
  });
}

// ─── Upload ───────────────────────────────────────────────────────────────────

const uploadInput = document.getElementById('upload-input');
const dropZone = document.getElementById('drop-zone');
const progressEl = document.getElementById('upload-progress');

dropZone.addEventListener('dragover', e => {
  e.preventDefault();
  dropZone.classList.add('border-gray-300');
});
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('border-gray-300'));
dropZone.addEventListener('drop', e => {
  e.preventDefault();
  dropZone.classList.remove('border-gray-300');
  handleUpload(Array.from(e.dataTransfer.files));
});
dropZone.addEventListener('click', () => uploadInput.click());
uploadInput.addEventListener('change', () => {
  handleUpload(Array.from(uploadInput.files));
  uploadInput.value = '';
});

async function handleUpload(files) {
  const imageFiles = files.filter(f => f.type.startsWith('image/'));
  if (!currentCollectionId || imageFiles.length === 0) return;

  progressEl.classList.remove('hidden');

  const snap = await getDocs(collection(db, 'collections', currentCollectionId, 'photos'));
  let nextOrder = snap.size;

  for (let i = 0; i < imageFiles.length; i++) {
    const file = imageFiles[i];
    const ext = file.name.split('.').pop();
    const filename = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
    const githubPath = `public/assets/${currentCollectionId}/${filename}`;

    progressEl.textContent = `Uploading ${i + 1}/${imageFiles.length}: ${file.name}...`;

    const base64 = await fileToBase64(file);
    await commitFile(githubPath, base64, `Add photo to collection ${currentCollectionId}`);

    const url = jsDelivrUrl(githubPath);

    await addDoc(collection(db, 'collections', currentCollectionId, 'photos'), {
      url,
      filename,
      githubPath,
      order: nextOrder++,
      uploadedAt: serverTimestamp(),
    });
  }

  await syncCollectionMeta(currentCollectionId);
  progressEl.textContent = `Done! ${imageFiles.length} photo${imageFiles.length !== 1 ? 's' : ''} uploaded. They may take up to 12h to appear on the public site via CDN.`;
  setTimeout(() => progressEl.classList.add('hidden'), 6000);
  await loadPhotos(currentCollectionId);
}

// ─── Title editing ────────────────────────────────────────────────────────────

const titleInput = document.getElementById('col-title');
titleInput.addEventListener('blur', async () => {
  const newTitle = titleInput.value.trim();
  if (!newTitle || !currentCollectionId) return;
  await updateDoc(doc(db, 'collections', currentCollectionId), { title: newTitle });
});
titleInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') titleInput.blur();
});

// ─── Navigation ───────────────────────────────────────────────────────────────

document.getElementById('back-btn').addEventListener('click', showDashboard);

document.getElementById('delete-col-btn').addEventListener('click', async () => {
  const title = titleInput.value || 'this collection';
  if (!confirm(`Delete "${title}" and all its photos?\n\nThis cannot be undone.`)) return;
  await deleteCollection(currentCollectionId);
  showDashboard();
});
