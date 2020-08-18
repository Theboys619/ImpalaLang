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