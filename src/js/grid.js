function createPhotoElement(src, alt, onClick, isCollection = false) {
    const div = document.createElement('div');
    div.className = 'bg-gray-800 rounded-lg overflow-hidden shadow-lg cursor-pointer flex flex-col';
    div.innerHTML = `
        <div class="relative w-full ${isCollection ? 'h-64' : 'h-48'} overflow-hidden">
            <img src="${src}" alt="${alt}" class="w-full h-full object-cover transition-opacity duration-300 ease-in-out">
            <div class="absolute inset-0 bg-black opacity-0 transition-opacity duration-300 ease-in-out hover:opacity-25"></div>
        </div>
        ${!isCollection ? `
        <div class="p-4 bg-white flex-grow flex items-center">
            <h3 class="text-xl font-semibold text-black">${alt}</h3>
        </div>
        ` : ''}
    `;
    div.style.height = isCollection ? '16rem' : '18rem'; // 64px = 16rem, 48px + ~24px (for text) = 18rem
    div.addEventListener('click', onClick);
    return div;
}

const photoCollections = {
    'Asher_s 1st Birthday (2024)': {
        title: 'Asher\'s 1st Birthday (2024)',
        photos: [
            './assets/Asher_s 1st Birthday (2024)/1.jpg',
            './assets/Asher_s 1st Birthday (2024)/2.jpg',
            './assets/Asher_s 1st Birthday (2024)/3.jpg',
            './assets/Asher_s 1st Birthday (2024)/4.jpg',
            './assets/Asher_s 1st Birthday (2024)/5.jpg',
            './assets/Asher_s 1st Birthday (2024)/6.jpg',
            './assets/Asher_s 1st Birthday (2024)/7.jpg',
            './assets/Asher_s 1st Birthday (2024)/8.jpg',
            './assets/Asher_s 1st Birthday (2024)/9.jpg',
            './assets/Asher_s 1st Birthday (2024)/10.jpg',
            './assets/Asher_s 1st Birthday (2024)/11.jpg',
           
            // ... more photos
        ]
    },
    'Father James 80th Birthday (2023)': {
        title: 'Father James 80th Birthday (2023)',
        photos: [
            './assets/Father James 80th Birthday (2023)/1.jpg',
            './assets/Father James 80th Birthday (2023)/2.jpg',
            './assets/Father James 80th Birthday (2023)/3.jpg',
            './assets/Father James 80th Birthday (2023)/4.jpg',
            './assets/Father James 80th Birthday (2023)/5.jpg',
            './assets/Father James 80th Birthday (2023)/6.jpg',
            './assets/Father James 80th Birthday (2023)/7.jpg',
            './assets/Father James 80th Birthday (2023)/8.jpg',
            './assets/Father James 80th Birthday (2023)/9.jpg',
            './assets/Father James 80th Birthday (2023)/10.jpg',
        ]
    },   
     'Jennifer_s 21st Birthday Party (2024)': {
        title: 'Jennifer\'s 21st Birthday Party (2024)',
        photos: [
            './assets/Jennifer_s 21st Birthday Party (2024)/1.jpg',
            './assets/Jennifer_s 21st Birthday Party (2024)/2.jpg',
            './assets/Jennifer_s 21st Birthday Party (2024)/3.jpg',
            './assets/Jennifer_s 21st Birthday Party (2024)/4.jpg',
            './assets/Jennifer_s 21st Birthday Party (2024)/5.jpg',
            './assets/Jennifer_s 21st Birthday Party (2024)/6.jpg',
            './assets/Jennifer_s 21st Birthday Party (2024)/7.jpg',
            './assets/Jennifer_s 21st Birthday Party (2024)/8.jpg',
            './assets/Jennifer_s 21st Birthday Party (2024)/9.jpg',
            ]
    },    'Mother_s Mary New Grotto (2024)': {
        title: 'Mother\'s Mary New Grotto (2024)',
        photos: [
            './assets/Mother_s Mary New Grotto (2024)/1.jpg',
            './assets/Mother_s Mary New Grotto (2024)/2.jpg',
            './assets/Mother_s Mary New Grotto (2024)/3.jpg',
            './assets/Mother_s Mary New Grotto (2024)/4.jpg',
            './assets/Mother_s Mary New Grotto (2024)/5.jpg',
            './assets/Mother_s Mary New Grotto (2024)/6.jpg',
            './assets/Mother_s Mary New Grotto (2024)/7.jpg',
            './assets/Mother_s Mary New Grotto (2024)/8.jpg',
            './assets/Mother_s Mary New Grotto (2024)/9.jpg',
        ]
    },    'Passion Play (2023)': {
        title: 'Passion Play (2023)',
        photos: [
            './assets/Passion Play (2023)/1.jpg',
            './assets/Passion Play (2023)/2.jpg',
            './assets/Passion Play (2023)/3.jpg',
            './assets/Passion Play (2023)/4.jpg',
            './assets/Passion Play (2023)/5.jpg',
            './assets/Passion Play (2023)/6.jpg',
            './assets/Passion Play (2023)/7.jpg',
            './assets/Passion Play (2023)/8.jpg',
            './assets/Passion Play (2023)/9.jpg',
            './assets/Passion Play (2023)/10.jpg',
        ]
    },
    'Sacha_s Baby Shower (2024)': {
        title: 'Sacha\'s Baby Shower (2024)',
        photos: [
            './assets/Sacha_s Baby Shower (2024)/1.jpg',
            './assets/Sacha_s Baby Shower (2024)/2.jpg',
            './assets/Sacha_s Baby Shower (2024)/3.jpg',
            './assets/Sacha_s Baby Shower (2024)/4.jpg',
            './assets/Sacha_s Baby Shower (2024)/5.jpg',
            './assets/Sacha_s Baby Shower (2024)/6.jpg',
            './assets/Sacha_s Baby Shower (2024)/7.jpg',
        ]
    },
    'Sacha_s Nalangu (2023)': {
        title: 'Sacha\'s Nalangu (2023)',
        photos: [
            './assets/Sacha_s Nalangu (2023)/1.JPG',
            './assets/Sacha_s Nalangu (2023)/2.JPG',
            './assets/Sacha_s Nalangu (2023)/3.jpg',
            './assets/Sacha_s Nalangu (2023)/4.jpg',
            './assets/Sacha_s Nalangu (2023)/5.jpg',
            './assets/Sacha_s Nalangu (2023)/6.jpg',
            './assets/Sacha_s Nalangu (2023)/7.jpg',
            './assets/Sacha_s Nalangu (2023)/8.JPG',
            './assets/Sacha_s Nalangu (2023)/9.jpg',
        ]
    },
};


function loadMainGrid() {
    const grid = document.getElementById('photo-grid');
    grid.innerHTML = ''; // Clear existing content
    grid.className = 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6';

    Object.entries(photoCollections).forEach(([key, collection]) => {
        const photo = createPhotoElement(
            collection.photos[0], // Use the first photo as a thumbnail
            collection.title,
            () => window.location.href = `?collection=${key}`
        );
        grid.appendChild(photo);
    });
}

function loadCollection(collectionKey) {
    const collection = photoCollections[collectionKey];
    if (!collection) {
        console.error('Collection not found');
        return;
    }

    const container = document.querySelector('.max-w-7xl');
    container.innerHTML = ''; // Clear existing content

    // Create a header div for the title and back button
    const header = document.createElement('div');
    header.className = 'flex justify-between items-center mb-8 max-sm:flex-col max-sm:items-start max-sm:mt-4 max-sm:gap-2';
    container.appendChild(header);

    // Add the title
    const title = document.createElement('h1');
    title.textContent = collection.title;
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
        window.location.href = window.location.pathname; // Remove the query parameter
    });
    header.appendChild(backButton);

    // Create the photo grid
    const grid = document.createElement('div');
    grid.id = 'photo-grid';
    grid.className = 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6';
    container.appendChild(grid);

    collection.photos.forEach(photoSrc => {
        const photo = createPhotoElement(photoSrc, collection.title, () => {}, true);
        grid.appendChild(photo);
    });
}
// Main execution
const urlParams = new URLSearchParams(window.location.search);
const collectionParam = urlParams.get('collection');

if (collectionParam) {
    loadCollection(collectionParam);
} else {
    loadMainGrid();
}