import { SourceFileRegistry } from "./src/modules/registry";
import { file } from "./src/modules/file";
import ts from "typescript";

console.log("=== REAL AST NODES TEST ===");

const registry = new SourceFileRegistry();

// Create proper TypeScript AST statement
const exportStatement = ts.factory.createVariableStatement(
  [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
  ts.factory.createVariableDeclarationList(
    [ts.factory.createVariableDeclaration(
      "MyComponent",
      undefined,
      undefined,
      ts.factory.createArrowFunction(
        undefined,
        undefined,
        [],
        undefined,
        ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
        ts.factory.createJsxElement(
          ts.factory.createJsxOpeningElement(
            ts.factory.createIdentifier("div"),
            undefined,
            []
          ),
          [],
          ts.factory.createJsxClosingElement(ts.factory.createIdentifier("div"))
        )
      )
    )],
    ts.NodeFlags.Const
  )
);

// Create files with proper AST nodes
const componentFile = file("MyComponent.tsx")
  .addImport({
    moduleSpecifier: "../utils/helper",
    namedImports: ["helper"]
  })
  .addImport({
    moduleSpecifier: "./types",
    namedImports: ["ComponentProps"]
  })
  .addStatement(exportStatement);

const helperExportStatement = ts.factory.createVariableStatement(
  [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
  ts.factory.createVariableDeclarationList(
    [ts.factory.createVariableDeclaration(
      "helper",
      undefined,
      undefined,
      ts.factory.createArrowFunction(
        undefined,
        undefined,
        [],
        undefined,
        ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
        ts.factory.createBlock([])
      )
    )],
    ts.NodeFlags.Const
  )
);

const utilsFile = file("helper.tsx")
  .addImport({
    moduleSpecifier: "../types/common",
    namedImports: ["CommonType"]
  })
  .addStatement(helperExportStatement);

// Register files
registry.registerFile("src/components/MyComponent.tsx", componentFile);
registry.registerFile("src/components/utils/helper.tsx", utilsFile);

console.log("\n=== BEFORE REWRITE ===");
registry.debugState();

// Test the rewrite
console.log("\n=== PERFORMING REWRITE ===");
registry.rewriteAllRelativeImports("src/components", "src/out");

console.log("\n=== AFTER REWRITE ===");
registry.debugState();

// Test writing files
console.log("\n=== WRITING FILES ===");
try {
  const files = registry.writeAllFiles();

  files.forEach((content, filePath) => {
    console.log(`\n--- ${filePath} ---`);
    if (typeof content === 'string') {
      // Show first 200 chars to avoid cluttering output
      console.log(content.substring(0, 200) + (content.length > 200 ? '...' : ''));
    } else {
      console.log('❌ Content is not string:', typeof content);
    }
  });
} catch (error) {
  console.error("Error writing files:", error);
}
