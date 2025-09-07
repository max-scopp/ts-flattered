// Comprehensive examples using all tsf APIs

import fs from "fs";
import path from "path";
import ts from "typescript";
import {
  $,
  $any,
  $boolean,
  $export,
  $number,
  $ref,
  $string,
  arrayType,
  arrow,
  assign,
  block,
  call,
  const_,
  decorator,
  exprStmt,
  for_,
  func,
  id,
  if_,
  klass,
  let_,
  method,
  newExpr,
  obj,
  param,
  prop,
  propAccess,
  ret,
  this_,
  typeInterface,
  union,
  var_,
  while_,
} from "../src/public_api";

// Helper function to generate source code from AST nodes
function generateSourceCode(nodes: ts.Statement[]): string {
  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
  const result: string[] = [];

  const sourceFile = ts.factory.createSourceFile(
    nodes,
    ts.factory.createToken(ts.SyntaxKind.EndOfFileToken),
    ts.NodeFlags.None,
  );

  return printer.printFile(sourceFile);
}

// Helper function to write generated code to file
function writeGeneratedCode(filename: string, nodes: ts.Statement[]): void {
  const code = generateSourceCode(nodes);
  const outputPath = path.join(__dirname, "../../../out", filename);
  fs.writeFileSync(outputPath, code, "utf8");
  console.log(`Generated ${filename}`);
}

console.log("=== Example 1: Initial Declaration Style ===\n");

// Example 1: Using initial declaration style (like existing patterns)
const exampleClass1 = klass(
  "ExampleService",
  [
    prop(
      "_config",
      typeInterface([
        { name: "apiUrl", type: $string() },
        { name: "timeout", type: $number(), optional: true },
        { name: "debug", type: $boolean() },
      ]),
    )
      .$private()
      .get(),

    prop("version", $string()).$readonly().$static().$init($("1.0.0")).get(),

    method(
      "constructor",
      [
        param(
          "config",
          typeInterface([
            { name: "apiUrl", type: $string() },
            { name: "timeout", type: $number(), optional: true },
          ]),
        ),
      ],
      block([
        exprStmt(assign(propAccess(this_(), "_config"), id("config"))),
        exprStmt(assign(propAccess(this_(), "version"), $("1.0.0"))),
      ]),
    ).get(),

    method(
      "fetchData",
      [
        param("endpoint", $string()),
        param(
          "options",
          typeInterface([
            { name: "method", type: union($string(), $string()) },
            {
              name: "headers",
              type: $ref("Record<string, string>"),
              optional: true,
            },
          ]),
          true,
        ),
      ],
      block([
        const_(
          "url",
          call("join", [propAccess(this_(), "_config.apiUrl"), id("endpoint")]),
        ).get(),
        const_("response", call("fetch", [id("url"), id("options")])).get(),
        ret(call("json", [id("response")])),
      ]),
    )
      .$public()
      .$async()
      .get(),

    method(
      "processItems",
      [param("items", arrayType($ref("Item")))],
      block([
        const_("results", newExpr("Array")).get(),
        for_(
          ts.factory.createVariableDeclarationList(
            [
              ts.factory.createVariableDeclaration(
                "i",
                undefined,
                undefined,
                $(0),
              ),
            ],
            ts.NodeFlags.Let,
          ),
          call("<", [id("i"), propAccess(id("items"), "length")]),
          assign(id("i"), call("+", [id("i"), $(1)])),
        )
          .body(
            block([
              const_("item", propAccess(id("items"), "i")).get(),
              if_(propAccess(id("item"), "isValid"))
                .thenClause(
                  block([exprStmt(call("push", [id("results"), id("item")]))]),
                )
                .get(),
            ]),
          )
          .get(),
        ret(id("results")),
      ]),
    )
      .$public()
      .get(),
  ],
  [$export()],
);

// Example function with arrow function
const exampleFunction1 = func(
  "createService",
  [param("config", $ref("ServiceConfig"))],
  block([
    const_("service", newExpr("ExampleService", [id("config")])).get(),
    ret(id("service")),
  ]),
).$export();

// Example arrow function
const exampleArrow1 = arrow(
  [param("data", $any())],
  call("JSON.stringify", [id("data")]),
).$async();

// Example variable declarations
const exampleVar1 = var_("globalCounter", $(0)).$export().get();
const exampleLet1 = let_("tempValue").get();
const exampleConst1 = const_("PI", $(3.14159)).get();

// Example object literal
const exampleObj1 = obj([
  ts.factory.createPropertyAssignment("name", $("example")),
  ts.factory.createPropertyAssignment("version", $(1.0)),
])
  .prop("config", obj().prop("enabled", $(true)).get())
  .get();

// Example control flow
const exampleIf1 = if_(
  call("isValid", [id("input")]),
  block([exprStmt(call("process", [id("input")]))]),
  block([exprStmt(call("handleError", [$("Invalid input")]))]),
).get();

const exampleWhile1 = while_(call("<", [id("counter"), $(10)]))
  .body(
    block([exprStmt(assign(id("counter"), call("+", [id("counter"), $(1)])))]),
  )
  .get();

// Example decorator
const exampleDecorator1 = decorator("Injectable", [
  {
    providedIn: "root",
  },
]);

// Generate source file for initial declaration style
writeGeneratedCode("decl.ts", [
  exampleClass1,
  exampleFunction1,
  // exampleArrow1,
  exampleVar1,
  exampleLet1,
  exampleConst1,
  // exampleObj1,
  exampleIf1,
  exampleWhile1,
  // exampleDecorator1,
]);

console.log("=== Example 2: Chainable Style ===\n");

// Example 2: Using chainable syntax for post changes
const exampleClass2 = klass("ExampleService")
  .$export()
  .addMember(
    prop(
      "_config",
      typeInterface([
        { name: "apiUrl", type: $string() },
        { name: "timeout", type: $number(), optional: true },
        { name: "debug", type: $boolean() },
      ]),
    )
      .$private()
      .get(),
  )
  .addMember(
    prop("version", $string()).$readonly().$static().$init($("1.0.0")).get(),
  )
  .addMember(
    method(
      "constructor",
      [
        param(
          "config",
          typeInterface([
            { name: "apiUrl", type: $string() },
            { name: "timeout", type: $number(), optional: true },
          ]),
        ),
      ],
      block([
        exprStmt(assign(propAccess(this_(), "_config"), id("config"))),
        exprStmt(assign(propAccess(this_(), "version"), $("1.0.0"))),
      ]),
    ).get(),
  )
  .addMember(
    method(
      "fetchData",
      [
        param("endpoint", $string()),
        param(
          "options",
          typeInterface([
            { name: "method", type: union($string(), $string()) },
            {
              name: "headers",
              type: $ref("Record<string, string>"),
              optional: true,
            },
          ]),
          true,
        ),
      ],
      block([
        const_(
          "url",
          call("join", [propAccess(this_(), "_config.apiUrl"), id("endpoint")]),
        ).get(),
        const_("response", call("fetch", [id("url"), id("options")])).get(),
        ret(call("json", [id("response")])),
      ]),
    )
      .$public()
      .$async()
      .get(),
  )
  .addMember(
    method(
      "processItems",
      [param("items", arrayType($ref("Item")))],
      block([
        const_("results", newExpr("Array")).get(),
        for_(
          ts.factory.createVariableDeclarationList(
            [
              ts.factory.createVariableDeclaration(
                "i",
                undefined,
                undefined,
                $(0),
              ),
            ],
            ts.NodeFlags.Let,
          ),
          call("<", [id("i"), propAccess(id("items"), "length")]),
          assign(id("i"), call("+", [id("i"), $(1)])),
        )
          .body(
            block([
              const_("item", propAccess(id("items"), "i")).get(),
              if_(propAccess(id("item"), "isValid"))
                .thenClause(
                  block([exprStmt(call("push", [id("results"), id("item")]))]),
                )
                .get(),
            ]),
          )
          .get(),
        ret(id("results")),
      ]),
    )
      .$public()
      .get(),
  );

// Example function with chainable changes
const exampleFunction2 = func(
  "createService",
  [param("config", $ref("ServiceConfig"))],
  block([
    const_("service", newExpr("ExampleService", [id("config")])).get(),
    ret(id("service")),
  ]),
).$export();

// Example arrow function with chainable changes
const exampleArrow2 = arrow(
  [param("data", $any())],
  call("JSON.stringify", [id("data")]),
).$async();

// Example variable declarations with chainable changes
const exampleVar2 = var_("globalCounter", $(0)).$export();
const exampleLet2 = let_("tempValue");
const exampleConst2 = const_("PI", $(3.14159));

// Example object literal with chainable changes
const exampleObj2 = obj()
  .prop("name", $("example"))
  .prop("version", $(1.0))
  .prop("config", obj().prop("enabled", $(true)).get());

// Example control flow with chainable changes
const exampleIf2 = if_(call("isValid", [id("input")]))
  .thenClause(block([exprStmt(call("process", [id("input")]))]))
  .elseClause(block([exprStmt(call("handleError", [$("Invalid input")]))]));

const exampleWhile2 = while_(call("<", [id("counter"), $(10)])).body(
  block([exprStmt(assign(id("counter"), call("+", [id("counter"), $(1)])))]),
);

console.log(exampleWhile2.get());

// Example decorator (already chainable)
const exampleDecorator2 = decorator("Injectable", [
  {
    providedIn: "root",
  },
]);

// Generate source file for chainable style
writeGeneratedCode("chainable.ts", [
  exampleClass2.get(),
  exampleFunction2.get(),
  // exampleArrow2.get(),
  exampleVar2.get(),
  exampleLet2.get(),
  exampleConst2.get(),
  // exampleObj2.get(),
  exampleIf2.get(),
  exampleWhile2.get(),
  // exampleDecorator2,
]);
