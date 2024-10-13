import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        second: resolve(__dirname, 'second.html'),
      }
    }
  },
  css: {
    postcss: {
      plugins: [
        require('tailwindcss'),
        require('autoprefixer'),
      ],
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      // You may not need this alias unless you are using it in your code
      'flowbite': resolve(__dirname, 'node_modules/flowbite')
    }
  },
  optimizeDeps: {
    include: ['flowbite']
  }
});