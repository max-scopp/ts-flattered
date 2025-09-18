import { SourceFileRegistry } from "./src/modules/registry";
import { file } from "./src/modules/file";

console.log("=== PROPER AST IMPORT REWRITING TEST ===");

const registry = new SourceFileRegistry();

// Create files with proper import structure
const componentFile = file("MyComponent.tsx")
  .addImport({
    moduleSpecifier: "../utils/helper",
    namedImports: ["helper"]
  })
  .addImport({
    moduleSpecifier: "./types",
    namedImports: ["ComponentProps"]
  })
  .addStatement("export const MyComponent = () => <div>Hello</div>;");

const utilsFile = file("helper.tsx")
  .addImport({
    moduleSpecifier: "../types/common",
    namedImports: ["CommonType"]
  })
  .addStatement("export const helper = () => {};");

// Register files with their paths
registry.registerFile("src/components/MyComponent.tsx", componentFile);
registry.registerFile("src/components/utils/helper.tsx", utilsFile);

console.log("\n=== BEFORE REWRITE ===");
registry.debugState();

// Perform the import rewriting
console.log("\n=== PERFORMING REWRITE ===");
registry.rewriteAllRelativeImports("src/components", "src/out");

console.log("\n=== AFTER REWRITE ===");
registry.debugState();

// Test file generation
console.log("\n=== GENERATING FILES ===");
const files = registry.writeAllFiles();

for (const [filePath, content] of files.entries()) {
  console.log(`\n--- ${filePath} ---`);
  if (typeof content === 'string') {
    console.log(content);
  } else {
    console.log('Error: Content is not a string:', typeof content);
  }
}
