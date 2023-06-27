
import path from 'path';
import {Transform} from 'stream';

import minimist from 'minimist';
import gulp from 'gulp';
import {babel as rollupBabel} from '@rollup/plugin-babel';
import rollupNodeResolve from '@rollup/plugin-node-resolve';
import rollupCommonjs from '@rollup/plugin-commonjs';

import gulpRun from '../src/gulpRun.js';
import {changeGlobs, mediumTransform, gulpTask, rollupSrc} from '../src/utils.js';
import gulpDestSymlink from '../src/plugin/destSymlink/destSymlink.js';


const _filename = import.meta.url.substring(7);


let cmdArgv = minimist(process.argv.slice(2));

if (cmdArgv.h === true || cmdArgv.help === true) {
  console.log(
    `Usage: ${path.basename(_filename)} [OPTION]`
    + '       <taskName ()>'
    + '\n\nOptions:'
    + '\n  -s, --src <path>   origin directory. (default: "./src")'
    + '\n  -t, --to <path>    dist directory. (default: "./dist")'
    + '\n  -h, --help        display this help',
  );
  process.exit();
}
cmdArgv.src = cmdArgv.src ?? cmdArgv.s ?? 'src';
cmdArgv.to = cmdArgv.to ?? cmdArgv.t ?? 'dist';


switch (cmdArgv._[0]) {
  case 'mediumTransform':
    testUtilsMediumTransform();
    break;
  case 'gulpTask':
    testGulpTask();
    break;
  case 'gulpRollupSrc':
    testGulpRollupSrc();
    break;
  case 'gulpRun':
    testGulpRun();
    break;
  case 'gulpDestSymlink':
    testGulpDestSymlink();
    break;
}

function gulpShowPassFileInfo(outputLog) {
  return new Transform({
    transform(file, encoding, callback) {
      if (typeof outputLog === 'function') {
        console.log(outputLog(file));
      } else {
        console.log(
          'file info'
          + `\n  cwd: ${file.cwd}\n  base: ${file.base}`
          + `\n  relative: ${file.relative}\n  path: ${file.path}`,
        );
      }
      callback(null, file);
    },
    objectMode: true,
  });
}

function testUtilsMediumTransform() {
  console.log(
    '預計輸出: pass 01 -> 02 -> file info'
    + '\n---',
  );

  let buildTransform = function buildTransform(readable) {
    return readable
      .pipe(gulpShowPassFileInfo(() => 'pass 02'))
    ;
  };

  let originDirPath = path.dirname(_filename);
  gulpRun('copy', () =>
    gulp.src('sampleSrc/path/**/main.txt', {
      cwd: originDirPath,
      allowEmpty: true,
    })
      .pipe(gulpShowPassFileInfo(() => 'pass 01'))
      .pipe(mediumTransform(buildTransform))
      .pipe(gulpShowPassFileInfo())
      .pipe(gulp.dest(path.join(originDirPath, 'dist')))
  );
}

function testGulpTask() {
  console.log(
    '預計輸出: pass 01 -> file info'
    + '\n---',
  );

  let originDirPath = path.dirname(_filename);
  gulpRun('copy', gulpTask({
    src: 'sampleSrc/path/**/main.txt',
    srcOption: {
      cwd: originDirPath,
      allowEmpty: true,
    },
    build(readable) {
      return readable
        .pipe(gulpShowPassFileInfo(() => 'pass 01'))
        .pipe(gulpShowPassFileInfo())
      ;
    },
    dest: path.join(originDirPath, 'dist'),
  }));
}

function testGulpRun() {
  console.log(
    'base info:'
    + `\n  process.cwd(): ${process.cwd()}`
    + `\n  entryPagePath: ${_filename}`
    + '\n'
    + "\n模擬 `gulp copy` do `gulpRun('copy', function () {...})` 打印的訊息展示:"
    + '\n---',
  );

  let originDirPath = path.dirname(_filename);
  gulpRun('copy', () =>
    gulp.src('sampleSrc/path/**/main.txt', {
      cwd: originDirPath,
      allowEmpty: true,
    })
      .pipe(gulpShowPassFileInfo())
      .pipe(gulp.dest(path.join(originDirPath, 'dist')))
  );
}

function testGulpRollupSrc() {
  let originDirPath = path.dirname(_filename);
  gulpRun('rollupSrc', () =>
    rollupSrc(
      changeGlobs(path.relative(process.cwd(), originDirPath), [
        'sampleSrc/**/*.{js,cjs,mjs,es}',
        '!**/MTProtoCore.js',
      ]),
      {
        gs: {
          cwd: process.cwd(),
          base: originDirPath,
          allowEmpty: true,
          sourcemaps: true,
        },
        input: {
          external: (id, fromPath) => {
            console.log(`rollup get:\n  id: ${id}\n  fromPath: ${fromPath}`);
            return false;
          },
          plugins: [
            rollupNodeResolve({
              browser: true,
              preferBuiltins: false,
              // NOTE: 只需指名目錄名，會自動匹配上層目錄。
              // moduleDirectories: moduleDirNames,
            }),
            rollupBabel({
              presets: [
                // 涵蓋 99% 瀏覽器
                ['@babel/preset-env', {
                  targets: 'cover 99%',
                  exclude: ['@babel/plugin-transform-typeof-symbol']
                }],
              ],
            }),
            rollupCommonjs(),
          ],
        },
        output: {
          format: 'es',
          sourcemap: true,
        },
        // resolveInput: (fileInfo) => path.relative(process.cwd(), fileInfo.path),
        // resolveGulpFileName: true,
      },
    )
      .pipe(gulpShowPassFileInfo())
      .pipe(gulp.dest(
        path.join(originDirPath, 'dist'),
        {sourcemaps: '.'}
      ))
  );
}

function testGulpDestSymlink() {
  let originDirPath = path.dirname(_filename);
  gulpRun('symlink', () =>
    gulp.src('sampleSrc/path/**/*', {
      cwd: originDirPath,
      allowEmpty: true,
    })
      .pipe(gulpShowPassFileInfo())
      .pipe(gulpDestSymlink(path.join(originDirPath, 'dist')))
  );
}

