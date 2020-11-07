#!/usr/bin/env node
/*
 * @Date: 2020-11-07 17:48:16
 * @Author: David
 * @LastEditors: OBKoro1
 * @LastEditTime: 2020-11-07 18:10:58
 * @FilePath: /demo/工程化/gulp/hycli-pages/bin/hycli-pages.js
 * @Description: someting...
 *
 */
process.argv.push("--cwd");
process.argv.push(process.cwd());
process.argv.push("--gulpfile");
process.argv.push(require.resolve(".."));

console.log(process.argv);
console.log("cli...");

require("gulp/bin/gulp");
