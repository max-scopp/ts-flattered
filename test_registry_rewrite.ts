import { file, SourceFileRegistry } from "./src/modules/file";

/**
 * Test to reproduce and fix the "completely empties source files" issue
 */
async function testRegistryRewriteIssue() {
  console.log("Testing registry rewrite issue...");

  const registry = new SourceFileRegistry();

  // Simulate your scenario - create some source files and register them
  const sourceFile1 = file({
    fileName: "src/components/Button.tsx",
    content: `
import React from 'react';
import { BaseProps } from '../types/common';
import { theme } from './theme/colors';

export const Button: React.FC<BaseProps> = (props) => {
  return <button style={{ color: theme.primary }} {...props} />;
};
`,
    registry,
    autoRegister: true
  });

  const sourceFile2 = file({
    fileName: "src/utils/helpers.ts",
    content: `
import { format } from '../lib/formatter';

export const formatText = (text: string) => format(text);
`,
    registry,
    autoRegister: true
  });

  console.log("✓ Created and registered source files");

  // Debug initial state
  console.log("\n--- BEFORE REWRITING ---");
  registry.debugState();

  // Check that files have content before rewriting
  const beforeRewrite1 = await sourceFile1.print();
  const beforeRewrite2 = await sourceFile2.print();

  console.log("\nFile 1 content length before:", beforeRewrite1.length);
  console.log("File 2 content length before:", beforeRewrite2.length);

  // Now perform the rewrite (this is what was causing the issue)
  const fromBase = "src";
  const outBase = "dist";

  console.log(`\n--- REWRITING FROM "${fromBase}" TO "${outBase}" ---`);
  registry.rewriteAllRelativeImports(fromBase, outBase);

  // Debug state after rewriting
  console.log("\n--- AFTER REWRITING ---");
  registry.debugState();

  // Get the files from registry (this is what your writeAllFiles does)
  const allFiles = registry.getAllWithPaths();

  console.log(`\n--- CHECKING FILES AFTER REWRITE ---`);
  console.log(`Registry has ${allFiles.size} files`);

  const fileEntries = Array.from(allFiles.entries());
  for (const [filePath, sf] of fileEntries) {
    console.log(`\nProcessing file: ${filePath}`);

    try {
      const printed = await sf.print();
      console.log(`  Content length: ${printed.length}`);
      console.log(`  Has imports: ${printed.includes('import')}`);

      if (printed.length === 0) {
        console.error(`  ❌ FILE IS EMPTY!`);
        console.log(`  SourceFile properties:`, {
          fileName: sf.fileName,
          hasStatements: !!sf.getStatements,
          statementsLength: sf.getStatements?.()?.length
        });
      } else {
        console.log(`  ✓ File has content`);
        // Show first few lines
        const lines = printed.split('\n').slice(0, 3);
        console.log(`  Preview: ${lines.join(' | ')}`);
      }
    } catch (error) {
      console.error(`  ❌ Error printing file:`, error);
    }
  }

  return allFiles;
}

// Run the test
testRegistryRewriteIssue().then((allFiles) => {
  console.log(`\n🎉 Test completed! Found ${allFiles.size} files in registry.`);
}).catch((error) => {
  console.error("❌ Test failed:", error);
  process.exit(1);
});
