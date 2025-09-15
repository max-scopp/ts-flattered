import ts from "typescript";
import { decorator, fileFromString, fromDecorator, objLiteral } from "../src";

// Example usage of the new decorator and object APIs

console.log("=== Object Literal Builder Example ===");

// Create an object literal using the fluent API
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
console.log("Config object:", configObj.get());

console.log("\n=== Decorator Argument Management Example ===");

// Create a decorator with multiple arguments
const myDecorator = decorator("ApiEndpoint")
  .addArgument({ path: "/users", method: "GET" })
  .addArgument("v1")
  .addArgument({ auth: true, cache: false });

console.log("Original decorator:", myDecorator.get());

// Update specific arguments
const updatedDecorator = myDecorator
  .updateArgument(0, { path: "/users/:id", method: "POST", validation: true })
  .updateArgument(1, "v2")
  .removeArgument(2)
  .addArgument({ rateLimit: 100 });

console.log("Updated decorator:", updatedDecorator.get());

console.log("\n=== Object Argument Updates Example ===");

// Update object arguments using the fluent object builder
const decoratorWithObjectUpdate = decorator("ConfigDecorator")
  .addArgument({ database: "postgres", cache: true })
  .updateArgumentObject(0, (obj) => {
    return obj.set("database", "mongodb")
              .set("timeout", 30000)
              .remove("cache");
  });

console.log("Decorator with updated object:", decoratorWithObjectUpdate.get());

console.log("\n=== Working with Existing Decorators Example ===");

// Simulate working with an existing decorator from a source file
const sourceCode = `
class UserService {
  @ApiEndpoint({ path: "/users", method: "GET" })
  getUsers() {}
  
  @ApiEndpoint({ path: "/users", method: "POST", validation: false })
  createUser() {}
}
`;

const sourceFile = fileFromString("example.ts", sourceCode);

// Find and update decorators
sourceFile.updateClasses((classBuilder) => {
  // This would be where you could update decorators on the class
  // For now, let's just demonstrate the decorator API
  return classBuilder;
});

console.log("\n=== Property Updates Example ===");

// Example of setting properties in the first argument (your use case)
const entityDecorator = decorator("Entity")
  .setProperty("tableName", "users")
  .setProperty("schema", "public")
  .setProperties({
    timestamps: true,
    softDelete: false
  });

console.log("Entity decorator:", entityDecorator.get());

// Remove a property
const cleanedDecorator = entityDecorator.removeProperty("softDelete");
console.log("After removing softDelete:", cleanedDecorator.get());

console.log("\n=== Adopting Existing Decorators Example ===");

// Create a decorator from an existing TypeScript decorator node
const existingDecorator = ts.factory.createDecorator(
  ts.factory.createCallExpression(
    ts.factory.createIdentifier("OldDecorator"),
    undefined,
    [ts.factory.createObjectLiteralExpression([
      ts.factory.createPropertyAssignment("old", ts.factory.createTrue())
    ])]
  )
);

const adoptedDecorator = fromDecorator(existingDecorator)
  .setProperty("migrated", true)
  .setProperty("version", "2.0")
  .removeProperty("old");

console.log("Adopted and updated decorator:", adoptedDecorator.get());