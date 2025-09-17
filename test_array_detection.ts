#!/usr/bin/env bun

import { computeConstructorType } from './src/helpers/type';
import ts from 'typescript';

// Test array type detection
const sourceCode = `
interface TestComponent {
  simpleArray?: string[];
  numberArray?: number[];
  booleanArray?: boolean[];
}
`;

const sourceFile = ts.createSourceFile(
  'array-test.ts',
  sourceCode,
  ts.ScriptTarget.Latest,
  true
);

const program = ts.createProgram(['array-test.ts'], {
  target: ts.ScriptTarget.Latest,
  module: ts.ModuleKind.ESNext,
}, {
  getSourceFile: (fileName) => fileName === 'array-test.ts' ? sourceFile : undefined,
  writeFile: () => {},
  getCurrentDirectory: () => '',
  getDirectories: () => [],
  fileExists: () => true,
  readFile: () => '',
  getCanonicalFileName: (fileName) => fileName,
  useCaseSensitiveFileNames: () => true,
  getNewLine: () => '\n',
  getDefaultLibFileName: () => 'lib.d.ts',
});

const checker = program.getTypeChecker();

console.log('=== Array Type Detection Test ===\n');

// Find the TestComponent interface
function findInterface(): ts.InterfaceDeclaration | undefined {
  function visit(node: ts.Node): ts.InterfaceDeclaration | undefined {
    if (ts.isInterfaceDeclaration(node) && node.name.text === 'TestComponent') {
      return node;
    }
    return ts.forEachChild(node, visit);
  }
  return visit(sourceFile);
}

const testInterface = findInterface();
if (!testInterface) {
  console.error('TestComponent interface not found!');
  process.exit(1);
}

const testCases = ['simpleArray', 'numberArray', 'booleanArray'];

for (const propName of testCases) {
  console.log(`\n=== Testing ${propName} ===`);
  
  const property = testInterface.members.find(member => 
    ts.isPropertySignature(member) && 
    member.name && 
    ts.isIdentifier(member.name) && 
    member.name.text === propName
  ) as ts.PropertySignature | undefined;

  if (!property || !property.type) {
    console.log(`❌ Property '${propName}' not found`);
    continue;
  }

  console.log(`Property type node kind: ${ts.SyntaxKind[property.type.kind]}`);
  console.log(`Property type text: ${property.type.getText(sourceFile)}`);
  
  // Get the type from the type checker
  const type = checker.getTypeFromTypeNode(property.type);
  console.log(`Type flags: ${type.flags} (${ts.TypeFlags[type.flags] || 'Unknown'})`);
  
  const simpleType = require('./src/helpers/type').computeSimpleType(checker, property.type);
  console.log(`Simple type result:`, simpleType);
  
  const result = computeConstructorType(checker, property.type);
  
  if (result && ts.isIdentifier(result)) {
    console.log(`Constructor: ${result.text}`);
  } else {
    console.log(`Constructor: null or not identifier`);
  }
}