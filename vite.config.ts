import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
// GitHub Pages sert le site sous /galerie-d-art-ahlem/, Vercel à la racine /
export default defineConfig({
  base: process.env.VERCEL ? '/' : '/galerie-d-art-ahlem/',
  plugins: [react(), tailwindcss()],
})
