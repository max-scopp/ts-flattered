<center><img src="banner.webp" width="320px"/></center>
<br/>

A lightweight TypeScript DSL for AST construction and code generation. Makes code generation **readable, concise, and easy to write**, reducing boilerplate compared to `ts.factory` and improving performance compared to `ts-morph`.

## Key Features

- **Native TypeScript AST**: Returns actual `ts.MethodDeclaration`, `ts.ClassDeclaration`, etc.
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

## API Overview

- **`sourceFile(name, statements)`** - Create a TypeScript file
- **`klass(name, members?)`** - Create a class with optional members
- **`method(name, params?, body?)`** - Create a method with optional params and body
- **`prop(name, type?)`** - Create a property with optional type
- **`param(name, type?)`** - Create a method parameter
- **`block(statements)`** - Create a code block
- **`call(functionName, args?)`** - Create a function call
- **`$(value)`** - Create a string/identifier literal
- **`assign(target, value)`** - Create an assignment expression
- **`writeAll(opts)`** - Generate all files to disk

## Why Choose ts-flattered?

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

## License

MIT
