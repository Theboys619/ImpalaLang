// Log function to print argument values to console

module.exports = {
  name: "log",
  run(...args) {

    args = args.map((item) => {
      return item.value;
    });
    console.log.apply(null, args);

  }
}