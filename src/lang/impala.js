#!/usr/bin/env node

// Credit where credit is due:
// Help from 'http://lisperator.net/pltut/'

const fs = require("fs");
const readline = require("readline");

const Path = require("path");
const Lexer = require("./lexer.js");
const Parser = require("./parser.js");
const Interpreter = require("./interpreter.js");

const cache = JSON.parse(fs.readFileSync(Path.join(__dirname, "./cache/memory.json")));

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (question) => new Promise((resolve) => {
  rl.question(question, resolve);
});

const writeCache = () => {
  fs.writeFile(Path.join(__dirname, "./cache/memory.json"), JSON.stringify(cache), (err) => {
    if (err) {
      console.log("Could not write to memory!");
    } else {
      process.exit(0);
    }
  });
}

process.argv.splice(0, 1);
main(process.argv);

function main(argv) {

  if (argv[1] == "run") {
    let file = argv[2];
    argv.splice(0, 3);
    run(file, argv);
  } else {
    repl();
  }

}

function repl() {
  let lastWorking = "";

  console.log("Welcome to the Impala REPL! Type to start evaluating!")

  function ask() {
    let input = lastWorking;

    question("> ").then(data => {
      // if (data == "CLEAR") { lastWorking = ""; input = ""; return ask() }
      if (!data) throw Error();
      input += data + "\n";

      const lexer = new Lexer(input, "REPL:IN:OUT");
      let tokens = lexer.tokenize();

      const parser = new Parser(tokens, lexer.grammar, "REPL:IN:OUT");
      let ast = parser.parse();

      const interpreter = new Interpreter(ast, lexer.grammar, "REPL:IN:OUT");

      const BuiltInsPath = "./built-ins";
      const builtIns = fs.readdirSync(Path.join(__dirname, "./built-ins"));

      for (const file of builtIns) {
        const path = Path.join(__dirname, BuiltInsPath, file);
        const module = require(path);

        if (!module.name) throw new Error("Could not create built in. No name specified!");
        if (!module.run) throw new Error("Could not create built in. No run function or callback specified!");

        if (!module.type) {
          module.run.type = "Function";
        } else {
          module.run.type = module.type;
        }

        interpreter.defineIdentifier(module.name, module.run);
      }

      const lastReturn = interpreter.interpret();
      if (!lastReturn) throw Error();

      console.log((lastReturn.value) ? lastReturn.value : lastReturn);
      lastWorking = input;
      ask();

    }).catch(err => {
      ask();
    });
  }

  ask();
}

function run(filepath, argv) {
  const fullpath = Path.resolve(filepath);
  const input = fs.readFileSync(fullpath, "utf8");
  const lexer = new Lexer(input, fullpath);

  if (cache[fullpath].input == input) {
    const interpreter = new Interpreter(cache[fullpath].ast, lexer.grammar, fullpath);

    const BuiltInsPath = "./built-ins";
    const builtIns = fs.readdirSync(Path.join(__dirname, "./built-ins"));

    for (const file of builtIns) {
      const path = Path.join(__dirname, BuiltInsPath, file);
      const module = require(path);

      if (!module.name) throw new Error("Could not create built in. No name specified!");
      if (!module.run) throw new Error("Could not create built in. No run function or callback specified!");

      if (!module.type) {
        module.run.type = "Function";
      } else {
        module.run.type = module.type;
      }

      interpreter.defineIdentifier(module.name, module.run);
    }

    const time = interpreter.evaluate();
    if (argv.includes("--time") && time >= 0) console.log("Program finished in: " + time + " seconds");
    
    process.exit(0);
  }

  const tokens = lexer.tokenize();

  const parser = new Parser(tokens, lexer.grammar, fullpath);
  const ast = parser.parse();

  if (argv.includes("--debug")) {
    console.log(tokens);
    console.log(JSON.stringify(ast, null, 2));
  }

  const interpreter = new Interpreter(ast, lexer.grammar, fullpath);

  const BuiltInsPath = "./built-ins";
  const builtIns = fs.readdirSync(Path.join(__dirname, "./built-ins"));

  for (const file of builtIns) {
    const path = Path.join(__dirname, BuiltInsPath, file);
    const module = require(path);

    if (!module.name) throw new Error("Could not create built in. No name specified!");
    if (!module.run) throw new Error("Could not create built in. No run function or callback specified!");

    if (!module.type) {
      module.run.type = "Function";
    } else {
      module.run.type = module.type;
    }

    interpreter.defineIdentifier(module.name, module.run);
  }

  const time = interpreter.evaluate();
  if (argv.includes("--time") && time >= 0) console.log("Program finished in: " + time + " seconds");

  cache[fullpath] = { input, ast };
  writeCache();
}