Gulp 小工具
=======


關於 [Gulp](https://gulpjs.com/) 的輔助工具集。


## 工具集目錄

* [gulpRun](./src/gulpRun.js):
    參考 gulp-cli 調用 gulp 的方式，可以直接調用
    `gulp` 而不更改預期的 `process.cwd()` 路徑。
* [gulpTask](./src/gulpTask.js):
    以彈性的物件對象取代函式方式來建立任務。
* [utils/rollupSrc](./src/utils/rollupSrc.js):
    使用 Rollup 讀取來源來替換 `gulp.src()`。
* [utils/tool](./src/utils/tool.js):
  * `changeGlobs`:
      當 Gulp 和其他轉換包衝突而不能更改 `cwd`, `base`
      選項時，那就更改 `gulp.src()` 的選取路徑吧！
  * `insertPipe`:
      可以對 `gulp.pipe()` 擴展管道，因此提高模組化的便利性。
* [plugin-pug](./src/plugin/pug/pug.js)
* [plugin-sass](./src/plugin/sass/sass.js)
* [plugin-destSymlink](./src/plugin/destSymlink/destSymlink.js): 輸出鏈結文件。

