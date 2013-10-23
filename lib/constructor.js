(function(exports) {
  'use strict';

  var common = require("./common.js");
  var namespace = common.namespace;
  var nodeType = common.nodeType;

  function Constructor() {
    this.childNodes = [];
    this.namespaceURI = namespace.HTML;
  }

  Constructor.prototype._insertAt = function(element, index) {
    element.parentNode = this;
    this.childNodes.splice(index, 0, element);
  };

  Constructor.prototype.createComment = function(data) {
    return {
      nodeType: nodeType.COMMENT_NODE,
      data: data
    };
  };

  Constructor.prototype.createElement = function(type) {
    var element = new DummyNode();
    element._tagName = type;
    element.nodeType = nodeType.ELEMENT_NODE;
    element.namespaceURI = namespace.HTML;
    element.ownerDocument = this;
    return element;
  };

  Constructor.prototype.createDocumentType = function(name, publicId, systemId) {
    return {
      nodeType: nodeType.DOCUMENT_TYPE_NODE,
      name: name,
      publicId: publicId,
      systemId: systemId,
      namespaceURI: namespace.HTML
    };
  };

  Constructor.prototype.createTextNode = function(data) {
    return {
      data: data,
      nodeType: nodeType.TEXT_NODE
    };
  };

  Constructor.prototype.appendVariable = function(name) {
    this.childNodes.push(new Variable(name));
  };

  Constructor.prototype._appendChild = function(child) {
    child.parentNode = this;
    this.childNodes.push(child);
  };

  function Variable(name) {
    this.name = name;
    this.nodeType = -1;
  }

  function DummyNode() {
    this.childNodes = [];
    this.attributes = {};
    this.integrationPoint = null;
  }

  DummyNode.prototype.appendVariable = function() {
    this.childNodes.push(new Variable(name));
  };

  DummyNode.prototype._appendChild = function(child) {
    this._checkParent(child);
    child.parentNode = this;
    if (child.nodeType === nodeType.TEXT_NODE) {
      var len = this.childNodes.length;
      if (len && this.childNodes[len - 1].nodeType === nodeType.TEXT_NODE) {
        this.childNodes[len - 1].data += child.data;
      } else {
        this.childNodes.push(this.ownerDocument.createTextNode(child.data));
      }
    } else {
      this.childNodes.push(child);
    }
  };

  DummyNode.prototype._checkParent = function(child) {
    if (child.parentNode) {
      var index = -1;
      if (child.parentNode.childNodes.some(function(refNode) {
        index++;
        return refNode === child;
      })) {
        child.parentNode.childNodes.splice(index, 1);
      }
      child.parentNode = null;
    }
  };

  DummyNode.prototype._insertAt = function(element, index) {
    this._checkParent(element);
    element.parentNode = this;
    this.childNodes.splice(index, 0, element);
  };

  exports.Constructor = Constructor;

}(typeof exports === 'object' && exports || this));
