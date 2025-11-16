import { fileURLToPath, URL } from 'node:url'
import {resolve} from 'path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { isWhiteSpaceSingleLine } from 'typescript'





// https://vitejs.dev/config/
export default defineConfig({
  base: `/salsa/server/`,
  plugins: [
    vue(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 5173,
    hmr: {
      port: 8444,
      clientPort: 8444
    }
  },
  build: {
    rollupOptions: {
      input: {
        coordinator: resolve(__dirname, 'coordinator.html'),
        admin: resolve(__dirname, 'admin.html'),
      },
    },
    minify: false,
    terserOptions: {
      compress: false,
      mangle: false,
    },
  },
})
