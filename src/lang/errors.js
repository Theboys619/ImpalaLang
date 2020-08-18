// Put your custom Errors here //

/*
  Errors might look something like:

  Error: Unexpected Datatype after LParen
      at /home/runner/Impala/src/in/lang.imp:4:9
*/

class ImpalaError {
  constructor(msg, errorname, data) {
    this.message = msg || "Error cannot recover closing...";
    this.name = errorname || "ImpalaError";

    Object.assign(this, data);

    this.throw();
  }

  throw() {
    console.log(`${this.name}: ${this.message}\n\tat ${this.filepath}:${this.line + 1}:${this.index + 1}`);
    process.exit(1);
  }
}

class InvalidToken extends ImpalaError {
  constructor(data) {
    super(`Invalid token '${data.token}'`, "InvalidToken", data);
  }
}

class ImpalaSyntaxError extends ImpalaError {
  constructor(data) {
    super(data.msg || `Unexpected ${data.type} after ${data.lastToken.type}`, "SyntaxError", data);
  }
}

class AssignmentError extends ImpalaError {
  constructor(data) {
    super(`${data.msg}`, "AssignmentError", data);
  }
}

class DeclarationError extends ImpalaError {
  constructor(data) {
    super(data.msg, "DeclarationError", data);
  }
}

module.exports = {
  ImpalaError,
  InvalidToken,
  ImpalaSyntaxError,
  AssignmentError,
  DeclarationError
};