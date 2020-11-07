const test = require("ava");
const hycliPages = require("..");

// TODO: Implement module test
test("<test-title>", t => {
  const err = t.throws(() => hycliPages(100), TypeError);
  t.is(err.message, "Expected a string, got number");

  t.is(hycliPages("w"), "w@zce.me");
  t.is(hycliPages("w", { host: "wedn.net" }), "w@wedn.net");
});
