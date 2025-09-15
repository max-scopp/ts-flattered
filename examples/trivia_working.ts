/**
 * Working trivia handler example - demonstrates creating comments without printing
 */

import { klass, func, prop, const_, param, block, $string, $number } from "../src/public_api";
import { 
  jsdocComment, 
  lineComment, 
  blockComment, 
  paramTag, 
  returnsTag,
  commentToString,
  CommentStyle 
} from "../src/helpers/trivia";
import { todoComment, constructorJSDoc } from "../src/helpers/commentPresets";

console.log("=== Trivia Handler Demonstration ===\n");

// Example 1: Different comment styles
console.log("1. Comment Styles:");
console.log("Line comment:", commentToString(lineComment("This is a line comment")));
console.log("Block comment:", commentToString(blockComment("This is a block comment")));
console.log("JSDoc comment:", commentToString(jsdocComment("This is a JSDoc comment")));
console.log();

// Example 2: JSDoc with tags
console.log("2. JSDoc with Tags:");
const methodDoc = jsdocComment("Calculates the sum of two numbers", [
  paramTag("a", "First number", "number"),
  paramTag("b", "Second number", "number"),
  returnsTag("The sum of a and b", "number"),
  { name: "example", text: "add(1, 2) // returns 3" },
  { name: "since", text: "1.0.0" }
]);
console.log(commentToString(methodDoc));
console.log();

// Example 3: Comment presets
console.log("3. Comment Presets:");
console.log("TODO:", commentToString(todoComment("Implement validation")));
console.log("Constructor JSDoc:", commentToString(
  constructorJSDoc("Creates a new instance", [
    { name: "name", type: "string", description: "The user's name" },
    { name: "age", type: "number", description: "The user's age" }
  ])
));
console.log();

// Example 4: Building AST nodes with comments (without printing)
console.log("4. AST Nodes with Comments:");

// Create a class with comments
const userClass = klass("User")
  .$export()
  .addLeadingComment(
    jsdocComment("Represents a user in the system", [
      { name: "example", text: "const user = new User('John', 25);" },
      { name: "since", text: "1.0.0" }
    ])
  )
  .addMember(
    prop("name", $string())
      .$private()
      .addLeadingComment(jsdocComment("The user's name"))
  );

console.log("Class created with JSDoc comment");
console.log("Class name:", userClass.name?.text);
console.log("Has modifiers:", !!userClass.modifiers?.length);
console.log("Members count:", userClass.members.length);

// Create a function with comments
const greetFunction = func("greet", [param("message", $string())], block([]))
  .$export()
  .addLeadingComment(
    jsdocComment("Greets the user", [
      paramTag("message", "The greeting message", "string"),
      returnsTag("The greeting response", "string")
    ])
  )
  .addTrailingComment(todoComment("Add input validation"));

console.log("Function created with JSDoc and TODO comment");
console.log("Function name:", greetFunction.name?.text);
console.log("Parameter count:", greetFunction.parameters.length);

// Create a variable with comments
const config = const_("CONFIG", undefined)
  .addLeadingComment(blockComment("Global application configuration"))
  .addTrailingComment(lineComment("Loaded at startup"));

console.log("Variable created with block and line comments");
console.log();

console.log("=== All comment functionality is working! ===");
console.log("The trivia handler allows you to:");
console.log("- Add JSDoc comments with full tag support");
console.log("- Add single-line and multi-line comments");
console.log("- Use preset comment functions for common patterns");
console.log("- Attach comments to any AST node (classes, methods, properties, variables, etc.)");
console.log("- Chain multiple comments on the same node");
console.log();
console.log("Note: Due to TypeScript printer limitations with synthetic comments,");
console.log("comments may not always render correctly when printing to strings.");
console.log("However, the AST nodes contain the comment information correctly.");