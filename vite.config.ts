// import { defineConfig } from 'vite';
// import vue from '@vitejs/plugin-vue';
// import path from 'path';
// import Pages from 'vite-plugin-pages';
// import extendRoute from './src/router/extendRoute';

// // https://vite.dev/config/
// export default defineConfig({
//   plugins: [
//     Pages({
//       dirs: [
//         {
//           dir: 'src/views',
//           baseRoute: '/'
//         }
//       ],
//       extensions: ['vue'],
//       extendRoute
//     }),
//     vue({
//       // @ts-ignore
//       vapor: true
//     })
//   ],
//   resolve: {
//     alias: {
//       '@': path.resolve(__dirname, './src') // 确保指向正确
//     }
//   },
//   css: {
//     preprocessorOptions: {
//       scss: {
//         additionalData: [
//           '@use "@/styles/init.scss" as *;',
//           '@use "@/styles/main.scss" as *;',
//           '@use "@/styles/common.scss" as *;',
//           ''
//         ].join('\n')
//       }
//     },
//     postcss: './postcss.config.js'
//   }
// });

// vite.config.js
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';
import Pages from 'vite-plugin-pages';
import extendRoute from './src/router/extendRoute';
import pxToViewport from 'postcss-px-to-viewport-8-plugin';

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
      '@': path.resolve(__dirname, './src')
    }
  },
  css: {
    // 直接在 Vite 中配置 PostCSS
    postcss: {
      plugins: [
        pxToViewport({
          viewportWidth: 1920,
          unitPrecision: 5,
          viewportUnit: 'vw',
          propList: ['*', '!border*', '!border-radius'],

          // 处理 Vue scoped 选择器
          selectorBlackList: ['.ignore', 'el-', 'van-'],

          // 处理 Vue scoped 的 data-v 属性
          replace: true,

          minPixelValue: 1,
          mediaQuery: false,
          exclude: [/node_modules/]
        })
      ]
    },
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
