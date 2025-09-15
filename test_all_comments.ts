/**
 * Test all comment types
 */

import { blockComment, jsdocComment, lineComment } from "./src/helpers/trivia";
import { file, interface_, prop } from "./src/public_api";

console.log("Testing all comment types...");

try {
  const testFile = file("test.d.ts");

  // Test JSDoc comment
  const jsdocInterface = interface_("JSDocTest").addLeadingComment(
    jsdocComment("This is a JSDoc comment"),
  );

  // Test line comment
  const lineInterface = interface_("LineTest").addLeadingComment(
    lineComment("This is a line comment"),
  );

  // Test block comment
  const blockInterface = interface_("BlockTest").addLeadingComment(
    blockComment("This is a block comment"),
  );

  testFile.addStatement(jsdocInterface.get());
  testFile.addStatement(lineInterface.get());
  testFile.addStatement(blockInterface.get());

  testFile.print().then((result) => {
    console.log("Generated TypeScript:");
    console.log("=".repeat(50));
    console.log(result);
  });
} catch (error) {
  console.error("Error:", error);
}
