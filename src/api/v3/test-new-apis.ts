// Test the new APIs
import {
  $,
  $ref,
  $string,
  arrow,
  assign,
  block,
  call,
  const_,
  decorator,
  exprStmt,
  if_,
  klass,
  method,
  obj,
  prop,
  propAccess,
  this_,
  typeInterface,
} from "./public_api";

console.log("=== Testing new tsf APIs ===\n");

// Test const variable with arrow function
const sdkFunction = const_(
  "getData",
  arrow().body(block([exprStmt(call("fetch", [$("/api/data")]))])),
).$export();

console.log("SDK Function:");
console.log(sdkFunction.get());

// Test object expression
const configObj = obj().prop("method", $("GET")).prop("url", $("/api/users"));

console.log("\nConfig Object:");
console.log(configObj.get());

// Test property access
const clientAccess = propAccess(this_(), "_client");
console.log("\nProperty Access:");
console.log(clientAccess);

// Test if statement
const conditionalAssignment = if_(propAccess("args", "client")).thenStmt(
  block([
    exprStmt(
      assign(propAccess(this_(), "_client"), propAccess("args", "client")),
    ),
  ]),
);

console.log("\nIf Statement:");
console.log(conditionalAssignment.get());

// Test type interface
const optionsType = typeInterface()
  .prop("id", $string())
  .prop("throwOnError", $ref("boolean"), true);

console.log("\nType Interface:");
console.log(optionsType.get());

// Test decorator
const injectableDecorator = decorator("Injectable", [
  {
    providedIn: "root",
  },
]);

console.log("\nDecorator:");
console.log(injectableDecorator.get());

// Test complete class similar to plugin.ts patterns
const sdkClass = klass("MySDK")
  .$export()
  .addMember(prop("_client", $ref("Client")).$protected().get())
  .addMember(
    method(
      "getData",
      [],
      block([exprStmt(call(propAccess(this_(), "_client"), []))]),
    )
      .$public()
      .$static()
      .get(),
  );

console.log("\nComplete SDK Class:");
console.log(sdkClass.get());

console.log("\n=== All tests completed ===");
