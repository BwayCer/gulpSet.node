
import {gulp} from './utils/gulpPkg.js';
import {changeGlobs, insertPipe} from './utils/tool.js';


/**
 * 創建任務：
 * 以彈性的物件對象取代函式方式來建立任務。
 *
 * @func gulpTask
 * @param {Object} info
 * @param {?String} info.name
 * @param {?String} info.srcBase
 * @param {(String|Array)} info.src
 * @param {?Object} info.srcOption
 * @param {Function} info.build
 * @param {?(string|function)} info.dest
 * @param {?Object} info.destOption
 * @param {?stream.Writable} info.writable
 * @return {Function}
 *
 * @example
 * function doTaskA() {
 *   return gulp.src(<globs>, <srcOption>)
 *     .pipe(insertPipe(<buildTransform>))
 *     .pipe(gulp.dest(<dest>, <destOption>))
 *   ;
 * }
 * // same as
 * gulpTask({
 *   name: 'doTaskA',
 *   src: <globs>,
 *   srcOption: <srcOption>,
 *   build: <buildTransform>,
 *   dest: <dest>,
 *   destOption: <destOption>,
 * });
 */
// NOTE: 如果只用 `Transform` 則只會觸發最後一個 `pipe()`。
export default function gulpTask(info) {
  ['src', 'build'].forEach(member => {
    if (member in info) {
      return;
    }
    throw new Error(`Missing required property "${member}" in the "info" object.`);
  });
  let fn = () => {
    let globs = 'srcBase' in info
      ? changeGlobs(info.srcBase, info.src)
      : info.src
    ;
    let streamTask = gulp.src(globs, info.srcOption)
      .pipe(insertPipe(info.build))
    ;
    if ('dest' in info) {
      streamTask.pipe(gulp.dest(info.dest, info.destOption));
    } else if ('writable' in info) {
      streamTask.pipe(info.writable);
    }
    return streamTask;
  };
  if (typeof info.name === 'string') {
    Reflect.defineProperty(fn, 'name', {value: info.name});
  }
  return fn;
}

