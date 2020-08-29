### Creating Built-in Functions
Built-in functions are useful for multiple things.
It allows for default functions that you can use in the language. 
It gives the programmer programming in the language an easier time. It allows them to not have to write the function all the time themselves.

Now how do you create one?

**Steps to create a Built-In Below:**

##### Step 1

Create a javascript file in `./src/lang/built-ins`.
The file name can be anything.

##### Step 2

Create a boilerplate module markup

**Example:**
```js
module.exports = {
  name: "log", // Your function or Identifier name goes here
  run(...args) {

    // Your code goes here

  }
}
```

And now write your fantastic built in code within the run function scope.

##### Step 3

Run your built in function in a impala language file (.imp)
```impala
string helloString = "Hello World";

log(helloString) $ -> "Hello World"
```

You are now done! Your built in function should now be working!

##### Additional Steps

If you want to return an item using a built in
you have to return an object.

Here is the Schema:
```json
{
  "type": "Return",
  "returnType": "The type you are returning here",
  "value": "RETURN TYPE VALUE HERE"
}
```

**Example**:
```js
// Floor built-in

module.exports = {
  name : "floor",
  run(arg) {

    return { type: "Return", returnType: "Number", value: Math.floor(arg.value) }

  }
}
```

More below:

---

**ReturnTypes**:
  - `Number`: *number* return type
  - `String`: *string* return type
  - `Boolean`: *bool* return type
  - `Object`: *object* return type

Or you can import the `ImpalaReturn` class to automatically detect the return type based on the value given.

```js
const { ImpalaReturn } = require("../classes/ImpClasses.js");

module.exports = {
  name : "floor",
  run(arg) {

    return new ImpalaReturn(Math.floor(arg.value));
    
  }
}
```

---
**NameSpaces:**

If you want to add a namespace for your functions you have to create an impala object.
To create one you have to import a class from src/lang/classes/ImpClasses.js.

This class takes in a single parameter which is an object.
This object can have your functions or whatever data you want.
This object will be accessible from the ***Impala Language***.

Make sure create the `type` property and specify the type of built in it is.
For namespaces this is usually an Object.

```json
{
  "type": "Object"
}
```

Then your run function should change into an ImpalaObject.


Here is a *Math* namespace example.

**Example**
```js
const { ImpalaObject } = require("../classes/ImpClasses.js");

module.exports = {
  name: "Math",
  type: "Object",
  run: new ImpalaObject({
    floor(arg) {
      return {
        type: "Return",
        returnType: "Number",
        value: Math.floor(arg.value)
      };
    },
    round(arg) {
      return {
        type: "Return",
        returnType: "Number",
        value: Math.round(arg.value)
      };
    }
  })
}
```