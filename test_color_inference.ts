import ts from "typescript";
import { computeConstructorType } from "./src/helpers/type";

// Create the exact type structure from your Ionic/Stencil codebase
const sourceCode = `
export type PredefinedColors =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'light'
  | 'medium'
  | 'dark';

export type LiteralUnion<T extends U, U = string> = T | (U & Record<never, never>);

export type Color = LiteralUnion<PredefinedColors, string>;

export class TestComponent {
  color?: Color;
  predefinedColors?: PredefinedColors;
  simpleString?: string;
  optionalNumber?: number;
}
`;

// Create TypeScript program
const sourceFile = ts.createSourceFile(
  "test.ts",
  sourceCode,
  ts.ScriptTarget.Latest,
  true
);

const program = ts.createProgram(["test.ts"], {}, {
  getSourceFile: (fileName) => fileName === "test.ts" ? sourceFile : undefined,
  writeFile: () => {},
  getCanonicalFileName: (fileName) => fileName,
  useCaseSensitiveFileNames: () => true,
  getNewLine: () => "\n",
  fileExists: (fileName) => fileName === "test.ts",
  readFile: () => undefined,
  directoryExists: () => true,
  getDirectories: () => [],
  getDefaultLibFileName: () => "lib.d.ts",
  getCurrentDirectory: () => "/"
});

const checker = program.getTypeChecker();

// Find the class properties
function findClassProperty(propertyName: string): ts.TypeNode | undefined {
  function visit(node: ts.Node): ts.TypeNode | undefined {
    if (ts.isClassDeclaration(node) && node.name?.text === "TestComponent") {
      for (const member of node.members) {
        if (ts.isPropertyDeclaration(member) && 
            ts.isIdentifier(member.name) && 
            member.name.text === propertyName) {
          return member.type;
        }
      }
    }
    return ts.forEachChild(node, visit);
  }
  return visit(sourceFile);
}

console.log("=== Stencil/Ionic Color Type Inference Test ===\n");

// Test the exact case from your breadcrumbs component
const colorType = findClassProperty("color");
if (colorType) {
  const constructorExpr = computeConstructorType(checker, colorType);
  const actualType = checker.getTypeFromTypeNode(colorType);
  
  console.log("color?: Color");
  console.log("  TypeScript infers as:", checker.typeToString(actualType));
  console.log("  Constructor result:", constructorExpr ? 
    (constructorExpr.kind === ts.SyntaxKind.Identifier ? 
      `expr("${(constructorExpr as ts.Identifier).text}")` : 
      "unknown expression") : 
    "null");
  console.log("  Expected: expr(\"String\")");
  console.log("  Status:", constructorExpr && 
    constructorExpr.kind === ts.SyntaxKind.Identifier && 
    (constructorExpr as ts.Identifier).text === "String" ? "✅ PASS" : "❌ FAIL");
  console.log();
}

// Test PredefinedColors (should work correctly)
const predefinedColorsType = findClassProperty("predefinedColors");
if (predefinedColorsType) {
  const constructorExpr = computeConstructorType(checker, predefinedColorsType);
  
  console.log("predefinedColors?: PredefinedColors");
  console.log("  Constructor result:", constructorExpr ? 
    (constructorExpr.kind === ts.SyntaxKind.Identifier ? 
      `expr("${(constructorExpr as ts.Identifier).text}")` : 
      "unknown expression") : 
    "null");
  console.log("  Expected: expr(\"String\")");
  console.log("  Status:", constructorExpr && 
    constructorExpr.kind === ts.SyntaxKind.Identifier && 
    (constructorExpr as ts.Identifier).text === "String" ? "✅ PASS" : "❌ FAIL");
  console.log();
}

// Test simple string (baseline)
const simpleStringType = findClassProperty("simpleString");
if (simpleStringType) {
  const constructorExpr = computeConstructorType(checker, simpleStringType);
  
  console.log("simpleString?: string");
  console.log("  Constructor result:", constructorExpr ? 
    (constructorExpr.kind === ts.SyntaxKind.Identifier ? 
      `expr("${(constructorExpr as ts.Identifier).text}")` : 
      "unknown expression") : 
    "null");
  console.log("  Expected: expr(\"String\")");
  console.log("  Status:", constructorExpr && 
    constructorExpr.kind === ts.SyntaxKind.Identifier && 
    (constructorExpr as ts.Identifier).text === "String" ? "✅ PASS" : "❌ FAIL");
  console.log();
}