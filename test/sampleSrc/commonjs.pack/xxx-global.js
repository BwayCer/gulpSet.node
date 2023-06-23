
function xxxGlobal() {
  return "xxx-global.js";
}

if (this) {
  this.xxxGlobalThis = xxxGlobal;
}

if (typeof window !== 'undefined') {
  window.xxxGlobalWin = xxxGlobal;
}

