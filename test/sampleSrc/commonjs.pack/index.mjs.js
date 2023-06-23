
import './xxx-global.js';

import esNothingDefault from './es-nothing-events.js';
import * as esPrivatePropertyClass from './es-privatePropertyClass.js';
import umdRme from './umd-rme.js';
import cjsRmxSimple from './cjs-rmx-simple.js';
import cjsXxeSimple from './cjs-xxe-simple.js';
import cjsXmeSimple from './cjs-xme-simple.js';
import cjsRmxXxxHasFileName from './cjs-rmx-confusionInRollup-hasFileName.js';
import cjsRmxXxxFnUseExport from './cjs-rmx-confusionInRollup-fnUseExport.js';

export default {
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

