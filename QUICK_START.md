# 🚀 Quick Start Guide

Get started with the LWC Compiler Worker in 2 minutes!

## Step 1: Start a Local Server

You **must** run a local server (workers don't work with `file://` protocol).

**Option A - Python (easiest):**

```bash
python3 -m http.server 8000
```

**Option B - Node.js:**

```bash
npx http-server -p 8000
```

**Option C - VS Code:**

- Install "Live Server" extension
- Right-click `compiler-demo.html` → "Open with Live Server"

## Step 2: Open in Browser

Choose one of these options:

### ✨ Best for Beginners: Interactive Demo

```
http://localhost:8000/compiler-demo.html
```

- Beautiful UI with examples
- Click buttons to compile components
- See real-time results

### 📝 Simple Example with Console Output

```
http://localhost:8000/simple-example.html
```

- Minimal setup
- Results in console
- Good for learning the API

### 🏠 Original Demo

```
http://localhost:8000/index.html
```

- The original scraped demo
- Shows compiled component running live

## Step 3: Try It Out!

### In the Browser Console

Open `compiler-demo.html` and try this in the console:

```javascript
// The compiler is already loaded as 'compilerWorker'
// Just send a message:

const myData = {
  messageId: 999,
  data: {
    files: {
      "<root>": {
        type: "directory",
        id: "<root>",
        name: "root",
        path: "root",
        childIds: ["dir1"],
        opened: true,
      },
      dir1: {
        type: "directory",
        id: "dir1",
        name: "test",
        path: "root/test",
        childIds: ["f1", "f2"],
        opened: true,
      },
      f1: {
        type: "file",
        id: "f1",
        name: "test.js",
        path: "root/test/test.js",
        content: `
                    import { LightningElement } from 'lwc';
                    export default class Test extends LightningElement {
                        message = 'It works!';
                    }
                `,
        childIds: [],
      },
      f2: {
        type: "file",
        id: "f2",
        name: "test.html",
        path: "root/test/test.html",
        content: `<template><div>{message}</div></template>`,
        childIds: [],
      },
    },
    project: {
      name: "Test",
      namespace: "c",
      minify: false,
      compat: false,
      mainModule: "test",
    },
    runtime: {
      lwc: {
        versions: [
          { version: "1.6.0", url: "/api/runtime/lwc/1.6.0/lwc-compiler.js" },
        ],
        stable: "1.6.0",
      },
      engine: {
        versions: [
          { version: "1.6.0", url: "/api/runtime/lwc/1.6.0/engine.js" },
        ],
        stable: "1.6.0",
      },
      "wire-service": {
        versions: [
          {
            version: "1.6.0",
            url: "/api/runtime/wire-service/1.6.0/wire-service.json",
          },
        ],
        stable: "1.6.0",
      },
      "lwc-synthetic-shadow": {
        versions: [
          {
            version: "1.6.0",
            url: "/api/runtime/lwc-synthetic-shadow/1.6.0/lwc-synthetic-shadow.json",
          },
        ],
        stable: "1.6.0",
      },
    },
  },
};

compilerWorker.postMessage(myData);
```

## 🎯 Common Use Cases

### Use Case 1: Testing LWC Code

Create a test file with the `CompilerClient`:

```html
<!DOCTYPE html>
<html>
  <head>
    <title>My Test</title>
  </head>
  <body>
    <script type="module">
      import CompilerClient from "./compiler-client.js";

      const compiler = new CompilerClient();

      const result = await compiler.compileSimple("myTest", {
        "myTest.js": `
                import { LightningElement } from 'lwc';
                export default class MyTest extends LightningElement {
                    // Your code here
                }
            `,
        "myTest.html": `
                <template>
                    <!-- Your template -->
                </template>
            `,
      });

      console.log("Result:", result);
    </script>
  </body>
</html>
```

### Use Case 2: Code Playground

Build a code editor where users can type LWC code and compile it in real-time.

### Use Case 3: Component Validator

Validate LWC components before deploying to Salesforce.

## 🐛 Troubleshooting

### Problem: "Failed to construct 'Worker'"

**Solution:** You need to run a local server. Use Python or http-server.

### Problem: Worker doesn't respond

**Solution:**

1. Check browser console for errors
2. Verify `compiler-worker.js` path is correct
3. Make sure `mainModule` matches your component name

### Problem: Compilation errors

**Solution:**

1. Check that file names match the pattern: `componentName.js`, `componentName.html`
2. Verify class name is PascalCase version of file name
3. Ensure `mainModule` matches directory name exactly

### Problem: CORS errors

**Solution:** Serve all files from the same origin using a local server.

## 📖 Next Steps

1. ✅ **Read the full README.md** for detailed documentation
2. ✅ **Check compiler-demo.html** source code for complete examples
3. ✅ **Explore compiler-client.js** to see the API
4. ✅ **Visit Salesforce docs** for LWC syntax: https://developer.salesforce.com/docs/component-library

## 💡 Pro Tips

1. **Always use a local server** - Workers require HTTP/HTTPS protocol
2. **Check the console** - All compilation results and errors are logged there
3. **Start simple** - Begin with a basic Hello World component
4. **Match names carefully** - Component names must match everywhere (file name, class name, mainModule)
5. **Use the helper** - The `CompilerClient` class makes everything easier

## 🎨 Example Components to Try

### 1. Counter

```javascript
await compiler.compileSimple("counter", {
  "counter.js": `
        import { LightningElement, track } from 'lwc';
        export default class Counter extends LightningElement {
            @track count = 0;
            increment() { this.count++; }
        }
    `,
  "counter.html": `
        <template>
            <div>Count: {count}</div>
            <button onclick={increment}>+1</button>
        </template>
    `,
});
```

### 2. Hello Name

```javascript
await compiler.compileSimple("hello", {
  "hello.js": `
        import { LightningElement, track } from 'lwc';
        export default class Hello extends LightningElement {
            @track name = 'World';
            get greeting() {
                return 'Hello ' + this.name;
            }
        }
    `,
  "hello.html": `
        <template>
            <h1>{greeting}</h1>
            <input type="text" value={name} onchange={handleChange}>
        </template>
    `,
});
```

### 3. Click Tracker

```javascript
await compiler.compileSimple("clicker", {
  "clicker.js": `
        import { LightningElement } from 'lwc';
        export default class Clicker extends LightningElement {
            clicks = 0;
            handleClick() {
                this.clicks++;
            }
        }
    `,
  "clicker.html": `
        <template>
            <button onclick={handleClick}>
                Clicked {clicks} times
            </button>
        </template>
    `,
});
```

## 🎉 You're Ready!

That's it! You now know how to:

- ✅ Start a local server
- ✅ Open the demo pages
- ✅ Compile LWC components
- ✅ Use the CompilerClient API
- ✅ Debug common issues

**Have fun building Lightning Web Components!** 🚀

---

Need help? Check the full [README.md](./README.md) or explore the [example files](./compiler-demo.html).
