const { ImpalaError } = require("./errors");

/*
  ######################

          PARSER

  ######################
*/

const PREC = {
  "=": 1,
  "||": 2,
  "&&": 3,
  "<": 7, ">": 7, "<=": 7, ">=": 7, "==": 7, "!=": 7,
  "+": 10, "-": 10,
  "*": 20, "/": 20, "%": 20,
};

class Scope {
  constructor(block) {
    this.type = "Scope";
    this.block = block || [];
  }
}

class Statement {
  constructor(type, value) {
    this.type = type;
    this.value = value;
  }
}

class Expression {
  constructor(type, operator, left, right) {
    this.type = type;
    this.operator = operator;

    this.left = left;
    this.right = right;
  }
}

class Parser {
  constructor(tokens, grammar, filepath) {
    this.tokens = tokens;
    this.grammar = grammar;
    this.filepath = filepath;

    this.pos = 0;
    this.curTok = this.tokens[0];

    this.ast = [];
  }

  advance(amt = 1) { // Advance to another token
    this.pos += amt; // Increment the position by an amount (default is 1)
    this.curTok = this.tokens[this.pos]; // Get the token from the current position
    return this.curTok; // Return the current token
  }

  peek(amt = 1) { // Peek and amount of the token after the current pos
    return this.tokens[this.pos + amt]; // return that token
  }

  isLinebreak(value, peek = false, peekamt = 1) { // is<TYPE> helper methods
    const tok = this.peek(peekamt); // Peek or get the next (pos + amt) token  without advancing

    if (peek && tok) { // If peek is true and the next (pos + amt) token exists then
      return tok && tok.type == "Linebreak" && (!value || tok.value == value) && tok;
      // if there is a 'tok' and 'tok.type' is <TYPE> and if there is a 'value' and the 'value' equals the 'token value' return 'tok' else return false
    }

    return this.curTok && this.curTok.type == "Linebreak" && (!value || this.curTok.value == value) && this.curTok;
    // If there is a current token and the current token is <TYPE> and if there is a 'value' and the 'value' equals the current token value return the current token else return false
  } // Repeat this for all is<TYPE> helper functions

  isDelim(value, peek = false, peekamt = 1) {
    const tok = this.peek(peekamt);

    if (peek && tok) {
      return tok && tok.type == "Delimiter" && (!value || tok.value == value) && tok;
    }

    return this.curTok && this.curTok.type == "Delimiter" && (!value || this.curTok.value == value) && this.curTok;
  }

  isNumber(value, peek = false, peekamt = 1) {
    const tok = this.peek(peekamt);

    if (peek && tok) {
      return tok && tok.type == "Number" && (!value || tok.value == value) && tok;
    }

    return this.curTok && this.curTok.type == "Number" && (!value || this.curTok.value == value) && this.curTok;
  }

  isString(value, peek = false, peekamt = 1) {
    const tok = this.peek(peekamt);

    if (peek && tok) {
      return tok && tok.type == "String" && (!value || tok.value == value) && tok;
    }

    return this.curTok && this.curTok.type == "String" && (!value || this.curTok.value == value) && this.curTok;
  }

  isKeyword(value, peek = false, peekamt = 1) {
    const tok = this.peek(peekamt);

    if (peek && tok) {
      return tok && tok.type == "Keyword" && (!value || tok.value == value) && tok;
    }

    return this.curTok && this.curTok.type == "Keyword" && (!value || this.curTok.value == value) && this.curTok;
  }

  isDatatype(value, peek = false, peekamt = 1) {
    const tok = this.peek(peekamt);

    if (peek && tok) {
      return tok && tok.type == "Datatype" && (!value || tok.value == value) && tok;
    }

    return this.curTok && this.curTok.type == "Datatype" && (!value || this.curTok.value == value) && this.curTok;
  }

  isIdentifier(value, peek = false, peekamt = 1) {
    const tok = this.peek(peekamt);

    if (peek && tok) {
      return tok && tok.type == "Identifier" && (!value || tok.value == value) && tok;
    }

    return this.curTok && this.curTok.type == "Identifier" && (!value || this.curTok.value == value) && this.curTok;
  }

  isOperator(value, peek = false, peekamt = 1) {
    const tok = this.peek(peekamt);

    if (peek && tok) {
      return tok && (tok.type == "Operator" || tok.type == "BinOperator") && (!value || tok.value == value) && tok;
    }

    return this.curTok && (this.curTok.type == "Operator" || this.curTok.type == "BinOperator") && (!value || this.curTok.value == value) && this.curTok;
  }

  isEOF() {
    return this.curTok == null || this.curTok.type == "EOF";
  }

  skipOver(input) { // Skip over an input
    // console.log("SKIP:", input, this.curTok) // :LOG:

    let curInput = (typeof input == "object") ? input[0] : input; // Get the input string or the first element of the given input array
    let inputIndex = -1; // Set the index to -1

    const nextInput = () => {
      if (typeof input == "object") {
        inputIndex++; // Increment the inputIndex by 1
        curInput = input[inputIndex]; // Get the current input from the inputIndex
      }
      const length = curInput ? curInput.length : 1; // Get the length of the input for advancing over

      if (this.isDelim(curInput)) // Check if the input is a delimiter
        this.advance(length); // Then advance over all characters and repeat for every possible type
      else if (this.isKeyword(curInput))
        this.advance(length);
      else if (this.isDatatype(curInput))
        this.advance(length);
      else if (this.isLinebreak(curInput))
        this.advance(length);
      else if (this.isIdentifier(curInput))
        this.advance(length);
      else if (inputIndex > input.length)
        new ImpalaError(`Unexpected token ${this.curTok.value}`, null, {}); // If it is never any type then throw an error
      else
        nextInput();
    }

    nextInput(); // Call next input to retrieve and skip over the input that was given
  }

  parseDelimiters(start, end, separator, parser) { // Parse delimiters (EX: funccall(2, 4, 5))
    const values = [];
    let isFirst = true;

    this.skipOver(start); // Skip over '('
    while (!this.isEOF()) { // Repeat until end of file

      if (this.isDelim(end)) break; // If token is the end delimiter or ')' then break

      if (isFirst) // If its the first item then set to false
        isFirst = false;
      else // Otherwise skip over the separator ','
        this.skipOver(separator);

      if (this.isDelim(end)) break; // If token is the end delimiter of ')' then break

      const parserBind = parser.bind(this, []);
      const value = parserBind();

      if (value)
        values.push(value); // Run the parser for the item and push it to the values

    }
    this.skipOver(end); // Skip over ')'

    return values; // Return the values
  }

  $isCall(exprCb) {
    let expression = exprCb(); // Call the expression callback to retrieve the returned expression
    // console.log("$isCall:", expression); // :LOG:

    return this.isDelim("(", true) ? this.pCall(expression) : expression; // If the next token is a delimiter then parse the call else return the expression
  }

  pCall(funcname) {
    // console.log("pCall:", funcname); // :LOG:
    this.advance(); // Advance to next token

    return new Statement("FunctionCall", { // Create a new statement FunctionCall
      function: new Statement("FunctionGet", funcname), // with the function name
      args: this.parseDelimiters("(", ")", ",", this.pExpression) // and arguments
    });
  }

  $isVariable(token) {
    // console.log("$isVariable", token); // :LOG:

    return this.isIdentifier(null, true) ? this.pVariable(token) : token; // If the next token is an identifier parse variable or return the token
  }

  pFunction(statement) {
    statement.type = "Function"; // Replace the type with function
    statement.value.parameters = this.parseDelimiters("(", ")", ",", this.pExpression); // Get the parameters of the function
    statement.value.scope = new Scope(this.parseDelimiters("{", "}", [";", "\n"], this.pExpression)); // Get the block or code in '{', '}' and create a new scope

    return statement;
  }

  pVariable(dataType) {
    const varname = this.advance(); // Get the variable name by advancing
    let variable = new Statement("Variable", { // Create a new variable statement
      dataType, // With the datatype
      varname // and variable name
    });

    this.advance(); // Advance to the next token to continue parsing

    if (this.isDelim("(")) { // If the token is a parenthesis then
      variable = this.pFunction(variable); // parse and create a new Function statement and replace it with the variable statement
    }

    return variable; // Return the statement
  }

  pBoolean() { // Parse boolean and return if the value == "true". This converts to JS booleans
    return new Statement("Boolean", this.curTok.value == "true"); // Return the statement
  }

  pAll() {
    return this.$isCall(() => { // Check whether the returned token/statement is a function call
      // console.log("pAll:", this.curTok); // :LOG:
      if (this.isDelim("(")) { // If the token is a delimiter parenthesis it is an expression
        this.advance(); // Advance to the next token
        const expression = this.pExpression(); // Parse the expression (EX: 1 + 2 * 4)
        this.skipOver(")"); // Skip over the ')' token
        return expression; // Return the expression
      }

      if (this.isKeyword("true") || this.isKeyword("false")) {
        const boolean = this.pBoolean();
        this.advance();
        return boolean;
      }

      if (this.isKeyword("return")) { // If the keyword is a return then do things
        this.advance(); // Advance to next token
        const expression = this.pExpression(); // parse the expression after the return statement

        return new Statement("Return", expression); // Return the return statement with a value of the expression
      }

      let tok = this.curTok; // Save the current token to return after advancing to the next token

      if (this.isNumber()) { // If it is a number advance then return the token before the advance
        this.advance(); // Advance to next token
        return tok; // Return token before advance
      } else if (this.isIdentifier()) {
        if (!this.isDelim("(", true)) // if the next token is a parenthesis then don't go to the next token
          this.advance();

        if (this.isOperator("=")) {
          return new Statement("Reassign", {
            varName: tok.value,
            index: tok.index,
            line: tok.line,
          });
        }
        
        return tok; // Return the token saved before advancing
      } else if (this.isDatatype()) { // If it is a datatype return the statement for the variable/function
        return this.$isVariable(this.curTok);
      }

      if (this.isString()) {
        this.advance();
        return tok;
      }

    });
  }

  pBinary(left, prec) {
    let tok = this.curTok; // Get the current token
    if (this.isOperator()) { // Check if it is an operator
      let newPrec = PREC[tok.value]; // Get the PRECEDENCE or operator "weight"
      if (newPrec > prec) { // If the new Precedence is greater than the old one then
        this.advance(); // Advance to next token
        const type = (left && left.type == "Reassign") ? "Reassign" : (tok.value == "=") ? "Assign" : "Binary";
        return this.pBinary(new Expression(type, tok.value, left, this.pBinary(this.pAll(), newPrec)), prec);
        // Create new expression with the value and type. Then get the right value by recursion and passing in the new Precedence and return the recursion with the old Precedence
      }
    }
    // console.log("pBinary:", left); // Log left :LOG:
    return left; // Return the left after all is done
  }

  pExpression() {
    return this.$isCall(() => { // Check if the returned token is a function call after parsing all and parsing binary
      return this.pBinary(this.pAll(), 0); // Return token or statement if binary is not a expression node then check if it is a function call
    });
  }

  parse() {
    let topScope = new Scope(); // Create a new Scope
    while (!this.isEOF()) { // Repeat until end of the file
      let expr = this.pExpression(); // Parse the expression
      if (expr) // If the expression is not null or undefined
        topScope.block.push(expr); // Push expression to topScope block
      if (!this.isEOF()) this.skipOver(this.grammar.ignore); // If its not the EOF yet then skipOver token defined in ignore (EX: [";", "\n"])
    }
    // console.log(topScope.block[0]) // :LOG:
    return topScope; // Return the top scope
  }
}

module.exports = Parser;