# Performance Tests

This folder contains performance tests and reports for the `ts-flattered` library.

## Test Overview

The test compares three approaches for building TypeScript AST nodes:

1. **Initial Declaration Style**: Pass all parameters upfront (highest abstraction)
2. **Chainable Style**: Use fluent method chaining (balanced approach)
3. **Raw ts.factory API**: Direct use of TypeScript's native factory methods (fastest)

## Example Code Variants

Here are the three code variants used in the performance test:

### 1. Initial Declaration Style

```typescript
const greeter = klass("Greeter", [
  prop("message", $string()).$readonly(),
  ctor(
    [param("message", $string()).$readonly()],
    block([assign("this.message", this_())]),
  ),
  method(
    "greet",
    [],
    block([call("console.log", [$("Hello, world!")]), ret($("done"))]),
  ).$async(),
]).$export();
```

### 2. Chainable Style

```typescript
const greeter = klass("Greeter")
  .$export()
  .addMember(prop("message", $string()).$readonly())
  .addMember(
    ctor(
      [param("message", $string()).$readonly()],
      block([assign("this.message", this_())]),
    ),
  )
  .addMember(
    method(
      "greet",
      [],
      block([call("console.log", [$("Hello, world!")]), ret($("done"))]),
    ).$async(),
  );
```

### 3. Raw ts.factory API

```typescript
const greeter = ts.factory.createClassDeclaration(
  [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
  ts.factory.createIdentifier("Greeter"),
  undefined,
  undefined,
  [
    ts.factory.createPropertyDeclaration(
      [ts.factory.createModifier(ts.SyntaxKind.ReadonlyKeyword)],
      "message",
      undefined,
      ts.factory.createTypeReferenceNode("string"),
      undefined,
    ),
    ts.factory.createConstructorDeclaration(
      undefined,
      [
        ts.factory.createParameterDeclaration(
          [ts.factory.createModifier(ts.SyntaxKind.ReadonlyKeyword)],
          undefined,
          "message",
          undefined,
          ts.factory.createTypeReferenceNode("string"),
          undefined,
        ),
      ],
      ts.factory.createBlock([
        ts.factory.createExpressionStatement(
          ts.factory.createBinaryExpression(
            ts.factory.createPropertyAccessExpression(
              ts.factory.createThis(),
              "message",
            ),
            ts.factory.createToken(ts.SyntaxKind.EqualsToken),
            ts.factory.createIdentifier("message"),
          ),
        ),
      ]),
    ),
    ts.factory.createMethodDeclaration(
      [ts.factory.createModifier(ts.SyntaxKind.AsyncKeyword)],
      undefined,
      "greet",
      undefined,
      undefined,
      [],
      undefined,
      ts.factory.createBlock([
        ts.factory.createExpressionStatement(
          ts.factory.createCallExpression(
            ts.factory.createPropertyAccessExpression(
              ts.factory.createIdentifier("console"),
              "log",
            ),
            undefined,
            [ts.factory.createStringLiteral("Hello, world!")],
          ),
        ),
        ts.factory.createReturnStatement(
          ts.factory.createStringLiteral("done"),
        ),
      ]),
    ),
  ],
);
```

## Running Tests

To run the performance test:

```bash
cd /home/mscopp/ts-flattered
bun run perf/performance_test.ts
```

Results will show the key finding prominently in the console output.
