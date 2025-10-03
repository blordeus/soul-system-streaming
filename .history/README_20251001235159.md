# Soul System Streaming — Full Setup

## 1. Create Project
```bash
npm create vite@latest soul-system-player -- --template react
cd soul-system-player
npm install
```

## 2. Tailwind Setup
```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```
Edit tailwind.config.js → add content paths.

## 3. Install Icons & Motion
```bash
npm install lucide-react framer-motion
```

## 4. Assets
- /public/img/soul-system-cover.png
- /public/img/logo-astronaut.png
- /public/img/soul-system-promo-no-text.png
- /public/img/noise-texture.png
- /public/audio/01.mp3 … 13.mp3

## 5. album.json
Configure album + branding.

## 6. Run Locally
```bash
npm run dev
```
Visit http://localhost:5173 and http://localhost:5173/embed

## 7. Deploy (Vercel)
vercel.json included. Run:
```bash
npm run build
vercel --prod
```
