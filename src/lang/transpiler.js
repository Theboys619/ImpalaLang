const { AssignmentError, DeclarationError, ImpalaError, SyntaxError } = require("./errors");

class Environment {
  constructor(parent) {
    this.variables = Object.create(parent ? parent.variables : null);
    this.parent = parent;

    this.nest = "  ";
  }

  define(name, cb) {
    this.variables[name] = cb;
  }

  set(name, value) {
    let scope = this.lookup(name);
    if (!scope && this.parent)
        return;
    return (scope || this).variables[name] = value;
  }

  get(name) {
    if (name in this.variables)
        return this.variables[name];

    return false;
  }

  lookup(name) {
    let scope = this;
    while (scope) {
      if (Object.prototype.hasOwnProperty.call(scope.variables, name)) {
        return scope;
      }
      scope = scope.parent;
    }
  }

  extend() {
    let env = new Environment(this);
    env.nest = this.nest + "  ";
    return env;
  }
}

class Transpiler {
  constructor(ast, grammar, filepath) {
    this.ast = ast;
    this.grammar = grammar;
    this.filepath = filepath;

    this.isTop = true;
    this.code = ``;
    this.mainIndex = 0;

    this.globalThis = new Environment();

    this.startTime = null;
    this.endTime = null;

    this.DatatoTok = this.grammar.dataTypeAssign;
    this.ToktoData = this.grammar.TokTypetoDataType;
  }

  createHeaders(HEADERS) {
    for (const headername of HEADERS) {
      this.code += `#include <${headername}>\n`;
    }
    this.code += "\n";
  }

  createError(msg, line, index, filepath = this.filepath) {
    return {
      msg,
      filepath,
      line,
      index
    }
  }

  defineIdentifier(name, cb) {
    this.globalThis.define(name, cb);
  }

  defineLib(name, code) {
    this.code += code + "\n\n";
  }

  getCType(type) {
    if (!type) return;

    switch (type) {
      case "Number":
        return "ImpalaNumber";
      case "String":
        return "std::string";
      case "Boolean":
        return "bool";
      case "Object":
        return "ImpalaObject";
      case "number":
        return "ImpalaNumber";
      case "string":
        return "std::string";
      case "bool":
        return "bool";
      case "object":
        return "ImpalaObject";
      case "any":
        return "ImpalaAny"
    }

    return type;
  }

  createVar(exp) {
    let code = "";

    const cType = this.getCType(exp.value.dataType.value);
    const varName = exp.value.varname.value;
    const isConst = exp.value.varname.isConst;
    if (isConst) code += "const"; // If it is a constant add keyword first

    code += `${cType} ${varName}`;

    return code;
  }
  
  doAssign(exp, env, addition) {
    const cType = this.getCType(exp.left.value.dataType.value);

    this.transpile(exp.left, env);
    this.code += ` ${exp.operator} `;
    if (cType == "ImpalaAny") {
      this.code += "ImpalaAny(";
      this.transpile(exp.right, env, ")" + addition || ");\n");
    } else {
      this.transpile(exp.right, env, addition || ";\n");
    }
  }

  createMain(exp) {
    this.mainIndex = this.code.length-1;
    this.code += `int main(int argc, char** argv) {\n  std::chrono::steady_clock::time_point begin = std::chrono::steady_clock::now();\n`;
  }

  createFuncCall(exp, env, addition = "") {
    let first = true;
    this.code += "(";

    exp.value.args.forEach(arg => {
      if (!first) {
        this.code += ", ";
      } else {
        first = false;
      }
      this.transpile(arg, env, false);
    });

    this.code += ")";
    if (addition) this.code += addition;
  }

  createFunction(exp) {
    const cType = this.getCType(exp.value.dataType.value);
    const functionName = exp.value.varname.value;
    const parameters = exp.value.parameters;
    const scope = exp.value.scope;

    const start = this.code.length-1;

    this.code += `${cType} ${functionName}(`;

    let first = true;

    parameters.forEach(parameter => {
      if (first) {
        first = false;
      } else {
        this.code += ", ";
      }
      // console.log(parameter);
      this.transpile(parameter);
    });

    this.code += `) `;
    this.transpile(scope);

    const end = this.code.length-1;
    const functionCode = this.code.slice(start, end);

    this.code = this.code.slice(0, start) + this.code.slice(end);

    this.code = this.code.slice(0, this.mainIndex) + functionCode + "\n" + this.code.slice(this.mainIndex);

    this.mainIndex = this.mainIndex + functionCode.length + 1;
  }

  createObject(exp, env, addition) {
    console.log(exp);
  }

  transpile(exp = this.ast, env = this.globalThis, addition = "") {
    switch(exp.type) {
      case "Number":
        this.code += `ImpalaNumber(${exp.value})`;
        if (addition) this.code += addition;
        break;

      case "String":
        this.code += "\"" + exp.value + "\"";
        if (addition) this.code += addition;
        break;

      case "Boolean":
        this.code += exp.value;
        if (addition) this.code += addition;
        break;

      case "Object":
        this.createObject(exp, env, addition);
        break;

      case "Scope":
        let createEnding = false;
        if (this.isTop) {
          this.createMain(exp);
          this.isTop = false;
          createEnding = true;
        } else {
          this.code += "{\n";
        }

        exp.block.forEach(expr => {
          // console.log(expr);
          this.transpile(expr, env);
        });

        if (createEnding) {
          this.code += `\n  if (std::strcmp(argv[1], "--time") == 0) {\n    std::chrono::steady_clock::time_point end = std::chrono::steady_clock::now();\n    std::cout << std::endl << "Program finished in: " << std::chrono::duration_cast<std::chrono::nanoseconds> (end - begin).count() * 1e-9 << " seconds (C++ Actual)" << std::endl;\n  };\n  return 0;`;
          this.code += `\n}`;
        } else {
          this.code += `\n}\n`;
        }
        break;

      case "Function":
        this.createFunction(exp);
        break;

      case "Variable":
        this.code += this.createVar(exp);
        break;

      case "Identifier":
        this.code += exp.value;
        if (addition) this.code += addition;
        break;

      case "FunctionGet":
        this.transpile(exp.value, env, addition || "");
        break;

      case "Assign":
        this.doAssign(exp, env, addition);
        break;

      case "Reassign":
        this.code += exp.left.value.varName + " = ";
        this.transpile(exp.right, env, ";\n");
        break;

      case "Crement":
        this.code += exp.value.varName + " += " + exp.value.increment.toString();
        break;

      case "Binary":
        this.transpile(exp.left, env);
        this.code += " " + exp.operator + " ";
        this.transpile(exp.right, env);
        break;

      case "AccessProp":
        break;

      case "FunctionCall":
        this.transpile(exp.value.function, env, addition);
        this.createFuncCall(exp, env, (addition === "") ? ";\n" : addition);
        break;
      
      case "ForLoop":
        this.code += "for (";
        this.transpile(exp.value.variable, env, "; ");
        this.transpile(exp.value.canLoop, env);
        this.code += "; ";
        this.transpile(exp.value.iteration, env);
        this.code += ") ";
        this.transpile(exp.scope);

        break;

      case "If":
        this.code += "if (";
        this.transpile(exp.value.condition, env);
        this.code += ") ";
        this.transpile(exp.value.then, env);
        if (exp.value.else) {
          this.code += "else ";
          this.transpile(exp.value.else, env);
        }
        break;

      case "Return":
        this.code += "return ";
        this.transpile(exp.value, env, ";\n");
        break;

      case "CPPSnippet":
        const start = this.code.length-1;
        this.code += exp.value.value;
        const end = this.code.length-1;

        const codesnippet = this.code.slice(start, end);

        this.code = this.code.slice(0, start) + this.code.slice(end);

        this.code = this.code.slice(0, this.mainIndex) + codesnippet + "\n" + this.code.slice(this.mainIndex);

        this.mainIndex = this.mainIndex + codesnippet.length + 1;
        break;
      
      case "MainCPPSnippet":
        this.code += exp.value.value;
        break;
    }
  }
}

module.exports = Transpiler