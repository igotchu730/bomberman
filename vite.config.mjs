import { defineConfig } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [visualizer({ open: true })], //bundle visualiser
  build: {
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['phaser']
          // Phaser import has its own separate JavaScript chunk called vendor 
          // reduces size and increase load speed. Phaser can cache in browser.
        }
      }
    }
  }
});
