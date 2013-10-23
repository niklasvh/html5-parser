(function(exports) {
  'use strict';

  var svgAttrTokenNames = ["attributename", "attributetype", "basefrequency", "baseprofile", "calcmode", "clippathunits", "contentscripttype", "contentstyletype", "diffuseconstant", "edgemode", "externalresourcesrequired", "filterres", "filterunits", "glyphref", "gradienttransform", "gradientunits", "kernelmatrix", "kernelunitlength", "keypoints", "keysplines", "keytimes", "lengthadjust", "limitingconeangle", "markerheight", "markerunits", "markerwidth", "maskcontentunits", "maskunits", "numoctaves", "pathlength", "patterncontentunits", "patterntransform", "patternunits", "pointsatx", "pointsaty", "pointsatz", "preservealpha", "preserveaspectratio", "primitiveunits", "refx", "refy", "repeatcount", "repeatdur", "requiredextensions", "requiredfeatures", "specularconstant", "specularexponent", "spreadmethod", "startoffset", "stddeviation", "stitchtiles", "surfacescale", "systemlanguage", "tablevalues", "targetx", "targety", "textlength", "viewbox", "viewtarget", "xchannelselector", "ychannelselector", "zoomandpan"];
  var svgAttrElementNames = ["attributeName", "attributeType", "baseFrequency", "baseProfile", "calcMode", "clipPathUnits", "contentScriptType", "contentStyleType", "diffuseConstant", "edgeMode", "externalResourcesRequired", "filterRes", "filterUnits", "glyphRef", "gradientTransform", "gradientUnits", "kernelMatrix", "kernelUnitLength", "keyPoints", "keySplines", "keyTimes", "lengthAdjust", "limitingConeAngle", "markerHeight", "markerUnits", "markerWidth", "maskContentUnits", "maskUnits", "numOctaves", "pathLength", "patternContentUnits", "patternTransform", "patternUnits", "pointsAtX", "pointsAtY", "pointsAtZ", "preserveAlpha", "preserveAspectRatio", "primitiveUnits", "refX", "refY", "repeatCount", "repeatDur", "requiredExtensions", "requiredFeatures", "specularConstant", "specularExponent", "spreadMethod", "startOffset", "stdDeviation", "stitchTiles", "surfaceScale", "systemLanguage", "tableValues", "targetX", "targetY", "textLength", "viewBox", "viewTarget", "xChannelSelector", "yChannelSelector", "zoomAndPan"];
  var svgCaseFix = {
    altglyph:	"altGlyph",
    altglyphdef:	"altGlyphDef",
    altglyphitem:	"altGlyphItem",
    animatecolor:	"animateColor",
    animatemotion:	"animateMotion",
    animatetransform:	"animateTransform",
    clippath:	"clipPath",
    feblend:	"feBlend",
    fecolormatrix:	"feColorMatrix",
    fecomponenttransfer:	"feComponentTransfer",
    fecomposite:	"feComposite",
    feconvolvematrix:	"feConvolveMatrix",
    fediffuselighting:	"feDiffuseLighting",
    fedisplacementmap:	"feDisplacementMap",
    fedistantlight:	"feDistantLight",
    feflood:	"feFlood",
    fefunca:	"feFuncA",
    fefuncb:	"feFuncB",
    fefuncg:	"feFuncG",
    fefuncr:	"feFuncR",
    fegaussianblur:	"feGaussianBlur",
    feimage:	"feImage",
    femerge:	"feMerge",
    femergenode:	"feMergeNode",
    femorphology:	"feMorphology",
    feoffset:	"feOffset",
    fepointlight:	"fePointLight",
    fespecularlighting:	"feSpecularLighting",
    fespotlight:	"feSpotLight",
    fetile:	"feTile",
    feturbulence:	"feTurbulence",
    foreignobject:	"foreignObject",
    glyphref:	"glyphRef",
    lineargradient:	"linearGradient",
    radialgradient:	"radialGradient",
    textpath:	"textPath"
  };

  var common = require("./common.js");
  var namespace = common.namespace;
  var characters = common.characters;
  var tokenType = common.tokenType;
  var nodeType = common.nodeType;
  var Tokenizer = require("./tokenizer.js").Tokenizer;
  var Constructor = require("./constructor.js").Constructor;
  var spaceCharacters = [characters.SPACE, characters.TAB, characters.LF, characters.FF, characters.CR];
  var invalidCharacters = common.invalidCharacters;

  function remapNewlines(chr) {
    return chr.charCodeAt(0) === characters.CR ? String.fromCharCode(characters.LF) : chr;
  }

  function notSpaceCharacterToken(token) {
    return spaceCharacters.indexOf(token[1].charCodeAt(0)) === -1;
  }


  function get_tagName(node) {
    return (typeof(node) === "object") ? node._tagName : node;
  }

  function Parser(html, options) {
    this.options = options || {};
    this.mode = this.modes.initial;
    this.templateInsertionModes = [];
    this.originalMode = null;
    this.headElementPointer = null;
    this.formElementPointer = null;
    this.openElements = [];
    this.lastPosition = null;
    this.scriptingFlag = true;
    this.fosterParented = false;
    this.activeFormattingElements = [];
    this.pendingTableCharacterTokens =  null;
    this.ignoreToken = null;
    this.paused = true;

    this.input = html.split("").filter(function(chr, index, input) {
      return !(input[index+1] && input[index+1].charCodeAt(0) === characters.LF && chr.charCodeAt(0) === characters.CR);
    }).map(remapNewlines);

    this.tokenizer = new Tokenizer(this.options, this);
    this.constructor = (options && options.document) ? options.document : new Constructor();
    this.tokens = [];
    this.fragmentCase = this.options.fragment ? true : false;

    switch(this.options.fragment) {
      case "textarea":
        this.tokenizer.setState(this.tokenizer.states.RCDATA);
        this.mode = this.modes.text;
        this.originalMode = this.modes.in_body;
        break;
      case "plaintext":
        this.mode = this.modes.in_body;
        this.tokenizer.setState(this.tokenizer.states.plaintext);
        break;
      case "head": case "body": this.mode = this.modes.in_body; break;
      case "html": this.mode = this.modes.before_head; break;
      case "div": this.mode = this.modes.in_body; break;
      case "style":
        this.tokenizer.state =  this.tokenizer.states.rawtext;
        this.originalMode = this.modes.in_body;
        this.mode = this.modes.text;
        break;
      case "frameset": this.mode = this.modes.in_frameset; break;
      case "table": this.mode = this.modes.in_table; break;
      case "tbody": this.mode = this.modes.in_table_body; break;
      case "caption":
        this.mode = this.modes.in_caption;
        this.constructor._tagName = "caption";
        break;
      case "colgroup": this.mode = this.modes.in_column_group; break;
      case "tr":
        this.mode = this.modes.in_row;
        this.constructor._tagName = "tr";
        break;
      case "td": this.mode = this.modes.in_cell; break;
      case "select": this.mode = this.modes.in_select; break;
      case undefined: break;
      default: console.log('Undefined fragment', this.options.fragment);
    }
  }

  Parser.prototype.run = function() {
    this.paused = false;
    var addToken = this.addToken.bind(this),
      result;
    do {
      if (this.paused) {
        return;
      }

      if (this.invalidCharacter(this.input)) {
        this.tokens.push(tokenType.parseError);
      }
      this.lastPosition = this.tokenizer.position;
      result = this.tokenizer.parse(this.input);
      if (Array.isArray(result)) {
        result.forEach(addToken);
      }
    } while(result !== false);

    if (this.options.type === "tree") {
      this.addToken([tokenType.EOF]);
    }

    if (this.options.complete) {
      this.options.complete.call(this.options.document);
    }
  };

  Parser.prototype.pause = function() {
    this.paused = true;
  };

  Parser.prototype.integrationPoint = {
    MathMLtext: 1,
    HTML: 2
  };

  Parser.prototype.addToken = function(token) {
    var ignored = this.ignoreToken;
    this.ignoreToken = null;
    if (this.options.type === "tree" && token !== tokenType.parseError) {
      var adjustedCurrentNode = this.adjustedCurrentNode();
      if (!adjustedCurrentNode ||
        adjustedCurrentNode.namespaceURI === namespace.HTML ||
        (adjustedCurrentNode.integrationPoint === this.integrationPoint.MathMLtext && token[0] === tokenType.startTag && !(/^(mglyph|malignmark)$/).test(token[1])) ||
        (adjustedCurrentNode.integrationPoint === this.integrationPoint.MathMLtext && this.isCharacterToken(token)) ||
        (adjustedCurrentNode._tagName === "annotation-xml" && adjustedCurrentNode.namespaceURI === namespace.MathML && this.isStartTag(token, "svg")) ||
        (adjustedCurrentNode.integrationPoint === this.integrationPoint.HTML && (token[0] === tokenType.startTag || this.isCharacterToken(token)))  ||
        this.isEOF(token)) {
        if (!ignored || (ignored[0] !== token[0] || String.fromCharCode(ignored[1]) !== token[1])) {
          this.in_html_content(token);
        }
      } else {
        this.in_foreign_content(token);
      }
    }
    this.tokens.push(token);
  };

  Parser.prototype.in_html_content = function(token) {
    switch(this.mode) {
      case this.modes.initial: this.initial(token); break;
      case this.modes.before_html: this.before_html(token); break;
      case this.modes.before_head: this.before_head(token); break;
      case this.modes.in_head: this.in_head(token); break;
      case this.modes.after_head: this.after_head(token); break;
      case this.modes.in_body: this.in_body(token); break;
      case this.modes.text: this.text(token); break;
      case this.modes.in_table: this.in_table(token); break;
      case this.modes.in_table_text: this.in_table_text(token); break;
      case this.modes.in_caption: this.in_caption(token); break;
      case this.modes.in_column_group: this.in_column_group(token); break;
      case this.modes.in_table_body: this.in_table_body(token); break;
      case this.modes.in_row: this.in_row(token); break;
      case this.modes.in_cell: this.in_cell(token); break;
      case this.modes.in_select: this.in_select(token); break;
      case this.modes.in_select_in_table: this.in_select_in_table(token); break;
      case this.modes.in_template: this.in_template(token); break;
      case this.modes.after_body: this.after_body(token); break;
      case this.modes.in_frameset: this.in_frameset(token); break;
      case this.modes.after_frameset: this.after_frameset(token); break;
      case this.modes.after_after_body: this.after_after_body(token); break;
      case this.modes.after_after_frameset: this.after_after_frameset(token); break;
      default:
        console.log("Unknown parse mode", this.mode);
    }
  };

  Parser.prototype.pushActiveFormatting = function(element) {
    var markerIndex = this.indexIn("marker", this.activeFormattingElements);
    var item;
    var count = 0;
    var first = null;
    markerIndex = markerIndex === -1 ? 0 : markerIndex;
    while((item = this.activeFormattingElements[markerIndex])) {
      if (element._tagName === item._tagName && element.namespaceURI === item.namespaceURI && this.equalObjects(this.getAttributes(item), this.getAttributes(element))) {
        count++;
        if (first === null) {
          first = markerIndex;
        }
      }
      markerIndex++;
    }

    if (count >= 3) {
      this.activeFormattingElements.splice(first, 1);
    }

    this.activeFormattingElements.push(element);
  };

  Parser.prototype.equalObjects = function(obj1, obj2) {
    return Object.keys(obj1).length === Object.keys(obj2).length && (Object.keys(obj1).length === 0 || Object.keys(obj1).some(function(key) {
      return obj1[key] === obj2[key];
    }));
  };

  Parser.prototype.reconstructActiveFormatting = function() {
    var newElement;
    // 1. If there are no entries in the list of active formatting elements, then there is nothing to reconstruct; stop this algorithm.
    if (!this.activeFormattingElements.length) {
      return;
    }

    var entryIndex = this.activeFormattingElements.length - 1;

    // 3. Let entry be the last (most recently added) element in the list of active formatting elements.
    var entry = this.lastActiveFormatting();

    // If the last (most recently added) entry in the list of active formatting elements is a marker,
    // or if it is an element that is in the stack of open elements, then there is nothing to reconstruct; stop this algorithm.
    if (entry === "marker" || this.indexIn(entry, this.openElements) !== -1) {
      return;
    }

    // 4. Rewind: If there are no entries before entry in the list of active formatting elements, then jump to the step labeled create.
    while(entryIndex > 0) {
      // 5. Let entry be the entry one earlier than entry in the list of active formatting elements.
      entry = this.activeFormattingElements[--entryIndex];

      // 6. If entry is neither a marker nor an element that is also in the stack of open elements, go to the step labeled rewind.
      if (entry !== "marker" && this.indexIn(entry, this.openElements) === -1) {
        continue;
      }
      // 7. Advance: Let entry be the element one later than entry in the list of active formatting elements.
      entry = this.activeFormattingElements[++entryIndex]; // step 7
      break;
    }

    while (true) {
      // 8. Create: Insert an HTML element for the token for which the element entry was created, to obtain new element.
      newElement = this.insertHTMLElement(entry._tagName, this.getAttributes(entry));

      // 9. Replace the entry for entry in the list with an entry for new element.
      this.activeFormattingElements.splice(entryIndex, 1, newElement);

      // 10 If the entry for new element in the list of active formatting elements is not the last entry in the list, return to the step labeled advance.
      if (this.activeFormattingElements.length - 1 !== entryIndex) {
        entry = this.activeFormattingElements[++entryIndex]; // step 7
        continue;
      }
      break;
    }
  };

  Parser.prototype.lastActiveFormatting = function() {
    return this.activeFormattingElements[this.activeFormattingElements.length - 1];
  };

  Parser.prototype.currentNode = function() {
    return (this.openElements.length) ? this.openElements[this.openElements.length - 1] : this.constructor;
  };

  Parser.prototype.adjustedCurrentNode = function() {
    if (this.openElements.length) {
      if (this.openElements.length === 1) {
        // TODO correct context
      }
      return this.currentNode();
    }
    return null;
  };

  Parser.prototype.appendFoster = function(node) {
    var fosterData = this.foster();
    fosterData.foster._insertAt(node, fosterData.index);
  };

  Parser.prototype.foster = function() {
    var foster = this.openElements[0];
    var nodes = this.openElements.slice(0);
    var pop;
    var lastTable;
    var i = -1;

    if (!(/^(table|tbody|tfoot|thead|tr)$/).test(this.currentNode()._tagName)) {
      return {
        foster: this.currentNode(),
        index: this.currentNode().childNodes.length
      };
    }

    while (nodes.length) {
      pop = nodes.pop();
      if (pop._tagName === "table") {
        lastTable = pop;
        foster = (pop.parentNode) ? pop.parentNode : nodes.pop();
        break;
      }
    }

    if (lastTable && foster === lastTable.parentNode) {
      while(foster.childNodes[++i] !== lastTable) {}
    } else {
      i = foster.childNodes.length;
    }

    return {
      foster: foster,
      index: (i)
    };
  };

  Parser.prototype.insertCharacterToken = function(token) {
    this.insertCharacter(token[1]);
  };

  Parser.prototype.insertCharacter = function(chr) {
    var len, fosterData, count;
    if (this.fosterParented && this.tokenizer.state !== this.tokenizer.states.plaintext) {
      fosterData = this.foster();
      len = fosterData.foster.childNodes.length;
      if (len && fosterData.index && fosterData.foster.childNodes[fosterData.index - 1].nodeType === nodeType.TEXT_NODE) {
        fosterData.foster.childNodes[fosterData.index - 1].data += chr;
      } else {
        this.appendFoster(this.constructor.createTextNode(chr));
      }
    }  else {
      count = this.currentNode().childNodes.length;
      if (count && this.currentNode().childNodes[count - 1].nodeType === nodeType.TEXT_NODE) {
        this.currentNode().childNodes[count - 1].data += chr;
      } else {
        this.currentNode()._appendChild(this.constructor.createTextNode(chr));
      }
    }
  };

  Parser.prototype.setElementAttributes = function(attributes, element, overwrite) {
    var elementAttributes = this.getAttributes(element);
    Object.keys(attributes || {}).forEach(function(attributeName) {
      if (overwrite || elementAttributes[attributeName] === undefined) {
        elementAttributes[attributeName] = attributes[attributeName];
      }
    });
  };

  Parser.prototype.getAttributes = function(element) {
    return element ? (element._parsedAttributes || element.attributes) : {};
  };

  Parser.prototype.insertHTMLElement = function(type, attributes) {
    var element = this.constructor.createElement(type);
    this.setElementAttributes(attributes, element, true);
    this.insertNodeInAppropriatePlace(element);
    this.openElements.push(element);
    return element;
  };

  Parser.prototype.setIntegrationPoint = function(element) {
    var ns = element.namespaceURI,
      type = element._tagName,
      attributes = this.getAttributes(element);
    if (ns === namespace.MathML && (/^(mi|mo|mn|ms|mtext)$/).test(type))  {
      element.integrationPoint = this.integrationPoint.MathMLtext;
    } else if (ns === namespace.MathML && type === "annotation-xml" && (/^(text\/html|application\/xhtml\+xml|)$/i).test(attributes.encoding)) {
      element.integrationPoint = this.integrationPoint.HTML;
    } else if (ns === namespace.SVG && (/^(foreignObject|desc|title)$/).test(type)) {
      element.integrationPoint = this.integrationPoint.HTML;
    }
  };

  Parser.prototype.insertForeignElement = function(type, attributes, ns) {
    var element = this.insertHTMLElement(type, attributes);
    element.namespaceURI = ns;
    this.setIntegrationPoint(element);
    return element;
  };

  Parser.prototype.genericRCDataParsing = function(token) {
    this.insertHTMLElement(token[1], token[2]);
    this.tokenizer.state =  this.tokenizer.states.RCDATA;
    this.originalMode = this.mode;
    this.mode = this.modes.text;
  };

  Parser.prototype.genericRawTextParsing = function(token) {
    this.insertHTMLElement(token[1], token[2]);
    this.tokenizer.state =  this.tokenizer.states.rawtext;
    this.originalMode = this.mode;
    this.mode = this.modes.text;
  };

  Parser.prototype.parseError = function() {};

  Parser.prototype.initial = function(token) {
    if (this.isCharacterToken(token) && this.characterOneOf(token, characters.TAB, characters.LF, characters.FF, characters.CR, characters.SPACE)) {
      return;
    } else if (this.isCommentToken(token)) {
      this.constructor._appendChild(this.constructor.createComment(token[1]));
    } else if (this.isDoctypeToken(token)) {
      /* TODO doctype */
      this.constructor._appendChild(this.constructor.createDocumentType(token[1], token[2], token[3]));
      this.constructor._quirksMode = token[4];
      this.mode = this.modes.before_html;
    } else {
      /* If the document is not an iframe srcdoc document, then this is a parse error; set the Document to quirks mode. */
      this.tokenizer.forceQuirks = true;
      this.mode = this.modes.before_html;
      this.addToken(token);
    }
  };

  Parser.prototype.before_html = function(token) {
    var element;
    if (this.isDoctypeToken(token)) {
      this.parseError();
    } else if (this.isCommentToken(token)) {
      this.constructor._appendChild(this.constructor.createComment(token[1]));
    } else if (this.isCharacterToken(token) && this.characterOneOf(token, characters.TAB, characters.LF, characters.FF, characters.CR, characters.SPACE)) {
      return;
    } else if (this.isStartTag(token, "html")) {
      element = this.constructor.createElement("html", token[2]);
      this.setElementAttributes(token[2], element, true);
      this.openElements.push(element);
      this.constructor._appendChild(element);
      this.mode = this.modes.before_head;
    } else if (token[0] === tokenType.endTag && !this.isEndTag(token, "head", "body", "html", "br")) {
      this.parseError();
    } else {
      element = this.constructor.createElement("html");
      this.openElements.push(element);
      this.constructor._appendChild(element);
      this.mode = this.modes.before_head;
      this.addToken(token);
    }
  };

  Parser.prototype.before_head = function(token) {
    if (this.isCharacterToken(token) && this.characterOneOf(token, characters.TAB, characters.LF, characters.FF, characters.CR, characters.SPACE)) {
      return;
    } else if(this.isCommentToken(token)) {
      this.currentNode()._appendChild(this.constructor.createComment(token[1]));
    } else if(this.isDoctypeToken(token)) {
      this.parseError();
    } else if (this.isStartTag(token, "html")) {
      this.in_body(token);
    } else if (this.isStartTag(token, "head")) {
      this.headElementPointer = this.insertHTMLElement(token[1], token[2]);
      this.mode = this.modes.in_head;
    } else if (this.isEndTag(token, "head", "body", "html", "br")) {
      this.headElementPointer = this.insertHTMLElement("head");
      this.mode = this.modes.in_head;
      this.addToken(token);
    } else if (token[0] === tokenType.endTag) {
      this.parseError();
    } else {
      this.headElementPointer = this.insertHTMLElement("head");
      this.mode = this.modes.in_head;
      this.addToken(token);
    }
  };

  Parser.prototype.in_head = function(token) {
    var element;
    if (this.isCharacterToken(token) && this.characterOneOf(token, characters.TAB, characters.LF, characters.FF, characters.CR, characters.SPACE)) {
      this.insertCharacter(token[1]);
    } else if(this.isCommentToken(token)) {
      this.currentNode()._appendChild(this.constructor.createComment(token[1]));
    } else if(this.isDoctypeToken(token)) {
      this.parseError();
    } else if(this.isStartTag(token, "html")) {
      this.in_body(token);
    } else if (this.isStartTag(token, "base", "basefont", "bgsound", "link")) {
      this.insertHTMLElement(token[1], token[2]);
      this.openElements.pop();
      // Acknowledge the token's self-closing flag, if it is set.
    } else if (this.isStartTag(token, "meta")) {
      this.insertHTMLElement(token[1], token[2]);
      this.openElements.pop();
      // Acknowledge the token's self-closing flag, if it is set.
      /*
       If the element has a charset attribute, and getting an encoding from its value results in a supported ASCII-compatible character encoding or a UTF-16 encoding,
       and the confidence is currently tentative, then change the encoding to the resulting encoding.

       Otherwise, if the element has an http-equiv attribute whose value is an ASCII case-insensitive match for the string "Content-Type", and the
       element has a content attribute, and applying the algorithm for extracting a character encoding from a meta element to that attribute's
       value returns a supported ASCII-compatible character encoding or a UTF-16 encoding, and the confidence is currently tentative, then change
       the encoding to the extracted encoding.
       */
    } else if (this.isStartTag(token, "title")) {
      this.genericRCDataParsing(token);
    } else if (this.isStartTag(token, "noscript") && this.scriptingFlag || this.isStartTag(token, "noframes", "style")) {
      this.genericRawTextParsing(token);
    } else if (this.isStartTag(token, "noscript") && !this.scriptingFlag) {
      this.insertHTMLElement(token[1], token[2]);
      this.mode = this.modes.in_head_noscript;
    } else if (this.isStartTag(token, "script")) {
      element = this.insertHTMLElement(token[1], token[2]);
      element._parserInserted = true;
      element.forceAsync = false;
      this.tokenizer.state = this.tokenizer.states.script_data;
      this.originalMode = this.mode;
      this.mode = this.modes.text;
    } else if (this.isEndTag(token, "head")) {
      this.openElements.pop();
      this.mode = this.modes.after_head;
    } else if (this.isEndTag(token, "body", "html", "br")) {
      this.openElements.pop();
      this.mode = this.modes.after_head;
      this.addToken(token);
    } else if (this.isStartTag(token, "template")) {
      this.insertHTMLElement(token[1], token[2]);
      this.activeFormattingElements.push("marker");
      this.frameSetOk = "not ok";
      this.mode = this.modes.in_template;
      this.templateInsertionModes.push(this.modes.in_template);
    } else if (this.isEndTag(token, "template")) {
      if (!this.hasInOpenStack("template")) {
        this.parseError();
      } else {
        this.generateImpliedEndTags();
        if (this.currentNode()._tagName !== "template") {
          this.parseError();
        }
        this.popUntil("template");
        this.clearUntilLastMarker();
        this.templateInsertionModes.pop();
        this.resetInsertionMode();
      }
    } else if (this.isStartTag(token, "head") || token[0] === tokenType.endTag) {
      this.parseError();
    } else {
      this.openElements.pop();
      this.mode = this.modes.after_head;
      this.addToken(token);
    }
  };

  Parser.prototype.after_head = function(token) {
    if (this.isCharacterToken(token) && this.characterOneOf(token, characters.TAB, characters.LF, characters.FF, characters.CR, characters.SPACE)) {
      this.insertCharacter(token[1]);
    } else if(this.isCommentToken(token)) {
      this.currentNode()._appendChild(this.constructor.createComment(token[1]));
    } else if(this.isDoctypeToken(token)) {
      this.parseError();
    } else if(this.isStartTag(token, "html")) {
      this.in_body(token);
    } else if (this.isStartTag(token, "body")) {
      this.insertHTMLElement(token[1], token[2]);
      this.frameSetOk = "not ok";
      this.mode = this.modes.in_body;
    } else if (this.isStartTag(token, "frameset")) {
      this.insertHTMLElement(token[1], token[2]);
      this.mode = this.modes.in_frameset;
    } else if (this.isStartTag(token, "base", "basefont", "bgsound", "link", "meta", "noframes", "script", "style", "title")) {
      this.parseError();
      this.openElements.push(this.headElementPointer);
      this.in_head(token);
      this.openElements.splice(this.indexIn(this.headElementPointer, this.openElements), 1);
    } else if (this.isEndTag(token, "body", "html", "br")) {
      this.insertHTMLElement("body", {});
      this.mode = this.modes.in_body;
      this.addToken(token);
    } else if (this.isStartTag(token, "head") || token[0] === tokenType.endTag) {
      this.parseError();
    } else {
      this.insertHTMLElement("body");
      this.mode = this.modes.in_body;
      this.addToken(token);
    }
  };

  Parser.prototype.in_body = function(token) {
    var self = this;
    var node;
    var index;
    var startForm = function(token) {
      if (this.formElementPointer !== null) {
        this.parseError();
      } else {
        if (this.hasInButtonScope("p")) {
          this.closePElement();
        }
        this.formElementPointer = this.insertHTMLElement(token[1], token[2]);
      }
    }.bind(this);

    if (this.isCharacterToken(token) && this.characterOneOf(token, characters.NULL)) {
      this.parseError();
    } else if (this.isCharacterToken(token) && this.characterOneOf(token, characters.TAB, characters.LF, characters.FF, characters.CR, characters.SPACE)) {
      this.reconstructActiveFormatting();
      this.insertCharacter(token[1]);
    } else if (this.isCharacterToken(token)) {
      this.reconstructActiveFormatting();
      this.insertCharacter(token[1]);
      this.frameSetOk = "not ok";
    } else if(this.isCommentToken(token)) {
      this.currentNode()._appendChild(this.constructor.createComment(token[1]));
    } else if(this.isDoctypeToken(token)) {
      this.parseError();
    } else if(this.isStartTag(token, "html")) {
      this.parseError();
      if (this.lastOfTypeIn("template", this.openElements) !== null) {
        return;
      }
      this.setElementAttributes(token[2], self.openElements[0], false);
    } else if (this.isStartTag(token, "base", "basefont", "bgsound", "link", "meta", "noframes", "script", "style", "template", "title") || this.isEndTag(token, "template")) {
      this.in_head(token);
    } else if (this.isStartTag(token, "body")) {
      this.parseError();
      /*
       If the second element on the stack of open elements is not a body element, if the stack of open elements has only one node on it, or if there is a template element on the stack of open elements, then ignore the token. (fragment case)
       */
      this.frameSetOk = "not ok";
      this.setElementAttributes(token[2], self.openElements[1], false);
    } else if(this.isStartTag(token, "frameset")) {
      this.parseError();
      if (this.openElements.length <= 1 || this.openElements[1]._tagName !== "body") {
        return;
      }
      if (this.frameSetOk !== "not ok") {
        node = this.openElements[1];
        if (node.parentNode) {
          index = 0;
          while(true) {
            if (node.parentNode.childNodes[index] === node) {
              node.parentNode.childNodes.splice(index, 1);
              break;
            }
            index++;
          }
        }
        this.popUntilOneOf("html");
        this.insertHTMLElement(token[1], token[2]);
        this.mode = this.modes.in_frameset;
      }
    } else if(this.isEOF(token)) {
      /*
       If there is a node in the stack of open elements that is not either a dd element, a dt element, an li element, a p element, a tbody element, a td element, a tfoot element, a th element, a thead element, a tr element, the body element, or the html element, then this is a parse error.
       */
      if (this.templateInsertionModes.length) {
        this.in_template(token);
      }

    } else if(this.isEndTag(token, "body")) {
      this.endBody(token);
    } else if(this.isEndTag(token, "html")) {
      if (this.endBody(token)) {
        this.addToken(token);
      }
    } else if(this.isStartTag(token, "address", "article", "aside", "blockquote", "center", "details", "dialog", "dir", "div", "dl", "fieldset", "figcaption",
      "figure", "footer", "header", "hgroup", "main", "menu", "nav", "ol", "p", "section", "summary", "ul")) {
      if (this.hasInButtonScope("p")) {
        this.closePElement();
      }
      this.insertHTMLElement(token[1], token[2]);
    } else if(this.isStartTag(token, "h1", "h2", "h3", "h4", "h5", "h6")) {
      if (this.hasInButtonScope("p")) {
        this.closePElement();
      }
      if ((/^(h1|h2|h3|h4|h5|h6)$/).test(this.currentNode()._tagName)) {
        this.parseError();
        this.openElements.pop();
      }
      this.insertHTMLElement(token[1], token[2]);
    } else if(this.isStartTag(token, "pre", "listing")) {
      if (this.hasInButtonScope("p")) {
        this.closePElement();
      }
      this.insertHTMLElement(token[1], token[2]);
      this.ignoreToken = [tokenType.character, characters.LF];
      this.frameSetOk = "not ok";
    } else if(this.isStartTag(token, "form")) {
      startForm(token);
    } else if (this.isStartTag(token, "li")) {
      this.frameSetOk = "not ok";
      index = this.openElements.length - 1;
      node = this.openElements[index];
      while (true) {
        if (node._tagName === "li") {
          this.generalFormatterEnd(token, this.hasInListItemScope);
          break;
        }
        if (this.inSpecialCategory(node) && !(/^(address|div|p)$/).test(node._tagName)) {
          break;
        }
        node = this.openElements[--index];
      }

      if (this.hasInButtonScope("p")) {
        this.closePElement();
      }
      this.insertHTMLElement(token[1],token[2]);
    } else if (this.isStartTag(token,  "dd", "dt")) {
      this.frameSetOk = "not ok";
      index = this.openElements.length;
      while(--index) {
        if ((/^(dd|dt)$/).test(this.openElements[index]._tagName)) {
          this.endDdDt([tokenType.endTag, this.openElements[index]._tagName]);
          break;
        }

        if (this.inSpecialCategory(this.openElements[index]) && !(/^(address|div|p)$/).test(this.openElements[index]._tagName)) {
          break;
        }
      }

      if (this.hasInButtonScope("p")) {
        this.closePElement();
      }
      this.insertHTMLElement(token[1], token[2]);
    } else if(this.isStartTag(token, "plaintext")) {
      if (this.hasInButtonScope("p")) {
        this.closePElement();
      }
      this.insertHTMLElement(token[1], token[2]);
      this.tokenizer.state = this.tokenizer.states.plaintext;
    } else if (this.isStartTag(token, "button")) {
      if (this.hasElementInScope("button")) {
        this.parseError();
        this.generateImpliedEndTags();
        if (this.currentNode()._tagName !== token[1]) {
          this.parseError();
        }
        this.popUntil(token[1]);
        this.addToken(token);
      } else {
        this.reconstructActiveFormatting();
        this.insertHTMLElement(token[1], token[2]);
        this.frameSetOk = "not ok";
      }
    } else if(this.isEndTag(token, "address", "article", "aside", "blockquote", "button", "center", "details", "dialog", "dir", "div", "dl", "fieldset", "figcaption",
      "figure", "footer", "header", "hgroup", "listing", "main", "menu", "nav", "ol", "pre", "section", "summary", "ul")) {
      if (!this.hasElementInScope(token[1])) {
        this.parseError();
      } else {
        this.generateImpliedEndTags();
        if (this.currentNode()._tagName !== token[1]) {
          this.parseError();
        }
        this.popUntil(token[1]);
      }
    } else if (this.isEndTag(token, "form")) {
      node = this.formElementPointer;
      this.formElementPointer = null;
      if (node === null || !this.hasElementInScope(node._tagName)) {
        this.parseError();
        return;
      }

      this.generateImpliedEndTags();
      if (this.currentNode() !== node) {
        this.parseError();
      }

      index = 0;
      while(this.openElements[index]) {
        if (this.openElements[index] === node) {
          this.openElements.splice(index, 1);
          break;
        }
        index++;
      }
    } else if (this.isEndTag(token, "p")) {
      if (!this.hasInButtonScope("p")) {
        this.parseError();
        this.insertHTMLElement("p", {});
      }
      this.closePElement();
    } else if (this.isEndTag(token, "li")) {
      this.generalFormatterEnd(token, this.hasInListItemScope);
    } else if (this.isEndTag(token, "dd", "dt")) {
      this.endDdDt(token);
    } else if (this.isEndTag(token, "h1", "h2", "h3", "h4", "h5", "h6")) {
      if (!this.hasElementInScope("h1", "h2", "h3", "h4", "h5", "h6")) {
        this.parseError();
      } else {
        this.generateImpliedEndTags();
        if (this.currentNode()._tagName !== token[1]) {
          this.parseError();
        }
        this.popUntilOneOf("h1", "h2", "h3", "h4", "h5", "h6");
        this.openElements.pop();
      }
    } else if (this.isStartTag(token, "a")) {
      index = this.getElementBetweenMarkerAndEnd("a");
      if (index !== -1) {
        node = this.activeFormattingElements[index];
        this.parseError();
        this.adoptionAgencyAlgorithm(token);
        this.removeFrom(node, this.activeFormattingElements);
        this.removeFrom(node, this.openElements);
        // TODO
      }
      this.reconstructActiveFormatting();
      this.pushActiveFormatting(this.insertHTMLElement(token[1], token[2]));
    } else if (this.isStartTag(token, "b", "big", "code", "em", "font", "i", "s", "small", "strike", "strong", "tt", "u")) {
      this.reconstructActiveFormatting();
      this.pushActiveFormatting(this.insertHTMLElement(token[1], token[2]));
    } else if (this.isStartTag(token, "nobr")) {
      this.reconstructActiveFormatting();
      if (this.hasElementInScope(token[1])) {
        this.parseError();
        this.adoptionAgencyAlgorithm(token);
        this.reconstructActiveFormatting();
      }
      this.pushActiveFormatting(this.insertHTMLElement(token[1], token[2]));
    } else if (this.isEndTag(token, "a", "b", "big", "code", "em", "font", "i", "nobr", "s", "small", "strike", "strong", "tt", "u")) {
      this.adoptionAgencyAlgorithm(token);
    } else if (this.isStartTag(token, "applet", "marquee", "object")) {
      this.reconstructActiveFormatting();
      this.insertHTMLElement(token[1], token[2]);
      this.activeFormattingElements.push("marker");
      this.frameSetOk = "not ok";
    } else if (this.isEndTag(token, "applet", "marquee", "object")) {
      if (!this.hasElementInScope(token[1])) {
        this.parseError();
      } else {
        this.generateImpliedEndTags();
        if (this.currentNode()._tagName !== token[1]) {
          this.parseError();
        }

        this.popUntil(token[1]);
        this.clearUntilLastMarker();
      }
    } else if (this.isStartTag(token, "table")) {
      if (!this.tokenizer.forceQuirks && this.hasInButtonScope("p")) {
        this.closePElement();
      }
      this.insertHTMLElement(token[1], token[2]);
      this.frameSetOk = "not ok";
      this.mode = this.modes.in_table;
    } else if (this.isStartTag(token, "area", "br", "embed", "img", "keygen", "wbr")) {
      this.reconstructActiveFormatting();
      this.insertHTMLElement(token[1], token[2]);
      this.openElements.pop();
      // Acknowledge the token's self-closing flag, if it is set.
      this.frameSetOk = "not ok";
    } else if (this.isStartTag(token, "input")) {
      this.reconstructActiveFormatting();
      this.insertHTMLElement(token[1], token[2]);
      this.openElements.pop();
      // Acknowledge the token's self-closing flag, if it is set.
      if (!token[2].type || !(/^hidden$/i).test(token[2].type)) {
        this.frameSetOk = "not ok";

      }
    } else if (this.isStartTag(token, "menuitem", "param", "source", "track")) {
      this.insertHTMLElement(token[1], token[2]);
      this.openElements.pop();
      // Acknowledge the token's self-closing flag, if it is set.
    } else if (this.isStartTag(token, "hr")) {
      if (this.hasInButtonScope("p")) {
        this.closePElement();
      }
      this.insertHTMLElement(token[1], token[2]);
      this.openElements.pop();
      // Acknowledge the token's self-closing flag, if it is set.
      this.frameSetOk = "not ok";
    } else if (this.isStartTag(token, "image")) {
      this.parseError();
      token[1] = "img";
      this.in_body(token);
    } else if (this.isStartTag(token, "isindex")) {
      this.parseError();
      if (this.formElementPointer === null) {
        // Acknowledge the token's self-closing flag, if it is set.
        startForm([tokenType.startTag, "form", token[2].action ? {action: token[2].action} : {}]);
        this.in_body([tokenType.startTag, "hr", {}]);
        this.in_body([tokenType.startTag, "label", {}]);
        this.in_body([tokenType.character, token[2].prompt ? token[2].prompt : "This is a searchable index. Enter search keywords: ", {}]);
        var attrs = {
          name: "isindex"
        };
        Object.keys(token[2]).filter(function(key) {
          return !(/^(name|action|prompt)$/i).test(key);
        }).forEach(function(key) {
            attrs[key] = token[2][key];
          });
        this.in_body([tokenType.startTag, "input", attrs]);
        this.in_body([tokenType.endTag, "label"]);
        this.in_body([tokenType.startTag, "hr", {}]);
        this.in_body([tokenType.endTag, "form"]);
      }
    } else if (this.isStartTag(token, "textarea")) {
      this.insertHTMLElement(token[1], token[2]);
      this.ignoreToken = [tokenType.character, characters.LF];
      this.tokenizer.setState(this.tokenizer.states.RCDATA);
      this.originalMode = this.mode;
      this.frameSetOk = "not ok";
      this.mode = this.modes.text;
    } else if (this.isStartTag(token, "xmp")) {
      if (this.hasInButtonScope("p")) {
        this.closePElement();
      }
      this.reconstructActiveFormatting();
      this.frameSetOk = "not ok";
      this.genericRawTextParsing(token);
    } else if (this.isStartTag(token, "iframe")) {
      this.frameSetOk = "not ok";
      this.genericRawTextParsing(token);
    } else if (this.isStartTag(token, "noembed") || (this.isStartTag(token, "noscript") && this.scriptingFlag)) {
      this.genericRawTextParsing(token);
    } else if (this.isStartTag(token, "select")) {
      this.reconstructActiveFormatting();
      this.insertHTMLElement(token[1], token[2]);
      this.frameSetOk = "not ok";
      if ([this.modes.in_table, this.modes.in_caption, this.modes.in_table_body, this.modes.in_row, this.modes.in_cell].indexOf(this.mode) !== -1) {
        this.mode = this.modes.in_select_in_table;
      } else {
        this.mode = this.modes.in_select;
      }
    } else if (this.isStartTag(token, "optgroup", "option")) {
      if (this.currentNode()._tagName === "option") {
        this.openElements.pop();
      }
      this.reconstructActiveFormatting();
      this.insertHTMLElement(token[1], token[2]);
    } else if (this.isStartTag(token, "rp", "rt")) {
      if (this.hasElementInScope("ruby")) {
        this.generateImpliedEndTags();
        if (this.currentNode()._tagName !== "ruby") {
          this.parseError();
        }
      }
      this.insertHTMLElement(token[1], token[2]);
    } else if (this.isEndTag(token, "br")) {
      this.parseError();
      this.reconstructActiveFormatting();
      this.insertHTMLElement(token[1], token[2]);
      this.openElements.pop();
      this.frameSetOk = "not ok";
    } else if (this.isStartTag(token, "math")) {
      this.reconstructActiveFormatting();
      /*
       Adjust MathML attributes for the token. (This fixes the case of MathML attributes that are not all lowercase.)
       Adjust foreign attributes for the token. (This fixes the use of namespaced attributes, in particular XLink.)
       */
      this.insertForeignElement(token[1], this.adjustMathMLattributes(token[2]), namespace.MathML);
      if (token[3] === true) {
        this.openElements.pop();
      }
    } else if (this.isStartTag(token, "svg")) {
      this.reconstructActiveFormatting();
      /*
       Adjust SVG attributes for the token. (This fixes the case of SVG attributes that are not all lowercase.)
       Adjust foreign attributes for the token. (This fixes the use of namespaced attributes, in particular XLink in SVG.)
       */
      this.insertForeignElement(token[1], this.adjustSVGattributes(token[2]), namespace.SVG);
      if (token[3] === true) {
        this.openElements.pop();
      }
    } else if (this.isStartTag(token, "caption", "col", "colgroup", "frame", "head", "tbody", "td", "tfoot", "th", "thead", "tr")) {
      this.parseError();
    } else if (this.isStartTag(token, "command")) {
      // NOT defined in spec???
      this.insertHTMLElement(token[1], token[2]);
      this.openElements.pop();
    } else if (token[0] === tokenType.startTag) {
      this.reconstructActiveFormatting();
      this.insertHTMLElement(token[1], token[2]);
    } else if (token[0] === tokenType.endTag) {
      this.generalEndTag(token);
    } else if (this.isVariable(token)) {
      this.currentNode().appendVariable(token[1]);
    }
  };

  Parser.prototype.adjustMathMLattributes = function(attributes) {
    var newAttributes = {};
    Object.keys(attributes).forEach(function(attributeName) {
      newAttributes[attributeName === "definitionurl" ? "definitionURL" : attributeName] = attributes[attributeName];
    });

    return newAttributes;
  };

  Parser.prototype.adjustSVGattributes = function(attributes) {
    var newAttributes = {};
    Object.keys(attributes).forEach(function(attributeName) {
      var index = svgAttrTokenNames.indexOf(attributeName);
      newAttributes[index === -1 ? attributeName : svgAttrElementNames[index]] = attributes[attributeName];
    });

    return newAttributes;
  };

  Parser.prototype.generateImpliedEndTags = function(except) {
    except = except || [];
    if (!Array.isArray(except)) {
      except = [except];
    }

    while((/^(dd|dt|li|option|optgroup|p|rp|rt)$/).test(this.currentNode()._tagName) && except.indexOf(this.currentNode()._tagName) === -1) {
      this.openElements.pop();
    }
  };

  Parser.prototype.endBody = function(token) {
    if (!this.hasElementInScope("body")) {
      this.parseError();
      return false;
    }

    /*
     Otherwise, if there is a node in the stack of open elements that is not either a dd element, a dt element, an li element, an optgroup element, an option element, a p element, an rp element, an rt element, a tbody element, a td element, a tfoot element, a th element, a thead element, a tr element, the body element, or the html element, then this is a parse error.
     */
    this.mode = this.modes.after_body;
    return true;
  };

  Parser.prototype.generalFormatterEnd = function(token, scopeFunction) {
    if (!scopeFunction.call(this, token[1])) {
      this.parseError();
    } else {
      // Generate implied end tags, except for elements with the same tag name as the token.
      if (this.currentNode()._tagName !== token[1]) {
        this.parseError();
      }
      this.popUntil(token[1]);
    }
  };

  Parser.prototype.endDdDt = function(token) {
    this.generalFormatterEnd(token, this.hasElementInScope);
  };

  Parser.prototype.adoptionAgencyAlgorithm = function(token) {
    var node;
    var nodeIndex = 0;
    var index;
    var lastNode;
    var tmpNodeIndex;
    var tmpIndex;
    var outerLoop;
    var innerLoop;
    var formattingElement;
    var furthestBlock;
    var commonAncestor;
    var bookmark = "BOOKMARK";
    var element;
    var self = this;
    var popped;
    var append = function(node) {
      element._appendChild(node);
    };

    // 1. Let outer loop counter be zero.
    outerLoop = 0;
    // 2. Outer loop: If outer loop counter is greater than or equal to eight, then abort these steps.
    while (outerLoop < 8) {
      // 3. Increment outer loop counter by one.
      outerLoop++;

      /*
       4. Let the formatting element be the last element in the list of active formatting elements that:
       - is between the end of the list and the last scope marker in the list, if any, or the start of the list otherwise, and
       - has the same tag name as the token.
       */

      index = this.getElementBetweenMarkerAndEnd(token[1]);
      formattingElement = this.activeFormattingElements[index];

      // If there is no such node, then abort these steps and instead act as described in the "any other end tag" entry below.
      if (index === -1) {
        this.generalEndTag(token);
        return;
      }

      // Otherwise, if there is such a node, but that node is not in the stack of open elements, then this is a parse error; remove the element from the list, and abort these steps.
      if (this.indexIn(formattingElement, this.openElements) === -1) {
        this.parseError();
        this.activeFormattingElements.splice(index, 1);
        return;
      }

      // Otherwise, if there is such a node, and that node is also in the stack of open elements, but the element is not in scope,
      // then this is a parse error; ignore the token, and abort these steps.
      if (!this.hasElementInScope(formattingElement._tagName)) {
        this.parseError();
        return;
      }

      // Otherwise, there is a formatting element and that element is in the stack and is in scope. If the element is not the current node,
      // this is a parse error. In any case, proceed with the algorithm as written in the following steps.
      if (this.currentNode() !== formattingElement) {
        this.parseError();
      }

      // 5. Let the furthest block be the topmost node in the stack of open elements that is lower in the stack than the formatting element, and is an element in the special category.
      // There might not be one.
      furthestBlock = this.getFurthestBlock(formattingElement);

      // 6. If there is no furthest block, then the UA must first pop all the nodes from the bottom of the stack of open elements, from the current node up to and including the formatting element,
      // then remove the formatting element from the list of active formatting elements, and finally abort these steps.
      if (!furthestBlock) {
        while((popped = this.openElements.pop()) !== formattingElement && popped !== undefined) {}
        this.removeFrom(formattingElement, this.activeFormattingElements);
        return;
      }

      // 7. Let the common ancestor be the element immediately above the formatting element in the stack of open elements.
      commonAncestor = this.openElements[this.indexIn(formattingElement, this.openElements) - 1];

      // 8. Let a bookmark note the position of the formatting element in the list of active formatting elements relative to the elements on either side of it in the list.
      this.activeFormattingElements.splice(this.indexIn(formattingElement, this.activeFormattingElements), 0, bookmark);

      // 9. Let node and last node be the furthest block
      node = lastNode = furthestBlock;

      // 9.1 Let inner loop counter be zero.
      innerLoop = 0;

      // 9.2 Inner loop: If inner loop counter is greater than or equal to three, then go to the next step in the overall algorithm.
      while (innerLoop < 3) {
        // 9.3 Increment inner loop counter by one.
        innerLoop++;

        // 9.4 Let node be the element immediately above node in the stack of open elements, or if node is no longer in the stack of open elements (e.g. because it got removed by the next step),
        // the element that was immediately above node in the stack of open elements before node was removed.
        tmpNodeIndex = this.indexIn(node, this.openElements);
        node = (tmpNodeIndex !== -1) ? this.openElements[tmpNodeIndex - 1] : this.openElements[nodeIndex - 1];

        tmpIndex = this.indexIn(node, this.activeFormattingElements);
        // 9.5 If node is not in the list of active formatting elements, then remove node from the stack of open elements and then go back to the step labeled inner loop.
        if (tmpIndex === -1) {
          nodeIndex = this.indexIn(node, this.openElements);
          this.removeFrom(node, this.openElements);
          continue;
        }

        // 9.6 Otherwise, if node is the formatting element, then go to the next step in the overall algorithm.
        if (node === formattingElement) {
          break;
        }

        // 9.7 Create an element for the token for which the element node was created, with common ancestor as the intended parent;
        element = this.constructor.createElement(node._tagName);
        this.setElementAttributes(this.getAttributes(node), element, true);
        commonAncestor._appendChild(element);
        // replace the entry for node in the list of active formatting elements with an entry for the new element,
        this.activeFormattingElements.splice(tmpIndex, 1, element);
        // replace the entry for node in the stack of open elements with an entry for the new element
        this.openElements.splice(this.indexIn(node, this.openElements), 1, element);
        // let node be the new element
        node = element;

        // 9.8 If last node is the furthest block, then move the aforementioned bookmark to be immediately after the new node in the list of active formatting elements.
        if (lastNode === furthestBlock) {
          // TODO
          this.activeFormattingElements.splice(this.indexIn(bookmark, this.activeFormattingElements), 1);
          this.activeFormattingElements.splice(this.indexIn(node, this.activeFormattingElements) + 1, 0, bookmark);
        }

        // 9.9 Insert last node into node, first removing it from its previous parent node if any.
        node._appendChild(lastNode);

        // 9.10 Let last node be node.
        lastNode = node;
      }
      // 10. Insert whatever last node ended up being in the previous step at the appropriate place for inserting a node, but using common ancestor as the override target.
      this.insertNodeInAppropriatePlace(lastNode, commonAncestor);
      // 11. Create an element for the token for which the formatting element was created, with furthest block as the intended parent.
      element = this.constructor.createElement(formattingElement._tagName);
      this.setElementAttributes(this.getAttributes(formattingElement), element, true);

      // 12. Take all of the child nodes of the furthest block and append them to the element created in the last step.
      furthestBlock.childNodes.splice(0).forEach(append);

      // 13. Append that new element to the furthest block.
      furthestBlock._appendChild(element);

      // 14. Remove the formatting element from the list of active formatting elements,
      this.removeFrom(formattingElement, this.activeFormattingElements);
      // and insert the new element into the list of active formatting elements at the position of the aforementioned bookmark.
      this.activeFormattingElements.splice(this.indexIn(bookmark, this.activeFormattingElements), 1, element);

      // 15. Remove the formatting element from the stack of open elements,
      this.removeFrom(formattingElement, this.openElements);
      // and insert the new element into the stack of open elements immediately below the position of the furthest block in that stack.
      this.openElements.splice(this.indexIn(furthestBlock, this.openElements) + 1, 0, element);
    }
  };

  Parser.prototype.insertNodeInAppropriatePlace = function(node, overrideTarget) {
    var appropriatePlace = this.appropriatePlaceForInsertingNode(overrideTarget);
    appropriatePlace.parent._insertAt(node, appropriatePlace.index);
  };

  Parser.prototype.appropriatePlaceForInsertingNode = function(overrideTarget) {
    var target = overrideTarget || this.currentNode();
    var adjustedInsertionLocation;
    var lastTemplate;
    var lastTable;

    if (this.fosterParented && (/^(table|tbody|tfoot|thead|tr)$/).test(target._tagName)) {
      lastTemplate = this.lastOfTypeIn("template", this.openElements);
      lastTable = this.lastOfTypeIn("table", this.openElements);

      // TODO 3. If there is a last template and either there is no last table, or there is one, but last template is lower (more recently added) than last table in the stack of open elements, then: let adjusted insertion location be inside last template's template contents, after its last child (if any), and abort these substeps.
      if (lastTemplate !== null && (lastTable === null || this.indexIn(lastTemplate, this.openElements) > this.indexIn(lastTable, this.openElements))) {
        return {
          parent: lastTemplate,
          index: lastTemplate.childNodes.length
        };
      }

      if (lastTable === null) {
        return {
          parent: this.openElements[0],
          index: this.openElements[0].childNodes.length
        };
      }

      if (lastTable.parentNode) {
        return {
          parent: lastTable.parentNode,
          index: this.indexIn(lastTable, lastTable.parentNode.childNodes)
        };
      }

      var previousElement = this.indexIn(lastTable, this.openElements);
      adjustedInsertionLocation = {
        parent: previousElement,
        index: previousElement.childNodes.length
      };
    } else {
      adjustedInsertionLocation = {
        parent: target,
        index: target.childNodes.length
      };
    }
    // TODO 3. If the adjusted insertion location is inside a template element, let it instead be inside the template element's template contents, after its last child (if any).
    return adjustedInsertionLocation;
  };

  Parser.prototype.lastOfTypeIn = function(type, arr) {
    var index = arr.length;
    while (--index > 0) {
      if (arr[index]._tagName === type) {
        return arr[index];
      }
    }
    return null;
  };

  Parser.prototype.removeFrom = function(obj, arr) {
    var index = this.indexIn(obj, arr);
    if (index !== -1) {
      arr.splice(index, 1);
    }
  };

  Parser.prototype.indexIn = function(obj, arr) {
    var index = -1;
    return (arr.some(function(refObj) {
      index++;
      return refObj === obj;
    })) ? index : -1;
  };

  Parser.prototype.getElementBetweenMarkerAndEnd = function(_tagName) {
    var _tagNames = this.activeFormattingElements.map(get_tagName);
    var lastMarker = _tagNames.lastIndexOf("marker");
    var result = _tagNames.slice((lastMarker !== -1 ? lastMarker : 0)).lastIndexOf(_tagName);
    return result === -1 ? -1 : result + ((lastMarker !== -1) ? lastMarker : 0);
  };

  Parser.prototype.getFurthestBlock = function(formattingElement) {
    var index = this.openElements.length - 1;
    var current = null;
    for (; index >= 0; index--) {
      if (this.inSpecialCategory(this.openElements[index])) {
        current = this.openElements[index];
      }

      if (this.openElements[index] === formattingElement && current) {
        return current;
      }
    }
    return null;
  };

  Parser.prototype.closePElement = function() {
    this.generateImpliedEndTags(["p"]);
    if (this.currentNode()._tagName !== "p") {
      this.parseError();
    }
    this.popUntil("p");
  };

  Parser.prototype.generalEndTag = function(token) {
    var index = this.openElements.length - 1;
    var node = this.openElements[index];
    while(true) {
      if (node._tagName === token[1]) {
        this.generateImpliedEndTags(token[1]);
        if (node._tagName !== this.currentNode()._tagName) {
          this.parseError();
        }
        this.openElements.splice(index);
        break;
      } else if (this.inSpecialCategory(node)) {
        this.parseError();
        return;
      }
      node = this.openElements[--index];
    }
  };

  Parser.prototype.text = function(token) {
    if (this.isCharacterToken(token)) {
      this.insertCharacter(token[1]);
    } else if (this.isEOF(token)) {
      this.parseError();
      if (this.currentNode()._tagName === "script") {
        this.currentNode()._alreadyStarted = true;
      }
      this.openElements.pop();
      this.mode = this.originalMode;
      this.addToken(token);
    } else if (this.isEndTag(token, "script")) {
      /*
       Perform a microtask checkpoint.
       Provide a stable state.
       */
      var script = this.currentNode();

      this.openElements.pop();
      this.mode = this.originalMode;

      if (script._alreadyStarted) {
        return;
      }

      var wasParserInserted = (script._parserInserted);
      script._parserInserted = false;

      if (wasParserInserted && this.getAttributes(script).async === undefined) {
        script._forceAsync = true;
      }

      if (script._run) {
        script._run();
      }
      // TODO  http://www.whatwg.org/specs/web-apps/current-work/multipage/scripting-1.html#prepare-a-script
    } else if (token[0] === tokenType.endTag) {
      this.openElements.pop();
      this.mode = this.originalMode;
    }
  };

  Parser.prototype.in_table = function(token) {
    if (this.isCharacterToken(token) && (/^(table|tbody|tfoot|thead|tr)$/).test(this.currentNode()._tagName)) {
      this.pendingTableCharacterTokens = [];
      this.originalMode = this.mode;
      this.mode = this.modes.in_table_text;
      this.addToken(token);
    } else if(this.isCommentToken(token)) {
      this.currentNode()._appendChild(this.constructor.createComment(token[1]));
    } else if(this.isDoctypeToken(token)) {
      this.parseError();
    } else if (this.isStartTag(token, "caption")) {
      this.clearTableStackBackToTableContext();
      this.activeFormattingElements.push("marker");
      this.insertHTMLElement(token[1], token[2]);
      this.mode = this.modes.in_caption;
    } else if (this.isStartTag(token, "colgroup", "col")) {
      this.clearTableStackBackToTableContext();
      this.insertHTMLElement("colgroup", this.isStartTag(token, "colgroup") ? token[2] : {});
      this.mode = this.modes.in_column_group;
      if (this.isStartTag(token, "col")) {
        this.addToken(token);
      }
    } else if (this.isStartTag(token, "tbody", "tfoot", "thead")) {
      this.clearTableStackBackToTableContext();
      this.insertHTMLElement(token[1], token[2]);
      this.mode = this.modes.in_table_body;
    } else if (this.isStartTag(token, "td", "th", "tr")) {
      this.clearTableStackBackToTableContext();
      this.insertHTMLElement("tbody", {});
      this.mode = this.modes.in_table_body;
      this.addToken(token);
    } else if (this.isStartTag(token, "table")) {
      this.parseError();
      if (this.hasInTableScope("table")) {
        this.popUntil("table");
        this.resetInsertionMode();
        this.addToken(token);
      }
    } else if (this.isEndTag(token, "table")) {
      if (!this.hasInTableScope("table")) {
        this.parseError();
      } else {
        this.popUntil("table");
        this.resetInsertionMode();
      }
    } else if (this.isEndTag(token, "body", "caption", "col", "colgroup", "html", "tbody", "td", "tfoot", "th", "thead", "tr")) {
      this.parseError();
    } else if (this.isStartTag(token, "style", "script", "template") || this.isEndTag(token, "template")) {
      this.in_head(token);
    } else if (this.isStartTag(token, "input")) {
      if (!token[2].type || !(/^hidden$/i).test(token[2].type)) {
        this.parseError();
        this.fosterParented = true;
        this.in_body(token);
        this.fosterParented = false;
      } else {
        this.parseError();
        this.insertHTMLElement(token[1], token[2]);
        this.openElements.pop();
        // Acknowledge the token's self-closing flag, if it is set.
      }
    } else if (this.isStartTag(token, "form")) {
      this.parseError();
      if (this.formElementPointer === null) {
        this.formElementPointer = this.insertHTMLElement(token[1], token[2]);
        this.openElements.pop();
      }
    } else if (this.isEOF(token)) {
      this.in_body(token);
    } else {
      this.tableAnythingElse(token);
    }
  };

  Parser.prototype.clearTableStackBackToTableContext = function() {
    this.popUntilOneOf("table", "template", "html");
  };

  Parser.prototype.tableAnythingElse = function(token) {
    this.parseError();
    this.fosterParented = true;
    this.in_body(token);
    this.fosterParented = false;
  };

  Parser.prototype.in_table_text = function(token) {
    if (this.isCharacterToken(token) && this.characterOneOf(token, characters.NULL)) {
      this.parseError();
    } else if (this.isCharacterToken(token)) {
      this.pendingTableCharacterTokens.push(token);
    } else {
      if (this.pendingTableCharacterTokens.some(notSpaceCharacterToken)) {
        this.pendingTableCharacterTokens.forEach(this.tableAnythingElse.bind(this));
      } else  {
        this.pendingTableCharacterTokens.forEach(this.insertCharacterToken.bind(this));
      }
      this.mode = this.originalMode;
      this.addToken(token);
      this.pendingTableCharacterTokens = [];
    }
  };

  Parser.prototype.in_caption = function(token) {
    if (this.isEndTag(token, "caption")) {
      this.closeCaption();
    } else if (this.isStartTag(token, "caption", "col", "colgroup", "tbody", "td", "tfoot", "th", "thead", "tr") || this.isEndTag(token, "table")) {
      this.parseError();
      if (this.closeCaption()) {
        this.addToken(token);
      }
    } else if (this.isEndTag(token, "body", "col", "colgroup", "html", "tbody", "td", "tfoot", "th", "thead", "tr")) {
      this.parseError();
    } else {
      this.in_body(token);
    }
  };

  Parser.prototype.closeCaption = function() {
    if (!this.hasInTableScope("caption")) {
      this.parseError();
      return false;
    } else {
      this.generateImpliedEndTags();
      if (this.currentNode()._tagName !== "caption") {
        this.parseError();
      }
      this.popUntil("caption");
      this.clearUntilLastMarker();
      this.mode = this.modes.in_table;
      return true;
    }
  };

  Parser.prototype.in_column_group = function(token) {
    if (this.isCharacterToken(token) && this.characterOneOf(token, characters.TAB, characters.LF, characters.FF, characters.CR, characters.SPACE)) {
      this.insertCharacter(token[1]);
    } else if(this.isCommentToken(token)) {
      this.currentNode()._appendChild(this.constructor.createComment(token[1]));
    } else if(this.isDoctypeToken(token)) {
      this.parseError();
    } else if(this.isStartTag(token, "html")) {
      this.in_body(token);
    } else if(this.isStartTag(token, "col")) {
      this.insertHTMLElement(token[1], token[2]);
      this.openElements.pop();
      // Acknowledge the token's self-closing flag, if it is set.
    } else if (this.isEndTag(token, "colgroup")) {
      this.closeColumnGroup();
    } else if (this.isEndTag(token, "col")) {
      this.parseError();
    } else if (this.isStartTag(token, "template") || this.isEndTag(token, "template")) {
      this.in_head(token);
    } else if (this.isEOF(token)){
      this.in_body(token);
    } else {
      if (this.closeColumnGroup()) {
        this.addToken(token);
      }
    }
  };

  Parser.prototype.closeColumnGroup = function() {
    var node = this.currentNode();
    if (node && node._tagName === "colgroup") {
      this.openElements.pop();
      this.mode = this.modes.in_table;
      return true;
    }
    return false;
  };

  Parser.prototype.in_table_body = function(token) {
    if (this.isStartTag(token, "tr")) {
      this.clearStackBackToTableContext();
      this.insertHTMLElement(token[1], token[2]);
      this.mode = this.modes.in_row;
    } else if (this.isStartTag(token, "th", "td")) {
      this.parseError();
      this.clearStackBackToTableContext();
      this.insertHTMLElement("tr", {});
      this.mode = this.modes.in_row;
      this.addToken(token);
    } else if (this.isEndTag(token, "tbody", "tfoot", "thead")) {
      this.closeTableSection(token[1]);
    } else if (this.isStartTag(token, "caption", "col", "colgroup", "tbody", "tfoot", "thead") || this.isEndTag(token, "table")) {
      if (!this.hasInTableScope("tbody", "thead", "tfoot")) {
        this.parseError();
      } else {
        this.clearStackBackToTableContext();
        this.openElements.pop();
        this.mode = this.modes.in_table;
        this.addToken(token);
      }
    } else if (this.isEndTag(token, "body", "caption", "col", "colgroup", "html", "td", "th", "tr")) {
      this.parseError();
    } else {
      this.in_table(token);
    }
  };

  Parser.prototype.clearStackBackToTableContext = function() {
    this.popUntilOneOf("tbody", "tfoot", "thead", "template", "html");
  };

  Parser.prototype.closeTableSection = function(_tagName) {
    if (!this.hasInOpenStack(_tagName)) {
      this.parseError();
    } else {
      this.clearStackBackToTableContext();
      this.openElements.pop();
      this.mode = this.modes.in_table;
    }
  };

  Parser.prototype.in_row = function(token) {
    if (this.isStartTag(token, "th", "td")) {
      this.clearStackBackToTableRowContext();
      this.insertHTMLElement(token[1], token[2]);
      this.mode = this.modes.in_cell;
      this.activeFormattingElements.push("marker");
    } else if(this.isEndTag(token, "tr")) {
      this.closeRow();
    } else if (this.isStartTag(token, "caption", "col", "colgroup", "tbody", "tfoot", "thead", "tr") || this.isEndTag(token, "table")) {
      if (!this.hasInTableScope("tr")) {
        this.parseError();
      } else {
        this.clearStackBackToTableRowContext();
        this.openElements.pop();
        this.mode = this.modes.in_table_body;
        this.addToken(token);
      }
    } else if (this.isEndTag(token, "tbody", "tfoot", "thead")) {
      if (!this.hasInTableScope(token[1])) {
        this.parseError();
      } else if (this.hasInTableScope("tr")) {
        this.clearStackBackToTableRowContext();
        this.openElements.pop();
        this.mode = this.modes.in_table_body;
        this.addToken(token);
      }
    }  else if (this.isEndTag(token, "body", "caption", "col", "colgroup", "html", "td", "th")) {
      this.parseError();
    } else {
      this.in_table(token);
    }
  };

  Parser.prototype.clearStackBackToTableRowContext = function() {
    this.popUntilOneOf("tr", "template", "html");
  };

  Parser.prototype.closeRow = function() {
    if (!this.hasInTableScope("tr")) {
      this.parseError();
      return false;
    } else {
      this.clearStackBackToTableRowContext();
      this.openElements.pop();
      this.mode = this.modes.in_table_body;
      return true;
    }
  };

  Parser.prototype.in_cell = function(token) {
    if (this.isEndTag(token, "td", "th")) {
      if (!this.hasInTableScope(token[1])) {
        this.parseError();
      } else {
        this.endCell(token[1]);
      }
    } else if (this.isStartTag(token, "caption", "col", "colgroup", "tbody", "td", "tfoot", "th", "thead", "tr")) {
      if (!this.hasInTableScope("td", "tr")) {
        this.parseError();
      } else {
        this.closeCell();
        this.addToken(token);
      }
    } else if (this.isEndTag(token, "body", "caption", "col", "colgroup", "html")) {
      this.parseError();
    } else if (this.isEndTag(token, "table", "tbody", "tfoot", "thead", "tr")) {
      if (!this.hasInTableScope(token[1])) {
        this.parseError();
      } else {
        this.closeCell();
        this.addToken(token);
      }
    } else {
      this.in_body(token);
    }
  };

  Parser.prototype.closeCell = function() {
    this.generateImpliedEndTags();
    if (!(/^(td|th)$/).test(this.currentNode()._tagName)) {
      this.parseError();
    }
    this.popUntilOneOf("td", "th");
    this.openElements.pop();
    this.clearUntilLastMarker();
    this.mode = this.modes.in_row;
  };

  Parser.prototype.endCell = function(_tagName) {
    this.generateImpliedEndTags();
    if (this.currentNode()._tagName === _tagName) {
      this.parseError();
    }
    this.popUntil(_tagName);
    this.clearUntilLastMarker();
    this.mode = this.modes.in_row;
  };

  Parser.prototype.clearUntilLastMarker = function() {
    var entry;
    while ((entry = this.activeFormattingElements.pop())) {
      if (entry === "marker" || !entry) {
        break;
      }
    }
  };

  Parser.prototype.in_select = function(token) {
    if (this.isCharacterToken(token) && this.characterOneOf(token, characters.NULL)) {
      this.parseError();
    } else if(this.isCharacterToken(token)) {
      this.insertCharacter(token[1]);
    } else if(this.isCommentToken(token)) {
      this.currentNode()._appendChild(this.constructor.createComment(token[1]));
    } else if(this.isDoctypeToken(token)) {
      this.parseError();
    } else if(this.isStartTag(token, "html")) {
      this.in_body(token);
    } else if(this.isStartTag(token, "option")) {
      if (this.currentNode()._tagName === "option") {
        this.openElements.pop();
      }
      this.insertHTMLElement(token[1], token[2]);
    } else if (this.isStartTag(token, "optgroup")) {
      if (this.currentNode()._tagName === "option") {
        this.openElements.pop();
      }
      if (this.currentNode()._tagName === "optgroup") {
        this.openElements.pop();
      }
      this.insertHTMLElement(token[1], token[2]);
    } else if (this.isEndTag(token, "optgroup")) {
      if (this.currentNode()._tagName === "option" && this.openElements.length >= 2 && this.openElements[this.openElements.length - 2]._tagName === "optgroup" ) {
        this.openElements.pop();
      }
      if (this.currentNode()._tagName === "optgroup") {
        this.openElements.pop();
      } else {
        this.parseError();
      }
    } else if (this.isEndTag(token, "option")) {
      if (this.currentNode()._tagName === "option") {
        this.openElements.pop();
      } else {
        this.parseError();
      }
    } else if (this.isEndTag(token, "select")) {
      this.closeSelect();
    } else if (this.isStartTag(token, "select")) {
      this.parseError();
      this.closeSelect();
    } else if (this.isStartTag(token, "input", "keygen", "textarea")) {
      this.parseError();
      if (this.hasInSelectScope("select")) {
        this.closeSelect();
        this.addToken(token);
      }
    } else if (this.isStartTag(token, "script", "template") || this.isEndTag(token, "template")) {
      this.in_head(token);
    } else if (this.isEOF(token)) {
      if (this.currentNode()._tagName !== "html") {
        this.parseError();
      }
    } else {
      this.parseError();
    }
  };

  Parser.prototype.closeSelect = function() {
    if (!this.hasInSelectScope("select")) {
      this.parseError();
    } else {
      this.popUntil("select");
      this.resetInsertionMode();
    }
  };

  Parser.prototype.in_select_in_table = function(token) {
    if (this.isStartTag(token, "caption", "table", "tbody", "tfoot", "thead", "tr", "td", "th")) {
      this.parseError();
      this.closeSelect();
      this.addToken(token);
    } else if (this.isEndTag(token, "caption", "table", "tbody", "tfoot", "thead", "tr", "td", "th")) {
      this.parseError();
      if (this.hasInTableScope(token[1])) {
        this.closeSelect();
        this.addToken(token);
      }
    } else {
      this.in_select(token);
    }
  };

  Parser.prototype.in_template = function(token) {
    if (this.isCharacterToken(token) || this.isCommentToken(token) || this.isDoctypeToken(token)) {
      this.in_body(token);
    } else if (this.isStartTag(token, "base", "basefont", "bgsound", "link", "meta", "noframes", "script", "style", "template", "title") || this.isEndTag(token, "template")) {
      this.in_head(token);
    } else if (this.isStartTag(token, "caption", "colgroup", "tbody", "tfoot", "thead")) {
      this.templateInsertionModes.pop();
      this.templateInsertionModes.push(this.modes.in_table);
      this.mode = this.modes.in_table;
      this.addToken(token);
    } else if (this.isStartTag(token, "col")) {
      this.templateInsertionModes.pop();
      this.templateInsertionModes.push(this.modes.in_column_group);
      this.mode = this.modes.in_column_group;
      this.addToken(token);
    } else if (this.isStartTag(token, "tr")) {
      this.templateInsertionModes.pop();
      this.templateInsertionModes.push(this.modes.in_table_body);
      this.mode = this.modes.in_table_body;
      this.addToken(token);
    } else if (this.isStartTag(token, "td", "th")) {
      this.templateInsertionModes.pop();
      this.templateInsertionModes.push(this.modes.in_row);
      this.mode = this.modes.in_row;
      this.addToken(token);
    } else if (token[0] === tokenType.startTag) {
      this.templateInsertionModes.pop();
      this.templateInsertionModes.push(this.modes.in_body);
      this.mode = this.modes.in_body;
      this.addToken(token);
    } else if (token[0] === tokenType.endTag) {
      this.parseError();
    } else if (this.isEOF(token)) {
      if (this.lastOfTypeIn("template", this.openElements) === null) {
        return;
      } else {
        this.parseError();
        this.popUntil("template");
        this.clearUntilLastMarker();
        this.templateInsertionModes.pop();
        this.resetInsertionMode();
        this.addToken(token);
      }

    }

  };

  Parser.prototype.after_body = function(token) {
    if (this.isCharacterToken(token) && this.characterOneOf(token, characters.TAB, characters.LF, characters.FF, characters.CR, characters.SPACE)) {
      this.in_body(token);
    } else if (this.isCommentToken(token)) {
      this.openElements[0]._appendChild(this.constructor.createComment(token[1]));
    } else if(this.isDoctypeToken(token)) {
      this.parseError();
    } else if(this.isStartTag(token, "html")) {
      this.in_body(token);
    } else if(this.isEndTag(token, "html")) {
      // If the parser was originally created as part of the HTML fragment parsing algorithm, this is a parse error; ignore the token. (fragment case)
      this.mode = this.modes.after_after_body;
    } else if (this.isEOF(token)) {
      return;
    } else {
      this.parseError();
      this.mode = this.modes.after_after_body;
      this.addToken(token);
    }
  };

  Parser.prototype.in_frameset = function(token) {
    if (this.isCharacterToken(token) && this.characterOneOf(token, characters.TAB, characters.LF, characters.FF, characters.CR, characters.SPACE)) {
      this.insertCharacter(token[1]);
    } else if (this.isCommentToken(token)) {
      this.currentNode()._appendChild(this.constructor.createComment(token[1]));
    } else if (this.isDoctypeToken(token)) {
      this.parseError();
    } else if (this.isStartTag(token, "html")) {
      this.in_body(token);
    } else if (this.isStartTag(token, "frameset")) {
      this.insertHTMLElement(token[1], token[2]);
    } else if (this.isEndTag(token, "frameset")) {
      if (this.currentNode()._tagName === "html") {
        this.parseError();
      } else {
        this.openElements.pop();
        if (!this.fragmentCase) {
          // If the parser was not originally created as part of the HTML fragment parsing algorithm (fragment case), and the current node is no longer a frameset element, then switch the insertion mode to "after frameset".
          this.mode = this.modes.after_frameset;
        }
      }
    } else if (this.isStartTag(token, "frame")) {
      this.insertHTMLElement(token[1], token[2]);
      this.openElements.pop();
      // Acknowledge the token's self-closing flag, if it is set.
    } else if (this.isStartTag(token, "noframes")) {
      this.in_head(token);
    } else if (this.isEOF(token)) {
      if (this.currentNode()._tagName === "html") {
        this.parseError();
      }
    } else {
      this.parseError();
    }
  };

  Parser.prototype.after_frameset = function(token) {
    if (this.isCharacterToken(token) && this.characterOneOf(token, characters.TAB, characters.LF, characters.FF, characters.CR, characters.SPACE)) {
      this.insertCharacter(token[1]);
    } else if (this.isCommentToken(token)) {
      this.currentNode()._appendChild(this.constructor.createComment(token[1]));
    } else if (this.isDoctypeToken(token)) {
      this.parseError();
    } else if (this.isStartTag(token, "html")) {
      this.in_body(token);
    } else if (this.isEndTag(token, "html")) {
      this.mode = this.modes.after_after_frameset;
    } else if (this.isStartTag(token, "noframes")) {
      this.in_head(token);
    } else if (this.isEOF(token)) {
      return;
    } else {
      this.parseError();
    }
  };

  Parser.prototype.after_after_body = function(token) {
    if (this.isCommentToken(token)) {
      this.constructor._appendChild(this.constructor.createComment(token[1]));
    } else if (this.isDoctypeToken(token) || (this.isCharacterToken(token) && this.characterOneOf(token, characters.TAB, characters.LF, characters.FF, characters.CR, characters.SPACE)) || this.isStartTag(token, "html")) {
      this.in_body(token);
    } else if (this.isEOF(token)) {
      return;
    } else {
      this.parseError();
      this.mode = this.modes.in_body;
      this.addToken(token);
    }
  };

  Parser.prototype.after_after_frameset = function(token) {
    if (this.isCommentToken(token)) {
      this.constructor._appendChild(this.constructor.createComment(token[1]));
    } else if (this.isDoctypeToken(token) || (this.isCharacterToken(token) && this.characterOneOf(token, characters.TAB, characters.LF, characters.FF, characters.CR, characters.SPACE)) || this.isStartTag(token, "html")) {
      this.in_body(token);
    } else if (this.isEOF(token)) {
      return;
    } else if (this.isStartTag(token, "noframes")) {
      this.in_head(token);
    } else {
      this.parseError();
    }
  };

  Parser.prototype.in_foreign_content = function(token) {
    var _tagName, attributes;
    if (this.isCharacterToken(token) && this.characterOneOf(token, characters.NULL)) {
      this.parseError();
      this.insertCharacter(String.fromCharCode(characters.REPLACEMENT_CHARACTER));
    } else if (this.isCharacterToken(token) && this.characterOneOf(token, characters.TAB, characters.LF, characters.FF, characters.CR, characters.SPACE)) {
      this.insertCharacter(token[1]);
    } else if (this.isCharacterToken(token)) {
      this.insertCharacter(token[1]);
      this.frameSetOk = "not ok";
    } else if (this.isCommentToken(token)) {
      this.currentNode()._appendChild(this.constructor.createComment(token[1]));
    } else if (this.isDoctypeToken(token)) {
      this.parseError();
    } else if (this.isStartTag(token,  "b", "big", "blockquote", "body", "br", "center", "code", "dd", "div", "dl", "dt", "em", "embed", "h1", "h2", "h3", "h4", "h5", "h6",
      "head", "hr", "i", "img", "li", "listing", "menu", "meta", "nobr", "ol", "p", "pre", "ruby", "s", "small", "span", "strong",
      "strike", "sub", "sup", "table", "tt", "u", "ul", "var") || (this.isStartTag(token, "font") && (token[2].color || token[2].face || token[2].size))) {
      this.parseError();
      // If the parser was originally created for the HTML fragment parsing algorithm, then act as described in the "any other start tag" entry below. (fragment case)
      var currentNode = this.currentNode();
      while(currentNode.integrationPoint !== this.integrationPoint.MathMLtext && currentNode.integrationPoint !== this.integrationPoint.HTML && currentNode.namespaceURI !== namespace.HTML) {
        this.openElements.pop();
        currentNode = this.currentNode();
      }
      this.addToken(token);
    } else if (token[0] === tokenType.startTag) {
      _tagName = token[1];
      attributes = token[2];
      if (this.currentNode().namespaceURI === namespace.MathML) {
        attributes = this.adjustMathMLattributes(attributes);
      } else if (this.currentNode().namespaceURI === namespace.SVG) {
        _tagName = (svgCaseFix[token[1]]) ? svgCaseFix[token[1]] : token[1];
        attributes = this.adjustSVGattributes(attributes);
      }
      // Adjust foreign attributes for the token. (This fixes the use of namespaced attributes, in particular XLink in SVG.)
      this.insertForeignElement(_tagName, attributes, this.currentNode().namespaceURI);

      if (token[3]) {
        if (_tagName === "script") {
          /*
           If the token has its self-closing flag set, then run the appropriate steps from the following list:

           If the token's tag name is "script"
           Acknowledge the token's self-closing flag, and then act as if an end tag with the tag name "script" had been seen.
           */
        } else {
          this.openElements.pop();
          //   Pop the current node off the stack of open elements and acknowledge the token's self-closing flag.
        }
      }
    } else if (this.isEndTag(token, "script") && this.currentNode()._tagName === "script" && this.currentNode().namespaceURI === namespace.SVG) {
      this.openElements.pop();
      /*
       Let the old insertion point have the same value as the current insertion point. Let the insertion point be just before the next input character.

       Increment the parser's script nesting level by one. Set the parser pause flag to true.

       Process the script element according to the SVG rules, if the user agent supports SVG. [SVG]

       Even if this causes new characters to be inserted into the tokenizer, the parser will not be executed reentrantly, since the parser pause flag is true.

       Decrement the parser's script nesting level by one. If the parser's script nesting level is zero, then set the parser pause flag to false.

       Let the insertion point have the value of the old insertion point. (In other words, restore the insertion point to its previous value. This value might be the "undefined" value.)
       */
    } else if (token[0] === tokenType.endTag) {
      var index = this.openElements.length;
      var node = this.openElements[--index];
      if (node._tagName.toLowerCase() !== token[1]) {
        this.parseError();
      }
      while(index) {
        if (node._tagName.toLowerCase() === token[1]) {
          this.openElements.splice(index);
          break;
        }
        node = this.openElements[--index];
        if (node.namespaceURI === namespace.HTML) {
          this.in_html_content(token);
          break;
        }
      }
    }
  };

  Parser.prototype.popUntil = function(_tagName) {
    while(this.openElements.length) {
      if (this.openElements.pop()._tagName === _tagName) {
        break;
      }
    }
  };

  Parser.prototype.popUntilOneOf = function() {
    var _tagNames = [].slice.call(arguments, 0);
    while(this.openElements.length) {
      if (_tagNames.indexOf(this.currentNode()._tagName) !== -1) {
        return;
      }
      this.openElements.pop();
    }
  };

  Parser.prototype.hasInOpenStack = function(_tagName) {
    return this.openElements.some(function(element) {
      return element._tagName === _tagName;
    });
  };

  Parser.prototype.resetInsertionMode = function() {
    var last = false;
    var i = this.openElements.length - 1;
    var node = this.openElements[i];
    while(true) {
      if (i <= 0) {
        last = true;
        node = this.constructor;
      }
      switch(node._tagName) {
        case "select":
          this.mode = this.modes.in_select;
          // TODO
          return;
        case "td":
        case "th":
          if (!last) {
            this.mode = this.modes.in_cell;
            return;
          }
          break;
        case "tr":
          this.mode = this.modes.in_row;
          return;
        case "tbody":
        case "thead":
        case "tfoot":
          this.mode = this.modes.in_table_body;
          return;
        case "caption":
          this.mode = this.modes.in_caption;
          return;
        case "colgroup":
          this.mode = this.modes.in_column_group;
          return;
        case "table":
          this.mode = this.modes.in_table;
          return;
        case "template":
          this.mode = this.currentTemplateInsertionMode();
          return;
        case "head":
          if (!last) {
            this.mode = this.modes.in_head;
            return;
          }
          break;
        case "body":
          this.mode = this.modes.in_body;
          return;
        case "frameset":
          this.mode = this.modes.in_frameset;
          return;
        case "html":
          this.mode = this.modes.before_head;
          return;
      }

      if (last) {
        this.mode = this.modes.in_body;
        return;
      }

      node = this.openElements[--i];
    }
  };

  Parser.prototype.currentTemplateInsertionMode = function() {
    return this.templateInsertionModes[this.templateInsertionModes.length - 1];
  };

  Parser.prototype.inSpecialCategory = function(node) {
    return ((["address", "applet", "area", "article", "aside", "base", "basefont", "bgsound", "blockquote", "body", "br", "button", "caption",
      "center", "col", "colgroup", "dd", "details", "dir", "div", "dl", "dt", "embed", "fieldset", "figcaption", "figure", "footer", "form", "frame", "frameset",
      "h1", "h2", "h3", "h4", "h5", "h6", "head", "header", "hgroup", "hr", "html", "iframe", "img", "input", "isindex", "li", "link", "listing", "main", "marquee",
      "menu", "menuitem", "meta", "nav", "noembed", "noframes", "noscript", "object", "ol", "p", "param", "plaintext", "pre", "script", "section", "select", "source", "style",
      "summary", "table", "tbody", "td", "template", "textarea", "tfoot", "th", "thead", "title", "tr", "track", "ul", "wbr", "xmp"].indexOf(node._tagName) !== -1 && node.namespaceURI === namespace.HTML) ||
      (["mi", "mo", "mn", "ms", "mtext", "annotation-xml"].indexOf(node._tagName) !== -1 && node.namespaceURI === namespace.MathML) ||
      (["foreignObject", "desc", "title"].indexOf(node._tagName) !== -1 && node.namespaceURI === namespace.SVG));
  };

  Parser.prototype.hasInScope = function(target, list, negate) {
    var index = this.openElements.length - 1;
    var node = this.openElements[index--];
    var matchFunc = function(group) {
      return (group.namespace === node.namespaceURI && group.elements.indexOf(node._tagName) !== -1);
    };
    while(true) {
      if (node === undefined) {
        break;
      }
      if (target.indexOf(node._tagName) !== -1) {
        return true;
      } else if (list.some(matchFunc) !== negate) {
        return false;
      }
      node = this.openElements[index--];
    }
    return false;
  };

  Parser.prototype.hasElementInScope = function() {
    return this.hasInScope([].slice.call(arguments, 0), [{
      namespace: namespace.HTML,
      elements: ["applet", "caption", "html", "table", "td", "th", "marquee", "object", "template"]
    },{
      namespace: namespace.MathML,
      elements: ["mi", "mo", "mn", "ms", "mtext", "annotation-xml"]
    },{
      namespace: namespace.SVG,
      elements: ["foreignObject", "desc", "title"]
    }], false);
  };

  Parser.prototype.hasInListItemScope = function() {
    return this.hasInScope([].slice.call(arguments, 0), [{
      namespace: namespace.HTML,
      elements: ["applet", "caption", "html", "table", "td", "th", "marquee", "object", "template", "ol", "ul"]
    },{
      namespace: namespace.MathML,
      elements: ["mi", "mo", "mn", "ms", "mtext", "annotation-xml"]
    },{
      namespace: namespace.SVG,
      elements: ["foreignObject", "desc", "title"]
    }], false);
  };

  Parser.prototype.hasInButtonScope = function() {
    return this.hasInScope([].slice.call(arguments, 0), [{
      namespace: namespace.HTML,
      elements: ["applet", "caption", "html", "table", "td", "th", "marquee", "object", "template", "button"]
    },{
      namespace: namespace.MathML,
      elements: ["mi", "mo", "mn", "ms", "mtext", "annotation-xml"]
    },{
      namespace: namespace.SVG,
      elements: ["foreignObject", "desc", "title"]
    }], false);
  };

  Parser.prototype.hasInTableScope = function() {
    return this.hasInScope([].slice.call(arguments, 0), [{
      namespace: namespace.HTML,
      elements: ["html", "table", "template"]
    }], false);
  };

  Parser.prototype.hasInSelectScope = function() {
    return this.hasInScope([].slice.call(arguments, 0), [{
      namespace: namespace.HTML,
      elements: ["optgroup", "option"]
    }], true);
  };

  Parser.prototype.isEOF = function(token) {
    return token[0] === tokenType.EOF;

  };

  Parser.prototype.isStartTag = function(token) {
    return token[0] === tokenType.startTag && [].slice.call(arguments, 1).some(function(type) {
      return token[1] === type;
    });
  };

  Parser.prototype.isEndTag = function(token) {
    return token[0] === tokenType.endTag && [].slice.call(arguments, 1).some(function(type) {
      return token[1] === type;
    });
  };

  Parser.prototype.isDoctypeToken = function(token) {
    return token[0] === tokenType.doctype;
  };

  Parser.prototype.isCharacterToken = function(token) {
    return token[0] === tokenType.character;
  };

  Parser.prototype.isCommentToken = function(token) {
    return token[0] === tokenType.comment;
  };

  Parser.prototype.characterOneOf = function(token) {
    return [].slice.call(arguments, 1).some(function(chr) {
      return token[1].charCodeAt(0) === chr;
    });
  };

  Parser.prototype.isVariable = function(token) {
    return token[0] === tokenType.variable;
  };

  Parser.prototype.invalidCharacter = function(input) {
    if (input[this.tokenizer.position] === undefined || this.tokenizer.position === this.lastPosition) {
      return false;
    }
    var str = this.tokenizer.codePointAt(input, this.tokenizer.position);
    return invalidCharacters(str);
  };

  Parser.prototype.combineCharacterTokens = function(tokens) {
    var newTokens = [],
      chrs = "";
    tokens.forEach(function(token) {
      if (token[0] === tokenType.character) {
        chrs += token[1];
      } else {
        if (chrs.length > 0) {
          newTokens.push([tokenType.character, chrs]);
          chrs = "";
        }
        newTokens.push(token);
      }
    });

    if (chrs.length > 0) {
      newTokens.push([tokenType.character, chrs]);
    }

    return newTokens;
  };

  Parser.prototype.modes = {
    initial: -1,
    before_html: 1,
    before_head: 2,
    in_head: 3,
    in_head_noscript: 4,
    after_head: 5,
    in_body: 6,
    text: 7,
    in_table: 8,
    in_table_text: 9,
    in_caption: 10,
    in_column_group: 11,
    in_table_body: 12,
    in_row: 13,
    in_cell: 14,
    in_select: 15,
    in_select_in_table: 16,
    after_body: 17,
    in_frameset: 18,
    after_frameset: 19,
    after_after_body: 20,
    after_after_frameset: 21,
    in_template: 22
  };

  exports.Parser = Parser;

}(typeof exports === 'object' && exports || this));
