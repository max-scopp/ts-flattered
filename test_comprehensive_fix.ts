import { SourceFileRegistry } from "./src/modules/registry";
import { file } from "./src/modules/file";

console.log("=== COMPREHENSIVE AST & PATH FIX TEST ===");

const registry = new SourceFileRegistry();

// Test the fixed addStatement method with strings
const componentFile = file("MyComponent.tsx")
  .addImport({
    moduleSpecifier: "../utils/helper",
    namedImports: ["helper"]
  })
  .addImport({
    moduleSpecifier: "./types",
    namedImports: ["ComponentProps"]
  })
  .addStatement("export const MyComponent = () => <div>Hello</div>;")
  .addStatement("export interface Props { name: string; }");

const utilsFile = file("helper.tsx")
  .addImport({
    moduleSpecifier: "../types/common",
    namedImports: ["CommonType"]
  })
  .addStatement("export const helper = () => {};")
  .addStatement("export type HelperType = string;");

// Test with nested paths like in your real example
registry.registerFile("src/components/MyComponent.tsx", componentFile);
registry.registerFile("src/components/utils/helper.tsx", utilsFile);

console.log("\n=== BEFORE REWRITE ===");
registry.debugState();

// Try generating content before rewrite to see if the AST nodes are properly formed
console.log("\n=== TESTING AST NODES BEFORE REWRITE ===");
try {
  const beforeFiles = registry.writeAllFiles();
  beforeFiles.forEach((content, filePath) => {
    console.log(`${filePath}: ${typeof content === 'string' ? 'SUCCESS' : 'FAILED'} (${typeof content})`);
    if (typeof content === 'string') {
      console.log(`  Content preview: ${content.substring(0, 100)}...`);
    }
  });
} catch (error) {
  console.error("Error generating files before rewrite:", error);
}

// Test the import rewriting with improved path calculation
console.log("\n=== PERFORMING REWRITE ===");
registry.rewriteAllRelativeImports("src/components", "src/out");

console.log("\n=== AFTER REWRITE ===");
registry.debugState();

// Test file generation after rewrite
console.log("\n=== TESTING FILES AFTER REWRITE ===");
const files = registry.writeAllFiles();

files.forEach((content, filePath) => {
  console.log(`\n--- ${filePath} ---`);
  if (typeof content === 'string') {
    console.log(content);
  } else {
    console.log('❌ ERROR: Content is not string:', typeof content);
  }
});