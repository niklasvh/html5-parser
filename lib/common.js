(function(exports) {
  'use strict';

  exports.characters = {
    NULL: 0x0000,
    EXCLAMATION_MARK: 0x0021,
    AMPERSAND: 0x0026,
    LESSTHAN_SIGN: 0x003C,
    GREATERTHAN_SIGN: 0x003E,
    SOLIDUS: 0x002F,
    QUESTION_MARK: 0x003F,
    EOF: -1,
    TAB: 0x0009,
    CR: 0x000D,
    LF: 0x000A,
    FF: 0x000C,
    SPACE: 0x0020,
    REPLACEMENT_CHARACTER: 0xFFFD,
    HYPHEN_MINUS: 0x002D,
    QUOTATION_MARK: 0x0022,
    APOSTROPHE: 0x0027,
    EQUALS_SIGN: 0x003D,
    GRAVE_ACCENT: 0x0060,
    NUMBER_SIGN: 0x0023,
    SEMICOLON: 0x003B,
    CURLY_OPEN: 0x007B,
    CURLY_CLOSE: 0x007D
  };

  exports.tokenType = {
    character: "Character",
    parseError: "ParseError",
    comment: "Comment",
    doctype: "DOCTYPE",
    startTag: "StartTag",
    endTag: "EndTag",
    EOF: "EOF",
    variable: "Variable"
  };

  exports.nodeType = {
    ELEMENT_NODE: 1,
    TEXT_NODE: 3,
    COMMENT_NODE: 8,
    DOCUMENT_TYPE_NODE: 10
  };

  exports.namespace = {
    HTML: "http://www.w3.org/1999/xhtml",
    MathML: "http://www.w3.org/1998/Math/MathML",
    SVG: "http://www.w3.org/2000/svg",
    XLink: "http://www.w3.org/1999/xlink",
    XML: "http://www.w3.org/XML/1998/namespace",
    XMLNS: "http://www.w3.org/2000/xmlns/"
  };


  exports.invalidCharacters = function(str) {
    return (str >= 0x0001 && str <= 0x0008) ||
      (str >= 0x000E && str <= 0x001F) ||
      (str >= 0x007F && str <= 0x009F) ||
      (str >= 0xFDD0 && str <= 0xFDEF) ||
      ([0x000B, 0xFFFE, 0xFFFF, 0x1FFFE, 0x1FFFF, 0x2FFFE, 0x2FFFF, 0x3FFFE, 0x3FFFF, 0x4FFFE, 0x4FFFF, 0x5FFFE, 0x5FFFF, 0x6FFFE, 0x6FFFF, 0x7FFFE,
        0x7FFFF, 0x8FFFE, 0x8FFFF, 0x9FFFE, 0x9FFFF, 0xAFFFE, 0xAFFFF, 0xBFFFE, 0xBFFFF, 0xCFFFE, 0xCFFFF, 0xDFFFE, 0xDFFFF, 0xEFFFE, 0xEFFFF, 0xFFFFE,
        0xFFFFF, 0x10FFFE, 0x10FFFF].indexOf(str) !== -1);
  };

  exports.scriptStates = {
    alreadyStarted: 1,
    parserInserted: 2
  };

}(typeof exports === 'object' && exports || this));
