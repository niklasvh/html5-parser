'use strict';

var html5_tokenizer = require('../lib/html5-tokenizer.js'),
    fs = require('fs');

/*
  ======== A Handy Little Nodeunit Reference ========
  https://github.com/caolan/nodeunit

  Test methods:
    test.expect(numAssertions)
    test.done()
  Test assertions:
    test.ok(value, [message])
    test.equal(actual, expected, [message])
    test.notEqual(actual, expected, [message])
    test.deepEqual(actual, expected, [message])
    test.notDeepEqual(actual, expected, [message])
    test.strictEqual(actual, expected, [message])
    test.notStrictEqual(actual, expected, [message])
    test.throws(block, [error], [message])
    test.doesNotThrow(block, [error], [message])
    test.ifError(value)
*/

exports['awesome'] = {
    setUp: function(done) {
        // setup here
        done();
    },
    'tokenizer': function(test) {
        var testFile = JSON.parse(fs.readFileSync("test/html5lib-tests/tokenizer/test1.test"));
        test.expect(testFile.tests.length);
        testFile.tests.forEach(function(testCase) {
            console.log(testCase.input, testCase.output);
            test.deepEqual(html5_tokenizer.tokenizer(testCase.input), testCase.output, testCase.description);
        });


        test.done();
    }
};
