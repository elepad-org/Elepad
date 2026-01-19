import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  preview: {
    port: 3000,
    // Configurar para que funcione con React Router en preview
    strictPort: false,
  },
  build: {
    // Asegurar que los assets se manejen correctamente
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
})
