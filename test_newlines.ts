import { fileFromString } from "./src/index.js";

async function testNewlinePreservation() {
  const code = `import { Component } from '@angular/core';

class FirstClass {
  property: string;
}

class SecondClass {
  anotherProperty: number;
}

interface MyInterface {
  value: boolean;
}`;

  console.log("Original code:");
  console.log(code);
  console.log("\n" + "=".repeat(50) + "\n");

  const sourceFile = fileFromString("test.ts", code);

  console.log("After fileFromString and print:");
  const result = await sourceFile.print();
  console.log(result);
}

testNewlinePreservation().catch(console.error);
