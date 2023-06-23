/*! The content of this article refers to GitHub:MikeKovarik/gulp-better-rollup@3eae3d1/index.js */


import path from 'path';
import {Transform} from 'stream';

import Vinyl from 'vinyl';
import PluginError from 'plugin-error';


const PLUGIN_NAME = 'gulp-plugin-rollup';
const rollup = (await import('rollup').catch(err => {
  throw new Error(`Cannot find package "rollup@^3.25.1" imported from ${PLUGIN_NAME}`, {cause: err});
})).rollup;


// map object storing rollup cache objects for each input file
const rollupCache = {};


/**
 * Rollup 打包管道。
 *
 * 這不是一個實在的 gulp 串流。
 * Rollup 無法讀取之前的轉換結果，只會從將 file 的路徑重新讀取再做轉換輸出。
 * 建議把 Rollup 放在第一個管道位置。
 *
 * @param config
 * 設定選項與 [Rollup config](https://rollupjs.org/command-line-interface/#configuration-files)
 * 相同，或者更進階的設定如下：
 * ```
 * { ... rollup config
 *   resolveInput({cwd, base, path}) {...},
 *   resolveOutputName({cwd, base, path}) {...},
 *   resolveOutputAmd({cwd, base, path}) {...},
 * }
 */
export default function gulpRollup(config) {
  let {
    resolveInput,
    resolveOutputName,
    resolveOutputAmd,
    inputOptions: originInputOptions,
    outputOptionsList: originOutputOptionsList,
  } = _parseConfig(config);

  return new Transform({
    async transform(file, encoding, callback) {
      // cannot handle empty or unavailable files
      if (file.isNull()) {
        return callback(null, file);
      }

      // cannot handle streams
      if (file.isStream()) {
        return callback(
          new PluginError(PLUGIN_NAME, 'Streaming not supported'),
        );
      }

      let fileInfo = _getFileInfo(file);

      // 處理 Stream 的 inputOptions
      let inputOptions = Object.assign({}, originInputOptions);
      inputOptions.input = typeof resolveInput === 'function'
        ? resolveInput(_getFileInfo(fileInfo))
        : path.relative(file.cwd, file.path)
      ;

      // caching is enabled by default because of the nature of gulp and the watching/recompilatin
      // but can be disabled by setting 'cache' to false
      if (inputOptions.cache !== false) {
        inputOptions.cache = rollupCache[inputOptions.input] || null;
      }

      // enable sourcemap is gulp-sourcemaps plugin is enabled
      let isCreateSourceMap = file.sourceMap !== undefined;

      try {
        // pass basic options to rollup
        let bundle = await rollup(inputOptions);

        // cache rollup object if caching is enabled
        if (inputOptions.cache !== false) {
          rollupCache[inputOptions.input] = bundle;
        }

        // generate ouput according to (each of) given outputOptions
        await Promise.all(
          originOutputOptionsList.map(_outputOptions => {
            // 處理 Transform 的 outputOptions
            let outputOptions = _getOutputOptionsForStream(
              fileInfo,
              _outputOptions,
              isCreateSourceMap,
              resolveOutputName,
              resolveOutputAmd,
            );
            let isInjectNewFile = _isInjectNewFile(outputOptions);
            return _rollupGenerate(
              fileInfo,
              file,
              bundle,
              outputOptions,
              isInjectNewFile,
              isCreateSourceMap,
            ).then(file => {
              this.push(file);
            });
          }),
        );

        // end stream
        callback(null);
      } catch (err) {
        if (inputOptions.cache !== false) {
          rollupCache[inputOptions.input] = null;
        }
        process.nextTick(() => {
          this.emit('error', new PluginError(PLUGIN_NAME, err));
          callback(null);
        });
      }
    },
    objectMode: true,
  });
}

function _parseConfig(config) {
  let newConfig = {
    resolveInput: null,
    resolveOutputName: null,
    resolveOutputAmd: null,
  };
  if (config === null || typeof config !== 'object') {
    return {
      ...newConfig,
      inputOptions: {},
      outputOptionsList: [{}],
    };
  }

  [ 'resolveInput',
    'resolveOutputName',
    'resolveOutputAmd',
  ].forEach(item => {
    if (config.hasOwnProperty(item)) {
      newConfig[item] = config[item];
      Reflect.deleteProperty(config, item);
    }
  });

  let inputOptions = config;
  if ('input' in inputOptions) {
    console.log(
      PLUGIN_NAME
      + ' ignore the "input" field in the Rollup configuration file.'
      + ' (only accepts file paths from the stream input.)',
    );
    Reflect.deleteProperty(inputOptions, 'input');
  }

  if (inputOptions.hasOwnProperty('watch')) {
    Reflect.deleteProperty(inputOptions, 'watch');
  }

  let outputOptionsList;
  if (inputOptions.hasOwnProperty('output')) {
    outputOptionsList = inputOptions.output;
    Reflect.deleteProperty(inputOptions, 'output');

    if (outputOptionsList instanceof Array) {
      outputOptionsList = _filterOutputOptionsList(outputOptionsList);
    } else {
      outputOptionsList = [outputOptionsList];
    }
  }

  return {
    ...newConfig,
    inputOptions,
    outputOptionsList,
  };
}

function _isInjectNewFile(outputOptions) {
  return typeof outputOptions.file === 'string';
}

// * 若 `typeof outputOptions.file !== 'string'`
//   視為是對原始文件的轉換，只能有一個，以後者覆蓋前者來挑選。
function _filterOutputOptionsList(originList) {
  let outputOptionsList = [];
  let lastNoFileFieldOpts = null;
  outputOptionsList = originList.filter(item => {
    let isNewFileOpt = _isInjectNewFile(item);
    if (!isNewFileOpt) {
      lastNoFileFieldOpts = item;
    }
    return isNewFileOpt;
  });
  if (lastNoFileFieldOpts !== null) {
    outputOptionsList.unshift(lastNoFileFieldOpts);
  }
  return outputOptionsList;
}

function _getFileInfo({cwd, base, path}) {
  return {cwd, base, path};
}

// 處理 Stream 的 outputOptions
function _getOutputOptionsForStream(
  fileInfo,
  outputOptions,
  isCreateSourceMap,
  resolveOutputName,
  resolveOutputAmd,
) {
  outputOptions = Object.assign({}, outputOptions);

  // Rollup won't bundle iife and umd modules without module name.
  // But it won't say anything either, leaving a space for confusion
  let _fileInfo = _getFileInfo(fileInfo);
  if (
    outputOptions.name === undefined
    && typeof resolveOutputName === 'function'
  ) {
    outputOptions.name = resolveOutputName(_fileInfo);
  }
  if (outputOptions.amd === undefined) {
    if (typeof resolveOutputAmd === 'function') {
      outputOptions.amd = resolveOutputAmd(_fileInfo);
    } else if (outputOptions.name !== undefined) {
      outputOptions.amd = {id: outputOptions.name};
    }
  }

  let sourcemap = isCreateSourceMap || outputOptions.sourcemap;
  if (sourcemap === undefined) {
    outputOptions.sourcemap = sourcemap;
  }

  return outputOptions;
}

function _rollupGenerate(
  fileInfo,
  file,
  bundle,
  outputOptions,
  isInjectNewFile,
  isCreateSourceMap,
) {
  let targetFile = file;
  if (isInjectNewFile) {
    // custom output name might be set
    let newFilePath = path.join(
      fileInfo.base,
      path.basename(outputOptions.file),
    );
    // create new file and inject it into stream if needed (in case of multiple outputs)
    targetFile = new Vinyl({
      cwd: fileInfo.cwd,
      base: fileInfo.base,
      path: newFilePath,
      stat: {
        isFile: () => true,
        isDirectory: () => false,
        isBlockDevice: () => false,
        isCharacterDevice: () => false,
        isSymbolicLink: () => false,
        isFIFO: () => false,
        isSocket: () => false,
      },
    });
  }

  // generate bundle according to given or autocompleted options
  return bundle.generate(outputOptions).then(result => {
    if (result === undefined) {
      return;
    }

    // 可能為 打包文件 + sourcemap
    // Pass sourcemap content and metadata to gulp-sourcemaps plugin to handle
    let output = result.output[0];
    // return bundled file as buffer
    targetFile.contents = Buffer.from(output.code);

    // Pass sourcemap content and metadata to gulp-sourcemaps plugin to handle
    if (result.output.length > 1) {
      let output = result.output[1];
      targetFile.sourceMap = JSON.parse(output.source);
    }

    return targetFile;
  });
}

