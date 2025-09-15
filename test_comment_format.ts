/**
 * Test comment formatting issue
 */

import { file, interface_ } from "./src/public_api";
import { jsdocComment } from "./src/helpers/trivia";

console.log("Testing comment formatting...");

try {
  const testFile = file("test.d.ts");
  
  const testInterface = interface_("TestInterface")
    .addLeadingComment(jsdocComment("This is a test JSDoc comment"));
  
  testFile.addStatement(testInterface.get());
  
  testFile.print().then(result => {
    console.log("Generated TypeScript:");
    console.log("=".repeat(30));
    console.log(result);
    
    // Check for the comment formatting issue
    if (result.includes("/*/**")) {
      console.log("\n❌ Comment formatting issue detected: /*/**");
    } else if (result.includes("/**")) {
      console.log("\n✅ Comment formatting looks correct: /**");
    }
  });

} catch (error) {
  console.error("Error:", error);
}