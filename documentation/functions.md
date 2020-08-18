### Functions

```cpp
any lol(bool variable) {
  if (variable) {
    return 5;
  } else {
    return "Lol";
  }
}

int add(int x, int y) {
  return x + y;
}

string cool(any test) {
  return test; // Throws error if not a string
}
```