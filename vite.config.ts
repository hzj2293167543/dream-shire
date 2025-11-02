import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';
import Pages from 'vite-plugin-pages';
import extendRoute from './src/router/extendRoute';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    Pages({
      dirs: [
        {
          dir: 'src/views',
          baseRoute: '/'
        }
      ],
      extensions: ['vue'],
      extendRoute
    }),
    vue({
      // @ts-ignore
      vapor: true
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src') // 确保指向正确
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: [
          '@use "@/styles/init.scss" as *;',
          '@use "@/styles/main.scss" as *;',
          '@use "@/styles/common.scss" as *;',
          ''
        ].join('\n')
      }
    }
  }
});
