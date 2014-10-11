'use strict';

var html5_parser = require('../lib/main.js'),
    fs = require('fs');

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

function namespaceAttribute(namespace, key) {
    return (namespace !== html5_parser.namespace.HTML) ? key.replace(":", " ") : key;
}

function serializeTree(tree, indentAmount) {
    var html = "";
    tree.forEach(function(token) {
        switch(token.nodeType) {
            case 1:
                html += "| " + indent(" ", indentAmount) + "<" + getNamespace(token.namespaceURI) + token._tagName + ">";
                if (typeof(token.attributes) === "object") {
                    Object.keys(token.attributes).sort().forEach(function(key) {
                        html += "| " + indent(" ", indentAmount + 2) + namespaceAttribute(token.namespaceURI, key) + '="' + token.attributes[key] + '"';
                    });
                }
                if (token.tagName === "template") {
                    html += "| " + indent(" ", indentAmount + 2) + "content";
                    html += serializeTree(token.childNodes, indentAmount + 4);
                } else {
                    html += serializeTree(token.childNodes, indentAmount + 2);
                }
                break;
            case 10:
                html +=  "| " + indent(" ", indentAmount) + '<!DOCTYPE ' + token.name;
                if (token.publicId || token.systemId) {
                    html += ' "' + (token.publicId || "") + '" "' + (token.systemId || "") + '"';
                }
                html += '>';
                break;
            case 3:
                html +=  "| " + indent(" ", indentAmount) + '"' + token.data.replace(/(\n|\r)/g, "") + '"';
                break;
            case 8:
                html += "| " + indent(" ", indentAmount) + '<!-- ';
                html += token.data;
                html += ' -->';
                break;
        }
    });

    return html;
}

function createTreeTest(buffer) {
    var lines = buffer.toString().split(/\r\n|\r|\n/g);
    var tests = [];
    var test = null;
    var collectingData = false;

    for (var i = 0, len = lines.length; i < len; i++) {
        if (lines[i] === "#data") {
            test = {
                data: (lines[++i] !== "#errors") ? lines[i] : "",
                result: "",
                fragment: null
            };
            collectingData = true;
        } else if(lines[i] === "#document-fragment") {
            test.fragment = lines[++i];
        } else if (lines[i] === "#document") {
            collectingData = false;
            while(lines[++i].length || (lines[i+1] && lines[i+1].charAt(0) === '"')) {
                test.result += lines[i];
            }
            tests.push(test);
        } else if (lines[i].charAt(0) === "#") {
            collectingData = false;
        } else if (collectingData) {
            test.data += "\n" + lines[i];
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

                var parser = new html5_parser.Parser(testCase.doubleEscaped ? testCase.input.replace(doubleEscape, escapeDouble) : testCase.input, options);
                parser.run();
                test.deepEqual(parser.combineCharacterTokens(parser.tokens), escapeDoubleResults(testCase.output, testCase.doubleEscaped ===  true), testCase.description);
            });
            test.done();
        };
    });
})("test/html5lib-tests/tokenizer/");


(function(path) {
    fs.readdirSync(path).filter(function(name) {
        return ["template.dat", "scripted"].indexOf(name) === -1;
    }).forEach(function(file) {
        exports.treeConstruction[file] = function(test) {
            var testFile = fs.readFileSync(path + file);
            var tests = createTreeTest(testFile);
            test.expect(tests.length);

            tests.forEach(function(testCase) {
                var options = {
                    type: "tree"
                };

                var parser = new html5_parser.Parser(testCase.data, options);
                if (testCase.fragment) {
                    var root = parser.parseHTMLFragment({_tagName: testCase.fragment, tagName: testCase.fragment.toUpperCase(), namespaceURI: "http://www.w3.org/1999/xhtml"});
                    test.deepEqual(serializeTree(root.childNodes, 0), testCase.result);
                } else {
                    parser.run();
                    test.deepEqual(serializeTree(parser.constructor.childNodes, 0), testCase.result, testCase.data);
                }


            });

            test.done();
        };
    });
})("test/html5lib-tests/tree-construction/");
