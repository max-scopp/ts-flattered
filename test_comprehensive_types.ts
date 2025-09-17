#!/usr/bin/env bun

import ts from "typescript";
import { computeConstructorType } from "./src/helpers/type";

// Create a test TypeScript program with various complex type patterns
const sourceCode = `
// Basic types
type SimpleString = string;
type SimpleNumber = number;
type SimpleBoolean = boolean;

// String literal unions  
type Direction = 'up' | 'down' | 'left' | 'right';
type Theme = 'light' | 'dark' | 'auto';

// Generic utility types
type LiteralUnion<T extends U, U = string> = T | (U & Record<never, never>);

// Color system types (real-world case)
type PredefinedColors = 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
type Color = LiteralUnion<PredefinedColors, string>;

// More complex patterns
type Size = LiteralUnion<'small' | 'medium' | 'large', string>;
type ButtonVariant = LiteralUnion<'filled' | 'outline' | 'text', string>;

// Union with primitives
type MixedUnion = string | number;
type OptionalString = string | undefined;
type NullableString = string | null;

// Function types
type EventHandler = (event: Event) => void;
type AsyncHandler = () => Promise<void>;

// Array types
type StringArray = string[];
type NumberList = Array<number>;

// Object types
type UserConfig = { name: string; age: number };

// Test interface
interface TestComponent {
  // Basic types
  simpleString?: SimpleString;
  simpleNumber?: SimpleNumber;
  simpleBoolean?: SimpleBoolean;
  
  // String literal unions
  direction?: Direction;
  theme?: Theme;
  
  // LiteralUnion patterns
  color?: Color;
  size?: Size;
  variant?: ButtonVariant;
  
  // Union types
  mixedUnion?: MixedUnion;
  optionalString?: OptionalString;
  nullableString?: NullableString;
  
  // Function types
  onEvent?: EventHandler;
  onAsync?: AsyncHandler;
  
  // Array types
  tags?: StringArray;
  numbers?: NumberList;
  
  // Object types
  config?: UserConfig;
}
`;

const sourceFile = ts.createSourceFile(
  "test.ts",
  sourceCode,
  ts.ScriptTarget.Latest,
  true,
);

const program = ts.createProgram(
  ["test.ts"],
  {},
  {
    getSourceFile: (fileName) =>
      fileName === "test.ts" ? sourceFile : undefined,
    writeFile: () => {},
    getCurrentDirectory: () => "",
    getDirectories: () => [],
    fileExists: () => true,
    readFile: () => "",
    getCanonicalFileName: (fileName) => fileName,
    useCaseSensitiveFileNames: () => true,
    getNewLine: () => "\n",
    getDefaultLibFileName: () => "lib.d.ts",
  },
);

const checker = program.getTypeChecker();

// Test cases with expected results
const testCases = [
  // Basic types
  { prop: "simpleString", expected: "String" },
  { prop: "simpleNumber", expected: "Number" },
  { prop: "simpleBoolean", expected: "Boolean" },

  // String literal unions
  { prop: "direction", expected: "String" },
  { prop: "theme", expected: "String" },

  // LiteralUnion patterns (key test cases)
  { prop: "color", expected: "String" },
  { prop: "size", expected: "String" },
  { prop: "variant", expected: "String" },

  // Union types
  { prop: "mixedUnion", expected: "String" }, // string | number should use first type (string)
  { prop: "optionalString", expected: "String" },
  { prop: "nullableString", expected: "String" },

  // Function types
  { prop: "onEvent", expected: "Function" },
  { prop: "onAsync", expected: "Function" },

  // Array types
  { prop: "tags", expected: "Array" },
  { prop: "numbers", expected: "Array" },

  // Object types
  { prop: "config", expected: "Object" },
];

console.log("=== Comprehensive Type Inference Test ===\n");

// Find the TestComponent interface
function findInterface(): ts.InterfaceDeclaration | undefined {
  function visit(node: ts.Node): ts.InterfaceDeclaration | undefined {
    if (ts.isInterfaceDeclaration(node) && node.name.text === "TestComponent") {
      return node;
    }
    return ts.forEachChild(node, visit);
  }
  return visit(sourceFile);
}

const testInterface = findInterface();
if (!testInterface) {
  console.error("TestComponent interface not found!");
  process.exit(1);
}

let passed = 0;
let failed = 0;

for (const testCase of testCases) {
  // Find the property in the interface
  const property = testInterface.members.find(
    (member) =>
      ts.isPropertySignature(member) &&
      member.name &&
      ts.isIdentifier(member.name) &&
      member.name.text === testCase.prop,
  ) as ts.PropertySignature | undefined;

  if (!property || !property.type) {
    console.log(`❌ Property '${testCase.prop}' not found`);
    failed++;
    continue;
  }

  // Get the type and test the constructor inference
  const result = computeConstructorType(checker, property.type);

  if (!result) {
    console.log(`❌ Property '${testCase.prop}' returned null`);
    failed++;
    continue;
  }

  // Check if it's an identifier and get its text
  let constructorName = "Object"; // default

  if (ts.isIdentifier(result)) {
    constructorName = result.text;
  }

  const status = constructorName === testCase.expected ? "✅ PASS" : "❌ FAIL";

  console.log(`${testCase.prop}: ${testCase.expected}`);
  console.log(`  Result: ${constructorName}`);
  console.log(`  Status: ${status}\n`);

  if (status === "✅ PASS") {
    passed++;
  } else {
    failed++;
  }
}

console.log(`\n=== Summary ===`);
console.log(`Passed: ${passed}/${testCases.length}`);
console.log(`Failed: ${failed}/${testCases.length}`);

if (failed > 0) {
  process.exit(1);
}
