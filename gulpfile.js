var gulp = require("gulp"),
    uglify = require("gulp-uglify"),
    header = require("gulp-header"),
    footer = require("gulp-footer"),
    concat = require("gulp-concat");

/**
 * Concat all files from ./lib into ./polyplayer.js
 * No vendors are included
 */
gulp.task("build", function() {
    
    gulp.src([
        "./lib/player.js",
        "./lib/model.js",
        "./lib/soundcloud.js",
        "./lib/youtube.js",
        "./lib/vimeo.js"
    ])
        .pipe(concat("polyplayer.js"))
        .pipe(header({ file: "./assets/header.txt" }))
        .pipe(footer({ file: "./assets/footer.txt" }))
        .pipe(gulp.dest("./"));
    
});

/**
 * Concat and minify all files from ./lib into ./polyplayer.js
 * No vendors are included
 */
gulp.task("build-minify", function() {
    
    gulp.src([
        "./lib/player.js",
        "./lib/model.js",
        "./lib/soundcloud.js",
        "./lib/youtube.js",
        "./lib/vimeo.js"
    ])
        .pipe(concat("polyplayer.min.js"))
        .pipe(header({ file: "./assets/header.txt" }))
        .pipe(footer({ file: "./assets/footer.txt" }))
        .pipe(uglify())
        .pipe(gulp.dest("./"));
    
});

/**
 * Concat and minify all files from ./lib into ./polyplayer.js
 * All vendors (soundcloud and vimeo (froogaloop.js)) are included
 */
gulp.task("build-vendor", function() {
        
    gulp.src([
        "./vendor/soundcloud.js",
        "./vendor/froogaloop.js",
        "./lib/player.js",
        "./lib/model.js",
        "./lib/soundcloud.js",
        "./lib/youtube.js",
        "./lib/vimeo.js"
    ])
        .pipe(concat("polyplayer.vendor.min.js"))
        .pipe(header({ file: "./assets/header.txt" }))
        .pipe(footer({ file: "./assets/footer.txt" }))
        .pipe(uglify())
        .pipe(gulp.dest("./"));
    
});

/**
 * Development task
 * Run `build` for each change in ./lib
 */
gulp.task("default", function() {
    
    gulp.run("build");
    
    gulp.watch("./lib/*.js", function() {
        gulp.run("build");
    });
    
});

/**
 * Build polyplayer.js, polyplayer.min.js and polyplayer.vendor.min.js
 */
gulp.task("all", function() {
    gulp.run("build", "build-minify", "build-vendor");
});
