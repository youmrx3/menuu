# Pizzeria Menu (Mobile-First)

Fast, lightweight menu website built with Vite + Vanilla JS.

## Features

- Mobile-first responsive layout
- JPEG/PNG menu carousel with swipe support
- Previous / Next controls
- Slide indicator (e.g. `3 / 12`)
- Lazy loading for images
- Adjacent image preloading for smoother swipes
- Fullscreen image view on tap
- QR code modal with copy URL action
- Lightweight loading screen

## Run Locally

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start development server:

   ```bash
   npm run dev
   ```

3. Build for production:

   ```bash
   npm run build
   ```

4. Preview production build:

   ```bash
   npm run preview
   ```

## Replace Menu Images

1. Put your JPG/JPEG/PNG files in:

   - `public/menu/`

2. Update image list in `src/main.js`:

   ```js
   const images = ['menu/1.jpg', 'menu/2.jpg', 'menu/3.jpg'];
   ```

Use any names you want, as long as they match files inside `public/menu/`.

## Change QR Code URL

Edit this constant in `src/main.js`:

```js
const qrCodeUrl = 'https://example.com/pizzeria-menu';
```

Set it to your deployed website URL.

If you set it to an empty string, the app falls back to the current page URL.

## Notes

- Keep image file sizes compressed for low-end phones.
- WebP is usually smaller than JPEG/PNG, but JPG/JPEG/PNG are fully supported.
