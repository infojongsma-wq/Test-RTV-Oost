import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import legacy from '@vitejs/plugin-legacy'
import { viteSingleFile } from 'vite-plugin-singlefile'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    legacy({
      targets: ['defaults'],
      renderLegacyChunks: true,
      modernPolyfills: true,
    }),
    viteSingleFile({
      removeViteModuleLoader: true,
    }),
  ],
  base: './',
  build: {
    target: 'es2015',
    modulePreload: false,
  },
})
