# ts-flattered

> A lightweight DSL for programmatically generating TypeScript code with automatic import resolution.

## What it does

Generate TypeScript files programmatically using a simple, chainable API. Automatically resolves imports between generated files based on symbol usage.

## Quick Example

```ts
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
