# ts-flattered

A simple TypeScript code generation library that returns native TypeScript AST nodes, allowing seamless interoperability between DSL convenience functions and the native TypeScript Compiler API.

## Key Features

- **Native TypeScript AST**: All functions return actual `ts.MethodDeclaration`, `ts.ClassDeclaration`, etc.
- **Interoperable**: Mix and match with `ts.factory` functions
- **Simple API**: Clean, minimal interface
- **No Wrapper Types**: Direct access to TypeScript AST nodes

## Installation

```bash
npm install ts-flattered typescript
```

## Usage

### Basic Example

```typescript
import * as ts from "typescript";
import { method, cls, addMethodToClass, SourceFile } from "ts-flattered";

// Create a method using the DSL
const greetMethod = method({
  name: "greet",
  parameters: [{ name: "name", type: "string" }],
  returnType: "string",
  body: "return `Hello, ${name}!`;"
});

// Create a class using native TypeScript
const nativeClass = ts.factory.createClassDeclaration(
  [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
  ts.factory.createIdentifier("Person"),
  undefined,
  undefined,
  []
);

// Add the DSL method to the native class
const classWithMethod = addMethodToClass(nativeClass, greetMethod);
```

### Source File Management

```typescript
import { SourceFile } from "ts-flattered";

const sourceFile = new SourceFile();

// Add imports
sourceFile.addImport({
  namedImports: ["Component"],
  moduleSpecifier: "@angular/core"
});

// Add classes
sourceFile.addClass({
  name: "MyComponent",
  isExported: true,
  members: [
    method({
      name: "ngOnInit",
      returnType: "void",
      body: "console.log('Component initialized');"
    })
  ]
});

// Generate TypeScript code
console.log(sourceFile.getFullText());
```

## API Reference

### Functions

#### `method(options: MethodOptions): ts.MethodDeclaration`
Creates a TypeScript method declaration.

#### `cls(options: ClassOptions): ts.ClassDeclaration`
Creates a TypeScript class declaration.

#### `imp(options: ImportOptions): ts.ImportDeclaration`
Creates a TypeScript import declaration.

#### `addMethodToClass(classDecl: ts.ClassDeclaration, method: ts.MethodDeclaration): ts.ClassDeclaration`
Adds a method to an existing class declaration.

### Classes

#### `SourceFile`
A wrapper for managing TypeScript statements and generating code.

## Why ts-flattered?

Unlike other code generation libraries that create their own AST or wrapper types, ts-flattered returns native TypeScript AST nodes. This means:

1. **Full TypeScript API Access**: Use any `ts.factory` function alongside our DSL
2. **No Learning Curve**: If you know the TypeScript Compiler API, you can use ts-flattered
3. **Maximum Flexibility**: Not locked into our abstractions
4. **Future Proof**: Compatible with TypeScript compiler updates

## License

MIT
Adds a method to an existing class declaration.

### Classes

#### `SourceFile`
A wrapper for managing TypeScript statements and generating code.

## Why ts-flattered?

Unlike other code generation libraries that create their own AST or wrapper types, ts-flattered returns native TypeScript AST nodes. This means:

1. **Full TypeScript API Access**: Use any `ts.factory` function alongside our DSL
2. **No Learning Curve**: If you know the TypeScript Compiler API, you can use ts-flattered
3. **Maximum Flexibility**: Not locked into our abstractions
4. **Future Proof**: Compatible with TypeScript compiler updates

## License

MITts
import { cls, method, param, code, sourceFile, writeAll } from "ts-flattered";

// Create files with classes
sourceFile("Dog.ts", [
  cls("Dog", [
    method({
      name: "bark",
      body: code`console.log("Woof!")`
    })
  ])
]);

sourceFile("PetStore.ts", [
  cls("PetStore", [
    method({
      name: "getDogs",
      params: [param("dogs", "Dog[]")], // Auto-imports Dog from Dog.ts
      body: code`dogs.forEach(dog => dog.bark())`
    })
  ])
]);

// Generate all files
await writeAll({ outputDir: "./generated" });
```

## Core API

- **`sourceFile(name, statements)`** - Create a TypeScript file
- **`cls(name, members)`** - Create a class with methods
- **`method(opts)`** - Create a method with params, return type, body
- **`param(name, type)`** - Method parameter
- **`code`literals`** - Template literal for arbitrary TypeScript code
- **`writeAll(opts)`** - Generate all files to disk

## Features

✅ **Auto-import resolution** - References between files handled automatically  
✅ **Barrel exports** - Generate index files that re-export everything  
✅ **Source mapping** - Map generated code back to DSL calls for debugging  
✅ **TypeScript diagnostics** - Get compile errors with original source locations  

## Before vs After

### Using raw TypeScript Compiler API

```ts
import * as ts from "typescript";
import * as fs from "fs";

// Create Dog.ts
const dogClassDeclaration = ts.factory.createClassDeclaration(
  [ts.factory.createToken(ts.SyntaxKind.ExportKeyword)],
  "Dog",
  undefined,
  undefined,
  [
    ts.factory.createMethodDeclaration(
      undefined,
      undefined,
      "bark",
      undefined,
      undefined,
      [],
      ts.factory.createKeywordTypeNode(ts.SyntaxKind.VoidKeyword),
      ts.factory.createBlock([
        ts.factory.createExpressionStatement(
          ts.factory.createCallExpression(
            ts.factory.createPropertyAccessExpression(
              ts.factory.createIdentifier("console"),
              "log"
            ),
            undefined,
            [ts.factory.createStringLiteral("Woof!")]
          )
        )
      ])
    )
  ]
);

const dogSourceFile = ts.factory.createSourceFile(
  [dogClassDeclaration],
  ts.factory.createToken(ts.SyntaxKind.EndOfFileToken),
  ts.NodeFlags.None
);

// Create PetStore.ts with manual import
const importDeclaration = ts.factory.createImportDeclaration(
  undefined,
  ts.factory.createImportClause(
    false,
    undefined,
    ts.factory.createNamedImports([
      ts.factory.createImportSpecifier(false, undefined, ts.factory.createIdentifier("Dog"))
    ])
  ),
  ts.factory.createStringLiteral("./Dog"),
  undefined
);

const petStoreMethod = ts.factory.createMethodDeclaration(
  undefined,
  undefined,
  "getDogs",
  undefined,
  undefined,
  [
    ts.factory.createParameterDeclaration(
      undefined,
      undefined,
      "dogs",
      undefined,
      ts.factory.createArrayTypeNode(ts.factory.createTypeReferenceNode("Dog"))
    )
  ],
  ts.factory.createKeywordTypeNode(ts.SyntaxKind.VoidKeyword),
  ts.factory.createBlock([
    ts.factory.createExpressionStatement(
      ts.factory.createCallExpression(
        ts.factory.createPropertyAccessExpression(
          ts.factory.createIdentifier("dogs"),
          "forEach"
        ),
        undefined,
        [
          ts.factory.createArrowFunction(
            undefined,
            undefined,
            [ts.factory.createParameterDeclaration(undefined, undefined, "dog")],
            undefined,
            ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
            ts.factory.createCallExpression(
              ts.factory.createPropertyAccessExpression(
                ts.factory.createIdentifier("dog"),
                "bark"
              ),
              undefined,
              []
            )
          )
        ]
      )
    )
  ])
);

const petStoreClass = ts.factory.createClassDeclaration(
  [ts.factory.createToken(ts.SyntaxKind.ExportKeyword)],
  "PetStore",
  undefined,
  undefined,
  [petStoreMethod]
);

const petStoreSourceFile = ts.factory.createSourceFile(
  [importDeclaration, petStoreClass],
  ts.factory.createToken(ts.SyntaxKind.EndOfFileToken),
  ts.NodeFlags.None
);

// Print and write files
const printer = ts.createPrinter();
fs.writeFileSync("Dog.ts", printer.printFile(dogSourceFile));
fs.writeFileSync("PetStore.ts", printer.printFile(petStoreSourceFile));
```

### Using ts-flattered

```ts
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
      params: [param("dogs", "Dog[]")], // Auto-imports Dog
      body: code`dogs.forEach(dog => dog.bark())`
    })
  ])
]);

await writeAll({ outputDir: "./generated" });
```

**90% less code + automatic import resolution + actually readable**
