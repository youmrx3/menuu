# Pizzeria Menu (Mobile-First)

Fast, lightweight menu website built with Vite + Vanilla JS.

## Features

- Mobile-first responsive layout
- JPEG/PNG menu carousel with swipe support
- Previous / Next controls
- Slide indicator (e.g. `3 / 12`)
- Next-item indicator (shows upcoming menu page)
- Automatic color switch to Dessert Menu starting at item 12
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

3. Optimize menu images for phone performance:

   ```bash
   npm run optimize:menu
   ```

4. Build for production:

   ```bash
   npm run build
   ```

5. Preview production build:

   ```bash
   npm run preview
   ```

## Replace Menu Images

1. Put your JPG/JPEG/PNG files in:

   - `public/menu/`

2. Name files with a number prefix so ordering is clear, for example:

   - `1-TACOS.jpg`
   - `2-BURGER.jpg`
   - `12-LYALI.jpg`

3. Update file list in `src/main.js`:

   ```js
   const menuFileNames = ['1-TACOS.jpg', '2-BURGER.jpg'];
   ```

The app auto-sorts by the numeric prefix and switches to Dessert Menu theme at item 12.

4. After adding/replacing images, run:

   ```bash
   npm run optimize:menu
   ```

This creates lightweight WebP files in `public/menu-lite/` used by the carousel for smoother phone performance.

5. Keep your logo file here if you want it shown in the header and loading screen:

   - `public/menu/logo.png`

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
