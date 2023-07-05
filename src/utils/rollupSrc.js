/*! The content of this article refers to GitHub:MikeKovarik/gulp-better-rollup@3eae3d1/index.js */


import fsPromises from 'fs/promises';
import path from 'path';
import {Transform} from 'stream';

import gs from 'glob-stream';
import Vinyl from 'vinyl';
import PluginError from 'plugin-error';


const PLUGIN_NAME = 'gulpRollupSrc';
const rollup = (await import('rollup').catch(err => {
  throw new Error(`Cannot find package "rollup@^3.25.1" imported from ${PLUGIN_NAME}`, {cause: err});
})).rollup;


  /**
   * @typedef {Object} GulpStreamFileInfo
   * @property {String} cwd
   * @property {String} base
   * @property {String} path
   */
  /**
   * @typedef {Function} RollupBaseResolve
   * @param {GulpStreamFileInfo} filePathInfo
   * @return {String}
   */
/**
 * Rollup 讀取來源。
 *
 * @param {(String|Array.<String>)} globs
 * @param {?Object} options
 * @param {?Object} options.gs
 * 見 [GitHub:gulpjs/glob-stream@8450d16/README.md#Options](https://github.com/gulpjs/glob-stream#Options)。
 * @param {?Object} options.input
 * 見 [Rollup:inputoptions](https://rollupjs.org/javascript-api/#inputoptions-object)。
 * @param {?(Object|Array.<Object>)} options.output
 * 見 [Rollup:inputoptions](https://rollupjs.org/javascript-api/#outputoptions-object)。
 * @param {?RollupBaseResolve} options.resolveInput
 * 修改 [Rollup:input.input](https://rollupjs.org/configuration-options/#input) 值的單份文件路徑。
 * @param {?RollupBaseResolve} options.resolveOutputName
 * 修改 [Rollup:output.name](https://rollupjs.org/configuration-options/#output-name) 的值。
 * @param {?RollupBaseResolve} options.resolveOutputAmd
 * 修改 [Rollup:output.name](https://rollupjs.org/configuration-options/#output-amd) 的值。
 */
export function rollupSrc(globs, options) {
  let {
    gs: gsOptions,
    resolveInput,
    resolveOutputName,
    resolveOutputAmd,
    inputOptions: originInputOptions,
    outputOptionsList: originOutputOptionsList,
  } = _parseConfig(options);

  // map object storing rollup cache objects for each input file
  let _rollupCache = {};

  return gs(globs, gsOptions).pipe(new Transform({
    async transform(file, encoding, callback) {
      let isFile = false;
      try {
        let fileStats = await fsPromises.stat(file.path);
        isFile = fileStats.isFile();
      } catch {}
      if (!isFile) {
        callback(null);
        return;
      }

      let fileInfo = {...file};

      // 處理 Stream 的 inputOptions
      let inputOptions = Object.assign({}, originInputOptions);
      inputOptions.input = typeof resolveInput === 'function'
        ? resolveInput(fileInfo)
        : path.relative(file.cwd, file.path)
      ;

      // caching is enabled by default because of the nature of gulp and the watching/recompilatin
      // but can be disabled by setting 'cache' to false
      if (inputOptions.cache !== false) {
        inputOptions.cache = _rollupCache[inputOptions.input] || null;
      }

      try {
        // pass basic options to rollup
        let bundle = await rollup(inputOptions);

        // cache rollup object if caching is enabled
        if (inputOptions.cache !== false) {
          _rollupCache[inputOptions.input] = bundle;
        }

        // generate ouput according to (each of) given outputOptions
        await Promise.all(originOutputOptionsList.map(_outputOptions => {
          // 處理 Transform 的 outputOptions
          let outputOptions = _resolveOutputOptions(
            fileInfo,
            _outputOptions,
            resolveOutputName,
            resolveOutputAmd,
          );

          let targetFile = _createVinyl(fileInfo, outputOptions);

          // generate bundle according to given or autocompleted options
          return bundle.generate(outputOptions).then(result => {
            if (result.output.length > 1) {
              console.log(
                PLUGIN_NAME
                + ' ignore output files beyond the second one from the "'
                + fileInfo.path + '" path.'
                + ` (${result.output.map(item => item.type).join(', ')})`,
              );
            }

            let realOutputs = result.output.filter(item => item.type === 'chunk');

            let output = realOutputs[0];
            targetFile.contents = Buffer.from(output.code, encoding);
            if (output.map !== null) {
              targetFile.sourceMap = output.map;
            }

            this.push(targetFile);
          });
        }));

        // end stream
        callback(null);
      } catch (err) {
        if (inputOptions.cache !== false) {
          _rollupCache[inputOptions.input] = null;
        }
        process.nextTick(() => {
          this.emit('error', new PluginError(PLUGIN_NAME, err));
          callback(null);
        });
      }
    },
    flush(callback) {
      _rollupCache = {};
      callback(null);
    },
    objectMode: true,
  }));
}

function _parseConfig(config) {
  let newConfig = {
    gs: undefined,
    resolveInput: null,
    resolveOutputName: null,
    resolveOutputAmd: null,
  };
  let inputOptions = {};
  let outputOptionsList = [{}];
  if (config === null || typeof config !== 'object') {
    return {
      ...newConfig,
      inputOptions,
      outputOptionsList,
    };
  }

  [
    'gs',
    'resolveInput',
    'resolveOutputName',
    'resolveOutputAmd',
  ].forEach(item => {
    if (config.hasOwnProperty(item)) {
      newConfig[item] = config[item];
    }
  });

  if (config.input instanceof Object) {
    inputOptions = config.input;

    if ('input' in inputOptions) {
      console.log(
        PLUGIN_NAME
        + ' ignore the "input" field in the Rollup configuration file.'
        + ' (only accepts file paths from the stream input.)',
      );
      Reflect.deleteProperty(inputOptions, 'input');
    }
  }

  let _output = config.output;
  if (_output instanceof Array) {
    outputOptionsList = _filterOutputOptionsList(_output);
  } else if (_output instanceof Object) {
    outputOptionsList = [_output];
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
  let lastNoFileFieldOpts = undefined;
  outputOptionsList = originList.filter(item => {
    let isNewFileOpt = _isInjectNewFile(item);
    if (!isNewFileOpt) {
      lastNoFileFieldOpts = item;
    }
    return isNewFileOpt;
  });
  if (lastNoFileFieldOpts !== undefined) {
    outputOptionsList.unshift(lastNoFileFieldOpts);
  }
  return outputOptionsList;
}

// 處理 Transform 的 outputOptions
function _resolveOutputOptions(
  fileInfo,
  outputOptions,
  resolveOutputName,
  resolveOutputAmd,
) {
  outputOptions = Object.assign({}, outputOptions);

  // Rollup won't bundle iife and umd modules without module name.
  // But it won't say anything either, leaving a space for confusion
  if (typeof resolveOutputName === 'function') {
    outputOptions.name = resolveOutputName(fileInfo);
  }
  if (typeof resolveOutputAmd === 'function') {
    outputOptions.amd = resolveOutputAmd(fileInfo);
  } else if (
    outputOptions.amd === undefined
    && outputOptions.name !== undefined
  ) {
    outputOptions.amd = {id: outputOptions.name};
  }

  return outputOptions;
}

function _createVinyl(fileInfo, outputOptions) {
  let filePath = _isInjectNewFile(outputOptions)
    ? path.join(fileInfo.base, path.basename(outputOptions.file))
    : fileInfo.path
  ;

  // create new file and inject it into stream if needed (in case of multiple outputs)
  return new Vinyl({
    cwd: fileInfo.cwd,
    base: fileInfo.base,
    path: filePath,
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

