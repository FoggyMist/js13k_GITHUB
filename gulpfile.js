const { src, dest } = require('gulp');
const minifyJS = require('gulp-minify');

exports.default = () => {
    return src('bin/*.js')
      .pipe(minifyJS({
          ext: {
              min: ".js",
              src: ".source.js",
          },
          noSource: true,
      }))
      .pipe(dest('bin'));
};;
