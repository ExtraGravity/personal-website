import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    host: true,
    // honor the port assigned by the preview harness via PORT env
    port: process.env.PORT ? Number(process.env.PORT) : 5173,
  },
  build: {
    // keep classic media query syntax — (width<=600px) range syntax
    // is ignored by Safari <16.4 / Chrome <104
    cssTarget: 'safari14',
  },
})
