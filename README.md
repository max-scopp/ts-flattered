<center><img src="banner.webp" width="320px"/></center>
<br/>

A lightweight TypeScript DSL for AST construction and code generation. Makes code generation **readable, concise, and easy to write**, reducing boilerplate compared to `ts.factory` and improving performance compared to `ts-morph`.

## Key Features

- **Native TypeScript AST**: Returns actual `ts.MethodDeclaration`, `ts.ClassDeclaration`, etc.
- **Trivia Preservation**: Automatically preserves comments, decorators, and JSDoc
- **Promise Support**: All methods are promise-able but not required (async/sync compatible)
- **Dual API Pattern**: Create new nodes or adopt existing ones (preserving all trivia)
- **Interoperable**: Mix and match with `ts.factory` functions
- **Simple API**: Clean, minimal interface with fluent chaining
- **No Wrapper Types**: Direct access to TypeScript AST nodes

## Why ts-flattered?

- **Minimal boilerplate**: Flat API with concise helpers
- **Readable & maintainable**: Clearly shows structure and intent
- **Full TypeScript API access**: Use any `ts.factory` function alongside this DSL
- **Future proof**: Compatible with TypeScript compiler updates
- **Handles core codegen tasks**: Classes, functions, methods, properties, imports/exports, file management

## Installation

```bash
npm install ts-flattered typescript
```

## Quick Start

**Creating New Code:**
```typescript
import { cls, method, param, block, call, $, sourceFile, writeAll } from "ts-flattered";

sourceFile("Dog.ts", [
  cls("Dog", [
    method({
      name: "bark",
      body: block([call("console.log", [$("Woof!")])])
    })
  ])
]);

await writeAll({ outputDir: "./generated" });
```

**Preserving Comments & Decorators:**
```typescript
import { prop, method } from "ts-flattered";

// All existing trivia (comments, decorators) preserved automatically!
const updatedClass = klass(existingClassNode)
  .addProp(prop("newField", $string()).get())
  .updateMethodsByFilter(
    { name: "process" },
    (method) => method.$async()
  );

// Promise support - any method can be awaited if needed
const asyncResult = await klass(existingClassNode)
  .$export();
```

## API Overview

- **`sourceFile(name, statements)`** - Create a TypeScript file  
- **`klass(name, members?)`** / **`klass(existingClass)`** - Create or adopt a class
- **`method(name, params?, body?)`** / **`method(existingMethod)`** - Create or adopt a method
- **`prop(name, type?)`** / **`prop(existingProperty)`** - Create or adopt a property
- **`param(name, type?)`** - Create a method parameter
- **`block(statements)`** - Create a code block
- **`call(functionName, args?)`** - Create a function call
- **`$(value)`** - Create a string/identifier literal
- **`assign(target, value)`** - Create an assignment expression
- **`writeAll(opts)`** - Generate all files to disk

📖 **[Complete API Reference](API.md)** - Comprehensive documentation with chainable and declarative examples for all APIs.

## Comparision to other AST Libraries

| Aspect | ts-flattered | ts-morph | ts.factory |
|--------|-------------|----------|------------|
| **Readability** | 🟢 Excellent | 🟡 Good | 🔴 Poor |
| **Performance** | 🟢 Excellent | 🔴 Poor | 🟢 Baseline |
| **Type Safety** | 🟢 Excellent | 🟡 Good | 🟢 Excellent |
| **Learning Curve** | 🟢 Excellent | 🟡 Good | 🔴 Poor |
| **Bundle Size** | 🟢 Excellent | 🟡 Good | 🟢 Excellent |
| **Code Generation** | 🟢 Excellent | 🟡 Good | 🟡 Good |

**Key Benefits:**
- **90% less code** than `ts.factory` with better readability
- **40-45x faster** than `ts-morph` for generation tasks
- **Native TypeScript AST** - no wrapper types
- **Perfect for**: Code generation, DSLs, build tools, metaprogramming

## Performance

ts-flattered offers excellent performance with minimal overhead:

- **1.6x slower than raw `ts.factory`** (declarative style)
- **1.8x slower than raw `ts.factory`** (chainable style)
- **40-45x faster than `ts-morph`**

## AI Code Generation

This library represents a practical solution to the gap between `ts.morph` and `ts.factory`. The initial investigation, research, testing, and core concept creation was done by a human developer. However, all subsequent code has been generated using AI assistants guided by instruction files based on the original human work.

This approach allows the creation of comprehensive results without interrupting more important work on other libraries. **This project purely exists to move on to bigger problems** - it serves as a foundation tool that enables focus on higher-level challenges rather than getting bogged down in AST manipulation details.

The combination of human architectural vision and AI implementation demonstrates how modern development can leverage both human creativity and AI efficiency to solve practical problems at scale.

## License

MIT
