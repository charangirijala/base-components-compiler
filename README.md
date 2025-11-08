# Lightning Web Components Compiler Worker

This project contains a scraped LWC compiler worker from Salesforce's Component Library and utilities to use it.

## 📁 Files

- **`public/compiler-worker.js`** - The compiler worker (71,075 lines, scraped from Salesforce)
- **`compiler-demo.html`** - Interactive demo page with UI
- **`compiler-client.js`** - Reusable JavaScript client for the compiler
- **`index.html`** - Original demo page with compiled components

## 🚀 Quick Start

### Option 1: Use the Interactive Demo

1. Start a local server in this directory:

   ```bash
   # Using Python 3
   python3 -m http.server 8000

   # Or using Node.js with http-server
   npx http-server -p 8000
   ```

2. Open your browser to:

   ```
   http://localhost:8000/compiler-demo.html
   ```

3. Click any of the example buttons to compile LWC components!

### Option 2: Use the JavaScript Client

Include the client in your HTML:

```html
<script type="module">
  import CompilerClient from "./compiler-client.js";

  // Initialize the compiler
  const compiler = new CompilerClient("/public/compiler-worker.js");

  // Compile a simple component
  const result = await compiler.compileSimple("myComponent", {
    "myComponent.js": `
            import { LightningElement } from 'lwc';
            
            export default class MyComponent extends LightningElement {
                greeting = 'Hello World';
            }
        `,
    "myComponent.html": `
            <template>
                <div>{greeting}</div>
            </template>
        `,
  });

  console.log("Compiled!", result);
</script>
```

### Option 3: Direct Worker Usage

```javascript
// Initialize worker
const worker = new Worker("/public/compiler-worker.js");

// Handle responses
worker.onmessage = function (event) {
  const { messageId, res, error } = event.data;
  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Success:", res);
  }
};

// Send compilation request
worker.postMessage({
  messageId: 0,
  data: {
    files: {
      // File structure here
    },
    project: {
      name: "MyComponent",
      namespace: "c",
      minify: false,
      compat: false,
      mainModule: "myComponent",
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
});
```

## 📦 Data Structure

The compiler expects data in this format:

```javascript
{
    messageId: 0,  // Unique message ID
    data: {
        files: {
            // Hierarchical file structure
            "<root>": {
                type: "directory",
                id: "<root>",
                name: "root",
                path: "root",
                childIds: ["comp-dir"],
                opened: true
            },
            "comp-dir": {
                type: "directory",
                id: "comp-dir",
                name: "myComponent",
                path: "root/myComponent",
                childIds: ["file-1", "file-2"],
                opened: true
            },
            "file-1": {
                type: "file",
                id: "file-1",
                name: "myComponent.js",
                path: "root/myComponent/myComponent.js",
                content: "// Your JS code here",
                childIds: [],
                opened: false
            },
            "file-2": {
                type: "file",
                id: "file-2",
                name: "myComponent.html",
                path: "root/myComponent/myComponent.html",
                content: "<template><!-- Your HTML --></template>",
                childIds: [],
                opened: false
            }
        },
        project: {
            name: "Component Name",
            description: "Optional description",
            namespace: "c",           // Component namespace
            minify: false,            // Enable minification
            compat: false,            // Enable compatibility mode
            mainModule: "myComponent" // Main module name (must match directory)
        },
        runtime: {
            lwc: {
                versions: [{ version: "1.6.0", url: "/api/runtime/lwc/1.6.0/lwc-compiler.js" }],
                stable: "1.6.0"
            },
            engine: {
                versions: [{ version: "1.6.0", url: "/api/runtime/lwc/1.6.0/engine.js" }],
                stable: "1.6.0"
            },
            "wire-service": {
                versions: [{ version: "1.6.0", url: "/api/runtime/wire-service/1.6.0/wire-service.json" }],
                stable: "1.6.0"
            },
            "lwc-synthetic-shadow": {
                versions: [{ version: "1.6.0", url: "/api/runtime/lwc-synthetic-shadow/1.6.0/lwc-synthetic-shadow.json" }],
                stable: "1.6.0"
            }
        }
    }
}
```

## 🎯 Examples

### Example 1: Hello World

```javascript
const compiler = new CompilerClient();

const result = await compiler.compileSimple("hello", {
  "hello.js": `
        import { LightningElement } from 'lwc';
        export default class Hello extends LightningElement {
            greeting = 'Hello World';
        }
    `,
  "hello.html": `
        <template>
            <h1>{greeting}</h1>
        </template>
    `,
});
```

### Example 2: Counter with CSS

```javascript
const result = await compiler.compileSimple("counter", {
  "counter.js": `
        import { LightningElement, track } from 'lwc';
        export default class Counter extends LightningElement {
            @track count = 0;
            increment() { this.count++; }
            decrement() { this.count--; }
        }
    `,
  "counter.html": `
        <template>
            <div class="counter">
                <h2>Count: {count}</h2>
                <button onclick={increment}>+</button>
                <button onclick={decrement}>-</button>
            </div>
        </template>
    `,
  "counter.css": `
        .counter {
            text-align: center;
            padding: 20px;
        }
    `,
});
```

### Example 3: DataTable (Full Structure)

See the `compiler-demo.html` file for the complete DataTable example with proper file structure.

## 🛠️ CompilerClient API

### Constructor

```javascript
const compiler = new CompilerClient(workerPath);
```

- `workerPath` (optional): Path to the compiler worker. Default: `'/public/compiler-worker.js'`

### Methods

#### `compile(data)`

Compile a component with full data structure.

```javascript
const result = await compiler.compile(fullDataStructure);
```

#### `compileSimple(componentName, files, options)`

Compile a component from simple file objects.

```javascript
const result = await compiler.compileSimple(
  "myComp",
  {
    "myComp.js": "...",
    "myComp.html": "...",
  },
  {
    namespace: "c",
    minify: false,
    description: "My Component",
  }
);
```

#### `createComponentData(componentName, files, options)`

Create the full data structure without compiling.

```javascript
const data = compiler.createComponentData("myComp", files);
// Modify data if needed
const result = await compiler.compile(data);
```

#### `terminate()`

Terminate the worker.

```javascript
compiler.terminate();
```

## 🔧 Troubleshooting

### Worker fails to load

Make sure you're running a local server. The worker requires HTTP/HTTPS protocol:

```bash
python3 -m http.server 8000
```

### CORS errors

Ensure all files are served from the same origin. Use a local server, not `file://` protocol.

### Compilation errors

- Check that `mainModule` matches the component directory name
- Ensure file names follow LWC conventions (e.g., `componentName.js`, `componentName.html`)
- Verify the component class name matches the file name (PascalCase)

## 📚 Resources

- [Salesforce LWC Documentation](https://developer.salesforce.com/docs/component-library/overview/components)
- [LWC Component Library](https://developer.salesforce.com/docs/component-library/bundle/lightning-datatable/example)
- [Web Workers API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API)

## 📝 License

This project uses code scraped from Salesforce's Component Library. Check Salesforce's terms for usage restrictions.

## 🤝 Contributing

This is a demo project. Feel free to modify and extend it for your needs.

---

**Note**: This compiler worker is scraped from Salesforce's public component library and may not include all features of the official LWC compiler. Use for educational and testing purposes.
