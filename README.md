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
import { cls, method, param, code, sourceFile, writeAll } from "ts-flattered";

sourceFile("Dog.ts", [
  cls("Dog", [
    method({ name: "bark", body: code`console.log("Woof!")` })
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

## Examples

### Declarative Approach
```typescript
import { cls, method, param, code, sourceFile, writeAll } from "ts-flattered";

sourceFile("Dog.ts", [
  cls("Dog", [
    method({ name: "bark", body: code`console.log("Woof!")` })
  ])
]);

sourceFile("PetStore.ts", [
  cls("PetStore", [
    method({
      name: "getDogs",
      params: [param("dogs", "Dog[]")],
      body: code`dogs.forEach(dog => dog.bark())`
    })
  ])
]);

await writeAll({ outputDir: "./generated" });
```

### Chainable Approach
```typescript
const greeter = tsf.klass("Greeter")
  .$export()
  .addMember(
    tsf.prop("message", tsf.$string()).$readonly()
  )
  .addMember(
    tsf.ctor([{ name: "message", type: tsf.$string() }], 
      tsf.block([tsf.assign("this.message", tsf.this_())])
    )
  )
  .addMember(
    tsf.method("greet", [], 
      tsf.block([
        tsf.call("console.log", [tsf.lit("Hello, world!")]),
        tsf.ret(tsf.lit("done"))
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
- **`cls(name, members)`** - Create a class with methods
- **`method(opts)`** - Create a method with params, return type, body
- **`param(name, type)`** - Method parameter
- **`code`literals`** - Template literal for arbitrary TypeScript code
- **`writeAll(opts)`** - Generate all files to disk

## Why ts-flattered?

- **Minimal boilerplate**: Flat API with concise helpers
- **Readable & maintainable**: Clearly shows structure and intent
- **Full TypeScript API access**: Use any `ts.factory` function alongside our DSL
- **Future proof**: Compatible with TypeScript compiler updates
- **Handles core codegen tasks**: Classes, functions, methods, properties, imports/exports, file management

## License

MIT
