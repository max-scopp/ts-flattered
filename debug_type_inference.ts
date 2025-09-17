#!/usr/bin/env bun

import { computeConstructorType } from './src/helpers/type';
import ts from 'typescript';

// Simple test with direct type creation
const sourceCode = `
type Color = 'red' | 'blue' | 'green';

interface TestComponent {
  color?: Color;
  name?: string;
  count?: number;
}
`;

const sourceFile = ts.createSourceFile(
  'debug.ts',
  sourceCode,
  ts.ScriptTarget.Latest,
  true
);

const program = ts.createProgram(['debug.ts'], {
  target: ts.ScriptTarget.Latest,
  module: ts.ModuleKind.ESNext,
}, {
  getSourceFile: (fileName) => fileName === 'debug.ts' ? sourceFile : undefined,
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

console.log('=== Debug Type Inference ===\n');

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

const testProps = ['color', 'name', 'count'];

for (const propName of testProps) {
  console.log(`\n=== Testing ${propName} ===`);
  
  // Find the property in the interface
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
  console.log(`Type symbol: ${type.symbol?.name || 'none'}`);
  
  // Test our function
  const simpleType = require('./src/helpers/type').computeSimpleType(checker, property.type);
  console.log(`Simple type result:`, simpleType);
  
  // Also test the recursive resolution directly
  const type = checker.getTypeFromTypeNode(property.type);
  const recursiveResult = require('./src/helpers/type').resolveTypeRecursively?.(checker, type);
  console.log(`Recursive resolution:`, recursiveResult);
  
  const result = computeConstructorType(checker, property.type);
  
  console.log(`Result type: ${typeof result}`);
  console.log(`Result:`, result);
  
  if (result) {
    console.log(`Result kind: ${ts.SyntaxKind[result.kind]}`);
    if (ts.isCallExpression(result)) {
      console.log(`Call expression detected`);
      console.log(`Expression:`, result.expression);
      console.log(`Arguments:`, result.arguments);
      
      if (ts.isIdentifier(result.expression)) {
        console.log(`Function name: ${result.expression.text}`);
        if (result.arguments.length > 0 && ts.isStringLiteral(result.arguments[0])) {
          console.log(`First argument: "${result.arguments[0].text}"`);
        }
      }
    } else {
      console.log(`Not a call expression`);
    }
  } else {
    console.log(`Result is null`);
  }
}