import { file, SourceFileRegistry } from "./src/modules/file";

/**
 * Test the import rewriting and printing functionality
 */
async function testImportRewritingAndPrinting() {
  console.log("Testing import rewriting and printing...");

  try {
    // Create a registry
    const registry = new SourceFileRegistry();

    // Create a source file with imports
    const sourceContent = `
import React from 'react';
import { Button } from './components/Button';
import { utils } from '../utils/helpers';

export const App: React.FC = () => {
  return (
    <div>
      <Button>Click me</Button>
      {utils.formatText('Hello World')}
    </div>
  );
};
`;

    // Create the file with auto-registration
    const appFile = file({
      fileName: "src/App.tsx",
      content: sourceContent,
      registry,
      autoRegister: true
    });

    console.log("✓ File created successfully");

    // Test adding imports
    appFile.addOrUpdateImport({
      moduleSpecifier: "react",
      namedImports: ["useEffect", "useState"]
    });

    console.log("✓ Imports added successfully");

    // Test rewriting relative imports
    appFile.rewriteRelativeImports("src", "dist");

    console.log("✓ Relative imports rewritten successfully");

    // Test printing
    const result = await appFile.print();

    console.log("✓ File printed successfully");
    console.log("Final output:");
    console.log("=".repeat(50));
    console.log(result);
    console.log("=".repeat(50));

    // Test getting dependencies
    const deps = registry.getImportDependencies("src/App.tsx");
    console.log("✓ Dependencies retrieved:", deps.length, "imports found");

    console.log("\n🎉 All tests passed!");

  } catch (error) {
    console.error("❌ Test failed:", error);
    throw error;
  }
}

// Run the test
testImportRewritingAndPrinting().then(() => {
  console.log("Test completed successfully");
}).catch((error) => {
  console.error("Test failed:", error);
  process.exit(1);
});
