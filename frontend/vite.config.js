import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Config do Vite. host:true permite servir via 0.0.0.0 (necessario no Docker).
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5444
  }
});
