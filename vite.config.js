import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { handleApiRequest } from './server/apiHandler.js';

const kbbApiPlugin = () => ({
  name: 'kbb-centralized-api',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      handleApiRequest(req, res, next);
    });
  },
  configurePreviewServer(server) {
    server.middlewares.use((req, res, next) => {
      handleApiRequest(req, res, next);
    });
  }
});

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), kbbApiPlugin()]
});
