
import path from 'path';
import {Readable, Writable, Transform} from 'stream';


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

