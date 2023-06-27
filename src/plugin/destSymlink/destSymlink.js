
import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import {Transform} from 'stream';

import {fsMkdir, fsSymlink} from '../../utils/fsQuick.js';


/**
 * 產生鏈結文件管道。
 *
 * @func gulpDestSymlink
 * @param {String} directory
 * @return {stream.Transform}
 */
// NOTE:
// 1. gulp.symlink 會遇到 Error: premature close 問題
// 2. 此方法不會為非鏈結文件的資料夾建立鏈結文件。
export default function gulpDestSymlink(directory) {
  let dirList = [];

  return new Transform({
    async transform(chunk, encoding, callback) {
      let srcFileStat = await fsPromises.stat(chunk.path);
      if (srcFileStat.isDirectory()) {
        dirList.push({
          cwd: chunk.cwd,
          base: chunk.base,
          path: chunk.path,
        });
      } else {
        await createSymlink(directory, chunk.cwd, chunk.base, chunk.path);
      }
      callback(null);
    },
    async flush(callback) {
      // NOTE:
      // `gulp.src()` 只有在目錄鏈結文件的子層明確匹配時
      // 才會如預期的查找其子目錄或文件。
      // 如：
      //   "./symlinkParent/symlinkDir/**" -> 會查找 symlinkDir 鏈結文件的子層
      //   "./symlinkParent/**" -> 只會查找到 symlinkDir 鏈結文件為止
      // 因此完整複製的邏輯為：
      // 1. 先建立文件的鏈結文件。
      // 2. 剩餘的目錄路徑，再過濾掉建立目的地已存在文件的路徑。(避免覆蓋已處理好的文件)
      // 3. 剩餘的目錄路徑，挑出原目錄為鏈結文件的建立鏈結文件。
      for (let idx = 0, len = dirList.length; idx < len; idx++) {
        let item = dirList[idx];
        let linkPath = path.join(
          path.resolve(item.cwd, directory),
          path.relative(item.base, item.path),
        );
        if (fs.existsSync(linkPath)) {
          continue;
        }
        let srcFileLstat = await fsPromises.lstat(item.path);
        if (srcFileLstat.isSymbolicLink()) {
          await createSymlink(directory, item.cwd, item.base, item.path);
        }
      }
      dirList.length = 0;
      callback(null);
    },
    objectMode: true,
  });
}

// cwd, base, path 都是絕對路徑，cwd 不一定等於 process.cwd()
// directory 可以是絕對或相對路徑，相對路徑是相對於 process.cwd() (和 gulp.dest() 相同)
async function createSymlink(directory, cwd, base, filePath) {
  let linkPath = path.join(
    path.resolve(cwd, directory),
    path.relative(base, filePath),
  );
  let linkDirPath = path.join(linkPath, '..');
  let linkTarget = path.relative(linkDirPath, filePath);
  await fsMkdir(linkDirPath);
  await fsSymlink(linkTarget, linkPath);
}

