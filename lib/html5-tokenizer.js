/*
 * html5-tokenizer
 * https://github.com/niklasvh/html5-tokenizer
 *
 * Copyright (c) 2013 Niklas von Hertzen
 * Licensed under the MIT license.
 */

(function(exports) {
    'use strict';

    var characters = {
        NULL: 0x0000,
        EXCLAMATION_MARK: 0x0021,
        AMPERSAND: 0x0026,
        LESSTHAN_SIGN: 0x003C,
        GREATERTHAN_SIGN: 0x003E,
        SOLIDUS: 0x002F,
        QUESTION_MARK: 0x003F,
        EOF: -1,
        TAB: 0x0009,
        LF: 0x000A,
        FF: 0x000C,
        SPACE: 0x0020,
        REPLACEMENT_CHARACTER: 0xFFFD,
        HYPHEN_MINUS: 0x002D,
        QUOTATION_MARK: 0x0022,
        APOSTROPHE: 0x0027,
        EQUALS_SIGN: 0x003D,
        GRAVE_ACCENT: 0x0060
    };

    var states = {
        data: 0,
        RCDATA: 1,
        tag_open: 2,
        character_reference_in_data: 3,
        character_reference_in_RCDATA: 4,
        RCDATA_less_than_sign: 5,
        markup_declaration_open: 6,
        end_tag_open: 7,
        tag_name: 8,
        bogus_comment: 9,
        before_attribute_name: 10,
        self_closing_start_tag: 11,
        plaintext: 12,
        script_data: 13,
        rawtext: 14,
        script_data_lessthan_sign: 15,
        rawtext_lessthan_sign: 16,
        RCDATA_end_tag_open: 17,
        RCDATA_end_tag_name: 18,
        rawtext_end_tag_open: 19,
        rawtext_end_tag_name: 20,
        script_data_end_tag_open: 21,
        script_data_escape_start: 22,
        script_data_end_tag_name: 23,
        script_data_escaped_dash: 24,
        script_data_escape_start_dash: 25,
        script_data_escaped_dash_dash: 26,
        script_data_escaped: 27,
        script_data_escaped_lessthan_sign: 28,
        script_data_escaped_end_tag_open: 29,
        script_data_double_escape_start: 30,
        script_data_escaped_end_tag_name: 31,
        script_data_double_escaped: 32,
        script_data_double_escaped_dash: 33,
        script_data_double_escaped_lessthan_sign: 34,
        script_data_double_escaped_dash_dash: 35,
        script_data_double_escape_end: 36,
        attribute_name: 37,
        after_attribute_name: 38,
        before_attribute_value: 39,
        attribute_value_double_quoted: 40,
        attribute_value_unquoted: 41,
        attribute_value_single_quoted: 42,
        after_attribute_value_quoted: 43,
        character_reference_in_attribute_value: 44,
        comment_start: 45,
        doctype: 46,
        before_doctype_name: 47,
        doctype_name: 48,
        after_doctype_name: 49,
        comment_start_dash: 50,
        comment_end: 51,
        comment: 52,
        comment_end_dash: 53,
        comment_end_bang: 54
    };

    function characterCode(str) {
        return str.charCodeAt(0);
    }

    exports.tokenizer = function(html) {
        var input = html.split("");
        var state = states.data;
        var revertState = null;
        var nextCharacter = null;
        var tagName = null;
        var endTag = null;
        var attributes = null;
        var attrName = null;
        var attrValue = null;
        var tempBuffer = null;
        var position = 0;
        var isEOF = false;
        var forceQuirks = false;
        var doctypeName = null;
        var commentData = null;
        var tokens = [];

        function consumeCharacter(input) {
            console.log(input[position], state);
            return input[position] ? input[position++].charCodeAt(0) : -1;
        }

        function parseError() {
            tokens.push('ParseError');
        }

        function createComment() {
            commentData = "";
        }

        function emitComment() {
            tokens.push(['Comment', commentData]);
        }

        function createDoctype() {
            doctypeName = "";
        }

        function emitDoctype() {
            tokens.push(['DOCTYPE', doctypeName, null, null, !forceQuirks]);
        }

        function createTempBuffer() {
            tempBuffer = "";
        }

        function createStartTagToken() {
            tagName = "";
            endTag = false;
            attributes = {};
        }

        function createEndTagToken() {
            tagName = "";
            endTag = true;
        }

        function createAttribute() {
            attrName = "";
        }

        function addAttribute() {
            attributes[attrName] = attrValue;
        }

        function emitTag() {
            tokens.push([endTag ? 'EndTag' : 'StartTag', tagName, attributes]);
        }

        function emitToken(chr) {

        }

        function emitEOF() {
            isEOF = true;
        }

        function appropriateEndTagToken() {

        }

        function data_state(character) {
            switch(character) {
                case characters.AMPERSAND:
                    state = states.character_reference_in_data;
                    break;
                case characters.LESSTHAN_SIGN:
                    state = states.tag_open;
                    break;
                case characters.NULL:
                    parseError();
                    emitToken(character);
                    break;
                case characters.EOF:
                    emitEOF();
                    break;
                default:
                    emitToken(character);
            }
        }

        function rcdata(character) {
            switch(character) {
                case characters.AMPERSAND:
                    state = states.character_reference_in_RCDATA;
                    break;
                case characters.LESSTHAN_SIGN:
                    state = states.RCDATA_less_than_sign;
                    break;
                case characters.NULL:
                    parseError();
                    emitToken(characters.REPLACEMENT_CHARACTER);
                    break;
                case characters.EOF:
                    emitEOF();
                    break;
                default:
                    emitToken(character);
            }
        }

        function character_reference_in_RCDATA(input) {
            state = states.RCDATA;
            /*
             Attempt to consume a character reference, with no additional allowed character.
             If nothing is returned, emit a U+0026 AMPERSAND character (&) token.
             Otherwise, emit the character tokens that were returned.
             */
        }

        function rawtext(character) {
            switch(character) {
                case characters.LESSTHAN_SIGN:
                    state = states.rawtext_lessthan_sign;
                    break;
                case character.NULL:
                    parseError();
                    emitToken(characters.REPLACEMENT_CHARACTER);
                    break;
                case character.EOF:
                    emitEOF();
                    break;
                default:
                    emitToken(character);
                    break;
            }
        }

        function script_data(character) {
            switch(character) {
                case character.LESSTHAN_SIGN:
                    state = states.script_data_lessthan_sign;
                    break;
                case character.NULL:
                    parseError();
                    emitToken(characters.REPLACEMENT_CHARACTER);
                    break;
                case character.EOF:
                    emitEOF();
                    break;
                default:
                    emitToken(character);
                    break;
            }
        }

        function plaintext(character) {
            switch(character) {
                case characters.NULL:
                    parseError();
                    emitToken(characters.REPLACEMENT_CHARACTER);
                    break;
                case characters.EOF:
                    emitEOF();
                    break;
                default:
                    emitToken(character);
                    break;
            }
        }

        function tag_open(character) {
            switch(character) {
                case characters.EXCLAMATION_MARK:
                    state = states.markup_declaration_open;
                    break;
                case characters.SOLIDUS:
                    state = states.end_tag_open;
                    break;
                case 0x0041:  //[A-Z]
                case 0x0042:case 0x0043:case 0x0044:case 0x0045:case 0x0046:
                case 0x0047:case 0x0048:case 0x0049:case 0x004A:case 0x004B:
                case 0x004C:case 0x004D:case 0x004E:case 0x004F:case 0x0050:
                case 0x0051:case 0x0052:case 0x0053:case 0x0054:case 0x0055:
                case 0x0056:case 0x0057:case 0x0058:case 0x0059:case 0x005A:
                    character += 0x0020;
                    /*falls through*/
                case 0x0061:  //[a-z]
                case 0x0062:case 0x0063:case 0x0064:case 0x0065:case 0x0066:
                case 0x0067:case 0x0068:case 0x0069:case 0x006A:case 0x006B:
                case 0x006C:case 0x006D:case 0x006E:case 0x006F:case 0x0070:
                case 0x0071:case 0x0072:case 0x0073:case 0x0074:case 0x0075:
                case 0x0076:case 0x0077:case 0x0078:case 0x0079:case 0x007A:
                    createStartTagToken();
                    tagName = String.fromCharCode(character);
                    state = states.tag_name;
                break;
                case characters.QUESTION_MARK:
                    parseError();
                    state = states.bogus_comment;
                    break;
                default:
                    parseError();
                    state = states.data;
                    emitToken(characters.LESSTHAN_SIGN);
                    position--;
                    break;
            }
        }

        function end_tag_open(character) {
            switch(character) {
                case 0x0041: // [A-Z]
                case 0x0042:case 0x0043:case 0x0044:case 0x0045:case 0x0046:
                case 0x0047:case 0x0048:case 0x0049:case 0x004A:case 0x004B:
                case 0x004C:case 0x004D:case 0x004E:case 0x004F:case 0x0050:
                case 0x0051:case 0x0052:case 0x0053:case 0x0054:case 0x0055:
                case 0x0056:case 0x0057:case 0x0058:case 0x0059:case 0x005A:
                    character += 0x0020;
                    /*falls through*/
                case 0x0061:  //[a-z]
                case 0x0062:case 0x0063:case 0x0064:case 0x0065:case 0x0066:
                case 0x0067:case 0x0068:case 0x0069:case 0x006A:case 0x006B:
                case 0x006C:case 0x006D:case 0x006E:case 0x006F:case 0x0070:
                case 0x0071:case 0x0072:case 0x0073:case 0x0074:case 0x0075:
                case 0x0076:case 0x0077:case 0x0078:case 0x0079:case 0x007A:
                    createEndTagToken();
                    tagName += String.fromCharCode(character);
                    state = states.tag_name;
                    break;
                case characters.GREATERTHAN_SIGN:
                    parseError();
                    state = states.data;
                    break;
                case characters.EOF:
                    parseError();
                    state = states.data;
                    emitToken(characters.LESSTHAN_SIGN);
                    emitToken(characters.SOLIDUS);
                    position--;
                    break;
                default:
                    parseError();
                    state = states.bogus_comment;
                    break;
            }
        }

        function tag_name(character) {
            switch(character) {
                case characters.TAB:
                case characters.LF:
                case characters.FF:
                case characters.SPACE:
                    state = states.before_attribute_name;
                    break;
                case characters.SOLIDUS:
                    state = states.self_closing_start_tag;
                    break;
                case characters.GREATERTHAN_SIGN:
                    state = states.data;
                    emitTag();
                break;
                case 0x0041: // [A-Z]
                case 0x0042:case 0x0043:case 0x0044:case 0x0045:case 0x0046:
                case 0x0047:case 0x0048:case 0x0049:case 0x004A:case 0x004B:
                case 0x004C:case 0x004D:case 0x004E:case 0x004F:case 0x0050:
                case 0x0051:case 0x0052:case 0x0053:case 0x0054:case 0x0055:
                case 0x0056:case 0x0057:case 0x0058:case 0x0059:case 0x005A:
                    tagName += String.fromCharCode(character + 0x0020);
                    break;
                case characters.NULL:
                    tagName += String.fromCharCode(characters.REPLACEMENT_CHARACTER);
                    break;
                case characters.EOF:
                    parseError();
                    state = states.data;
                    position--;
                    break;
                default:
                    tagName += String.fromCharCode(character);
                    break;
            }
        }

        function rcdata_less_than_sign(character) {
            switch(character) {
                case characters.SOLIDUS:
                    createTempBuffer();
                    state = states.RCDATA_end_tag_open;
                    break;
                default:
                    state = states.RCDATA;
                    emitToken(characters.LESSTHAN_SIGN);
                    position--;
                    break;
            }
        }

        function end_tag_open_general(character, endTagName, defaultState) {
            var tmp = character;
            switch(character) {
                case 0x0041: //[A-Z]
                case 0x0042:case 0x0043:case 0x0044:case 0x0045:case 0x0046:
                case 0x0047:case 0x0048:case 0x0049:case 0x004A:case 0x004B:
                case 0x004C:case 0x004D:case 0x004E:case 0x004F:case 0x0050:
                case 0x0051:case 0x0052:case 0x0053:case 0x0054:case 0x0055:
                case 0x0056:case 0x0057:case 0x0058:case 0x0059:case 0x005A:
                tmp += 0x0020;
                /*falls through*/
                case 0x0061: //[a-z]
                case 0x0062:case 0x0063:case 0x0064:case 0x0065:case 0x0066:
                case 0x0067:case 0x0068:case 0x0069:case 0x006A:case 0x006B:
                case 0x006C:case 0x006D:case 0x006E:case 0x006F:case 0x0070:
                case 0x0071:case 0x0072:case 0x0073:case 0x0074:case 0x0075:
                case 0x0076:case 0x0077:case 0x0078:case 0x0079:case 0x007A:
                createEndTagToken();
                tagName = String.fromCharCode(tmp);
                tempBuffer += String.fromCharCode(character);
                state = endTagName;
                break;
                default:
                    state = defaultState;
                    emitToken(characters.LESSTHAN_SIGN);
                    emitToken(characters.SOLIDUS);
                    position--;
                    break;
            }
        }

        function rcdata_end_tag_open(character) {
            end_tag_open_general(character, states.RCDATA_end_tag_name, states.RCDATA);
        }

        function end_tag_name(character, defaultState) {
            switch(character) {
                case characters.TAB:
                case characters.LF:
                case characters.FF:
                case characters.SPACE:
                    if (appropriateEndTagToken()) {
                        state = states.before_attribute_name;
                        return;
                    }
                    break;
                case characters.SOLIDUS:
                    if (appropriateEndTagToken()) {
                        state = states.self_closing_start_tag;
                        return;
                    }
                    break;
                case characters.GREATERTHAN_SIGN:
                    if (appropriateEndTagToken()) {
                        state = states.data;
                        emitTag();
                        return;
                    }
                    break;
                case 0x0041: //[A-Z]
                case 0x0042:case 0x0043:case 0x0044:case 0x0045:case 0x0046:
                case 0x0047:case 0x0048:case 0x0049:case 0x004A:case 0x004B:
                case 0x004C:case 0x004D:case 0x004E:case 0x004F:case 0x0050:
                case 0x0051:case 0x0052:case 0x0053:case 0x0054:case 0x0055:
                case 0x0056:case 0x0057:case 0x0058:case 0x0059:case 0x005A:
                tagName += String.fromCharCode(character + 0x0020);
                tempBuffer += String.fromCharCode(character);
                return;
                case 0x0061: //[a-z]
                case 0x0062:case 0x0063:case 0x0064:case 0x0065:case 0x0066:
                case 0x0067:case 0x0068:case 0x0069:case 0x006A:case 0x006B:
                case 0x006C:case 0x006D:case 0x006E:case 0x006F:case 0x0070:
                case 0x0071:case 0x0072:case 0x0073:case 0x0074:case 0x0075:
                case 0x0076:case 0x0077:case 0x0078:case 0x0079:case 0x007A:
                tagName += String.fromCharCode(character);
                tempBuffer += String.fromCharCode(character);
                return;
            }

            state = defaultState;
            emitToken(characters.LESSTHAN_SIGN);
            emitToken(characters.SOLIDUS);
            tempBuffer.split("").map(characterCode).forEach(emitToken);
            position--;
        }

        function rcdata_end_tag_name(character) {
            end_tag_name(character, states.RCDATA);
        }

        function rawtext_less_than_sign(character) {
            switch(character) {
                case characters.SOLIDUS:
                    tempBuffer = "";
                    state = states.rawtext_end_tag_open;
                    break;
                default:
                    state = states.rawtext;
                    emitToken(characters.LESSTHAN_SIGN);
                    position--;
                    break;
            }
        }

        function rawtext_end_tag_open(character) {
            end_tag_open_general(character, states.rawtext_end_tag_name, states.rawtext);
        }

        function rawtext_end_tag_name(character) {
            end_tag_name(character, states.rawtext);
        }

        function script_data_lessthan_sign(character) {
            switch(character) {
                case characters.SOLIDUS:
                    tempBuffer = "";
                    state = states.script_data_end_tag_open;
                    break;
                case characters.EXCLAMATION_MARK:
                    state = states.script_data_escape_start;
                    emitToken(characters.LESSTHAN_SIGN);
                    emitToken(characters.EXCLAMATION_MARK);
                    break;
                default:
                    state = states.script_data;
                    emitToken(characters.LESSTHAN_SIGN);
                    position--;
                    break;
            }
        }

        function script_data_end_tag_open(character) {
            end_tag_open_general(character, states.script_data_end_tag_name, states.script_data);
        }

        function script_data_end_tag_name(character) {
            end_tag_name(character, states.script_data);
        }

        function script_data_escape_start(character) {
            switch(character) {
                case characters.HYPHEN_MINUS:
                    state = states.script_data_escape_start_dash;
                    emitToken(characters.HYPHEN_MINUS);
                    break;
                default:
                    state = states.script_data;
                    position--;
                    break;
            }
        }

        function script_data_escape_start_dash(character) {
            switch(character) {
                case characters.HYPHEN_MINUS:
                    state = states.script_data_escaped_dash_dash;
                    emitToken(characters.HYPHEN_MINUS);
                    break;
                default:
                    state = states.script_data;
                    position--;
                    break;
            }
        }

        function script_data_escaped(character) {
            switch(character) {
                case characters.HYPHEN_MINUS:
                    state = states.script_data_escaped_dash_dash;
                    emitToken(characters.HYPHEN_MINUS);
                    break;
                case characters.LESSTHAN_SIGN:
                    state = states.script_data_escaped_lessthan_sign;
                    break;
                case characters.NULL:
                    parseError();
                    emitToken(characters.REPLACEMENT_CHARACTER);
                    break;
                case characters.EOF:
                    state = states.data;
                    parseError();
                    position--;
                    break;
                default:
                    emitToken(character);
                    break;
            }
        }

        function script_data_escaped_dash(character) {
            switch(character) {
                case characters.HYPHEN_MINUS:
                    state = states.script_data_escaped_dash_dash;
                    emitToken(characters.HYPHEN_MINUS);
                    break;
                case characters.LESSTHAN_SIGN:
                    state = states.script_data_escaped_lessthan_sign;
                    break;
                case characters.NULL:
                    parseError();
                    state = states.script_data_escaped;
                    emitToken(characters.REPLACEMENT_CHARACTER);
                    break;
                case characters.EOF:
                    parseError();
                    state = states.data;
                    position--;
                    break;
                default:
                    state = states.script_data_escaped;
                    emitToken(character);
                    break;
            }
        }

        function script_data_escaped_lessthan_sign(character) {
            var tmp = character;
            switch(character) {
                case characters.SOLIDUS:
                    tempBuffer = "";
                    state = states.script_data_escaped_end_tag_open;
                    break;
                case 0x0041: //[A-Z]
                case 0x0042:case 0x0043:case 0x0044:case 0x0045:case 0x0046:
                case 0x0047:case 0x0048:case 0x0049:case 0x004A:case 0x004B:
                case 0x004C:case 0x004D:case 0x004E:case 0x004F:case 0x0050:
                case 0x0051:case 0x0052:case 0x0053:case 0x0054:case 0x0055:
                case 0x0056:case 0x0057:case 0x0058:case 0x0059:case 0x005A:
                    tmp += 0x0020;
                    /* falls through */
                case 0x0061: //[a-z]
                case 0x0062:case 0x0063:case 0x0064:case 0x0065:case 0x0066:
                case 0x0067:case 0x0068:case 0x0069:case 0x006A:case 0x006B:
                case 0x006C:case 0x006D:case 0x006E:case 0x006F:case 0x0070:
                case 0x0071:case 0x0072:case 0x0073:case 0x0074:case 0x0075:
                case 0x0076:case 0x0077:case 0x0078:case 0x0079:case 0x007A:
                    tempBuffer = String.fromCharCode(tmp);
                    state = states.script_data_double_escape_start;
                    emitToken(characters.LESSTHAN_SIGN);
                    emitToken(character);
                    break;
                default:
                    state = states.script_data_escaped;
                    emitToken(characters.LESSTHAN_SIGN);
                    position--;
                    break;
            }
        }

        function script_data_escaped_end_tag_open(character) {
            var tmp = character;
            switch(character) {
                case 0x0041: //[A-Z]
                case 0x0042:case 0x0043:case 0x0044:case 0x0045:case 0x0046:
                case 0x0047:case 0x0048:case 0x0049:case 0x004A:case 0x004B:
                case 0x004C:case 0x004D:case 0x004E:case 0x004F:case 0x0050:
                case 0x0051:case 0x0052:case 0x0053:case 0x0054:case 0x0055:
                case 0x0056:case 0x0057:case 0x0058:case 0x0059:case 0x005A:
                    tmp += 0x0020;
                    /* falls through */
                case 0x0061: //[a-z]
                case 0x0062:case 0x0063:case 0x0064:case 0x0065:case 0x0066:
                case 0x0067:case 0x0068:case 0x0069:case 0x006A:case 0x006B:
                case 0x006C:case 0x006D:case 0x006E:case 0x006F:case 0x0070:
                case 0x0071:case 0x0072:case 0x0073:case 0x0074:case 0x0075:
                case 0x0076:case 0x0077:case 0x0078:case 0x0079:case 0x007A:
                    createEndTagToken();
                    tagName = String.fromCharCode(tmp);
                    tempBuffer += String.fromCharCode(character);
                    state = states.script_data_escaped_end_tag_name;
                    break;
                default:
                    state = states.script_data_escaped;
                    emitToken(characters.LESSTHAN_SIGN);
                    emitToken(characters.SOLIDUS);
                    position--;
                    break;
            }
        }

        function script_data_escaped_end_tag_name(character) {
            end_tag_name(character, states.script_data_escaped);
        }

        function script_data_double_escape_start(character) {
            var tmp = character;
            switch(character) {
                case characters.TAB:
                case characters.LF:
                case characters.FF:
                case characters.SPACE:
                case characters.SOLIDUS:
                case characters.GREATERTHAN_SIGN:
                    state = (tempBuffer === "script") ? states.script_data_double_escaped : states.script_data_escaped;
                    emitToken(character);
                    break;
                case 0x0041: //[A-Z]
                case 0x0042:case 0x0043:case 0x0044:case 0x0045:case 0x0046:
                case 0x0047:case 0x0048:case 0x0049:case 0x004A:case 0x004B:
                case 0x004C:case 0x004D:case 0x004E:case 0x004F:case 0x0050:
                case 0x0051:case 0x0052:case 0x0053:case 0x0054:case 0x0055:
                case 0x0056:case 0x0057:case 0x0058:case 0x0059:case 0x005A:
                    tmp += 0x0020;
                    /* falls through */
                case 0x0061: //[a-z]
                case 0x0062:case 0x0063:case 0x0064:case 0x0065:case 0x0066:
                case 0x0067:case 0x0068:case 0x0069:case 0x006A:case 0x006B:
                case 0x006C:case 0x006D:case 0x006E:case 0x006F:case 0x0070:
                case 0x0071:case 0x0072:case 0x0073:case 0x0074:case 0x0075:
                case 0x0076:case 0x0077:case 0x0078:case 0x0079:case 0x007A:
                    tempBuffer +=  String.fromCharCode(tmp);
                    emitToken(character);
                    break;
                default:
                    state = state.script_data_escaped;
                    position--;
                    break;
            }
        }

        function script_data_double_escaped(character) {
            switch(character) {
                case characters.HYPHEN_MINUS:
                    state = states.script_data_double_escaped_dash;
                    emitToken(characters.HYPHEN_MINUS);
                    break;
                case characters.LESSTHAN_SIGN:
                    state = states.script_data_double_escaped_lessthan_sign;
                    emitToken(characters.LESSTHAN_SIGN);
                    break;
                case characters.NULL:
                    parseError();
                    emitToken(characters.REPLACEMENT_CHARACTER);
                    break;
                case characters.EOF:
                    parseError();
                    state = states.data;
                    position--;
                    break;
                default:
                    emitToken(character);
                    break;
            }
        }

        function script_data_double_escaped_dash(character) {
            switch(character) {
                case characters.HYPHEN_MINUS:
                    state = states.script_data_double_escaped_dash_dash;
                    emitToken(characters.HYPHEN_MINUS);
                    break;
                case characters.LESSTHAN_SIGN:
                    state = states.script_data_double_escaped_lessthan_sign;
                    emitToken(characters.LESSTHAN_SIGN);
                    break;
                case characters.NULL:
                    parseError();
                    state = states.script_data_double_escaped;
                    emitToken(characters.REPLACEMENT_CHARACTER);
                    break;
                case characters.EOF:
                    parseError();
                    state = states.data;
                    position--;
                    break;
                default:
                    state = states.script_data_double_escaped;
                    emitToken(character);
                    break;
            }
        }

        function script_data_double_escaped_dash_dash(character) {
            switch(character) {
                case characters.HYPHEN_MINUS:
                    emitToken(characters.HYPHEN_MINUS);
                    break;
                case characters.LESSTHAN_SIGN:
                    state = states.script_data_double_escaped_lessthan_sign;
                    emitToken(characters.LESSTHAN_SIGN);
                    break;
                case characters.GREATERTHAN_SIGN:
                    state = states.script_data;
                    emitToken(characters.GREATERTHAN_SIGN);
                    break;
                case characters.NULL:
                    parseError();
                    state = states.script_data_double_escaped;
                    emitToken(characters.REPLACEMENT_CHARACTER);
                    break;
                case characters.EOF:
                    parseError();
                    state = states.data;
                    position--;
                    break;
                default:
                    state = states.script_data_double_escaped;
                    emitToken(character);
                    break;
            }
        }

        function script_data_double_escaped_lessthan_sign(character) {
            switch(character) {
                case characters.SOLIDUS:
                    tempBuffer = "";
                    state = states.script_data_double_escape_end;
                    emitToken(characters.SOLIDUS);
                    break;
                default:
                    state = states.script_data_escaped;
                    position--;
                    break;
            }
        }

        function script_data_double_escape_end(character) {
            var tmp = character;
            switch(character) {
                case characters.TAB:
                case characters.LF:
                case characters.FF:
                case characters.SPACE:
                case characters.SOLIDUS:
                case character.GREATERTHAN_SIGN:
                    state = (tempBuffer === "script") ? states.script_data_escaped : states.script_data_double_escaped;
                    emitToken(character);
                    break;
                case 0x0041: //[A-Z]
                case 0x0042:case 0x0043:case 0x0044:case 0x0045:case 0x0046:
                case 0x0047:case 0x0048:case 0x0049:case 0x004A:case 0x004B:
                case 0x004C:case 0x004D:case 0x004E:case 0x004F:case 0x0050:
                case 0x0051:case 0x0052:case 0x0053:case 0x0054:case 0x0055:
                case 0x0056:case 0x0057:case 0x0058:case 0x0059:case 0x005A:
                    tmp += 0x0020;
                    /* falls through */
                case 0x0061: //[a-z]
                case 0x0062:case 0x0063:case 0x0064:case 0x0065:case 0x0066:
                case 0x0067:case 0x0068:case 0x0069:case 0x006A:case 0x006B:
                case 0x006C:case 0x006D:case 0x006E:case 0x006F:case 0x0070:
                case 0x0071:case 0x0072:case 0x0073:case 0x0074:case 0x0075:
                case 0x0076:case 0x0077:case 0x0078:case 0x0079:case 0x007A:
                    tempBuffer +=  String.fromCharCode(tmp);
                    emitToken(character);
                break;
                default:
                    state = state.script_data_double_escaped;
                    position--;
                    break;
            }
        }

        function before_attribute_name(character) {
            switch(character) {
                case characters.TAB:
                case characters.LF:
                case characters.FF:
                case characters.SPACE:
                    break;
                case characters.SOLIDUS:
                    state = states.self_closing_start_tag;
                    break;
                case characters.GREATERTHAN_SIGN:
                    state = states.data;
                    emitToken(character);
                    break;
                case 0x0041: //[A-Z]
                case 0x0042:case 0x0043:case 0x0044:case 0x0045:case 0x0046:
                case 0x0047:case 0x0048:case 0x0049:case 0x004A:case 0x004B:
                case 0x004C:case 0x004D:case 0x004E:case 0x004F:case 0x0050:
                case 0x0051:case 0x0052:case 0x0053:case 0x0054:case 0x0055:
                case 0x0056:case 0x0057:case 0x0058:case 0x0059:case 0x005A:
                    createAttribute();
                    attrName = String.fromCharCode(character + 0x0020);
                    attrValue = "";
                    state = states.attribute_name;
                break;
                case characters.NULL:
                    parseError();
                    createAttribute();
                    attrName = String.fromCharCode(characters.REPLACEMENT_CHARACTER);
                    attrValue = "";
                    state = states.attribute_name;
                    break;
                case characters.EOF:
                    parseError();
                    state = states.data;
                    position--;
                    break;
                case characters.QUOTATION_MARK:
                case characters.APOSTROPHE:
                case characters.LESSTHAN_SIGN:
                case characters.EQUALS_SIGN:
                    parseError();
                    /* falls through */
                default:
                    createAttribute();
                    attrName = String.fromCharCode(character);
                    attrValue = "";
                    state = states.attribute_name;
                    break;

            }

        }

        function attribute_name(character) {
            switch(character) {
                case characters.TAB:
                case characters.LF:
                case characters.FF:
                case characters.SPACE:
                    state = states.after_attribute_name;
                    break;
                case characters.SOLIDUS:
                    addAttribute();
                    state = states.self_closing_start_tag;
                    break;
                case characters.EQUALS_SIGN:
                    state = states.before_attribute_value;
                    break;
                case characters.GREATERTHAN_SIGN:
                    addAttribute();
                    state = states.data;
                    emitTag();
                    break;
                case 0x0041: //[A-Z]
                case 0x0042:case 0x0043:case 0x0044:case 0x0045:case 0x0046:
                case 0x0047:case 0x0048:case 0x0049:case 0x004A:case 0x004B:
                case 0x004C:case 0x004D:case 0x004E:case 0x004F:case 0x0050:
                case 0x0051:case 0x0052:case 0x0053:case 0x0054:case 0x0055:
                case 0x0056:case 0x0057:case 0x0058:case 0x0059:case 0x005A:
                    attrName += String.fromCharCode(character + 0x0020);
                    break;
                case characters.NULL:
                    parseError();
                    attrName += String.fromCharCode(characters.REPLACEMENT_CHARACTER);
                    break;
                case characters.EOF:
                    parseError();
                    state = states.data;
                    position--;
                    break;
                case characters.QUOTATION_MARK:
                case characters.APOSTROPHE:
                case characters.LESSTHAN_SIGN:
                    parseError();
                    /* falls through */
                default:
                    attrName += String.fromCharCode(character);
                    break;
            }
        }

        function after_attribute_name(character) {
            switch(character) {
                case characters.TAB:
                case characters.LF:
                case characters.FF:
                case characters.SPACE:
                    break;
                case characters.SOLIDUS:
                    addAttribute();
                    state = states.self_closing_start_tag;
                    break;
                case characters.EQUALS_SIGN:
                    state = states.before_attribute_value;
                    break;
                case characters.GREATERTHAN_SIGN:
                    addAttribute();
                    state = states.data;
                    emitTag();
                    break;
                case 0x0041: //[A-Z]
                case 0x0042:case 0x0043:case 0x0044:case 0x0045:case 0x0046:
                case 0x0047:case 0x0048:case 0x0049:case 0x004A:case 0x004B:
                case 0x004C:case 0x004D:case 0x004E:case 0x004F:case 0x0050:
                case 0x0051:case 0x0052:case 0x0053:case 0x0054:case 0x0055:
                case 0x0056:case 0x0057:case 0x0058:case 0x0059:case 0x005A:
                    addAttribute();
                    createAttribute();
                    attrName = String.fromCharCode(character + 0x0020);
                    attrValue = "";
                    state = states.attribute_name;
                    break;
                case characters.NULL:
                    parseError();
                    createAttribute();
                    attrName = String.fromCharCode(characters.REPLACEMENT_CHARACTER);
                    attrValue = "";
                    state = states.attribute_name;
                    break;
                case characters.EOF:
                    parseError();
                    state = states.data;
                    position--;
                    break;
                case characters.QUOTATION_MARK:
                case characters.APOSTROPHE:
                case characters.LESSTHAN_SIGN:
                    parseError();
                /* falls through */
                default:
                    createAttribute();
                    attrName = String.fromCharCode(character);
                    attrValue = "";
                    state = states.attribute_name;
                    break;
            }
        }

        function before_attribute_value(character) {
            switch(character) {
                case characters.TAB:
                case characters.LF:
                case characters.FF:
                case characters.SPACE:
                    break;
                case characters.QUOTATION_MARK:
                    state = states.attribute_value_double_quoted;
                    break;
                case characters.AMPERSAND:
                    state = states.attribute_value_unquoted;
                    position--;
                    break;
                case characters.APOSTROPHE:
                    state = states.attribute_value_single_quoted;
                    break;
                case characters.NULL:
                    parseError();
                    attrValue +=  String.fromCharCode(characters.REPLACEMENT_CHARACTER);
                    state = states.attribute_value_unquoted;
                    break;
                case characters.GREATERTHAN_SIGN:
                    parseError();
                    state = states.data;
                    emitTag();
                    break;
                case characters.EOF:
                    parseError();
                    state = states.data;
                    position--;
                    break;
                case characters.LESSTHAN_SIGN:
                case characters.EQUALS_SIGN:
                case characters.GRAVE_ACCENT:
                    parseError();
                    /* falls through */
                default:
                    attrValue += String.fromCharCode(character);
                    state = states.attribute_value_unquoted;
                    break;
            }
        }

        function attribute_value_double_quoted(character) {
            switch(character) {
                case characters.QUOTATION_MARK:
                    addAttribute();
                    state = states.after_attribute_value_quoted;
                    break;
                case characters.AMPERSAND:
                    revertState = state;
                    state = states.character_reference_in_attribute_value;
                    // with the additional allowed character being U+0022 QUOTATION MARK (").
                    break;
                case characters.NULL:
                    parseError();
                    attrValue += String.fromCharCode(characters.REPLACEMENT_CHARACTER);
                    break;
                case characters.EOF:
                    parseError();
                    state = states.data;
                    position--;
                    break;
                default:
                    attrValue += String.fromCharCode(character);
                    break;
            }
        }

        function attribute_value_single_quoted(character) {
            switch(character) {
                case characters.APOSTROPHE:
                    addAttribute();
                    state = states.after_attribute_value_quoted;
                    break;
                case characters.AMPERSAND:
                    revertState = state;
                    state = states.character_reference_in_attribute_value;
                    // with the additional allowed character being U+0027 APOSTROPHE (').
                    break;
                case characters.NULL:
                    parseError();
                    attrValue += String.fromCharCode(characters.REPLACEMENT_CHARACTER);
                    break;
                case characters.EOF:
                    parseError();
                    state = states.data;
                    position--;
                    break;
                default:
                    attrValue += String.fromCharCode(character);
                    break;
            }
        }

        function attribute_value_unquoted(character) {
            switch(character) {
                case characters.TAB:
                case characters.LF:
                case characters.FF:
                case characters.SPACE:
                    addAttribute();
                    state = states.before_attribute_name;
                    break;
                case characters.AMPERSAND:
                    revertState = state;
                    state = states.character_reference_in_attribute_value;
                    // with the additional allowed character being U+003E GREATER-THAN SIGN (>).
                    break;
                case characters.GREATERTHAN_SIGN:
                    addAttribute();
                    state = states.data;
                    emitTag();
                    break;
                case characters.NULL:
                    parseError();
                    attrValue += String.fromCharCode(characters.REPLACEMENT_CHARACTER);
                    break;
                case characters.EOF:
                    parseError();
                    state = states.data;
                    position--;
                    break;
                case characters.QUOTATION_MARK:
                case characters.APOSTROPHE:
                case characters.LESSTHAN_SIGN:
                case characters.EQUALS_SIGN:
                case characters.GRAVE_ACCENT:
                    parseError();
                    /* falls through */
                default:
                    attrValue += String.fromCharCode(character);
                    break;
            }
        }

        function character_reference_in_attribute_value(input) {
            /*
             Attempt to consume a character reference.
             If nothing is returned, append a U+0026 AMPERSAND character (&) to the current attribute's value.
             Otherwise, append the returned character tokens to the current attribute's value.
             */
            state = revertState;
        }

        function after_attribute_value_quoted(character) {
            switch(character) {
                case characters.TAB:
                case characters.LF:
                case characters.FF:
                case characters.SPACE:
                    addAttribute();
                    state = states.before_attribute_name;
                    break;
                case characters.SOLIDUS:
                    state = states.self_closing_start_tag;
                    break;
                case characters.GREATERTHAN_SIGN:
                    state = states.data;
                    emitTag();
                    break;
                case characters.EOF:
                    parseError();
                    state = states.data;
                    position--;
                    break;
                default:
                    parseError();
                    state = states.before_attribute_name;
                    position--;
                    break;
            }
        }

        function self_closing_start_tag(character) {
            switch(character) {
                case characters.GREATERTHAN_SIGN:
                    // Set the self-closing flag of the current tag token
                    state = states.data;
                    emitTag();
                    break;
                case characters.EOF:
                    parseError();
                    state = states.data;
                    position--;
                    break;
                default:
                    parseError();
                    state = states.before_attribute_name;
                    position--;
                    break;
            }
        }

        function bogus_comment(input) {
            var consumed = null;
            commentData = "";
            while((consumed = consumeCharacter(input)) !== characters.GREATERTHAN_SIGN && consumed !== characters.EOF) {
                if (consumed === characters.NULL) {
                    consumed = characters.REPLACEMENT_CHARACTER;
                }
                commentData += String.fromCharCode(consumed);
            }
            emitComment();

            /*
             Consume every character up to and including the first U+003E GREATER-THAN SIGN character (>) or the end of the file (EOF),
             whichever comes first. Emit a comment token whose data is the concatenation of all the characters starting from and including
             the character that caused the state machine to switch into the bogus comment state, up to and including the character
             immediately before the last consumed character (i.e. up to the character just before the U+003E or EOF character), but
             with any U+0000 NULL characters replaced by U+FFFD REPLACEMENT CHARACTER characters. (If the comment was started by the
             end of the file (EOF), the token is empty. Similarly, the token is empty if it was generated by the string "<!>".)
             */
            state = states.data;
        }

        function markup_declaration_open(input) {
            if (input[position] === "-" && input[position+1] ===  "-") {
                position+=2;
                createComment();
                state = states.comment_start;
            } else if (input.slice(position, position+7).join("").toUpperCase() === "DOCTYPE") {
                position+=7;
                state = states.doctype;
            } else if (false) {
                /*
                 Otherwise, if there is a current node and it is not an element in the HTML namespace and the next seven
                 characters are a case-sensitive match for the string "[CDATA[" (the five uppercase letters "CDATA" with a U+005B LEFT SQUARE BRACKET
                 character before and after), then consume those characters and switch to the CDATA section state.

                 */      console.log('s');

            } else {
                parseError();
                state = states.bogus_comment;
            }
        }

        function comment_start(character) {
            switch(character) {
                case characters.HYPHEN_MINUS:
                    state = states.comment_start_dash;
                    break;
                case characters.NULL:
                    parseError();
                    commentData += String.fromCharCode(characters.REPLACEMENT_CHARACTER);
                    state = states.comment;
                    break;
                case characters.GREATERTHAN_SIGN:
                    parseError();
                    state = states.data;
                    emitComment();
                    break;
                case characters.EOF:
                    parseError();
                    state = states.data;
                    emitComment();
                    position--;
                    break;
                default:
                    commentData += String.fromCharCode(characters.HYPHEN_MINUS, character);
                    state = states.comment;
                    break;
            }
        }

        function comment_start_dash(character) {
            switch(character) {
                case characters.HYPHEN_MINUS:
                    state = states.comment_end;
                    break;
                case characters.NULL:
                    parseError();
                    commentData += String.fromCharCode(characters.HYPHEN_MINUS, characters.REPLACEMENT_CHARACTER);
                    state = states.comment;
                    break;
                case characters.GREATERTHAN_SIGN:
                    parseError();
                    state = states.data;
                    emitComment();
                    break;
                case characters.EOF:
                    parseError();
                    state = states.data;
                    emitComment();
                    position--;
                    break;
                default:
                    commentData += String.fromCharCode(characters.HYPHEN_MINUS, character);
                    state = states.comment;
                    break;
            }
        }

        function comment(character) {
            switch(character) {
                case characters.HYPHEN_MINUS:
                    state = states.comment_end_dash;
                    break;
                case characters.NULL:
                    parseError();
                    commentData += String.fromCharCode(characters.REPLACEMENT_CHARACTER);
                    break;
                case characters.EOF:
                    parseError();
                    state = states.data;
                    emitComment();
                    position--;
                    break;
                default:
                    commentData += String.fromCharCode(character);
                    break;
            }
        }

        function comment_end_dash(character) {
            switch(character) {
                case characters.GREATERTHAN_SIGN:
                    state = states.data;
                    emitComment();
                    break;
                case characters.NULL:
                    parseError();
                    commentData += String.fromCharCode(characters.HYPHEN_MINUS, characters.HYPHEN_MINUS, characters.REPLACEMENT_CHARACTER);
                    state = states.comment;
                    break;
                case characters.EXCLAMATION_MARK:
                    parseError();
                    state = states.comment_end_bang;
                    break;
                case characters.HYPHEN_MINUS:
                    parseError();
                    commentData += String.fromCharCode(characters.HYPHEN_MINUS);
                    break;
                case characters.EOF:
                    parseError();
                    state = states.data;
                    emitComment();
                    position--;
                    break;
                default:
                    parseError();
                    commentData += String.fromCharCode(characters.HYPHEN_MINUS, characters.HYPHEN_MINUS, character);
                    state = states.comment;
                    break;
            }
        }

        function comment_end(character) {
            switch(character) {
                case characters.GREATERTHAN_SIGN:
                    state = states.data;
                    emitComment();
                    break;
                case characters.NULL:
                    parseError();
                    commentData += String.fromCharCode(characters.HYPHEN_MINUS, characters.HYPHEN_MINUS, characters.REPLACEMENT_CHARACTER);
                    state = states.comment;
                    break;
                case characters.EXCLAMATION_MARK:
                    parseError();
                    state = states.comment_end_bang;
                    break;
                case characters.HYPHEN_MINUS:
                    parseError();
                    commentData += String.fromCharCode(characters.HYPHEN_MINUS);
                    break;
                case characters.EOF:
                    parseError();
                    state = states.data;
                    emitComment();
                    position--;
                    break;
                default:
                    parseError();
                    commentData += String.fromCharCode(characters.HYPHEN_MINUS, characters.HYPHEN_MINUS, character);
                    state = states.comment;
                    break;
            }
        }

        function doctype(character) {
            switch(character) {
                case characters.TAB:
                case characters.LF:
                case characters.FF:
                case characters.SPACE:
                    state = states.before_doctype_name;
                    break;
                case characters.EOF:
                    parseError();
                    state = states.data;
                    createDoctype();
                    forceQuirks = true;
                    emitDoctype();
                    position--;
                    break;
                default:
                    parseError();
                    state = states.before_doctype_name;
                    position--;
                    break;
            }
        }

        function before_doctype_name(character) {
            switch(character) {
                case characters.TAB:
                case characters.LF:
                case characters.FF:
                case characters.SPACE:
                    break;
                case 0x0041: //[A-Z]
                case 0x0042:case 0x0043:case 0x0044:case 0x0045:case 0x0046:
                case 0x0047:case 0x0048:case 0x0049:case 0x004A:case 0x004B:
                case 0x004C:case 0x004D:case 0x004E:case 0x004F:case 0x0050:
                case 0x0051:case 0x0052:case 0x0053:case 0x0054:case 0x0055:
                case 0x0056:case 0x0057:case 0x0058:case 0x0059:case 0x005A:
                    createDoctype();
                    doctypeName = String.fromCharCode(character + 0x0020);
                    state = states.doctype_name;
                    break;
                case characters.NULL:
                    parseError();
                    createDoctype();
                    doctypeName = String.fromCharCode(characters.REPLACEMENT_CHARACTER);
                    state = states.doctype_name;
                    break;
                case characters.GREATERTHAN_SIGN:
                    parseError();
                    createDoctype();
                    forceQuirks = true;
                    state = states.data;
                    emitDoctype();
                    break;
                case characters.EOF:
                    parseError();
                    state = states.data;
                    createDoctype();
                    forceQuirks = true;
                    emitDoctype();
                    position--;
                    break;
                default:
                    createDoctype();
                    doctypeName = String.fromCharCode(character);
                    state = states.doctype_name;
                    break;
            }
        }

        function doctype_name(character) {
            switch(character) {
                case characters.TAB:
                case characters.LF:
                case characters.FF:
                case characters.SPACE:
                    state = states.after_doctype_name;
                    break;
                case characters.GREATERTHAN_SIGN:
                    state = states.data;
                    emitDoctype();
                    break;
                case 0x0041: //[A-Z]
                case 0x0042:case 0x0043:case 0x0044:case 0x0045:case 0x0046:
                case 0x0047:case 0x0048:case 0x0049:case 0x004A:case 0x004B:
                case 0x004C:case 0x004D:case 0x004E:case 0x004F:case 0x0050:
                case 0x0051:case 0x0052:case 0x0053:case 0x0054:case 0x0055:
                case 0x0056:case 0x0057:case 0x0058:case 0x0059:case 0x005A:
                    doctypeName += String.fromCharCode(character + 0x0020);
                    break;
                case characters.NULL:
                    parseError();
                    doctypeName += String.fromCharCode(characters.REPLACEMENT_CHARACTER);
                    break;
                case characters.EOF:
                    parseError();
                    state =  states.data;
                    forceQuirks = true;
                    emitDoctype();
                    position--;
                    break;
                default:
                    doctypeName += String.fromCharCode(character);
                    break;
            }
        }

        while(!isEOF) {
            switch(state) {
                case states.data:
                    data_state(consumeCharacter(input));
                    break;
                case states.character_reference_in_data:
                    state = states.data;
                    /*
                     Attempt to consume a character reference, with no additional allowed character.
                     If nothing is returned, emit a U+0026 AMPERSAND character (&) token.
                     Otherwise, emit the character tokens that were returned.
                     */
                    break;
                case states.RCDATA:
                    rcdata(consumeCharacter(input));
                    break;
                case states.character_reference_in_RCDATA:
                    character_reference_in_RCDATA(input);
                    break;
                case states.rawtext:
                    rawtext(consumeCharacter(input));
                    break;
                case states.script_data:
                    script_data(consumeCharacter(input));
                    break;
                case states.plaintext:
                    plaintext(consumeCharacter(input));
                    break;
                case states.tag_open:
                    tag_open(consumeCharacter(input));
                    break;
                case states.end_tag_open:
                    end_tag_open(consumeCharacter(input));
                    break;
                case states.tag_name:
                    tag_name(consumeCharacter(input));
                    break;
                case states.RCDATA_less_than_sign:
                    rcdata_less_than_sign(consumeCharacter(input));
                    break;
                case states.RCDATA_end_tag_open:
                    rcdata_end_tag_open(consumeCharacter(input));
                    break;
                case states.RCDATA_end_tag_name:
                    rcdata_end_tag_name(consumeCharacter(input));
                    break;
                case states.rawtext_lessthan_sign:
                    rawtext_less_than_sign(consumeCharacter(input));
                    break;
                case states.rawtext_end_tag_open:
                    rawtext_end_tag_open(consumeCharacter(input));
                    break;
                case states.rawtext_end_tag_name:
                    rawtext_end_tag_name(consumeCharacter(input));
                    break;
                case states.script_data_lessthan_sign:
                    script_data_lessthan_sign(consumeCharacter(input));
                    break;
                case states.script_data_end_tag_open:
                    script_data_end_tag_open(consumeCharacter(input));
                    break;
                case states.script_data_end_tag_name:
                    script_data_end_tag_name(consumeCharacter(input));
                    break;
                case states.script_data_escape_start:
                    script_data_escape_start(consumeCharacter(input));
                    break;
                case states.script_data_escape_start_dash:
                    script_data_escape_start_dash(consumeCharacter(input));
                    break;
                case states.script_data_escaped:
                    script_data_escaped(consumeCharacter(input));
                    break;
                case states.script_data_escaped_dash:
                    script_data_escaped_dash(consumeCharacter(input));
                    break;
                case states.script_data_escaped_lessthan_sign:
                    script_data_escaped_lessthan_sign(consumeCharacter(input));
                    break;
                case states.script_data_escaped_end_tag_open:
                    script_data_escaped_end_tag_open(consumeCharacter(input));
                    break;
                case states.script_data_escaped_end_tag_name:
                    script_data_escaped_end_tag_name(consumeCharacter(input));
                    break;
                case states.script_data_double_escape_start:
                    script_data_double_escape_start(consumeCharacter(input));
                    break;
                case states.script_data_double_escaped:
                    script_data_double_escaped(consumeCharacter(input));
                    break;
                case states.script_data_double_escaped_dash:
                    script_data_double_escaped_dash(consumeCharacter(input));
                    break;
                case states.script_data_double_escaped_dash_dash:
                    script_data_double_escaped_dash_dash(consumeCharacter(input));
                    break;
                case states.script_data_double_escaped_lessthan_sign:
                    script_data_double_escaped_lessthan_sign(consumeCharacter(input));
                    break;
                case states.script_data_double_escape_end:
                    script_data_double_escape_end(consumeCharacter(input));
                    break;
                case states.before_attribute_name:
                    before_attribute_name(consumeCharacter(input));
                    break;
                case states.attribute_name:
                    attribute_name(consumeCharacter(input));
                    break;
                case states.after_attribute_name:
                    after_attribute_name(consumeCharacter(input));
                    break;
                case states.before_attribute_value:
                    before_attribute_value(consumeCharacter(input));
                    break;
                case states.attribute_value_double_quoted:
                    attribute_value_double_quoted(consumeCharacter(input));
                    break;
                case states.attribute_value_single_quoted:
                    attribute_value_single_quoted(consumeCharacter(input));
                    break;
                case states.attribute_value_unquoted:
                    attribute_value_unquoted(consumeCharacter(input));
                    break;
                case states.character_reference_in_attribute_value:
                    character_reference_in_attribute_value(input);
                    break;
                case states.after_attribute_value_quoted:
                    after_attribute_value_quoted(consumeCharacter(input));
                    break;
                case states.self_closing_start_tag:
                    self_closing_start_tag(consumeCharacter(input));
                    break;
                case states.bogus_comment:
                    bogus_comment(input);
                    break;
                case states.markup_declaration_open:
                    markup_declaration_open(input);
                    break;
                case states.comment_start:
                    comment_start(consumeCharacter(input));
                    break;
                case states.comment_start_dash:
                    comment_start_dash(consumeCharacter(input));
                    break;
                case states.comment:
                    comment(consumeCharacter(input));
                    break;
                case states.comment_end_dash:
                    comment_end_dash(consumeCharacter(input));
                    break;
                case states.comment_end:
                    comment_end(consumeCharacter(input));
                    break;
                case states.doctype:
                    doctype(consumeCharacter(input));
                    break;
                case states.before_doctype_name:
                    before_doctype_name(consumeCharacter(input));
                    break;
                case states.doctype_name:
                    doctype_name(consumeCharacter(input));
                    break;

                default:
                    if (state === undefined) {
                        throw "undefined";
                    }
                    console.log("unknown state", state);
            }
        }

        return tokens;
    };

}(typeof exports === 'object' && exports || this));
