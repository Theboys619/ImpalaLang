#!/usr/bin/env node

// Credit where credit is due:
// Help from 'http://lisperator.net/pltut/'

const LANGPATH = "../src/lang";

const fs = require("fs");
const readline = require("readline");

const Path = require("path");
const Lexer = require(Path.join(__dirname, LANGPATH, "./lexer.js"));
const Parser = require(Path.join(__dirname, LANGPATH, "./parser.js"));
const Interpreter = require(Path.join(LANGPATH, "./interpreter.js"));
const Transpiler = require(Path.join(LANGPATH, "./transpiler.js"));
const { execSync } = require("child_process");

const cache = JSON.parse(fs.readFileSync(Path.join(__dirname, LANGPATH, "./cache/memory.json")));

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (question) => new Promise((resolve) => {
  rl.question(question, resolve);
});

const writeCache = (close) => {
  fs.writeFileSync(Path.join(__dirname, LANGPATH, "./cache/memory.json"), JSON.stringify(cache));

  if (close) process.exit(0);
}

process.argv.splice(0, 1);
main(process.argv);

function main(argv) {

  if (argv[1] == "run") {
    let file = argv[2];
    argv.splice(0, 3);
    run(file, argv, !argv.includes("--no-cache"));
  } else {
    repl();
  }

}

// RUN //

function setModules(transpiler) {
  if (!transpiler) return;

  const BuiltInsPath = Path.join(LANGPATH, "./built-ins");
  const builtIns = fs.readdirSync(Path.join(__dirname, LANGPATH, "./built-ins"));


  for (const file of builtIns) {
    const path = Path.join(__dirname, BuiltInsPath, file);

    transpiler.defineLib(file.split(".")[0], fs.readFileSync(path, "utf8"));
  }
}

function setMainFiles(transpiler) {
  if (!transpiler) return;

  const BuiltInsPath = Path.join(LANGPATH, "./main");
  const builtIns = fs.readdirSync(Path.join(__dirname, LANGPATH, "./main"));

  for (const file of builtIns) {
    const path = Path.join(__dirname, BuiltInsPath, file);

    transpiler.defineLib(file.split(".")[0], fs.readFileSync(path, "utf8")); 
  }
}

function run(filepath, argv, ezfmt) {
  const fullpath = Path.resolve(filepath);
  const input = fs.readFileSync(fullpath, "utf8");
  const lexer = new Lexer(input, fullpath);

  const timeArg = argv.includes("--time") ? "--time" : "";

  let tokens;// = lexer.tokenize();

  let parser;
  let ast;// = parser.parse();

  if (ezfmt && cache[fullpath] && cache[fullpath].input == input) {
    // const startTime = Date.now();
    // console.log(execSync(`./main ${timeArg}`, { cwd: "../src/out", encoding: "utf8" }));

    // const time = (Date.now() - startTime) / 1000;

    // if (timeArg) {
    //   console.log(`Program finished in: ${time} seconds`);
    // }
    process.exit(0);
  } else {
    tokens = lexer.tokenize();
    parser = new Parser(tokens, lexer.grammar, fullpath);
    ast = parser.parse();
  }

  if (argv.includes("--debug")) {
    console.log(tokens);
    console.log(JSON.stringify(ast, null, 2));
  }

  const transpiler = new Transpiler(ast, lexer.grammar, fullpath);

  transpiler.createHeaders([
    "string",
    "variant",
    "chrono",
    "cstring",
    "algorithm"
  ]);
  setMainFiles(transpiler);
  setModules(transpiler);

  console.log(`Transpiling...`);
  transpiler.transpile();

  const outpath = Path.join(__dirname, "../src/out/");
  const outFile = fullpath.split("/")[fullpath.split("/").length-1].replace(".imp", "");
  //clang++ -std=c++17

  console.log(`Compiling...`);
  fs.writeFile(`${outpath}${outFile}.cpp`, transpiler.code.toString(), { encoding: "utf8" }, (err) => {
    if (err) throw err;
    else {
      execSync(`clang++-7 -pthread -std=c++17 -o ${outpath}main ${outpath}${outFile}.cpp`);

      console.log(`Running...\n`);
      // const startTime = Date.now();
      // console.log(execSync(`./main ${timeArg}`, { cwd: "../src/out", encoding: "utf8" }));

      // const time = (Date.now() - startTime) / 1000;

      // if (argv.includes("--time")) {
        // console.log(`Program finished in: ${time} seconds`);
      // }
    }

    cache[fullpath] = { input, ast };
    writeCache(true);
  });
  // const time = interpreter.evaluate();
  // if (argv.includes("--time") && time >= 0) console.log("Program finished in: " + time + " seconds");

  // cache[fullpath] = { input, ast };
  // writeCache();
}