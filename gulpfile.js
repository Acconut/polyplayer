var gulp = require("gulp"),
    uglify = require("gulp-uglify"),
    header = require("gulp-header"),
    footer = require("gulp-footer"),
    concat = require("gulp-concat");

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

gulp.task("default", function() {
    
    gulp.run("build");
    
    gulp.watch("./lib/*.js", function() {
        gulp.run("build");
    });
    
});

gulp.task("all", function() {
    gulp.run("build", "build-minify", "build-vendor");
});
