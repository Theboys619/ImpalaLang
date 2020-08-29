// Log function to print argument values to console

const { ImpalaObject } = require("../classes/ImpClasses.js");

module.exports = {
  name: "Math",
  type: "Object",
  run: new ImpalaObject({
    floor(arg) {
      return {
        type: "Return",
        returnType: "Number",
        value: Math.floor(arg.value)
      };
    },
    round(arg) {
      return {
        type: "Return",
        returnType: "Number",
        value: Math.round(arg.value)
      };
    }
  })
}