'use strict';

var html5_parser = require('../lib/html5-tokenizer.js'),
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

exports['tokenizer'] = {
    setUp: function(done) {
        // setup here
        done();
    }
};

var path = "test/html5lib-tests/tokenizer/";
var tests = fs.readdirSync(path);
var doubleEscape = /\\u([\d\w]{4})/gi;

function escapeDouble(match, grp) {
    return String.fromCharCode(parseInt(grp, 16));
}

function escapeDoubleResults(results, escape) {
    if (!escape) {
        return results;
    }

    return results.map(function(result) {
        return  (Array.isArray(result)) ? result.map(function(txt) {
            return txt.replace(doubleEscape, escapeDouble);
          }) : result;
    });
}

tests.forEach(function(file) {
    exports.tokenizer[file] = function(test) {
        var testFile = JSON.parse(fs.readFileSync(path + file));
        test.expect(testFile.tests.length);
        testFile.tests.forEach(function(testCase) {
            var options = {};
            if (testCase.initialStates) {
                switch(testCase.initialStates[testCase.initialStates.length -1]) {
                    case "RCDATA state":
                        options.initialState = html5_parser.tokenizerStates.RCDATA;
                        break;
                    case "RAWTEXT state":
                        options.initialState = html5_parser.tokenizerStates.rawtext;
                        break;
                    case "PLAINTEXT state":
                        options.initialState = html5_parser.tokenizerStates.plaintext;
                        break;
                    default:
                        console.log("unmapped initial state", testCase.initialStates[testCase.initialStates.length -1]);
                }
            }
            if (testCase.lastStartTag) {
                options.lastStartTag = testCase.lastStartTag;
            }
            test.deepEqual(html5_parser.tokenizer(testCase.doubleEscaped ? testCase.input.replace(doubleEscape, escapeDouble) : testCase.input, options), escapeDoubleResults(testCase.output, testCase.doubleEscaped ===  true), testCase.description);
        });
        test.done();
    };
});