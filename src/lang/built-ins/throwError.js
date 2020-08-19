// Throws an impala error
const { ImpalaError } = require("../errors.js");

module.exports = {
  name: "ImpalaError",
  run: function run(...args) {
    const values = [];
    for (const i in args) {
      const arg = args[i];
      values.push(arg.value);
    }
    
    new ImpalaError(values.join(" "), null, {
      filepath: run.filepath,
      index: args[0].index,
      line: args[0].line
    });

  }
}