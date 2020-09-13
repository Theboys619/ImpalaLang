const { InvalidToken } = require("./errors.js"); // Bring in custom errors from error.js

/*
  #####################

          LEXER

  #####################
*/

const DATA = { // Define grammar here
  ignore: [";", "\n"],

  whitespace: [" ", "\t"],
  linebreaks: ["\n"],

  dataTypes: ["any", "string", "number", "bool", "object", "none"],
  keywords: ["true", "false", "return", "const", "for", "while", "do", "if", "else", "between", "and", "import"],

  dataTypeAssign: {
    "any": ["String", "Number", "Boolean", "object", "none"],
    "string": "String",
    "number": "Number",
    "bool": "Boolean",
    "object": "Object"
  },
  TokTypetoDataType: {
    "Number": "number",
    "String": "string",
    "Boolean": "bool",
    "Object": "object"
  },
  keywordAssign: {
    "true": "Boolean",
    "false": "Boolean"
  },

  operators: ["=", "==", "!=", "+=", "-=", "++", "--", "<", "<=", ">", ">=", "&&", "||"],
  binOperators: ["*", "/", "%", "+", "-"],
  digits: "0123456789",
  strings: ["\"", "'", "`"],
  delimiters: [";", ",", ".", ":"],
  parenthesis: ["(", ")"],
  curlybraces: ["{", "}"],
  singleComment: "$",
  multiComment: ["/*", "*/"],

  other: [ // Other grammar in JSON / regex form
    {
      matcher: /=\>/,
      type: "Arrow",
      length: 2
    }
  ]

}

class Lexer {
  constructor(input, filepath) {
    this.input = input.replace(/\r/g, ""); // File input / contents
    this.filepath = filepath; // File path

    this.grammar = DATA;

    this.pos = 0; // The position of the current character
    this.char = this.input[0]; // The current character

    this.line = 0; // The line of the current Token
    this.index = 0; // The index of the current Token

    this.tokens = []; // An array of all Tokens
  }

  advance(amt = 1) { // Method to advance to next character
    this.pos += amt; // Update position to an amount
    this.index = this.index + amt; // Update index of Token to amount
    this.char = this.input[this.pos]; // Get the char from the position

    return this.char; // Return the character
  }

  peek(amt = 1) { // Same thing as advance but not setting any class properties
    return this.input[this.pos + amt]; // Return next (amt) character
  }

  isWhitespace(char = this.char) {
    return DATA.whitespace.includes(char);
  }

  isLinebreak(char = this.char) {
    return DATA.linebreaks.includes(char);
  }

  isLetter(char = this.char) {
    return (char >= "a" && "z" >= char) || (char >= "A" && "Z" >= char);
  }

  isNumber(char = this.char) {
    if (char == "-" && DATA.digits.includes(this.peek())) return true;
    return DATA.digits.includes(char);
  }

  isString(char = this.char) {
    return DATA.strings.includes(char);
  }

  isOperator(char = this.char) {
    return (
      DATA.operators.includes(char) ||
      DATA.operators.includes(char + this.peek()) ||
      DATA.operators.includes(char + this.peek() + this.peek())
    );
  }

  isBinOperator(char = this.char) {
    return DATA.binOperators.includes(char);
  }

  isDelimiter(char = this.char) {
    return DATA.delimiters.includes(char);
  }

  isParen(char = this.char) {
    return DATA.parenthesis.includes(char);
  }

  isCurly(char = this.char) {
    return DATA.curlybraces.includes(char);
  }

  isComment(char = this.char) {
    let str = char;

    for (let i = 1; i < DATA.singleComment.length; i++) {
      str += this.peek(i);
    }

    if (DATA.singleComment.includes(str)) return { multiLine: false };
    else if (DATA.multiComment[0] == char + this.peek()) return { multiLine: true };

    return false;
  }

  isSnippet(char = this.char) {
    return (char == "`" && this.peek() == "`" && this.peek(2) == "`");
  }

  isOther(char = this.char) {
    let index = this.index;
    let line = this.line;

    for (let token of DATA.other) {
      let str = this.char || "";
      let i = 1;

      while (str.length < token.length && this.peek(i) != null) {
        str += this.peek(i);
        i++;
      }

      if (token.matcher.test(str)) {
        this.tokens.push({
          type: token.type,
          value: str,
          index,
          line
        });

        this.advance(i - 1);

        return true
      }
    }

    return false;
  }

  tokenize() {
    while (this.char != null) {
      const lastpos = this.pos;
      if (this.isWhitespace()) { // If it is white space advance to the next character
        this.advance();
      }

      if (this.isLinebreak()) { // If the character is a linebreak add 1 to the line and set index back to 0
        this.tokens.push({ // Push object to tokens array
          type: "Linebreak", // The type of the token
          value: "\n", // The tokens values
          index: this.index, // The index of the start of the Token
          line: this.line // The beginning line of the Token
        });

        this.line++;
        this.index = -1;

        this.advance(); // Advance to the next character
      }

      if (this.isComment() && this.isComment().multiLine == false) {
        while (this.char != null && !this.isLinebreak()) {
          this.advance();
        }
      }

      if (this.isComment() && this.isComment().multiLine) {
        while (this.char != null && (this.char + this.peek() != DATA.multiComment[1])) {
          this.advance();
        }

        this.advance(2);
      }

      if (this.isSnippet()) {
        this.advance(3);
        let code = "";

        while (this.char != null && !this.isSnippet()) {
          code += this.char;
          this.advance();
        }

        this.tokens.push({
          type: "CPPSnippet",
          value: code,
          index: this.index,
          line: this.line
        });
        this.advance(3);
      }

      if (this.isOther()) {
        this.advance();
      }
      
      if (this.isOperator()) {
        let op = this.char;
        let index = this.index;
        let line = this.line;

        while (this.isOperator(op + this.peek()) && this.char != null) {
          this.advance();
          op += this.char;
        }

        this.tokens.push({
          type: "Operator",
          value: op,
          index,
          line
        });

        this.advance();
      } else if (this.isBinOperator()) {
        this.tokens.push({
          type: "BinOperator",
          value: this.char,
          index: this.index,
          line: this.line
        });

        this.advance();
      }

      if (this.isNumber()) {
        let str = this.char;
        let index = this.index;
        let line = this.line;

        this.advance();

        while (this.char != null && this.isNumber()) {
          str += this.char;
          this.advance();
        }

        if (this.char == ".") {
          str += this.char;
          this.advance();
          while (this.char != null && this.isNumber()) {
            str += this.char;
            this.advance();
          }
        }

        this.tokens.push({
          type: "Number",
          value: parseFloat(str),
          index,
          line
        });
      }

      if (this.isString()) {
        let value = "";
        let index = this.index;
        let line = this.line;

        this.advance();

        while (this.char != null && !this.isString()) {
          value += this.char;
          this.advance();
        }

        this.tokens.push({
          type: "String",
          value,
          index,
          line
        });

        this.advance();
      }

      if (this.isParen()) {
        let type = "Delimiter";

        this.tokens.push({
          type,
          value: this.char,
          index: this.index,
          line: this.line
        });

        this.advance();
      }

      if (this.isCurly()) {
        let type = "Delimiter";

        this.tokens.push({
          type,
          value: this.char,
          index: this.index,
          line: this.line
        });

        this.advance();
      }

      if (this.isDelimiter()) {
        this.tokens.push({
          type: "Delimiter",
          value: this.char,
          index: this.index,
          line: this.line
        });

        this.advance();
      }
      
      if (this.isLetter()) {
        let value = "";
        let type = "Identifier";
        let index = this.index;
        let line = this.line;

        while (this.char != null && (this.isLetter() || this.isNumber())) {
          value += this.char;
          this.advance();
        }

        if (DATA.dataTypes.includes(value)) type = "Datatype";
        if (DATA.keywords.includes(value)) type = "Keyword";

        this.tokens.push({
          type,
          value,
          index,
          line
        });
      }

      if (this.pos == lastpos) {
        new InvalidToken({
          filepath: this.filepath,
          token: this.char,
          line: this.line,
          index: this.index
        });
      }
    }

    this.tokens.push({
      type: "EOF",
      value: "EOF",
      index: 0,
      line: (this.tokens.length > 0) ? this.tokens[this.tokens.length-1].line + 1 : 0
    });

    return this.tokens;
  }
}

module.exports = Lexer;