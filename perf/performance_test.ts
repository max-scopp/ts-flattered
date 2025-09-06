import { performance } from "perf_hooks";
import { Project } from "ts-morph";
import ts from "typescript";
import {
  $,
  assign,
  block,
  call,
  ctor,
  klass,
  method,
  param,
  prop,
  ret,
  this_,
} from "../src/api/v3/public_api";
import { $string } from "../src/api/v3/types";

// Function to run performance test
function runPerformanceTest(
  testName: string,
  testFunction: () => void,
  iterations: number = 10000,
) {
  const times: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    testFunction();
    const end = performance.now();
    times.push(end - start);
  }

  const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);

  console.log(`\n=== ${testName} ===`);
  console.log(`Iterations: ${iterations}`);
  console.log(`Average time: ${avgTime.toFixed(4)} ms`);
  console.log(`Min time: ${minTime.toFixed(4)} ms`);
  console.log(`Max time: ${maxTime.toFixed(4)} ms`);

  return { avgTime, minTime, maxTime, times };
}

// Example 1: Initial Declaration Style (from example.ts)
function example1() {
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

  return greeter.get();
}

// Example 2: Chainable Style
function example2() {
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

  return greeter.get();
}

// Example 3: Raw ts.factory API
function example3() {
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

  return greeter;
}

// Example 4: ts-morph API
function example4() {
  const project = new Project();
  const sourceFile = project.createSourceFile("temp.ts");

  const greeterClass = sourceFile.addClass({
    name: "Greeter",
    isExported: true,
  });

  greeterClass.addProperty({
    name: "message",
    type: "string",
    isReadonly: true,
  });

  greeterClass.addConstructor({
    parameters: [{ name: "message", type: "string", isReadonly: true }],
    statements: ["this.message = message;"],
  });

  greeterClass.addMethod({
    name: "greet",
    statements: ['console.log("Hello, world!");', 'return "done";'],
    isAsync: true,
  });

  // Get the TypeScript compiler AST
  const tsSourceFile = project.getSourceFile("temp.ts");
  if (!tsSourceFile) throw new Error("Source file not found");

  const classDecl = tsSourceFile.getClass("Greeter");
  if (!classDecl) throw new Error("Class not found");

  return classDecl.compilerNode;
}

console.log(
  "Performance Report: Declaration vs Chainable vs ts-morph vs Raw ts.factory",
);
console.log(
  "=================================================================================",
);

const result1 = runPerformanceTest("Initial Declaration Style", example1);
const result2 = runPerformanceTest("Chainable Style", example2);
const result3 = runPerformanceTest("Raw ts.factory API", example3);
const result4 = runPerformanceTest("ts-morph API", example4);

// Key Finding
console.log("\n=== KEY FINDING ===");
const factoryVsDeclaration =
  ((result1.avgTime - result3.avgTime) / result3.avgTime) * 100;
const factoryVsChainable =
  ((result2.avgTime - result3.avgTime) / result3.avgTime) * 100;
const factoryVsTsmorph =
  ((result4.avgTime - result3.avgTime) / result3.avgTime) * 100;
const timeDiffDeclaration = result1.avgTime - result3.avgTime;
const timeDiffChainable = result2.avgTime - result3.avgTime;
const timeDiffTsmorph = result4.avgTime - result3.avgTime;

console.log(
  `Raw ts.factory is ${factoryVsDeclaration.toFixed(1)}% FASTER than Initial Declaration style`,
);
console.log(
  `  → Time difference: ${(timeDiffDeclaration * 1000).toFixed(1)} microseconds per operation`,
);
console.log(
  `Raw ts.factory is ${factoryVsChainable.toFixed(1)}% FASTER than Chainable style`,
);
console.log(
  `  → Time difference: ${(timeDiffChainable * 1000).toFixed(1)} microseconds per operation`,
);
console.log(
  `Raw ts.factory is ${factoryVsTsmorph.toFixed(1)}% FASTER than ts-morph`,
);
console.log(
  `  → Time difference: ${(timeDiffTsmorph * 1000).toFixed(1)} microseconds per operation`,
);
console.log(
  `\n📊 Context: While percentages seem dramatic, we're talking about MICROSECONDS per AST node creation.`,
);
console.log(
  `   For 100k operations: Declaration takes ${(timeDiffDeclaration * 100000).toFixed(0)}ms extra, Chainable takes ${(timeDiffChainable * 100000).toFixed(0)}ms extra, ts-morph takes ${(timeDiffTsmorph * 100000).toFixed(0)}ms extra.`,
);

// Simple comparison
console.log("\n=== Performance Summary ===");
console.log(`Raw ts.factory: ${result3.avgTime.toFixed(4)} ms (Fastest)`);
console.log(
  `Chainable:      ${result2.avgTime.toFixed(4)} ms (${(((result2.avgTime - result3.avgTime) / result3.avgTime) * 100).toFixed(1)}% slower, ${(timeDiffChainable * 1000).toFixed(1)}μs extra)`,
);
console.log(
  `Declaration:    ${result1.avgTime.toFixed(4)} ms (${(((result1.avgTime - result3.avgTime) / result3.avgTime) * 100).toFixed(1)}% slower, ${(timeDiffDeclaration * 1000).toFixed(1)}μs extra)`,
);
console.log(
  `ts-morph:       ${result4.avgTime.toFixed(4)} ms (${(((result4.avgTime - result3.avgTime) / result3.avgTime) * 100).toFixed(1)}% slower, ${(timeDiffTsmorph * 1000).toFixed(1)}μs extra)`,
);
console.log(
  `\n💡 Note: These are MICROSECOND differences per AST node. Choose based on developer experience, not raw performance.`,
);

// Quick code verification
const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
const code1 = printer.printNode(
  ts.EmitHint.Unspecified,
  example1(),
  ts.createSourceFile("", "", ts.ScriptTarget.Latest),
);
const code2 = printer.printNode(
  ts.EmitHint.Unspecified,
  example2(),
  ts.createSourceFile("", "", ts.ScriptTarget.Latest),
);
const code3 = printer.printNode(
  ts.EmitHint.Unspecified,
  example3(),
  ts.createSourceFile("", "", ts.ScriptTarget.Latest),
);
const code4 = printer.printNode(
  ts.EmitHint.Unspecified,
  example4() as unknown as ts.Node,
  ts.createSourceFile("", "", ts.ScriptTarget.Latest),
);

console.log("\n=== Code Verification ===");
console.log(`Declaration & Chainable identical: ${code1 === code2}`);
console.log(
  `All approaches semantically equivalent: ${code1.replace(/\s+/g, "") === code2.replace(/\s+/g, "") && code1.replace(/\s+/g, "") === code3.replace(/\s+/g, "") && code1.replace(/\s+/g, "") === code4.replace(/\s+/g, "")}`,
);
