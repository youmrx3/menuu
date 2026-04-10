import './style.css';
import QRCode from 'qrcode';

// Replace with your own menu image files in /public/menu
const images = ['menu/1.png', 'menu/2.png', 'menu/3.png'];

// Replace this URL with your production website URL for QR sharing.
const qrCodeUrl = 'https://example.com/pizzeria-menu';

const carouselTrack = document.getElementById('carouselTrack');
const carouselViewport = document.getElementById('carouselViewport');
const indicator = document.getElementById('slideIndicator');
const prevButton = document.getElementById('prevButton');
const nextButton = document.getElementById('nextButton');
const loadingScreen = document.getElementById('loadingScreen');

const qrButton = document.getElementById('qrButton');
const qrModal = document.getElementById('qrModal');
const qrCanvas = document.getElementById('qrCanvas');
const qrUrlText = document.getElementById('qrUrlText');
const closeQrButton = document.getElementById('closeQrButton');
const copyQrUrlButton = document.getElementById('copyQrUrlButton');

const fullscreenModal = document.getElementById('fullscreenModal');
const fullscreenImage = document.getElementById('fullscreenImage');
const closeFullscreenButton = document.getElementById('closeFullscreenButton');

const preloadCache = new Set();
let currentIndex = 0;
let qrReady = false;
let firstImageSettled = false;

function hideLoadingScreen() {
  if (firstImageSettled) {
    return;
  }
  firstImageSettled = true;
  loadingScreen.classList.add('hidden');
}

function createSlides() {
  if (!images.length) {
    const emptyCard = document.createElement('div');
    emptyCard.className = 'empty-card';
    emptyCard.textContent = 'No menu images found.';
    carouselTrack.append(emptyCard);
    indicator.textContent = '0 / 0';
    prevButton.disabled = true;
    nextButton.disabled = true;
    hideLoadingScreen();
    return;
  }

  const fallbackTimer = window.setTimeout(hideLoadingScreen, 2200);

  images.forEach((path, index) => {
    const slide = document.createElement('article');
    slide.className = 'slide';

    const img = document.createElement('img');
    img.className = 'slide-image';
    img.alt = `Menu page ${index + 1}`;
    img.dataset.src = path;
    img.loading = 'lazy';
    img.decoding = 'async';

    img.addEventListener(
      'load',
      () => {
        if (index === 0) {
          window.clearTimeout(fallbackTimer);
          hideLoadingScreen();
        }
      },
      { once: true }
    );

    img.addEventListener('error', () => {
      img.classList.add('missing-image');
      img.alt = `Missing file: ${path}`;
      if (index === 0) {
        window.clearTimeout(fallbackTimer);
        hideLoadingScreen();
      }
    });

    img.addEventListener('click', () => openFullscreen(img.currentSrc || img.src || path));

    slide.append(img);
    carouselTrack.append(slide);
  });
}

function lazyLoadImage(index) {
  if (index < 0 || index >= images.length) {
    return;
  }

  const slideImage = carouselTrack.children[index]?.querySelector('img');
  if (!slideImage || slideImage.getAttribute('src')) {
    return;
  }

  slideImage.src = slideImage.dataset.src;
}

function preloadAdjacentImage(index) {
  if (!images.length) {
    return;
  }

  const path = images[index];
  if (!path || preloadCache.has(path)) {
    return;
  }

  preloadCache.add(path);
  const preloader = new Image();
  preloader.decoding = 'async';
  preloader.src = path;
}

function updateCarousel(animate = true) {
  if (!images.length) {
    return;
  }

  if (!animate) {
    carouselTrack.classList.add('no-animate');
  } else {
    carouselTrack.classList.remove('no-animate');
  }

  carouselTrack.style.transform = `translateX(${-currentIndex * 100}%)`;
  indicator.textContent = `${currentIndex + 1} / ${images.length}`;

  lazyLoadImage(currentIndex);
  lazyLoadImage((currentIndex + 1) % images.length);
  lazyLoadImage((currentIndex - 1 + images.length) % images.length);

  preloadAdjacentImage((currentIndex + 1) % images.length);
}

function goToNext() {
  if (!images.length) {
    return;
  }
  currentIndex = (currentIndex + 1) % images.length;
  updateCarousel();
}

function goToPrevious() {
  if (!images.length) {
    return;
  }
  currentIndex = (currentIndex - 1 + images.length) % images.length;
  updateCarousel();
}

let touchStartX = 0;
let touchEndX = 0;

function onTouchStart(event) {
  touchStartX = event.changedTouches[0].clientX;
}

function onTouchEnd(event) {
  touchEndX = event.changedTouches[0].clientX;
  const delta = touchEndX - touchStartX;

  if (Math.abs(delta) < 40) {
    return;
  }

  if (delta < 0) {
    goToNext();
  } else {
    goToPrevious();
  }
}

function getShareUrl() {
  return qrCodeUrl.trim() || window.location.href;
}

async function ensureQrRendered() {
  if (qrReady) {
    return;
  }

  const url = getShareUrl();
  qrUrlText.textContent = url;

  await QRCode.toCanvas(qrCanvas, url, {
    width: 220,
    margin: 1,
    color: {
      dark: '#F9E4C8',
      light: '#25190F'
    }
  });

  qrReady = true;
}

function openQrModal() {
  ensureQrRendered().catch(() => {
    qrUrlText.textContent = 'Unable to generate QR code. Check the URL.';
  });
  qrModal.classList.remove('hidden');
}

function closeQrModal() {
  qrModal.classList.add('hidden');
}

async function copyQrUrl() {
  const url = getShareUrl();
  try {
    await navigator.clipboard.writeText(url);
    copyQrUrlButton.textContent = 'Copied';
    window.setTimeout(() => {
      copyQrUrlButton.textContent = 'Copy URL';
    }, 1200);
  } catch {
    copyQrUrlButton.textContent = 'Copy failed';
    window.setTimeout(() => {
      copyQrUrlButton.textContent = 'Copy URL';
    }, 1200);
  }
}

function openFullscreen(src) {
  fullscreenImage.src = src;
  fullscreenModal.classList.remove('hidden');
}

function closeFullscreen() {
  fullscreenModal.classList.add('hidden');
  fullscreenImage.removeAttribute('src');
}

function initEventListeners() {
  nextButton.addEventListener('click', goToNext);
  prevButton.addEventListener('click', goToPrevious);

  carouselViewport.addEventListener('touchstart', onTouchStart, { passive: true });
  carouselViewport.addEventListener('touchend', onTouchEnd, { passive: true });

  qrButton.addEventListener('click', openQrModal);
  closeQrButton.addEventListener('click', closeQrModal);
  copyQrUrlButton.addEventListener('click', copyQrUrl);

  qrModal.addEventListener('click', (event) => {
    if (event.target === qrModal) {
      closeQrModal();
    }
  });

  closeFullscreenButton.addEventListener('click', closeFullscreen);
  fullscreenModal.addEventListener('click', (event) => {
    if (event.target === fullscreenModal) {
      closeFullscreen();
    }
  });

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeQrModal();
      closeFullscreen();
    }

    if (event.key === 'ArrowRight') {
      goToNext();
    }

    if (event.key === 'ArrowLeft') {
      goToPrevious();
    }
  });
}

createSlides();
initEventListeners();
updateCarousel(false);
