// Round

module.exports = {
  name: "round",
  run(arg) {

    return {
      type: "Return",
      value: Math.round(arg.value)
    };

  }
}