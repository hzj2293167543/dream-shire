// postcss.config.js
export default {
  plugins: {
    "postcss-px-to-viewport": {
      viewportWidth: 1920, // 设计稿宽
      unitPrecision: 5,
      viewportUnit: "vw",
      selectorBlackList: [".font", ".text"], // 不让 vw 处理的类
      minPixelValue: 1,
    },
    "postcss-pxtorem": {
      rootValue: 192, // 1920 屏时 1 rem = 192 px
      unitPrecision: 5,
      propList: ["font", "line-height", "padding", "margin"], // 只转这些属性
      selectorBlackList: [".ignore-rem"],
    },
  },
};
