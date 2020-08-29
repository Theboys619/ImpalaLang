### IF ELSE Chains

If else chains and conditions should look like the following.

```cpp
number fact(number x) { // $ Basic factorial function
  if (x == 1) {
    return 1;
  } else {
    return x * fact(x - 1);
  }
}

log(fact(5)) // $ -> 120
```

```cpp
if (CONDITION) {
  // $ CODE
} else if (CONDITION) {
  // $ CODE
} else {
  // $ CODE
}
```