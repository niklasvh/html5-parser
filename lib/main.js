/*
 * html5-parser
 * https://github.com/niklasvh/html5-parser
 *
 * Copyright (c) 2013 Niklas von Hertzen
 * Licensed under the MIT license.
 */

(function(exports) {
  'use strict';
  var tokenizer =  require("./tokenizer.js");
  var common =  require("./common.js");
  exports.namespace = common.namespace;
  exports.tokenType = common.tokenType;
  exports.scriptStates = common.scriptStates;
  exports.Parser = require("./parser.js").Parser;
  exports.tokenizerStates = tokenizer.tokenizerStates;

}(typeof exports === 'object' && exports || this));
