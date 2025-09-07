import { Project } from "ts-morph";
import { runPerformanceTest } from "./test_utils";

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

console.log("Performance Report: ts-morph API");
console.log("==================================");

runPerformanceTest("ts-morph API", example4);
