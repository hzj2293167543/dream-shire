// // // postcss.config.js
// // export default {
// //   plugins: {
// //     // ✅ 用对版本和插件名
// //     'postcss-px-to-viewport': {
// //       viewportWidth: 1920,
// //       unitPrecision: 5,
// //       viewportUnit: 'vw',
// //       propList: ['*', '!border*', '!border-radius'],
// //       selectorBlackList: ['.ignore', 'el-', 'van-'], // 忽略特定前缀的类
// //       minPixelValue: 1,
// //       mediaQuery: false,
// //       exclude: [/node_modules/] // 排除 node_modules
// //     }
// //     // 'postcss-pxtorem': {
// //     //   rootValue: 192,
// //     //   unitPrecision: 3,
// //     //   propList: ['font', 'line-height'],
// //     //   selectorBlackList: ['.ignore-rem'],
// //     //   minPixelValue: 1
// //     // }
// //   }
// // };
// // postcss.config.js
// // export default {
// //   plugins: [
// //     require('postcss-px-to-viewport')({
// //       viewportWidth: 1920,
// //       unitPrecision: 5,
// //       viewportUnit: 'vw',
// //       propList: ['*', '!border*', '!border-radius', '!box-shadow'],
// //       selectorBlackList: [
// //         /^\.ignore/,
// //         /^\.el-/,
// //         /^\.van-/,
// //         /^\.is-/, // Element UI 状态类
// //         /^\.v-/, // Vue 相关
// //         /::v-deep/, // Vue deep 选择器
// //         /::vue-deep/,
// //         /deep/,
// //         /:deep/,
// //         /:slotted/,
// //         /:global/
// //       ],
// //       minPixelValue: 1,
// //       mediaQuery: false,
// //       exclude: [/node_modules/, /\.module\.css$/], // 排除模块化 CSS
// //       include: /src/ // 只处理 src 目录下的文件
// //     })
// //   ]
// // };
// // 使用 postcss-px-to-viewport-8-plugin，专门为 PostCSS 8 设计
// const pxToViewport = require('postcss-px-to-viewport-8-plugin');

// module.exports = {
//   plugins: [
//     pxToViewport({
//       viewportWidth: 1920,
//       unitPrecision: 5,
//       viewportUnit: 'vw',
//       fontViewportUnit: 'vw', // 字体也使用 vw

//       // 属性列表：转换所有属性，除了边框和圆角
//       propList: ['*', '!border*', '!border-radius*', '!box-shadow', '!text-shadow'],

//       // 选择器黑名单：使用正则匹配
//       selectorBlackList: [
//         /\.ignore/, // 匹配所有包含 .ignore 的选择器
//         /^\.el-/, // 匹配以 .el- 开头的选择器
//         /^\.van-/, // 匹配以 .van- 开头的选择器
//         /^\.is-/, // Element UI 状态类
//         /\.keep-px/, // 自定义保持 px 的类
//         /^html$/, // 排除 html 元素
//         /^body$/ // 排除 body 元素
//       ],

//       // 处理 Vue scoped 样式
//       transformSelector: function (selector) {
//         // 移除 data-v-xxx 属性，让黑名单能正确匹配
//         return selector.replace(/\[data-v-[^\]]+\]/g, '');
//       },

//       minPixelValue: 1,
//       mediaQuery: false,

//       // 只转换 src 目录下的文件
//       include: /src\//,

//       // 排除 node_modules
//       exclude: /node_modules/,

//       // 是否直接替换，而不是添加新规则
//       replace: true,

//       // 是否忽略某部分文件
//       landscape: false
//     })
//   ]
// };
