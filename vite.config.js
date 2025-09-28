import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite needs to know about React and ensure asset paths are relative for Electron.
export default defineConfig({
  plugins: [react()],
  // Set base path to relative './' to ensure assets load correctly in Electron's file:// protocol
  base: './',
  build: {
    // Output files to the 'dist' directory
    outDir: 'dist'
  },
  // Ensure the dev server runs on a specific port for the 'wait-on' script in package.json
  server: {
    port: 5173
  },
  // Add the entry point configuration
  resolve: {
    alias: {
      '@': '/src'
    }
  }
});
