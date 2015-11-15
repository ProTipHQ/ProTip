
var test = require("tap").test;

var first = global._stackChain = { version: require('../../package.json').version };
var chain = require('../../stack-chain.js');

test("same version but copies", function (t) {
  t.strictEqual(chain, first);
  t.end();
});
