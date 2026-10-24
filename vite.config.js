import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const { BACKEND_URL } = loadEnv(mode, process.cwd(), '');
  if (!BACKEND_URL) {
    throw new Error('Set BACKEND_URL in the frontend environment before starting Vite or building.');
  }

  return {
    envPrefix: ['VITE_', 'BACKEND_URL'],
    plugins: [react()],
    server: { port: 5173 },
  };
});
