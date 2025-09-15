import ts from "typescript";
import { decorator, objLiteral, print } from "../src";

// Helper function to print an expression as TypeScript code
function printExpression(expr: ts.Expression): string {
  const sourceFile = ts.factory.createSourceFile(
    "temp.ts", 
    "", 
    ts.ScriptTarget.Latest
  );
  const statement = ts.factory.createExpressionStatement(expr);
  const updatedSourceFile = ts.factory.updateSourceFile(sourceFile, [statement]);
  return print(updatedSourceFile).trim();
}

// Example showing the new generalized decorator API

console.log("=== Generalized Decorator Argument Management ===\n");

// 1. Create a decorator with multiple arguments
console.log("1. Creating decorator with multiple arguments:");
const apiDecorator = decorator("ApiEndpoint")
  .addArgument({ path: "/users", method: "GET" })
  .addArgument("v1")
  .addArgument({ auth: true, cache: false });

console.log(printExpression(apiDecorator.get().expression as ts.Expression));

// 2. Update specific arguments by index
console.log("\n2. Updating arguments by index:");
const updatedDecorator = apiDecorator
  .updateArgument(0, { path: "/users/:id", method: "POST", validation: true })
  .updateArgument(1, "v2")
  .removeArgument(2)  // Remove the auth/cache object
  .addArgument({ rateLimit: 100 });

console.log(printExpression(updatedDecorator.get().expression as ts.Expression));

// 3. Working with object arguments using the fluent object builder
console.log("\n3. Updating object arguments with object builder:");
const configDecorator = decorator("ConfigDecorator")
  .addArgument({ database: "postgres", cache: true, timeout: 5000 });

const updatedConfigDecorator = configDecorator
  .updateArgumentObject(0, (obj) => {
    // The fluent API should return the proxy object that works with chaining
    obj.set("database", "mongodb")
       .set("timeout", 30000)
       .remove("cache")
       .set("ssl", true);
    return obj;
  });

console.log(printExpression(updatedConfigDecorator.get().expression as ts.Expression));

// 4. Working with properties in the first argument (your specific use case)
console.log("\n4. Setting properties in first argument (your use case):");
const entityDecorator = decorator("Entity")
  .setProperty("tableName", "users")
  .setProperty("schema", "public")
  .setProperties({
    timestamps: true,
    softDelete: false
  });

console.log(printExpression(entityDecorator.get().expression as ts.Expression));

// 5. Object Literal Builder standalone
console.log("\n5. Object Literal Builder standalone:");
const configObj = objLiteral({
  name: "MyConfig",
  enabled: true,
  timeout: 5000
})
  .set("debug", false)
  .set("retries", 3)
  .remove("timeout")
  .setMany({
    host: "localhost",
    port: 8080
  });

console.log("Object properties:", configObj.getPropertyNames());
console.log("Has 'debug':", configObj.has("debug"));
console.log(printExpression(configObj.get()));

console.log("\n=== Summary ===");
console.log("✅ Object Literal Builder: Create and modify objects fluently");
console.log("✅ Decorator Argument Management: Update any argument by index");
console.log("✅ Object Argument Updates: Use object builder on decorator arguments");
console.log("✅ Property Setting: Set properties in first argument (your use case)");
console.log("✅ Adoption: Work with existing decorators from source files");