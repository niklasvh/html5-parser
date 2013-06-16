'use strict';

var html5_parser = require('../lib/tokenizer.js'),
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

exports['treeConstruction'] = {
    setUp: function(done) {
        // setup here
        done();
    }
};

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

function indent(chr, len) {
    var result = "";
    for (var i = 0; i < len; i++) {
        result += chr;
    }
    return result;
}

function getNamespace(namespace) {
    switch(namespace) {
        case html5_parser.namespace.HTML:
            return "";
        case html5_parser.namespace.SVG:
            return "svg ";
        case html5_parser.namespace.MathML:
            return "math ";
    }
}

function serializeTree(tree, indentAmount) {
    var html = "";
    tree.forEach(function(token) {
        switch(token.type) {
            case "Element":
                html += indent(" ", indentAmount) + "<" + getNamespace(token.namespace) + token.tagName + ">|";
                if (typeof(token.attributes) === "object") {
                    Object.keys(token.attributes).forEach(function(key) {
                        html += indent(" ", indentAmount + 2) + key + '="' + token.attributes[key] + '"|';
                    });
                }
                html += serializeTree(token.children, indentAmount + 2);
                break;
            case "DOCTYPE":
                html +=  indent(" ", indentAmount) + '<!DOCTYPE ' + token.name + '>|';
                break;
            case "Character":
                html +=  indent(" ", indentAmount) + '"' + token.text + '"|';
                break;
            case "Comment":
                html += indent(" ", indentAmount) + '<!-- ';
                html += token.data;
                html += indent(" ", indentAmount - 2) + ' -->|';
                break;
        }
    });

    return html;
}

function createTreeTest(buffer) {
    var lines = buffer.toString().split(/\r\n|\r|\n/g);
    var tests = [];
    var test = null;

    for (var i = 0, len = lines.length; i < len; i++) {
        if (lines[i] === "#data") {
            test = {
                data: lines[++i],
                result: ""
            };
        } else if (lines[i] === "#document") {
            while(lines[++i].length) {
                test.result += lines[i].substring(2) + "|";
            }
            tests.push(test);
        }
    }
    return tests;
}

(function(path) {
    fs.readdirSync(path).forEach(function(file) {
        exports.tokenizer[file] = function(test) {
            var testFile = JSON.parse(fs.readFileSync(path + file));
            if (testFile.xmlViolationTests) {
                test.done();
                return;
            }
            test.expect(testFile.tests.length);
            testFile.tests.forEach(function(testCase) {
                var options = {
                    type: "tokens"
                };
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
                test.deepEqual(new html5_parser.Parser(testCase.doubleEscaped ? testCase.input.replace(doubleEscape, escapeDouble) : testCase.input, options), escapeDoubleResults(testCase.output, testCase.doubleEscaped ===  true), testCase.description);
            });
            test.done();
        };
    });
})("test/html5lib-tests/tokenizer/");


(function(path) {
    fs.readdirSync(path).filter(function(name) {
        return name === "inbody01.dat" || name === "tables01.dat" || name === "tests14.dat" || name === "tests17.dat" || name === "tests18.dat" || name === "tests20.dat";
    }).forEach(function(file) {
        exports.treeConstruction[file] = function(test) {
            var testFile = fs.readFileSync(path + file);
            var tests = createTreeTest(testFile);
            test.expect(tests.length);

            var options = {
                type: "tree"
            };

            tests.forEach(function(testCase) {
                test.deepEqual(serializeTree(new html5_parser.Parser(testCase.data, options), 0), testCase.result, testCase.data);
            });

            test.done();
        };
    });
})("test/html5lib-tests/tree-construction/");