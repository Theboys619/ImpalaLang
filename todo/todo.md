#### Impala Language Todo List

- [x]  Lexerization (Tokenize input)
- [ ]  Parse tokens from lexer
  - [x]  Parse return statements
    - Partially works
  - [x]  Parse 'function definitions'
    - Overflowing not done yet
  - [x]  Parse 'local and global variables'
  - [x]  Parse 'function calls'
    - Somewhat probably should fix a little bit
  - [x]  Parse 'for loops'
  - [ ]  Parse 'while loops'
  - [x]  Parse 'if and else statements'
- [ ]  Interpret or Compile data from parser
  - [x]  Interpret 'basic math and expressions'
  - [x]  Interpret 'returns'
  - [x]  Interpret 'function calls'
  - [x]  Interpret 'if and else if conditions'
    - else if is not interpreted or parsed yet
  - [x]  Interpret 'Scopes'
  - [x]  Interpret 'variable definitions'
  - [x]  Interpret 'variable reassignments'
  - [ ]  Interpret 'while loops'
  - [x]  Interpret 'for loops'

#### Performance Increase

Things todo that will help increase language performance
These things should be done after the language jam.

- [ ]  Compile code down into bytecode
- [ ]  Create vm in C++
- [ ]  Parse all bytecode
- [ ]  Run and interpret the bytecode

or

- [ ]  Compile code into assembly x86
- [ ]  Compile and link assembly to an executable

and

- [ ]  Change how objects work (really slows down the language)
- [ ]  Change the majority of the interpreter
  - This should help developers and boost performance