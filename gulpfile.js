// Initialize modules
// Importing specific gulp API functions lets us write them below as series() instead of gulp.series()
const { src, dest, watch, series, parallel } = require('gulp');
// Importing all the Gulp-related packages we want to use
const sourcemaps = require('gulp-sourcemaps');
const sass = require('gulp-sass');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');
const replace = require('gulp-replace');
const browserSync = require('browser-sync');

const server = browserSync.create();

// File paths
const files = {
  indexPath: 'app/*.html',
  scssPath: 'app/scss/**/*.scss',
  jsPath: 'app/js/**/*.js',
};

// Sass task: compiles the style.scss file into style.css
function scssTask() {
  return src(files.scssPath)
    .pipe(sourcemaps.init()) // initialize sourcemaps first
    .pipe(sass()) // compile SCSS to CSS
    .pipe(postcss([autoprefixer(), cssnano()])) // PostCSS plugins
    .pipe(sourcemaps.write('.')) // write sourcemaps file in current directory
    .pipe(dest('dist')); // put final CSS in dist folder
}

// JS task: concatenates and uglifies JS files to script.js
function jsTask() {
  return src([
    files.jsPath,
    //,'!' + 'includes/js/jquery.min.js', // to exclude any specific files
  ])
    .pipe(concat('all.js'))
    .pipe(uglify())
    .pipe(dest('dist'));
}

// Cachebust
function cacheBustTask() {
  var cbString = new Date().getTime();
  return src(['./dist/*.html'])
    .pipe(replace(/cb=\d+/g, 'cb=' + cbString))
    .pipe(dest('dist'));
}

// Copy Assets task: copies images folder to dist
function copyImagesTask() {
  return src(['app/images/**/*']).pipe(dest('dist/images'));
}

// Copy Assets task: copies images folder to dist
function copyIconsTask() {
  return src(['app/icons/**/*']).pipe(dest('dist/icons'));
}

// Copy Index task: copies index file to dist
function copyIndexTask() {
  return src(['app/*.html']).pipe(dest('dist'));
}

// Browser-sync local server
function reload(done) {
  server.reload();
  done();
}

function serve(done) {
  server.init({
    server: {
      baseDir: './dist',
    },
  });
  done();
}

// Watch task: watch SCSS and JS files for changes
// If any change, run scss and js tasks simultaneously
function watchTask() {
  watch(
    [files.indexPath, files.scssPath, files.jsPath],
    { interval: 1000, usePolling: true }, //Makes docker work
    series(
      parallel(scssTask, jsTask),
      copyImagesTask,
      copyIconsTask,
      copyIndexTask,
      cacheBustTask,
      reload
    )
  );
}

// Export the default Gulp task so it can be run
// Runs the scss and js tasks simultaneously
// then runs cacheBust, then watch task
exports.default = series(
  parallel(scssTask, jsTask),
  copyImagesTask,
  copyIconsTask,
  copyIndexTask,
  cacheBustTask,
  serve,
  watchTask
);
