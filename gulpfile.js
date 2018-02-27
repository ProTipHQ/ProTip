var fs = require('fs')
var path = require('path')
var gulp = require('gulp')
var del = require('del')
var rename = require('gulp-rename')
var uglify = require('gulp-uglify')
var minifyCSS = require('gulp-csso')
var concat = require('gulp-concat')
var sourcemaps = require('gulp-sourcemaps')
var exec = require('child_process').exec
var nunjucksRender = require('gulp-nunjucks-render')

gulp.task('clean', function(cb) {
    exec('rm -rf extension', function(err, stdout, stderr) {
        cb(err)
    })
})

gulp.task('copy', function() {
    gulp.src('src/assets/**/*', { base: 'src' })
        .pipe(gulp.dest('extension'))
    gulp.src('src/controllers/*.js')
        .pipe(gulp.dest('extension/controllers'))
    gulp.src('src/features/**')
        .pipe(gulp.dest('extension/features'))
    gulp.src('src/init/**')
        .pipe(gulp.dest('extension/init'))
    gulp.src('src/views/*.html')
        .pipe(nunjucksRender({ path: ['src/views/partials'] }))
        .pipe(gulp.dest('extension/views'))
    gulp.src('src/lib/*.js')
        .pipe(gulp.dest('extension/lib'))
    gulp.src('src/js/*.js')
        .pipe(gulp.dest('extension/js'))
    gulp.src([
        'src/background.js',
        'src/content.js',
        'src/manifest.json'
    ]).pipe(gulp.dest('extension'))
})

gulp.task('build', [ 'clean', 'copy' ])


// Package for FF & Chrome
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
