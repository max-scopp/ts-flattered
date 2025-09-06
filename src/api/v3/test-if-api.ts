import { _if, assign, block, exprStmt, propAccess, this_ } from "./public_api";

console.log("Testing simplified _if API...");

// Test 1: Simple if without then/else
const simpleIf = _if(propAccess("args", "client"));
console.log("Simple if created:", !!simpleIf.get());

// Test 2: If with then statement
const ifWithThen = _if(
  propAccess("args", "client"),
  block([
    exprStmt(
      assign(propAccess(this_(), "_client"), propAccess("args", "client")),
    ),
  ]),
);
console.log("If with then created:", !!ifWithThen.get());

// Test 3: If with fluent API
const fluentIf = _if(propAccess("args", "client"))
  .thenClause(
    block([
      exprStmt(
        assign(propAccess(this_(), "_client"), propAccess("args", "client")),
      ),
    ]),
  )
  .elseClause(block([]));

console.log("Fluent if created:", !!fluentIf.get());
console.log("Has then statement:", !!fluentIf.get().thenStatement);
console.log("Has else statement:", !!fluentIf.get().elseStatement);

console.log("All tests passed!");
