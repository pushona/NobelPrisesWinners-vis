var gulp = require('gulp');
var useref = require('gulp-useref');
var runSequence = require('run-sequence');

gulp.task('assets', function() {
    return gulp.src('src/assets/**/*')
        .pipe(gulp.dest('dist/assets'))
});
gulp.task('templates', function() {
    return gulp.src('src/templates/**/*')
        .pipe(gulp.dest('dist/templates'))
});
gulp.task('useref', function(){
    return gulp.src('src/index.html')
        .pipe(useref())
        .pipe(gulp.dest('dist'))
});
gulp.task('build', function(callback) {
    runSequence(['useref', 'assets', 'templates'], callback);
});