### Functions

```cpp
any lol(bool variable) { // $ This function can return anything of any type
  if (variable) {
    return 5;
  } else {
    return "Lol";
  }
}

number add(number x, number y) {
  return x + y;
}

string cool(any test) {
  return test; // $ Throws error if not a string
}

none thisisnothing() {
  // $ This will not throw an error because of 'none' type
}
```