import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In dev the browser only talks to :5173; Vite forwards API + OAuth calls to Spring Boot.
// Same origin => the HttpOnly auth cookie and the CSRF cookie "just work", no CORS needed.
const backend = 'http://localhost:8080';
export default defineConfig({
  envPrefix: ['VITE_', 'BACKEND_URL'],
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': backend,
      '/oauth2': backend,
      '/login/oauth2': backend,
    },
  },
});
