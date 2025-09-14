import ts from "typescript";
import { file, fileFromString } from "../src/modules/file";

// Sample TypeScript code as a string
const existingCode = `
// Sample TypeScript code
import { useState } from 'react';

export class User {
  constructor(private name: string, private age: number) {}

  greet() {
    return \`Hello, \${this.name}! You are \${this.age} years old.\`;
  }
}

export function createUser(name: string, age: number) {
  return new User(name, age);
}
`;

// Create a file from the existing code string
const sourceFile = fileFromString("user.ts", existingCode);

console.log("Original code parsed into a SourceFile:");
console.log("----------------------------------------");
console.log(sourceFile.print());
console.log("----------------------------------------");

// We can also manipulate the file after creating it from a string
sourceFile.addImport({
  moduleSpecifier: "react-dom",
  namedImports: ["render"],
});

// Add a new constant to the file
sourceFile.addVariable({
  name: "MINIMUM_AGE",
  initializer: ts.factory.createNumericLiteral("18"),
  kind: "const",
});

console.log("Modified source file:");
console.log("----------------------------------------");
console.log(sourceFile.print());
console.log("----------------------------------------");

// Example of creating an empty file and adding statements
const emptyFile = file("empty.ts");
emptyFile.addImport({
  moduleSpecifier: "./user",
  namedImports: ["User", "createUser"],
});

console.log("Empty file with imports:");
console.log("----------------------------------------");
console.log(emptyFile.print());
console.log("----------------------------------------");
