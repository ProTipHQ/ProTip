var fs = require('fs')
var path = require('path')
var browserify = require('browserify')
var gulp = require('gulp')
var eslint = require('gulp-eslint')
var source = require('vinyl-source-stream')
var buffer = require('vinyl-buffer')
var npmDist = require('gulp-npm-dist');
var rename = require('gulp-rename')
var uglify = require('gulp-uglify')
var minifyCSS = require('gulp-csso')
var concat = require('gulp-concat')
var sourcemaps = require('gulp-sourcemaps')
var nunjucksRender = require('gulp-nunjucks-render')
var log = require('gulplog')
var del = require('del')
var exec = require('child_process').exec

// Testing
gulp.task('lint', function() {
    return gulp.src([
        'src/controllers/*.js',
        'src/various/*.js',
        'src/wallet/*.js'
    ])
        .pipe(eslint())
        .pipe(eslint.format())
})

// Building
gulp.task('clean', function(cb) {
    exec('rm -rf extension/', function(err, stdout, stderr) {
        cb(err)
    })
})

gulp.task('libs', function() {
    gulp.src(npmDist(), {
        base:'./node_modules'
    })
        .pipe(gulp.dest('./extension/libs'));
});

gulp.task('copy', function() {
    gulp.src('src/controllers/*')
        .pipe(gulp.dest('extension/js'))
    gulp.src('src/css/*', {
        base: 'src'
    })
        .pipe(gulp.dest('extension'))
    gulp.src('src/fonts/**')
        .pipe(gulp.dest('extension/fonts'))
    gulp.src('src/images/**/*')
        .pipe(gulp.dest('extension/images'))
    gulp.src('src/various/*')
        .pipe(gulp.dest('extension/js'))
    gulp.src([
        'src/background.js',
        'src/content.js',
        'src/manifest.json'
    ]).pipe(gulp.dest('extension'))
})

gulp.task('views', function() {
    gulp.src('src/views/*.html')
        .pipe(nunjucksRender({ path: ['src/views/partials'] }))
        .pipe(gulp.dest('extension/views'))
})

gulp.task('bundle', function () {
  var b = browserify({
    entries: './src/bundle.js',
    debug: true
  })

  return b.bundle()
    .pipe(source('bundle.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init({loadMaps: true}))
        //.pipe(uglify())
        .on('error', log.error)
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('./extension/js/'))
})

gulp.task('build', ['clean', 'libs', 'copy', 'views', 'bundle'])

// Packaging
var getManifest = function() {
     var manifest = JSON.parse(fs.readFileSync('./extension/manifest.json'))
     return manifest
}

var getFilename = function() {
    var { short_name, version } = getManifest()
    var filename = `${short_name.toLowerCase()}-${version}`
    return filename
}

// Uses web-ext
gulp.task('package-firefox', function(cb) {
    var filename = getFilename()
    var xpiCommand = 'web-ext -s ./extension -a ./dist/firefox build'
    exec(xpiCommand, function(err, stdout, stderr) {
        cb(err)
        exec('mv dist/firefox/' + filename + '.zip dist/firefox/' + filename + '.xpi')
    })
})

// Uses crx
gulp.task('package-chromium', function(cb) {
    var filename = getFilename()
    var crxCommand = 'crx pack ./extension -o ./dist/chromium/' + filename + '.crx -p .chrome-extension-key.pem'
    exec('mkdir -p dist/chromium')
    exec(crxCommand, function(err, stdout, stderr) {
        cb(err)
    })

})

gulp.task('package', ['package-firefox', 'package-chromium'])
