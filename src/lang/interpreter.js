const { AssignmentError, DeclarationError, ImpalaError } = require("./errors");

class Environment {
  constructor(parent) {
    this.variables = Object.create(parent ? parent.variables : null);
    this.parent = parent;
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
    return new Environment(this);
  }
}

class Interpreter {
  constructor(ast, grammar, filepath) {
    this.ast = ast;
    this.grammar = grammar;
    this.filepath = filepath;

    this.globalThis = new Environment();

    this.startTime = null;
    this.endTime = null;

    this.DatatoTok = this.grammar.dataTypeAssign;
    this.ToktoData = this.grammar.TokTypetoDataType;
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

  iBinaryOp(op, a, b) {
    function num(x) {
        if (typeof x != "number")
            throw new Error("Expected number but got " + x);
        return x;
    }

    function div(x) {
        if (num(x) == 0)
            throw new Error("Divide by zero");
        return x;
    }

    switch (op) {
      case "+": return { type: "Number", value: num(a) + num(b) };
      case "-": return { type: "Number", value: num(a) - num(b) };
      case "*": return { type: "Number", value: num(a) * num(b) };
      case "/": return { type: "Number", value: num(a) / div(b) };
      case "%": return { type: "Number", value: num(a) % div(b) };
      case "&&": return { type: "Boolean", value: a !== false && b };
      case "||": return { type: "Boolean", value: a !== false ? a : b };
      case "<": return { type: "Boolean", value: num(a) < num(b) };
      case ">": return { type: "Boolean", value: num(a) > num(b) };
      case "<=": return { type: "Boolean", value: num(a) <= num(b) };
      case ">=": return { type: "Boolean", value: num(a) >= num(b) };
      case "==": return { type: "Boolean", value: a === b };
      case "!=": return { type: "Boolean", value: a !== b };
    }
    throw new Error("Can't apply operator " + op);
  }

  createFunction(exp, env) {
    const parameters = exp.value.parameters;
    const returnType = exp.value.dataType;

    const func = (...args) => {
      const scope = env.extend();
      
      for (var i = 0; i < parameters.length; i++) {
        const paramType = parameters[i].value.dataType;
        const argType = args[i].type;

        // console.log(parameters[i].value, args); // :LOG:

        if (paramType.value == this.ToktoData[argType])
          scope.define(parameters[i].value.varname.value, i < args.length ? args[i] : false);
        else
          new AssignmentError(this.createError(`Cannot assign value with type '${this.ToktoData[argType]}' to argument type '${paramType.value}'`, paramType.line, paramType.index));
      }
      
      const returnValue = this.interpret(exp.value.scope, scope);

      if (typeof returnValue == "object") {
        if (returnType.value !== this.ToktoData[returnValue.returnType]) {
          new AssignmentError(this.createError(`Cannot return type '${this.ToktoData[returnValue.returnType]}' in function type '${returnType.value}'`, returnType.line, returnType.index))
        }
        return returnValue;
      }
    }
    func.params = parameters;
    func.returnType = returnType.returnType
    func.env = env;
    func.filepath = this.filepath;

    env.define(exp.value.varname.value, func);

    return func;
  }

  evaluate() {
    this.startTime = Date.now();
    this.interpret();
    this.endTime = Date.now();

    return (this.endTime - this.startTime) / 1000;
  }

  interpret(exp = this.ast, env = this.globalThis) {
    switch(exp.type) {
      case "Number":
      case "String":
      case "Boolean":
      case "Object":
        return exp;

      case "Scope":
        var val = null;
        var scopeReturned = false;
        exp.block.forEach(expr => {
          if (!scopeReturned) {
            val = this.interpret(expr, env);
            if (val && val.type == "Return") {
              scopeReturned = true;
              return val;
            }
          }
          // if (expr && expr.type == "Return") return val;
        });
        return val;

      case "Function":
        return this.createFunction(exp, env);

      case "Variable":
        const Variable = env.get(exp.value.varname);
        if (!Variable) new ImpalaError(`Variable ${exp.value.varname} is not defined!`, null, this.createError(null, exp.value.varname.line, exp.value.varname.index));
        return Variable;
      case "Identifier":
        const IVariable = env.get(exp.value);
        if (!IVariable) new ImpalaError(`Variable ${exp.value} is not defined!`, null, this.createError(null, exp.line, exp.index));
        return IVariable;
      case "FunctionGet":
        const GFunction = env.get(exp.value.value);
        if (!GFunction) new ImpalaError(`Variable ${exp.value.value} is not defined!`, null, this.createError(null, exp.value.value.line, exp.value.value.index));
        return GFunction;

      case "Assign":
        const assignExprType = exp.left.type;
        if (exp.left.type != "Variable") {
          new DeclarationError(this.createError(`Cannot declare a variable`, exp.left.line, exp.left.index));
        }
        // console.log("ASSIGN:\n\n"); // :LOG:
        // console.log(exp.left.value); // :LOG:
        // console.log(exp.right); // :LOG:
        // console.log(env); // :LOG:

        const dataType = exp.left.value.dataType;
        const varName = exp.left.value.varname;
        const value = this.interpret(exp.right, env);

        // console.log(value); // :LOG:

        let variable = env.set(varName.value, value);

        if (!variable) {
          variable = env.define(varName.value, value);
        }

        if (this.DatatoTok[dataType.value] !== value.type) {
          new AssignmentError(this.createError(`Cannot assign value with type '${this.ToktoData[exp.right.type]}' to variable type '${dataType.value}'`, dataType.line, dataType.index));
        }
        return variable;

      case "Reassign":
        const ReassignName = exp.left.value.varName;
        const ReassignValue = this.interpret(exp.right, env);

        const ReassignOldVar = env.get(ReassignName);
        const ReassignLine = exp.left.value.line;
        const ReassignIndex = exp.left.value.index;

        if (!ReassignOldVar) {
          new ImpalaError(`Variable ${ReassignName} is not defined!`, null, this.createError(null, ReassignLine, ReassignIndex));
        }

        // console.log(ReassignOldVar);

        if (ReassignOldVar.type !== ReassignValue.type) {
          new AssignmentError(this.createError(`Cannot reassign variable to value type '${this.ToktoData[ReassignValue.type]}' of variable type '${this.ToktoData[ReassignOldVar.type]}'`, ReassignLine, ReassignIndex));
        }
        
        const ReassignedVar = env.set(ReassignName, (Reassign.type == "Return") ? ReassignValue.value : ReassignValue);
        return ReassignedVar;

      case "Crement":
        const CrementedName = exp.value.varName;
        const CrementedOldVar = env.get(CrementedName);

        const CrementedLine = exp.value.line;
        const CrementedIndex = exp.value.index;

        if (!CrementedOldVar) {
          new ImpalaError(`Variable ${CrementedName} is not defined!`, null, this.createError(null, CrementedLine, CrementedIndex));
        }

        if (CrementedOldVar.type !== "Number") {
          new AssignmentError(this.createError(`Cannot increment/decrement a variable with type '${this.ToktoData[CrementedOldVar.type]}'`, CrementedLine, CrementedIndex));
        }

        const CrementValue = { type: CrementedOldVar.type, value: CrementedOldVar.value + exp.value.increment, index: CrementedIndex, line: CrementedLine };
        const CrementedVar = env.set(CrementedName, CrementValue);

        return CrementedVar;

      case "Binary":
        const left = this.interpret(exp.left, env);
        const right = this.interpret(exp.right, env);
        return this.iBinaryOp(exp.operator, left.value, right.value);

      case "AccessProp":
        const ObjectItem = exp.value.object;
        const ObjectName = ObjectItem.name;
        const ObjectVar = env.get(exp.value.object.name);
        if (!ObjectVar) new ImpalaError(`Object ${ObjectName} is not defined!`, null, this.createError(null, ObjectItem.index, ObjectItem.line));

        const ObjectValue = ObjectVar.value;

        let PropValue = ObjectVar;

        for (const prop of exp.value.properties) {
          if (!PropValue) new ImpalaError(`Cannt access property ${prop.value} of undefined object. Main object is ${ObjectName}`, null, this.createError(null, prop.index, prop.line));

          if (PropValue.type !== "Object") new ImpalaError(`Cannt access property ${prop.value} of a ${PropValue.type || this.ToktoData[PropValue.type]}. Main object is ${ObjectName}.`, null, this.createError(null, prop.index, prop.line));
          else {
            PropValue = PropValue.value;
          }
          if (prop.type == "FunctionCall") {
            const PropFunc = PropValue[prop.value.function.value.value];
            this.interpret(PropFunc, env);
            if (PropFunc.value) {
              prop.value.function.value.value = PropFunc.value.varname.value;
              PropValue = this.interpret(prop, env);
            } else {
              const args = prop.value.args.map((arg) => {
                const argument = this.interpret(arg, env);
                return argument;
              });
              PropValue = PropFunc.apply(null, args);
            }

            if (PropValue.type == "Return" && PropValue.returnType && PropValue.returnType != "Return") {
              if (typeof PropValue.value == "Object")
                PropValue.value.type = PropValue.returnType;
              PropValue.type = PropValue.returnType;
            }
            continue;
          }

          PropValue = PropValue[prop.value];
          if (PropValue && PropValue["__POSITIONALDATA__"]) {
            delete PropValue["__POSITIONALDATA__"]
          }
        }

        let AccessLastValue = this.interpret(PropValue, env);

        if (AccessLastValue && AccessLastValue["__POSITIONALDATA__"]) {
          delete AccessLastValue["__POSITIONALDATA__"];
        }

        return (AccessLastValue) ? AccessLastValue : PropValue;

      case "FunctionCall":
        // console.log(exp.value.function, env); // :LOG:
        const func = this.interpret(exp.value.function, env);
        // console.log("FuncCall:", "\n", func); // :LOG:

        const args = exp.value.args.map((arg) => {
          const argument = this.interpret(arg, env);
          return argument;
        });

        if (!func.filepath)
          func.filepath = this.filepath;

        // console.log(args); // :LOG:

        // console.log("\n"); // :LOG:

        return func.apply(null, args);
      
      case "ForLoop":
        let FVariable = this.interpret(exp.value.variable, env);
        let forCondition = this.interpret(exp.value.canLoop, env);
        
        while (forCondition.value) {
          const forBlock = this.interpret(exp.scope, env);
          const forIteration = this.interpret(exp.value.iteration, env);
          forCondition = this.interpret(exp.value.canLoop, env);

          if (forBlock && (forBlock.type == "Return" || forBlock.type == "Break")) {
            return forBlock;
          }
        }

        return null;

      case "If":
        const ifCondition = this.interpret(exp.value.condition, env);
        let ifReturn = false;

        if (ifCondition.value) {
          ifReturn = this.interpret(exp.value.then, env);
        } else if (exp.value.else) {
          ifReturn = this.interpret(exp.value.else, env);
        }
        return ifReturn;

      case "Return":
        // console.log("RETURN:\n"); // :LOG:
        // console.log(exp, env); // :LOG:
        const returnValue = (exp.type == "Return" && !exp.returnType) ? exp.value : (exp.type == "Return" && exp.returnType) ? exp : this.interpret(exp.value, env);
        const returnType = (exp.value.type == "Binary" || "Identifier") ? returnValue.type : (!exp.value.type) ? "Boolean" : exp.value.type;

        return { type: "Return", returnType, value: returnValue.value };
    }
  }
}

module.exports = Interpreter;