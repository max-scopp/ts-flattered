import { SourceFileRegistry } from "./src/modules/registry";
import { file } from "./src/modules/file";

// Create a simple test
const registry = new SourceFileRegistry();

// Create test files
const componentFile = file("MyComponent.tsx")
  .addImport("../utils/helper", ["helper"])
  .addImport("./types", ["ComponentProps"]);

const utilsFile = file("helper.tsx")
  .addImport("../types/common", ["CommonType"]);

// Register files with their current paths
registry.registerFile("src/components/MyComponent.tsx", componentFile);
registry.registerFile("src/components/utils/helper.tsx", utilsFile);

console.log("=== BEFORE REWRITE ===");
registry.debugState();

// Test the rewrite functionality
console.log("\n=== STARTING REWRITE ===");
registry.rewriteAllRelativeImports("src/components", "src/out");

console.log("\n=== AFTER REWRITE ===");
registry.debugState();

// Test the writeAllFiles functionality
console.log("\n=== WRITE FILES ===");
const files = registry.writeAllFiles();

for (const [path, content] of files) {
  console.log(`\n--- ${path} ---`);
  console.log(content.slice(0, 200) + "...");
}
