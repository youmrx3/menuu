import './style.css';
import QRCode from 'qrcode';

// Keep this list synced with files inside /public/menu.
const menuFileNames = [
  '1-TACOS.jpg',
  '2-BURGER.jpg',
  '3-THAISTY CROUSTY.jpg',
  '4-CHICKEN.jpg',
  '5-SUPPLEMENT.jpg',
  '6-PIZZA.jpg',
  '7-PIZZA SPECIAL.jpg',
  '8-SALADE.jpg',
  '9-PASTA AND RICE.jpg',
  '10-SANDWICH.jpg',
  '11-SANDWICH.jpg',
  '12-LYALI.jpg',
  '13-JUS.jpg',
  '14-BUBBLE TARTE.jpg',
  '15-SMOOTHIE.jpg',
  '16-CREPES.jpg',
  '17-BUBBLE WAFFLE.jpg',
  '18-BOISSONS.jpg',
  '19-TOPPINGS.jpg'
];

const dessertStartNumber = 12;

const menuItems = menuFileNames
  .map((fileName) => {
    const match = fileName.match(/^(\d+)\s*[-_. ]\s*(.+)\.(png|jpe?g|webp)$/i);
    if (!match) {
      return null;
    }

    const number = Number(match[1]);
    const normalizedTitle = match[2]
      .replace(/[-_]+/g, ' ')
      .trim()
      .replace(/\s+/g, ' ');

    return {
      fileName,
      number,
      title: normalizedTitle,
      path: `menu-lite/${fileName.replace(/\.(png|jpe?g|webp)$/i, '.webp')}`,
      fallbackPath: `menu/${fileName}`
    };
  })
  .filter(Boolean)
  .sort((a, b) => a.number - b.number);

const images = menuItems.map((item) => item.path);

// Replace this URL with your production website URL for QR sharing.
const qrCodeUrl = 'https://spartmenu.vercel.app/';

const carouselTrack = document.getElementById('carouselTrack');
const carouselViewport = document.getElementById('carouselViewport');
const indicator = document.getElementById('slideIndicator');
const nextItemIndicator = document.getElementById('nextItemIndicator');
const sectionBadge = document.getElementById('sectionBadge');
const prevButton = document.getElementById('prevButton');
const nextButton = document.getElementById('nextButton');
const loadingScreen = document.getElementById('loadingScreen');
const loadingLogo = document.getElementById('loadingLogo');
const loadingLogoFallback = document.getElementById('loadingLogoFallback');
const brandLogo = document.getElementById('brandLogo');

const qrButton = document.getElementById('qrButton');
const qrModal = document.getElementById('qrModal');
const qrCanvas = document.getElementById('qrCanvas');
const qrUrlText = document.getElementById('qrUrlText');
const closeQrButton = document.getElementById('closeQrButton');
const copyQrUrlButton = document.getElementById('copyQrUrlButton');
const downloadQrSvgButton = document.getElementById('downloadQrSvgButton');

const fullscreenModal = document.getElementById('fullscreenModal');
const fullscreenImage = document.getElementById('fullscreenImage');
const closeFullscreenButton = document.getElementById('closeFullscreenButton');
const zoomInButton = document.getElementById('zoomInButton');
const zoomOutButton = document.getElementById('zoomOutButton');
const zoomResetButton = document.getElementById('zoomResetButton');

const preloadCache = new Set();
let currentIndex = 0;
let qrReady = false;
let qrSvgObjectUrl = '';
let firstImageSettled = false;
let fullscreenScale = 1;
let pinchStartDistance = 0;
let pinchStartScale = 1;
let fullscreenTranslateX = 0;
let fullscreenTranslateY = 0;
let panStartX = 0;
let panStartY = 0;
let panOriginX = 0;
let panOriginY = 0;
let isPanning = false;

function clampZoom(value) {
  return Math.max(1, Math.min(4, value));
}

function updateZoomUI() {
  const percent = Math.round(fullscreenScale * 100);
  zoomResetButton.textContent = `${percent}%`;
}

function clampPanInBounds() {
  const baseWidth = fullscreenImage.clientWidth;
  const baseHeight = fullscreenImage.clientHeight;

  const scaledWidth = baseWidth * fullscreenScale;
  const scaledHeight = baseHeight * fullscreenScale;

  const maxPanX = Math.max(0, (scaledWidth - window.innerWidth) / 2);
  const maxPanY = Math.max(0, (scaledHeight - window.innerHeight) / 2);

  fullscreenTranslateX = Math.min(maxPanX, Math.max(-maxPanX, fullscreenTranslateX));
  fullscreenTranslateY = Math.min(maxPanY, Math.max(-maxPanY, fullscreenTranslateY));
}

function applyFullscreenZoom() {
  clampPanInBounds();
  fullscreenImage.style.transform = `translate(${fullscreenTranslateX}px, ${fullscreenTranslateY}px) scale(${fullscreenScale})`;
  updateZoomUI();
}

function setFullscreenZoom(nextScale) {
  fullscreenScale = clampZoom(nextScale);

  if (fullscreenScale === 1) {
    fullscreenTranslateX = 0;
    fullscreenTranslateY = 0;
  }

  applyFullscreenZoom();
}

function getTouchDistance(touchA, touchB) {
  const dx = touchA.clientX - touchB.clientX;
  const dy = touchA.clientY - touchB.clientY;
  return Math.hypot(dx, dy);
}

function startPan(touch) {
  isPanning = true;
  panStartX = touch.clientX;
  panStartY = touch.clientY;
  panOriginX = fullscreenTranslateX;
  panOriginY = fullscreenTranslateY;
}

function updatePan(touch) {
  if (!isPanning || fullscreenScale <= 1) {
    return;
  }

  fullscreenTranslateX = panOriginX + (touch.clientX - panStartX);
  fullscreenTranslateY = panOriginY + (touch.clientY - panStartY);
  applyFullscreenZoom();
}

function stopPan() {
  isPanning = false;
}

function initLogoAssets() {
  loadingLogo.addEventListener(
    'error',
    () => {
      loadingLogo.classList.add('logo-image-hidden');
      loadingLogoFallback.classList.remove('hidden');
    },
    { once: true }
  );

  brandLogo.addEventListener(
    'error',
    () => {
      brandLogo.style.display = 'none';
    },
    { once: true }
  );
}

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
    nextItemIndicator.textContent = 'Next: -';
    sectionBadge.textContent = 'Menu';
    prevButton.disabled = true;
    nextButton.disabled = true;
    hideLoadingScreen();
    return;
  }

  const fallbackTimer = window.setTimeout(hideLoadingScreen, 2200);

  menuItems.forEach((item, index) => {
    const slide = document.createElement('article');
    slide.className = 'slide';

    const img = document.createElement('img');
    img.className = 'slide-image';
    if (item.number === 12) {
      img.classList.add('slide-image-full');
    }
    img.alt = `Menu ${item.number} ${item.title}`;
    img.dataset.src = item.path;
    img.dataset.fallbackSrc = item.fallbackPath;
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
      const fallbackSrc = img.dataset.fallbackSrc;
      const currentSrc = img.getAttribute('src') || '';

      if (fallbackSrc && !currentSrc.includes('/menu/')) {
        img.src = fallbackSrc;
        return;
      }

      img.classList.add('missing-image');
      img.alt = `Missing file: ${item.path}`;
      if (index === 0) {
        window.clearTimeout(fallbackTimer);
        hideLoadingScreen();
      }
    });

    img.addEventListener('click', () => openFullscreen(img.currentSrc || img.src || item.path));

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

  const currentItem = menuItems[currentIndex];
  const nextItem = menuItems[(currentIndex + 1) % images.length];

  carouselTrack.style.transform = `translateX(${-currentIndex * 100}%)`;
  indicator.textContent = `${currentIndex + 1} / ${images.length}`;

  const inDessertMenu = currentItem.number >= dessertStartNumber;
  document.body.classList.toggle('dessert-mode', inDessertMenu);
  sectionBadge.textContent = inDessertMenu ? 'Dessert Menu' : 'Main Menu';

  if (images.length === 1) {
    nextItemIndicator.textContent = `Only item: #${currentItem.number} ${currentItem.title}`;
  } else if (!inDessertMenu && nextItem.number >= dessertStartNumber) {
    nextItemIndicator.textContent = `Next: Dessert starts at #${nextItem.number} ${nextItem.title}`;
  } else {
    nextItemIndicator.textContent = `Next: #${nextItem.number} ${nextItem.title}`;
  }

  lazyLoadImage(currentIndex);
  lazyLoadImage((currentIndex + 1) % images.length);

  preloadAdjacentImage((currentIndex + 2) % images.length);
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

  const qrOptions = {
    width: 220,
    margin: 1,
    color: {
      dark: '#F9E4C8',
      light: '#25190F'
    }
  };

  await QRCode.toCanvas(qrCanvas, url, qrOptions);

  const svgMarkup = await QRCode.toString(url, {
    type: 'svg',
    margin: 1,
    color: {
      dark: '#000000',
      light: '#ffffff'
    }
  });

  if (qrSvgObjectUrl) {
    URL.revokeObjectURL(qrSvgObjectUrl);
  }

  qrSvgObjectUrl = URL.createObjectURL(new Blob([svgMarkup], { type: 'image/svg+xml' }));
  downloadQrSvgButton.href = qrSvgObjectUrl;
  downloadQrSvgButton.download = 'spartmenu-qr.svg';

  qrReady = true;
}

function openQrModal() {
  ensureQrRendered().catch(() => {
    qrUrlText.textContent = 'Unable to generate QR code. Check the URL.';
    downloadQrSvgButton.removeAttribute('href');
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
  fullscreenScale = 1;
  fullscreenTranslateX = 0;
  fullscreenTranslateY = 0;
  stopPan();
  applyFullscreenZoom();
  fullscreenModal.classList.remove('hidden');
}

function closeFullscreen() {
  fullscreenModal.classList.add('hidden');
  fullscreenImage.removeAttribute('src');
  fullscreenScale = 1;
  fullscreenTranslateX = 0;
  fullscreenTranslateY = 0;
  stopPan();
  applyFullscreenZoom();
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
  zoomInButton.addEventListener('click', () => setFullscreenZoom(fullscreenScale + 0.25));
  zoomOutButton.addEventListener('click', () => setFullscreenZoom(fullscreenScale - 0.25));
  zoomResetButton.addEventListener('click', () => setFullscreenZoom(1));

  fullscreenImage.addEventListener('dblclick', () => {
    if (fullscreenScale > 1) {
      setFullscreenZoom(1);
    } else {
      setFullscreenZoom(2);
    }
  });

  fullscreenImage.addEventListener(
    'touchstart',
    (event) => {
      if (event.touches.length === 2) {
        pinchStartDistance = getTouchDistance(event.touches[0], event.touches[1]);
        pinchStartScale = fullscreenScale;
        stopPan();
        return;
      }

      if (event.touches.length === 1 && fullscreenScale > 1) {
        startPan(event.touches[0]);
        event.preventDefault();
      }
    },
    { passive: false }
  );

  fullscreenImage.addEventListener(
    'touchmove',
    (event) => {
      if (event.touches.length === 2) {
        stopPan();

        const nextDistance = getTouchDistance(event.touches[0], event.touches[1]);
        if (!pinchStartDistance) {
          pinchStartDistance = nextDistance;
        }

        const scaleRatio = nextDistance / pinchStartDistance;
        setFullscreenZoom(pinchStartScale * scaleRatio);
        event.preventDefault();
        return;
      }

      if (event.touches.length === 1 && fullscreenScale > 1) {
        updatePan(event.touches[0]);
        event.preventDefault();
      }
    },
    { passive: false }
  );

  fullscreenImage.addEventListener('touchend', (event) => {
    if (!fullscreenImage.src) {
      return;
    }

    if (event.touches.length < 2) {
      pinchStartDistance = 0;
      pinchStartScale = fullscreenScale;
    }

    if (event.touches.length === 0) {
      stopPan();
      return;
    }

    if (event.touches.length === 1 && fullscreenScale > 1) {
      startPan(event.touches[0]);
    }
  });

  fullscreenImage.addEventListener('touchcancel', () => {
    pinchStartDistance = 0;
    pinchStartScale = fullscreenScale;
    stopPan();
  });

  fullscreenModal.addEventListener('click', (event) => {
    if (event.target === fullscreenModal) {
      closeFullscreen();
    }
  });

  window.addEventListener('resize', () => {
    updateCarousel(false);
    applyFullscreenZoom();
  });

  window.addEventListener('beforeunload', () => {
    if (qrSvgObjectUrl) {
      URL.revokeObjectURL(qrSvgObjectUrl);
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
initLogoAssets();
initEventListeners();
updateCarousel(false);
