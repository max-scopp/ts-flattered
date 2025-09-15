/**
 * Example demonstrating the trivia handler functionality
 * for adding comments to TypeScript AST nodes
 */

import ts from "typescript";
import {
  klass,
  method,
  prop,
  func,
  const_,
  param,
  block,
  ret,
  $string,
  $number,
  $,
} from "../src/public_api";

// Import trivia functionality
import {
  jsdocComment,
  lineComment,
  blockComment,
  createClassJSDoc,
  createMethodJSDoc,
  createPropertyJSDoc,
  paramTag,
  returnsTag,
  exampleTag,
  deprecatedTag,
  sinceTag,
  authorTag,
  CommentStyle,
} from "../src/helpers/trivia";

// Import comment presets
import {
  todoComment,
  fixmeComment,
  constructorJSDoc,
  getterJSDoc,
  setterJSDoc,
  functionJSDoc,
  variableJSDoc,
  fileHeaderComment,
} from "../src/helpers/commentPresets";

// Helper function to print the generated code
function printCode(node: ts.Node): string {
  const sourceFile = ts.createSourceFile(
    "example.ts",
    "",
    ts.ScriptTarget.Latest,
    false,
    ts.ScriptKind.TS,
  );

  const printer = ts.createPrinter({
    newLine: ts.NewLineKind.LineFeed,
    removeComments: false,
  });

  return printer.printNode(ts.EmitHint.Unspecified, node, sourceFile);
}

console.log("=== Trivia Handler Examples ===\n");

// Example 1: Class with JSDoc comment
console.log("1. Class with JSDoc comment:");
const userClass = klass("User", [
  prop("name", $string()).$private(),
  prop("age", $number()).$private(),
])
  .$export()
  .addLeadingComment(
    createClassJSDoc(
      "Represents a user in the system",
      {
        examples: [
          "const user = new User('John', 25);",
          "console.log(user.getName());",
        ],
        since: "1.0.0",
        author: "Development Team",
      },
    ),
  );

console.log(printCode(userClass.get()));
console.log("\n" + "=".repeat(50) + "\n");

// Example 2: Method with comprehensive JSDoc
console.log("2. Method with comprehensive JSDoc:");
const greetMethod = method(
  "greet",
  [param("greeting", $string())],
  block([ret($("Hello!"))]),
).addLeadingComment(
  createMethodJSDoc(
    "Greets the user with a custom message",
    [
      {
        name: "greeting",
        type: "string",
        description: "The greeting message to display",
      },
    ],
    "The formatted greeting string",
    "string",
    {
      examples: [
        "user.greet('Welcome'); // Returns 'Hello!'",
        "user.greet('Good morning'); // Returns 'Hello!'",
      ],
      since: "1.0.0",
      throws: [
        {
          type: "Error",
          description: "When greeting is empty",
        },
      ],
    },
  ),
);

console.log(printCode(greetMethod.get()));
console.log("\n" + "=".repeat(50) + "\n");

// Example 3: Property with JSDoc and inline comments
console.log("3. Property with JSDoc and inline comments:");
const configProperty = prop("config", ts.factory.createTypeReferenceNode("Config"))
  .$private()
  .$readonly()
  .addLeadingComment(
    createPropertyJSDoc(
      "Application configuration settings",
      {
        type: "Config",
        since: "1.1.0",
        see: ["ConfigLoader", "DefaultConfig"],
      },
    ),
  )
  .addTrailingComment(lineComment("Initialized in constructor"));

console.log(printCode(configProperty.get()));
console.log("\n" + "=".repeat(50) + "\n");

// Example 4: Function with TODO and FIXME comments
console.log("4. Function with TODO and FIXME comments:");
const processDataFunction = func(
  "processData",
  [param("data", ts.factory.createTypeReferenceNode("unknown"))],
  block([ret($("processed"))]),
)
  .$export()
  .addLeadingComment(
    functionJSDoc(
      "Processes incoming data",
      [
        {
          name: "data",
          type: "unknown",
          description: "The data to process",
        },
      ],
      "The processed data",
      "any",
      {
        deprecated: "Use processDataV2 instead",
      },
    ),
  )
  .addTrailingComment(todoComment("Add validation logic"))
  .addTrailingComment(fixmeComment("Handle edge cases for null data"));

console.log(printCode(processDataFunction.get()));
console.log("\n" + "=".repeat(50) + "\n");

// Example 5: Variable with different comment styles
console.log("5. Variable with different comment styles:");
const apiUrlConstant = const_("API_URL", $("https://api.example.com"))
  .$export()
  .addLeadingComment(blockComment("Base URL for all API endpoints"))
  .addLeadingComment(
    variableJSDoc(
      "The base URL used for all API requests",
      "string",
      {
        constant: true,
        since: "1.0.0",
      },
    ),
  );

console.log(printCode(apiUrlConstant.get()));
console.log("\n" + "=".repeat(50) + "\n");

// Example 6: Complex class with constructor JSDoc
console.log("6. Complex class with constructor and getter/setter comments:");
const apiClientClass = klass("ApiClient", [
  prop("baseUrl", $string()).$private().$readonly(),
  prop("timeout", $number()).$private(),
])
  .$export()
  .addLeadingComment(
    createClassJSDoc(
      "HTTP API client for making requests",
      {
        examples: [
          "const client = new ApiClient('https://api.example.com');",
          "const response = await client.get('/users');",
        ],
        since: "2.0.0",
        author: "API Team",
      },
    ),
  )
  .addMember(
    method(
      "constructor",
      [
        param("baseUrl", $string()),
        param("timeout", $number(), true),
      ],
      block([]),
    ).addLeadingComment(
      constructorJSDoc(
        "Creates a new API client instance",
        [
          {
            name: "baseUrl",
            type: "string",
            description: "The base URL for API requests",
          },
          {
            name: "timeout",
            type: "number",
            description: "Request timeout in milliseconds (default: 5000)",
          },
        ],
      ),
    ),
  )
  .addMember(
    method(
      "getBaseUrl",
      [],
      block([ret($("this.baseUrl"))]),
    ).addLeadingComment(
      getterJSDoc("baseUrl", "string", "Gets the configured base URL"),
    ),
  )
  .addMember(
    method(
      "setTimeout",
      [param("value", $number())],
      block([]),
    ).addLeadingComment(
      setterJSDoc("timeout", "number", "Sets the request timeout"),
    ),
  );

console.log(printCode(apiClientClass.get()));
console.log("\n" + "=".repeat(50) + "\n");

// Example 7: Multiple comment types on a single node
console.log("7. Multiple comment types on a single node:");
const debugFunction = func(
  "debug",
  [param("message", $string())],
  block([]),
)
  .addLeadingComment(blockComment("Debug utility function"))
  .addLeadingComment(
    jsdocComment(
      "Logs debug information to console",
      [
        paramTag("message", "The debug message to log", "string"),
        deprecatedTag("Use console.debug() instead"),
        sinceTag("0.1.0"),
        authorTag("Debug Team"),
      ],
    ),
  )
  .addTrailingComment(lineComment("Will be removed in v3.0"))
  .addTrailingComment(todoComment("Add log levels"));

console.log(printCode(debugFunction.get()));
console.log("\n" + "=".repeat(50) + "\n");

console.log("=== Trivia Handler Examples Complete ===");