import { $, arrow, block, call, exprStmt } from "./public_api";

console.log("Testing arrow function...");

// Test basic arrow creation
const basicArrow = arrow();
console.log("Basic arrow created:", basicArrow);
console.log("Type:", typeof basicArrow.body);

// Test with simple body
try {
  const simpleArrow = arrow([]).body(block([]));
  console.log("Simple arrow with body:", simpleArrow.get());
} catch (e) {
  console.error("Error creating arrow with body:", e);
}

console.log("Test completed.");
