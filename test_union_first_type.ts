#!/usr/bin/env bun

import { computeConstructorType } from './src/helpers/type';
import ts from 'typescript';

// Test the specific case: string | string[]
const sourceCode = `
interface TestComponent {
  // This should resolve to String (first type in union)
  cssClass?: string | string[];
  
  // Other union cases to test
  numberOrArray?: number | number[];
  booleanOrString?: boolean | string;
  stringOrUndefined?: string | undefined;
  arrayOrString?: string[] | string;
}
`;

const sourceFile = ts.createSourceFile(
  'union-test.ts',
  sourceCode,
  ts.ScriptTarget.Latest,
  true
);

const program = ts.createProgram(['union-test.ts'], {
  target: ts.ScriptTarget.Latest,
  module: ts.ModuleKind.ESNext,
}, {
  getSourceFile: (fileName) => fileName === 'union-test.ts' ? sourceFile : undefined,
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

console.log('=== Union Type First-Type Inference Test ===\n');

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

const testCases = [
  { prop: 'cssClass', union: 'string | string[]', expected: 'String' },
  { prop: 'numberOrArray', union: 'number | number[]', expected: 'Number' },
  { prop: 'booleanOrString', union: 'boolean | string', expected: 'Boolean' },
  { prop: 'stringOrUndefined', union: 'string | undefined', expected: 'String' },
  { prop: 'arrayOrString', union: 'string[] | string', expected: 'Array' },
];

let passed = 0;
let failed = 0;

for (const testCase of testCases) {
  console.log(`\n=== Testing ${testCase.prop}: ${testCase.union} ===`);
  
  // Find the property in the interface
  const property = testInterface.members.find(member => 
    ts.isPropertySignature(member) && 
    member.name && 
    ts.isIdentifier(member.name) && 
    member.name.text === testCase.prop
  ) as ts.PropertySignature | undefined;

  if (!property || !property.type) {
    console.log(`❌ Property '${testCase.prop}' not found`);
    failed++;
    continue;
  }

  console.log(`Property type: ${property.type.getText(sourceFile)}`);
  
  // Get the type from the type checker
  const type = checker.getTypeFromTypeNode(property.type);
  console.log(`Type flags: ${type.flags} (${ts.TypeFlags[type.flags] || 'Unknown'})`);
  
  if (type.flags & ts.TypeFlags.Union) {
    const unionType = type as ts.UnionType;
    console.log(`Union has ${unionType.types.length} types:`);
    unionType.types.forEach((t, i) => {
      console.log(`  ${i}: ${checker.typeToString(t)} (flags: ${t.flags})`);
    });
  }
  
  const result = computeConstructorType(checker, property.type);
  
  if (!result) {
    console.log(`❌ Returned null`);
    failed++;
    continue;
  }
  
  // Check if it's an identifier and get its text
  let constructorName = 'Object'; // default
  
  if (ts.isIdentifier(result)) {
    constructorName = result.text;
  }
  
  const status = constructorName === testCase.expected ? '✅ PASS' : '❌ FAIL';
  
  console.log(`Expected: ${testCase.expected}`);
  console.log(`Got: ${constructorName}`);
  console.log(`Status: ${status}`);
  
  if (status === '✅ PASS') {
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