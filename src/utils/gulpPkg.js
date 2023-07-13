
const PKG_NAME = '@bwaycer/gulp-set';

export const gulp = (await import('gulp').catch(err => {
  throw new Error(`Cannot find package "gulp@^4.0.2" imported from ${PKG_NAME}`, {cause: err});
})).default;

// gulp depends on colors, prettyTime
export const colors = (await import('ansi-colors')).default;
export const prettyTime = (await import('pretty-hrtime')).default;

