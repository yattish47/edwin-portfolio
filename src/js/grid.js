import { db } from './firebase.js';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import GLightbox from 'glightbox';

function createPhotoElement(src, alt, onClick, isCollection = false) {
    const div = document.createElement('div');
    div.className = 'bg-gray-800 rounded-lg overflow-hidden shadow-lg cursor-pointer flex flex-col';
    div.innerHTML = `
        <div class="relative w-full ${isCollection ? 'h-64' : 'h-48'} overflow-hidden">
            <img src="${src}" alt="${alt}" loading="lazy" class="w-full h-full object-cover transition-opacity duration-300 ease-in-out">
            <div class="absolute inset-0 bg-black opacity-0 transition-opacity duration-300 ease-in-out hover:opacity-25"></div>
        </div>
        ${!isCollection ? `
        <div class="p-4 bg-white flex-grow flex items-center">
            <h3 class="text-xl font-semibold text-black">${alt}</h3>
        </div>
        ` : ''}
    `;
    div.style.height = isCollection ? '16rem' : '18rem';
    div.addEventListener('click', onClick);
    return div;
}

function showSpinner(container) {
    container.innerHTML = `
        <div class="col-span-full flex justify-center py-20">
            <div class="animate-spin h-10 w-10 border-4 border-white border-t-transparent rounded-full"></div>
        </div>
    `;
}

async function fetchCollections() {
    const q = query(collection(db, 'collections'), orderBy('order'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function fetchPhotos(collectionId) {
    const q = query(collection(db, 'collections', collectionId, 'photos'), orderBy('order'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function loadMainGrid() {
    const grid = document.getElementById('photo-grid');
    grid.className = 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6';
    showSpinner(grid);

    const collections = await fetchCollections();
    grid.innerHTML = '';

    collections.forEach(col => {
        const el = createPhotoElement(
            col.coverUrl,
            col.title,
            () => window.location.href = `?collection=${col.id}`
        );
        grid.appendChild(el);
    });
}

async function loadCollection(collectionId) {
    const container = document.querySelector('.max-w-7xl');
    container.innerHTML = `
        <div class="flex justify-center py-20">
            <div class="animate-spin h-10 w-10 border-4 border-white border-t-transparent rounded-full"></div>
        </div>
    `;

    const [collections, photos] = await Promise.all([
        fetchCollections(),
        fetchPhotos(collectionId)
    ]);

    const col = collections.find(c => c.id === collectionId);
    if (!col) {
        container.innerHTML = '<p class="text-center py-20 text-gray-400">Collection not found.</p>';
        return;
    }

    container.innerHTML = '';

    const header = document.createElement('div');
    header.className = 'flex justify-between items-center mb-8 max-sm:flex-col max-sm:items-start max-sm:mt-4 max-sm:gap-2';
    container.appendChild(header);

    const title = document.createElement('h1');
    title.textContent = col.title;
    title.className = 'text-4xl font-bold max-sm:text-2xl';
    header.appendChild(title);

    const backButton = document.createElement('button');
    backButton.className = 'flex items-center bg-white hover:bg-gray-800 hover:text-white text-black font-bold py-2 px-4 rounded transition duration-[800ms] ease-in-out group w-full sm:w-auto mt-4 sm:mt-0';
    backButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 transform transition-transform duration-300 group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to All Collections
    `;
    backButton.addEventListener('click', () => {
        window.location.href = window.location.pathname;
    });
    header.appendChild(backButton);

    const grid = document.createElement('div');
    grid.id = 'photo-grid';
    grid.className = 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6';
    container.appendChild(grid);

    photos.forEach((p, i) => {
        const wrapper = document.createElement('a');
        wrapper.href = p.url;
        wrapper.className = 'glightbox';
        wrapper.dataset.gallery = 'collection';
        wrapper.dataset.description = col.title;

        const el = createPhotoElement(p.url, col.title, e => e.preventDefault(), true);
        wrapper.appendChild(el);
        grid.appendChild(wrapper);
    });

    GLightbox({ selector: '.glightbox' });
}

const urlParams = new URLSearchParams(window.location.search);
const collectionParam = urlParams.get('collection');

if (collectionParam) {
    loadCollection(collectionParam);
} else {
    loadMainGrid();
}
