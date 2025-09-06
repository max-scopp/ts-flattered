# tsf – TypeScript AST DSL

**tsf** is a lightweight TypeScript **DSL** for AST construction and code generation.  
It makes code generation **readable, concise, and easy to write**, reducing boilerplate compared to `ts-morph` or raw `ts.factory`.

---

## Example: Simple Greeter Class

### Using `tsf`
```ts
const greeter = tsf.klass("Greeter", [
  tsf.prop("message", tsf.$string(), [tsf.$mod.readonly()]),
  tsf.ctor([{ name: "message", type: tsf.$string() }], tsf.block([
    tsf.assign("this.message", tsf.this_())
  ])),
  tsf.method("greet", [], tsf.block([
    tsf.call("console.log", [tsf.lit("Hello, world!")]),
    tsf.ret(tsf.lit("done"))
  ]), [tsf.$mod.async()])
], [tsf.$mod.export()]);
````

> ✅ Easy to read; clearly shows the structure and intent.

---

### Using `ts-morph`

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

> ⚠️ More verbose; multiple nested API calls.

---

### Using raw `ts.factory`

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
    ts.factory.createConstructorDeclaration(
      undefined,
      [ts.factory.createParameterDeclaration(undefined, undefined, "message", undefined, ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword), undefined)],
      ts.factory.createBlock([
        ts.factory.createExpressionStatement(
          ts.factory.createBinaryExpression(ts.factory.createPropertyAccessExpression(ts.factory.createThis(), "message"), ts.factory.createToken(ts.SyntaxKind.EqualsToken), ts.factory.createIdentifier("message"))
        )
      ], true)
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
        ts.factory.createExpressionStatement(ts.factory.createCallExpression(ts.factory.createPropertyAccessExpression(ts.factory.createIdentifier("console"), "log"), undefined, [ts.factory.createStringLiteral("Hello, world!")]))
      ], true)
    )
  ]
);
```

> ⚠️ Extremely verbose; deeply nested; focuses on AST structure rather than intent.

---

## Comparative Stats

| Feature                       | tsf         | ts-morph     | ts.factory |
| ----------------------------- | ----------- | ------------ | ---------- |
| Lines to create class         | 10          | 20+          | 50+        |
| Readability                   | ✅ Very high | ⚠️ Medium    | ❌ Low      |
| Boilerplate                   | Minimal     | Moderate     | Very high  |
| Focus on intent               | ✅ Yes       | ⚠️ Partially | ❌ No       |
| Interoperable with ts.factory | ✅           | ✅            | N/A        |

---

## Why `tsf`

* Minimal boilerplate.
* Readable & maintainable.
* Flat API with concise helpers (`ret()`, `assign()`, `call()`, `lit()`).
* Handles **core codegen tasks**, including classes, functions, methods, properties, imports/exports, and file management.
