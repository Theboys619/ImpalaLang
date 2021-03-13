class ImpalaObject {
  constructor(value) {
    this.type = "Object",
    this.value = value;
  }
}

class ImpalaString {
  constructor(value) {
    this.type = "String",
    this.index = "BUILTIN",
    this.line = "BUILTIN"
    this.value = value;
  }
}

class ImpalaReturn {
  constructor(value) {
    this.type = "Return";
    this.returnType = (typeof value == "number")
    ? "Number"  : (typeof value == "boolean")
    ? "Boolean" : (typeof value == "string")
    ? "String" : "Object";

    this.value = value;
  }
}

module.exports = { ImpalaObject, ImpalaString, ImpalaReturn };