import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Standalone static-web build for subpath serving.
// The reverse proxy strips the /gibson prefix, so the app always sees its
// root at "/".  Relative asset paths ("./assets/...") keep the bundle
// self-contained regardless of where it lands under a domain.
export default defineConfig({
  root: resolve(__dirname, 'src/renderer'),
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      '@renderer': resolve(__dirname, 'src/renderer/src')
    }
  },
  build: {
    outDir: resolve(__dirname, 'dist-web'),
    emptyOutDir: true
  }
})
