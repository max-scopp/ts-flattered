/**
 * Simple trivia handler example showing basic usage
 */

import { todoComment } from "../src/helpers/commentPresets";
import {
  blockComment,
  jsdocComment,
  paramTag,
  returnsTag,
} from "../src/helpers/trivia";
import {
  $number,
  $string,
  block,
  const_,
  file,
  func,
  klass,
  param,
  prop,
} from "../src/public_api";

// Example 1: Class with JSDoc comment
const userClass = klass("User")
  .$export()
  .addLeadingComment(
    jsdocComment("Represents a user in the system", [
      { name: "example", text: "const user = new User();" },
      { name: "since", text: "1.0.0" },
    ]),
  )
  .addMember(
    prop("name", $string())
      .$private()
      .addLeadingComment(jsdocComment("The user's name")),
  )
  .addMember(
    prop("age", $number())
      .$private()
      .addLeadingComment(jsdocComment("The user's age")),
  );

// Example 2: Function with comprehensive JSDoc
const greetFunction = func("greet", [param("message", $string())], block([]))
  .$export()
  .addLeadingComment(
    jsdocComment("Greets the user", [
      paramTag("message", "The greeting message", "string"),
      returnsTag("The greeting response", "string"),
    ]),
  );

// Example 3: Variable with different comment types
const config = const_("CONFIG", undefined)
  .addLeadingComment(blockComment("Application configuration"))
  .addTrailingComment(todoComment("Load from environment"));

// Create a file with all examples
const sourceFile = file("trivia_example.ts")
  .addStatement(userClass)
  .addStatement(greetFunction)
  .addStatement(config);

console.log("=== Trivia Handler Example ===");
console.log(sourceFile.print());
