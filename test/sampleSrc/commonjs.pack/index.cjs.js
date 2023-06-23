
require('./xxx-global.js');

let esNothingDefault = require('./es-nothing-events.js');
let esPrivatePropertyClass = require('./es-privatePropertyClass.js');
let umdRme = require('./umd-rme.js');
let cjsRmxSimple = require('./cjs-rmx-simple.js');
let cjsXxeSimple = require('./cjs-xxe-simple.js');
let cjsXmeSimple = require('./cjs-xme-simple.js');
let cjsRmxXxxHasFileName = require('./cjs-rmx-confusionInRollup-hasFileName.js');
let cjsRmxXxxFnUseExport = require('./cjs-rmx-confusionInRollup-fnUseExport.js');

module.exports = {
  xxxGlobalThis: typeof xxxGlobalThis !== 'undefined' ? xxxGlobalThis : null,
  xxxGlobalWin:
    typeof xxxGlobalWin !== 'undefined' ? xxxGlobalWin
    : typeof window !== 'undefined' && 'xxxGlobalWin' in window
    ? window.xxxGlobalWin
    : null,
  esNothingDefault,
  esPrivatePropertyClass,
  umdRme,
  cjsRmxSimple,
  cjsXxeSimple,
  cjsXmeSimple,
  cjsRmxXxxHasFileName,
  cjsRmxXxxFnUseExport,
};

