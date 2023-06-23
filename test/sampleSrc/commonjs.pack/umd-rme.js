
(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.math = factory();
  }
})(this, function carry() {
  return "rme-umd.js";
});



// NOTE: (2023.06) 使用 rollup 遇到無法編譯的情況
//  使用的設定 | 原始文件 | 產生結果 | 備註
// :---------- |:-------- |:-------- |:----
//  config01   | file01   | file03   | 通過 cjs 編譯，import file 功能正常。
//  config02   | file01   | file02   | 通過 babel 編譯，符合預期。
//  config03   | file01   | file02   | 通過 babel + cjs 編譯，rollupCommonjs 不起作用。
//  config04   | file01   | file03   | 通過 babel(no-typeof) + cjs 編譯，import file 功能正常。
//  config03   | file02   | file04   | 通過 babel 編譯，再通過 babel + cjs 編譯，import file 功能正常。
//
// ---
// // config01.json
// gulpRollup({
//   plugins: [
//     rollupCommonjs(),
//   ],
//   output: {
//     format: 'es',
//   },
// })
//
// ---
// // config02.json
// gulpRollup({
//   plugins: [
//     rollupBabel({
//       presets: [
//         // 涵蓋 99% 瀏覽器
//         ['@babel/preset-env', {
//           targets: 'cover 99%',
//         }],
//       ],
//     }),
//   ],
//   output: {
//     format: 'es',
//   },
// })
//
// ---
// // config03.json
// gulpRollup({
//   plugins: [
//     rollupBabel({
//       presets: [
//         // 涵蓋 99% 瀏覽器
//         ['@babel/preset-env', {
//           targets: 'cover 99%',
//         }],
//       ],
//     }),
//     rollupCommonjs(),
//   ],
//   output: {
//     format: 'es',
//   },
// })
//
// ---
// // config04.json
// gulpRollup({
//   plugins: [
//     rollupBabel({
//       presets: [
//         // 涵蓋 99% 瀏覽器
//         ['@babel/preset-env', {
//           targets: 'cover 99%',
//           exclude: ['@babel/plugin-transform-typeof-symbol']
//         }],
//       ],
//     }),
//     rollupCommonjs(),
//   ],
//   output: {
//     format: 'es',
//   },
// })
//
// ---
// // file01.js
// (function(root, factory) {
//   if (typeof define === 'function' && define.amd) {
//     define([], factory);
//   } else if (typeof module === 'object' && module.exports) {
//     module.exports = factory();
//   } else {
//     root.math = factory();
//   }
// })(this, function carry() {
//   return "rme-umd.js";
// });
//
// ---
// // file02.js
// function _typeof(obj) {
//   "@babel/helpers - typeof";
//
//   return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function
// (obj) {
//     return typeof obj;
//   } : function (obj) {
//     return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.pr
// ototype ? "symbol" : typeof obj;
//   }, _typeof(obj);
// }
//
// (function (root, factory) {
//   if (typeof define === 'function' && define.amd) {
//     define([], factory);
//   } else if ((typeof module === "undefined" ? "undefined" : _typeof(module)) === 'object' && module.exports) {
//     module.exports = factory();
//   } else {
//     root.math = factory();
//   }
// })(undefined, function carry() {
//   return "rme-umd.js";
// });
//
// ---
// // file03.js
// var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};
//
// function getDefaultExportFromCjs (x) {
//         return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['defa
// ult'] : x;
// }
//
// var umdRme$1 = {exports: {}};
//
// (function (module) {
//         (function (root, factory) {
//           if (module.exports) {
//             module.exports = factory();
//           } else {
//             root.math = factory();
//           }
//         })(commonjsGlobal, function carry() {
//           return "rme-umd.js";
//         });
// } (umdRme$1));
//
// var umdRmeExports = umdRme$1.exports;
// var umdRme = /*@__PURE__*/getDefaultExportFromCjs(umdRmeExports);
//
// export { umdRme as default };
//
// ---
// // file04.js
// function getDefaultExportFromCjs (x) {
//         return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['defa
// ult'] : x;
// }
//
// var umdRme$1 = {exports: {}};
//
// umdRme$1.exports;
//
// (function (module) {
//         function _typeof(obj) {
//           "@babel/helpers - typeof";
//
//           return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? f
// unction (obj) {
//             return typeof obj;
//           } : function (obj) {
//             return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== S
// ymbol.pr;
//           }, _typeof(obj);
//         }
//         (function (root, factory) {
//           if ((_typeof(module)) === 'object' && module.exports) {
//             module.exports = factory();
//           } else {
//             root.math = factory();
//           }
//         })(undefined, function carry() {
//           return "rme-umd.js";
//         });
// } (umdRme$1));
//
// var umdRmeExports = umdRme$1.exports;
// var umdRme = /*@__PURE__*/getDefaultExportFromCjs(umdRmeExports);
//
// export { umdRme as default };
//
// ---

