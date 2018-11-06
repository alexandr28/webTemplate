import gulp from "gulp";
import browserSync from "browser-sync";
import sass from "gulp-sass";
import postcss from "gulp-postcss";
import cssnano from "cssnano";
import browserify from "browserify";
import source from "vinyl-source-stream";
import sourcemaps from "gulp-sourcemaps";
import buffer from "vinyl-buffer";
import babelify from "babelify";
import eslint from "gulp-eslint";
import copy from "gulp-copy";
import pug from "gulp-pug";
import watch from "gulp-watch";
import plumber from "gulp-plumber";
import minify from "gulp-minify";
import sitemap from "gulp-sitemap";
import imagemin from "gulp-imagemin";

const server = browserSync.create();

const production = false;
const env = production ? "prod" : "dev";
const srcJs = production ? ".js" : "-min.js";
const minJs = production ? "-min.js" : ".js";

const postcssPlugins = [
  cssnano({
    core: true,
    zindex: false,
    autoprefixer: {
      add: true,
      browsers: "> 1%, last 2 versions, Firefox ESR, Opera 12.1"
    }
  })
];

const sassOptions =
  env === "dev"
    ? {
        includePaths: ["node_modules"],
        sourceComments: true,
        outputStyle: "expanded"
      }
    : {
        includePaths: ["node_modules"]
      };

gulp.task("styles", () => {
  return env === "dev"
    ? gulp
        .src("./src/scss/styles.scss")
        .pipe(plumber())
        .pipe(sass(sassOptions))
        .pipe(gulp.dest("./public/css/"))
        .pipe(server.stream({ match: "**/*.css" }))
    : gulp
        .src("./src/scss/styles.scss")
        .pipe(plumber())
        .pipe(sass(sassOptions))
        .pipe(postcss(postcssPlugins))
        .pipe(gulp.dest("./public/css/"))
        .pipe(server.stream({ match: "**/*.css" }));
});

gulp.task("scripts", () =>
  browserify("./src/js/index.js")
    .transform(babelify, {
      global: true
    })
    .bundle()
    .on("error", function(err) {
      console.error(err);
      this.emit("end");
    })
    .pipe(source("scripts.js"))
    .pipe(buffer())
    .pipe(
      minify({
        ext: {
          src: srcJs,
          min: minJs
        }
      })
    )
    .pipe(sourcemaps.init({ loadMaps: true }))
    .pipe(sourcemaps.write("."))
    .pipe(gulp.dest("./public/js"))
);

gulp.task("images", () => {
  gulp
    .src("./src/img/**/**")
    .pipe(
      imagemin([
        imagemin.gifsicle({ interlaced: true }),
        imagemin.jpegtran({ progressive: true }),
        imagemin.optipng({ optimizationLevel: 5 }),
        imagemin.svgo()
      ])
    )
    .pipe(gulp.dest("./public/assets/img"));
});

gulp.task("lint", () =>
  gulp
    .src(["**/*.js", "!node_modules/**"])
    .pipe(plumber())
    .pipe(eslint())
    .pipe(eslint.format())
);

gulp.task("pug", () =>
  gulp
    .src("./src/views/pages/**/*.pug")
    .pipe(plumber())
    .pipe(
      pug({
        pretty: !production,
        basedir: "./src/views"
      })
    )
    .pipe(gulp.dest("./public"))
);

gulp.task("sitemap", () => {
  gulp
    .src("./public/**/*.html", {
      read: false
    })
    .pipe(
      sitemap({
        siteUrl: "https://example.com" // remplazar por tu dominio
      })
    )
    .pipe(gulp.dest("./public"));
});

gulp.task("default", ["scripts", "styles", "pug", "images"], () => {
  server.init({
    server: {
      baseDir: "./public"
    }
  });
  watch("./src/js/**/**", () => gulp.start("scripts", server.reload));
  watch("./src/scss/**/**", () => gulp.start("styles"));
  watch("./src/views/**/**", () => gulp.start("pug", server.reload));
  watch("./src/img/**/**", () => gulp.start("images"));
});
