import { fileFromString, SourceFileRegistry } from "../src/modules/file";
import { computeSimpleType, computeConstructorType } from "../src/helpers/type";
import * as ts from "typescript";

/**
 * Test to verify that the error handling in symbol resolution works correctly
 */
function testErrorHandling() {
  console.log("Testing error handling in symbol resolution...");

  // Create a simple TypeScript source file for testing
  const testContent = `
export interface TestInterface {
  prop: string;
}

export class TestClass {
  constructor(public value: string) {}
}

export type TestType = string | number;
`;

  const sourceFile = ts.createSourceFile(
    "test.ts",
    testContent,
    ts.ScriptTarget.Latest,
    true
  );

  // Create a simple program for type checking
  const compilerOptions: ts.CompilerOptions = {
    target: ts.ScriptTarget.ES2020,
    module: ts.ModuleKind.ESNext,
  };

  const program = ts.createProgram({
    rootNames: ["test.ts"],
    options: compilerOptions,
    host: {
      ...ts.createCompilerHost(compilerOptions),
      getSourceFile: (fileName) => {
        if (fileName === "test.ts") {
          return sourceFile;
        }
        return ts.createCompilerHost(compilerOptions).getSourceFile?.(fileName, ts.ScriptTarget.Latest);
      }
    }
  });

  const typeChecker = program.getTypeChecker();

  // Test computeSimpleType with various scenarios
  console.log("Testing computeSimpleType with error-prone scenarios...");

  try {
    // Test with undefined
    const result1 = computeSimpleType(typeChecker, undefined);
    console.log("✓ computeSimpleType handles undefined:", result1);

    // Test with a complex type node that might cause symbol resolution issues
    const complexTypeNode = ts.factory.createTypeReferenceNode(
      ts.factory.createIdentifier("NonExistentType"),
      undefined
    );

    const result2 = computeSimpleType(typeChecker, complexTypeNode);
    console.log("✓ computeSimpleType handles non-existent type:", result2);

    // Test with a malformed identifier
    const malformedNode = ts.factory.createTypeReferenceNode(
      ts.factory.createIdentifier(""),
      undefined
    );

    const result3 = computeSimpleType(typeChecker, malformedNode);
    console.log("✓ computeSimpleType handles malformed node:", result3);

    // Test computeConstructorType
    const result4 = computeConstructorType(typeChecker, undefined);
    console.log("✓ computeConstructorType handles undefined:", result4);

    const result5 = computeConstructorType(typeChecker, complexTypeNode);
    console.log("✓ computeConstructorType handles complex type:", result5);

  } catch (error) {
    console.error("❌ Error in type computation:", error);
    throw error;
  }

  console.log("✓ All error handling tests passed!");
}

// Test registry functionality as well
function testRegistry() {
  console.log("Testing registry error handling...");

  const registry = new SourceFileRegistry();

  // Create a file with potentially problematic imports
  const complexContent = `
import type { NonExistent } from 'non-existent-module';
import { AnotherMissing } from './missing-file';

export class TestComponent {
  @Prop() someProperty: NonExistent;
}
`;

  try {
    const file = fileFromString(
      "src/test.tsx",
      complexContent,
      ts.ScriptTarget.Latest,
      registry,
      true
    );

    console.log("✓ Successfully created file with missing imports");

    // Test import rewriting
    file.rewriteRelativeImports("src", "dist");
    console.log("✓ Successfully rewrote imports without crashing");

  } catch (error) {
    console.error("❌ Error in registry operations:", error);
    throw error;
  }

  console.log("✓ Registry error handling tests passed!");
}

// Run the tests
try {
  testErrorHandling();
  testRegistry();
  console.log("\n🎉 All tests completed successfully! The error handling should prevent TypeScript symbol resolution crashes.");
} catch (error) {
  console.error("\n💥 Test failed:", error);
  process.exit(1);
}
