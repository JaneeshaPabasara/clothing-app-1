import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react({
      fastRefresh: true,
      babel: {
        plugins: ['@babel/plugin-transform-react-jsx']
      }
    })
  ],
  server: {
    port: 3000,
    open: true,
    hmr: {
      overlay: true
    }
  },
  build: {
    outDir: 'build',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          firebase: ['firebase/app', 'firebase/firestore']
        }
      }
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'firebase/app', 'firebase/firestore']
  }
})