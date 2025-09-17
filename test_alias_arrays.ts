#!/usr/bin/env bun

import ts from "typescript";
import { computeConstructorType } from "./src/helpers/type";

// Test type alias array detection
const sourceCode = `
type StringArray = string[];
type NumberList = Array<number>;

interface TestComponent {
  directArray?: string[];
  aliasArray?: StringArray;
  genericArray?: NumberList;
}
`;

const sourceFile = ts.createSourceFile(
  "alias-array-test.ts",
  sourceCode,
  ts.ScriptTarget.Latest,
  true,
);

const program = ts.createProgram(
  ["alias-array-test.ts"],
  {
    target: ts.ScriptTarget.Latest,
    module: ts.ModuleKind.ESNext,
  },
  {
    getSourceFile: (fileName) =>
      fileName === "alias-array-test.ts" ? sourceFile : undefined,
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

console.log("=== Type Alias Array Detection Test ===\n");

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

const testCases = ["directArray", "aliasArray", "genericArray"];

for (const propName of testCases) {
  console.log(`\n=== Testing ${propName} ===`);

  const property = testInterface.members.find(
    (member) =>
      ts.isPropertySignature(member) &&
      member.name &&
      ts.isIdentifier(member.name) &&
      member.name.text === propName,
  ) as ts.PropertySignature | undefined;

  if (!property || !property.type) {
    console.log(`❌ Property '${propName}' not found`);
    continue;
  }

  console.log(`Property type node kind: ${ts.SyntaxKind[property.type.kind]}`);
  console.log(`Property type text: ${property.type.getText(sourceFile)}`);

  // Add some debug info about type alias resolution
  if (
    ts.isTypeReferenceNode(property.type) &&
    ts.isIdentifier(property.type.typeName)
  ) {
    const symbol = checker.getSymbolAtLocation(property.type.typeName);
    console.log(`Symbol found: ${!!symbol}`);
    if (symbol?.declarations) {
      console.log(`Symbol has ${symbol.declarations.length} declarations`);
      for (const decl of symbol.declarations) {
        if (ts.isTypeAliasDeclaration(decl)) {
          console.log(
            `Type alias declaration type kind: ${ts.SyntaxKind[decl.type?.kind || 0]}`,
          );
          console.log(
            `Type alias declaration text: ${decl.type?.getText(sourceFile) || "none"}`,
          );
          if (decl.type) {
            if (ts.isArrayTypeNode(decl.type)) {
              console.log(`✓ Detected as array type node`);
            } else if (ts.isTypeReferenceNode(decl.type)) {
              console.log(`✓ Detected as type reference node`);
              if (
                ts.isIdentifier(decl.type.typeName) &&
                decl.type.typeName.text === "Array"
              ) {
                console.log(`✓ Detected as Array<T> generic`);
              }
            }
          }
        }
      }
    }
  }

  const simpleType = require("./src/helpers/type").computeSimpleType(
    checker,
    property.type,
  );
  console.log(`Simple type result:`, simpleType);

  const result = computeConstructorType(checker, property.type);

  if (result && ts.isIdentifier(result)) {
    console.log(`Constructor: ${result.text}`);
  } else {
    console.log(`Constructor: null or not identifier`);
  }
}
