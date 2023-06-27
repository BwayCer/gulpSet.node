
import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';


export async function fsMkdir(path) {
  await fsPromises.mkdir(path, {recursive: true});
}

export async function fsRm(path, option) {
  if (fs.existsSync(path)) {
    await fsPromises.rm(path, Object.assign({
      recursive: false,
      force: true,
    }, option));
  }
}

export async function fsSymlink(target, path, type) {
  await fsRm(path, {recursive: true});
  await fsPromises.symlink(target, path, type);
}

