import { SourceFileRegistry } from "./src/modules/registry";
import { file } from "./src/modules/file";

console.log("=== SIMPLE FILE MOVEMENT TEST ===");

const registry = new SourceFileRegistry();

// Create a simple file without complex imports for now
const simpleFile = file("SimpleComponent.tsx")
  .addStatement("export const SimpleComponent = () => <div>Hello</div>;");

registry.registerFile("src/components/SimpleComponent.tsx", simpleFile);

console.log("Before:", [...registry.getAll().keys()]);

// Move without import rewriting first
const newFiles = new Map<string, any>();
for (const [path, sourceFile] of registry.getAll()) {
  const newPath = path.replace("src/components", "src/out");
  newFiles.set(newPath, sourceFile);
}

// Clear and re-populate
registry.clear();
for (const [path, sourceFile] of newFiles) {
  registry.registerFile(path, sourceFile);
}

console.log("After:", [...registry.getAll().keys()]);

// Test writing
const files = registry.writeAllFiles();
for (const [path, content] of files) {
  console.log(`\n--- ${path} ---`);
  console.log(content);
}
