#!/usr/bin/env node
const fs = require("fs");
const Path = require("path");
const Lexer = require("./lexer.js");
const Parser = require("./parser.js");
const Interpreter = require("./interpreter.js");

process.argv.splice(0, 1);
main(process.argv);

function main(argv) {

  if (argv[1] == "run") {
    let file = argv[2];
    argv.splice(0, 3);
    run(file, argv);
  }

}

function run(filepath, argv) {
  const fullpath = Path.resolve(filepath);
  const input = fs.readFileSync(fullpath, "utf8");

  const lexer = new Lexer(input, fullpath);
  const tokens = lexer.tokenize();

  const parser = new Parser(tokens, lexer.grammar, fullpath);
  const ast = parser.parse();

  if (argv[0] == "--debug") {
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

    interpreter.defineIdentifier(module.name, module.run);
  }

  const inter = interpreter.interpret();
  if (inter) console.log(inter);

}