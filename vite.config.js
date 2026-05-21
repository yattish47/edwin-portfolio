import { defineConfig } from 'vite';
import { resolve } from 'path';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        second: resolve(__dirname, 'second.html'),
        admin: resolve(__dirname, 'admin/index.html'),
      }
    }
  },
  css: {
    postcss: {
      plugins: [
        tailwindcss,
        autoprefixer,
      ],
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      'flowbite': resolve(__dirname, 'node_modules/flowbite')
    }
  },
  optimizeDeps: {
    include: ['flowbite']
  }
});
