// Floor

module.exports = {
  name : "floor",
  run(arg) {

    return {
      type: "Return",
      value: Math.floor(arg.value)
    };
    
  }
}