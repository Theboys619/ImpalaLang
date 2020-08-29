### Strings

Strings in Impala are pretty simpliar to strings in js.

Strings can be concatenated via a plus (+);

Strings can be created in various ways.

**Example**
```ts
string str1 = "This is a string";
string str2 = 'This is also a string';
string str3 = `This is also a string`;
```

Strings can be concatenated like so:

```ts
string str1 = "This is a string";
string str2 = 'This is also a string';
string str3 = `This is also a string`;

log(str1 + str2); // $ outputs 'This is a stringThis is also a string'

// $ or like

log("Hello " + "World!"); // $ outputs 'Hello World!'

// $ or use the += operator

str1 += "!";

log(str1); // $ outputs 'This is a string!'
```