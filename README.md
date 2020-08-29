## Impala programming language

Impala is a programming language like many others.

#### [About]

In Impala you can use for or while loops. You can also have if statements to run specific code if a condition is met or not.
You can chain these to have really long blocks (not ideal).

Impala also has a REPL that you can use to evaluate chunks of code.

#### [Impala CLI]

Impala also has its own CLI to run your code.
It also has a couple of arguments/options you can use to debug the code.

These arguments are like so `impala run path/to/file.imp --debug --time`.

Arguments:
  - *--debug*: is for debugging the lexer and parser of the code. This will print all the tokens and the abstract syntax tree.
  - *--time*: Will display the time that it took for the program to complete.


The built-in functions are made with the native/base code of the language. Which you can even write your own. Read the documentation for more.

#### [Impala VSCode Extension]

We have created a VSCode Extension that you can use for syntax highlighting.
Right now this extension if very limited on what it highlights. Most of the highlights are complete but not all.

The extension is not published on the extension market place so you would have to download it from the github repo.

Here is the link: [https://github.com/Theboys619/ImpalaLang-VSCode](https://github.com/Theboys619/ImpalaLang-VSCode)