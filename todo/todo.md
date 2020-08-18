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
  - [ ]  Parse 'for loops'
  - [ ]  Parse 'while loops'
  - [ ]  Parse 'if and else statements'
- [ ]  Interpret or Compile data from parser
  - [x]  Interpret 'basic math and expressions'
  - [x]  Interpret 'returns'
  - [x]  Interpret 'function calls'
  - [ ]  Interpret 'if and else if conditions'
  - [x]  Interpret 'Scopes'
  - [x]  Interpret 'variable definitions'
  - [ ]  Interpret 'variable reassignments'
  - [ ]  Interpret 'while loops'
  - [ ]  Interpret 'for loops'

#### Performance Increase

Things todo that will help increase language performance
These things should be done after the language jam.

- [ ]  Compile code down into bytecode
- [ ]  Create vm in C++
- [ ]  Create a working stack
- [ ]  Parse all bytecode
- [ ]  Run and interpret the bytecode