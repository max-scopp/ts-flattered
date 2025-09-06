# ts-flattered

A lightweight TypeScript DSL for AST construction and code generation. Makes code generation **readable, concise, and easy to write**, reducing boilerplate compared to `ts-morph` or raw `ts.factory`.

## Key Features

- **Native TypeScript AST**: Returns actual `ts.MethodDeclaration`, `ts.ClassDeclaration`, etc.
- **Interoperable**: Mix and match with `ts.factory` functions
- **Simple API**: Clean, minimal interface with fluent chaining
- **No Wrapper Types**: Direct access to TypeScript AST nodes

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

## API Comparison

| Aspect | ts-flattered Declarative | ts-flattered Chainable | ts-morph | ts.factory |
|--------|------------------------|-----------------------|----------|------------|
| **API Style** | Declarative, functional | Fluent chaining | Object-oriented | Imperative factory |
| **Readability** | ⭐⭐⭐ (Excellent) | ⭐⭐⭐ (Excellent) | ⭐⭐ (Good) | ⭐ (Poor) |
| **Performance** | ⭐⭐ (Good) | ⭐⭐ (Good) | ⭐ (Poor) | ⭐⭐⭐ (Excellent) |
| **Type Safety** | ⭐⭐⭐ (Excellent) | ⭐⭐⭐ (Excellent) | ⭐⭐ (Good) | ⭐⭐⭐ (Excellent) |
| **Learning Curve** | ⭐⭐ (Good) | ⭐⭐⭐ (Excellent) | ⭐ (Poor) | ⭐ (Poor) |
| **Bundle Size** | ⭐⭐⭐ (Excellent) | ⭐⭐⭐ (Excellent) | ⭐⭐ (Good) | ⭐⭐⭐ (Excellent) |
| **Use Case** | Code generation, DSLs | Interactive building | Source analysis/modification | Low-level AST work |

### Key Insights

- **ts-flattered Declarative**: Best for readability and maintainability when you know the structure upfront. Ideal for code generation and DSL creation.
- **ts-flattered Chainable**: Sweet spot for interactive AST building with excellent developer experience and reasonable performance.

## Performance Overview

ts-flattered offers excellent performance with minimal overhead compared to raw `ts.factory`:

- **ts-flattered Declarative**: 0.0169 ms per operation (165% slower than raw ts.factory)
- **ts-flattered Chainable**: 0.0097 ms per operation (52% slower than raw ts.factory)
- **Raw ts.factory**: 0.0064 ms per operation (fastest)
- **ts-morph**: 0.6235 ms per operation (**9,671% slower** than raw ts.factory)

### Key Finding
**ts-morph is 97x slower than ts-flattered** - While these are microsecond differences per operation, ts-morph's overhead becomes significant at scale (61.7ms extra per 100k operations vs ts-flattered's 1.7ms).

**Choose based on developer experience**: ts-flattered's readability benefits outweigh the tiny performance cost for most applications.

## Examples

### Declarative Approach
```typescript
import { cls, method, param, block, call, $, id, arrow, sourceFile, writeAll } from "ts-flattered";

sourceFile("Dog.ts", [
  cls("Dog", [
    method({ 
      name: "bark", 
      body: block([call("console.log", [$("Woof!")])])
    })
  ])
]);

sourceFile("PetStore.ts", [
  cls("PetStore", [
    method({
      name: "getDogs",
      params: [param("dogs", "Dog[]")],
      body: block([
        call("forEach", [id("dogs"), arrow([param("dog")], call("bark", [id("dog")]))])
      ])
    })
  ])
]);

await writeAll({ outputDir: "./generated" });
```

### Chainable Approach
```typescript
import { klass, prop, ctor, method, param, block, call, $, assign, ret, this_, $string } from "ts-flattered";

const greeter = klass("Greeter")
  .$export()
  .addMember(
    prop("message", $string()).$readonly()
  )
  .addMember(
    ctor([param("message", $string())], 
      block([assign("this.message", this_())])
    )
  )
  .addMember(
    method("greet", [], 
      block([
        call("console.log", [$("Hello, world!")]),
        ret($("done"))
      ])
    ).$async()
  );
```

### Comparison with Alternatives

#### Using ts-morph
```ts
const file = project.createSourceFile("Greeter.ts");
const klass = file.addClass({ name: "Greeter", isExported: true });
klass.addProperty({ name: "message", type: "string", isReadonly: true });
klass.addConstructor({
  parameters: [{ name: "message", type: "string" }],
  statements: ["this.message = message;"]
});
klass.addMethod({ name: "greet", isAsync: true, statements: ["console.log('Hello, world!');", "return 'done';"] });
```

#### Using raw ts.factory
```ts
const klassNode = ts.factory.createClassDeclaration(
  [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
  "Greeter",
  [],
  undefined,
  [
    ts.factory.createPropertyDeclaration(
      [ts.factory.createModifier(ts.SyntaxKind.ReadonlyKeyword)],
      "message",
      undefined,
      ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
      undefined
    ),
    // ... 30+ more lines of verbose AST construction
  ]
);
```

**ts-flattered: 90% less code + actually readable**

## Core API

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

## Why ts-flattered?

- **Minimal boilerplate**: Flat API with concise helpers
- **Readable & maintainable**: Clearly shows structure and intent
- **Full TypeScript API access**: Use any `ts.factory` function alongside our DSL
- **Future proof**: Compatible with TypeScript compiler updates
- **Handles core codegen tasks**: Classes, functions, methods, properties, imports/exports, file management

## License

MIT
