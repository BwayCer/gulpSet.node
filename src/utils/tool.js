
import path from 'path';
import {Readable, Writable, Transform} from 'stream';

import {gulp} from './gulpPkg.js';


/**
 * 改變選取路徑：
 * 當 Gulp 和其他轉換包衝突而不能更改 `cwd`, `base`
 * 選項時，那就更改 `gulp.src()` 的選取路徑吧！
 *
 * @func changeGlobs
 * @param {String} srcBase
 * @param {(String|Array)} globs
 * @return {(String|Array)}
 *
 * @example
 * changeGlobs('new/src/path', [
 *   'the/fileA',
 *   '!the/fileB',
 * ]);
 * // ['new/src/path/the/fileA',
 * //  '!new/src/path/the/fileB']
 */
export function changeGlobs(srcBase, globs) {
  return typeof globs === 'string'
    ? _changeGlob(srcBase, globs)
    : globs.map(item => _changeGlob(srcBase, item))
  ;
}

function _changeGlob(prefix, glob) {
  return glob.startsWith('!')
    ? '!' + path.join(prefix, glob.substring(1))
    : path.join(prefix, glob)
  ;
}


/**
 * 擴展管道：
 * 可以在 `gulp.pipe()` 中丟入一組處裡包，因此提高模組化的便利性。
 *
 * @func insertPipe
 * @param {Function} buildTransform
 * @return {stream.Transform}
 *
 * @example
 * gulp.src(...)
 *   .pipe(transform01())
 *   .pipe(transform02())
 *   .pipe(transform03())
 * // same as
 * function buildTransform(readable) {
 *   return readable
 *     .pipe(transform02())
 *   ;
 * }
 * gulp.src(...)
 *   .pipe(transform01())
 *   .pipe(insertPipe(buildTransform))
 *   .pipe(transform03())
 */
// NOTE: 如果只用 `Transform` 則只會觸發最後一個 `pipe()`。
export function insertPipe(buildTransform) {
  let readable = new Readable({
    // TODO: 從此處著手處理串流過載問題？
    read(/* size */) {},
    objectMode: true,
  });
  let currFlushCallback = null;
  let transform = new Transform({
    transform(chunk, encoding, callback) {
      readable.push(chunk, encoding);
      callback(null);
    },
    flush(callback) {
      readable.push(null);
      currFlushCallback = callback;
    },
    objectMode: true,
  });
  buildTransform(readable)
    .pipe(new Writable({
      write(chunk, encoding, callback) {
        transform.push(chunk);
        callback(null);
      },
      final(callback) {
        callback(null);
        currFlushCallback(null);
      },
      objectMode: true,
    }))
  ;
  return transform;
}


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
export function gulpTask(info) {
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

