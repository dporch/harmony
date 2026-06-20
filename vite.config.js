import { resolve } from 'path';
import tailwindcss from '@tailwindcss/vite';

export default {
  plugins: [tailwindcss()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        room: resolve(import.meta.dirname, 'room.html'),
      },
    },
  },
};
