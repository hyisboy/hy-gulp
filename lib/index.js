/*
 * @Date: 2020-11-04 13:05:02
 * @Author: David
 * @LastEditors: OBKoro1
 * @LastEditTime: 2020-11-07 16:35:14
 * @FilePath: /demo/工程化/gulp/hycli-pages/lib/index.js
 * @Description: someting...
 *1.  gulp-load-plugins 用于加载所有用到的插件 yarn add gulp-load-plugins --dev ,只能加载gulp插件，引用时，忽略掉前缀 gulp,=> gulp-sass 引用 plugins.sass
 *2.  使用 browser-sync 进行热更新，文件修改后会同步到浏览器中， yarn add browser-sync --dev
 *  使用 create 创建一个实例
 * 3. 监听src 下文件的变化 也就是我们源码的变化
 * 需要用到 gulp 中 的 watch 模块
 * 使用 : watch(filepath , buildTask) , 第一个参数是 监视的文件，第二个参数是文件变化后执行的任务
 *
 * 4. 由于 图片 html 文件 和 静态资源文件 的构建其实并不会进行太多转化，所以在开发时，可以不必监听他们，从而提高效率
 * 所以我们需要创建一个 开发任务，这个任务只监视 必要的文件变化 和 服务的启动
 * 5. 使用 gulp-useref  插件，将 html中引用的文件 重新组合生成 一个新的文件，当我们引用了一些类库中的文件时，经过useref插件转化，会抽出这些文件，然后生成一个新的文件，并重新注入到 html中
 * 6. 进行压缩
 * 插件： gulp-uglify -> js,  gulp-cleanCss -> css, gulp-htmlmin -> html 还需要一个 gulp-if 插件来判断文件类型
 * 在使用 useref 的之后执行压缩
 * 7. 重新规划构建过程2
 * 对目录的规划，增加一个 temp 临时文件存放目录，这个目录中存放的就是开发中的文件，dist文件存放的是 生产环境下的文件
 * 8. 暴露模块中 的任务，私有任务有些是不需要暴露的，这样容易混淆。 还可以通过 package.json 的scripts 定义我们的 任务
 */
const { src, dest, parallel, series, watch } = require("gulp");

const loadPlugins = require("gulp-load-plugins");
const plugins = loadPlugins();
const del = require("del");
const browserSync = require("browser-sync");
const bs = browserSync.create();
const cwd = process.cwd();
let config = {
  build: {
    src: "src",
    temp: ".tmp",
    dist: "release",
    public: "public",
    paths: {
      styles: "assets/styles/*.scss",
      scripts: "assets/scripts/*.js",
      images: "assets/images/**",
      fonts: "assets/fonts/**",
      pages: "*.html"
    }
  },
  port: 2000
};
// 获取配置项
try {
  const loadConfig = require(`${cwd}/pages.config.js`);
  config = Object.assign({}, config, loadConfig);
} catch (e) {}

const style = () => {
  return src(config.build.paths.styles, {
    base: config.build.src,
    cwd: config.build.src
  })
    .pipe(plugins.sass({ outputStyle: "expanded" })) // Css 格式 =》 完全展开
    .pipe(dest(config.build.temp));
};

const script = () => {
  console.log("修改js");
  return src(config.build.paths.scripts, {
    base: config.build.src,
    cwd: config.build.src
  })
    .pipe(plugins.babel({ presets: ["@babel/preset-env"] }))
    .pipe(dest(config.build.temp));
};

const page = () => {
  console.log("修改html");
  return src("src/*.html", { base: "src" })
    .pipe(plugins.swig({ data: config.data, defaults: { cache: false } })) // 动态渲染 模板，传入 data作为参数
    .pipe(dest(config.build.temp))
    .pipe(bs.reload({ stream: true }));
};

// 压缩图片,需要使用 gulp-imagemin 插件
const image = () => {
  return src(config.build.paths.images, {
    base: config.build.src,
    cwd: config.build.src
  })
    .pipe(plugins.imagemin())
    .pipe(dest(config.build.dist));
};

// 处理字体文件
const fonts = () => {
  return src(config.build.paths.fonts, { base: config.build.src })
    .pipe(plugins.imagemin())
    .pipe(dest(config.build.dist));
};

// 将静态资源复制到打包目录中
const extra = () => {
  return src("**", { base: config.build.public, cwd: "." }).pipe(
    dest(config.build.dist)
  );
};

// 先将上次打包的文件清除,需要使用到 del 插件, 传入数组，数组中元素为需要删除的文件夹 或文件
const clean = () => {
  return del([config.build.dist, config.build.temp]).then(() => {
    console.log("执行完毕");
  });
};

const useref = () => {
  return src(config.build.paths.pages, { base: config.build.temp })
    .pipe(plugins.useref({ searchPath: [config.build.temp, "."] })) // 从dist 和 根目录下 查找
    .pipe(plugins.if(/\.js$/, plugins.uglify()))
    .pipe(plugins.if(/\.css$/, plugins.cleanCss()))
    .pipe(
      plugins.if(
        /\.html$/,
        plugins.htmlmin({
          collapseWhitespace: true, // 压缩换行
          minifyCSS: true, // 压缩行内的 css
          minifyJS: true // 压缩行内 js
        })
      )
    )
    .pipe(dest(config.build.dist));
};

// 启动一个服务，并进行热更新
const serve = () => {
  // 我们在 启动服务的之前，先进行文件的监视
  watch(config.build.paths.styles, { cwd: config.build.src }, style); // 样式文件
  watch(config.build.paths.scripts, { cwd: config.build.src }, script); // 脚本文件
  watch(config.build.paths.pages, { cwd: config.build.src }, page); // Html文件
  // watch('src/assets/images/*',image); // 图片文件
  // watch('src/assets/fonts/*',fonts); // 字体文件
  // watch('public/*',extra); // 静态文件
  watch(
    [config.build.paths.images, config.build.paths.fonts],
    { cwd: config.build.src },
    bs.reload
  );
  watch("**", { cwd: config.build.public }, bs.reload);

  bs.init({
    notify: false,
    // Files:`${config.build.temp}/**` , // 需要监听的文件
    port: config.port, // 指定服务启动的端口
    server: {
      baseDir: [config.build.temp, config.build.dist, config.build.public], // 指定服务启动的根目录
      routes: {
        "/node_modules": "node_modules" // 设置为相对路径
      }
    }
  });
};

const compile = parallel(style, script, page);
const build = series(
  clean,
  parallel(series(compile, useref), extra, image, fonts)
);

const develop = series(compile, serve);

module.exports = {
  build,
  clean,
  develop,
  page
};
