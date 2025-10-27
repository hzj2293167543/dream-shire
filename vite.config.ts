import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue({
      // @ts-ignore
      vapor: true,
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"), // 确保指向正确
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: [
          '@use "@/styles/init.scss" as *;',
          '@use "@/styles/main.scss" as *;',
          '@use "@/styles/common.scss" as *;',
          "",
        ].join("\n"),
      },
    },
  },
});
