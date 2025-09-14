import { basename } from "path";
import ts from "typescript";
import { SourceFile } from "../src/modules/file";

/**
 * Example showing how to use SourceFile.findDecorators() with your pattern
 */

// Sample TypeScript code with decorators
const fileContent = `
import { Component, Injectable } from '@angular/core';

@Component({
  selector: 'app-root',
  template: '<h1>Hello World</h1>'
})
export class AppComponent {
  constructor() { }
}

@Injectable()
export class MyService {
  getData() {
    return 'Data';
  }
}
`;

/**
 * Function to find classes and their decorators in TypeScript source
 * Using the pattern you provided
 */
function findClassesAndDecorators(filePath: string, fileContent: string) {
  // Create the source file
  const sourceFile = new SourceFile(basename(filePath));

  // Parse the content using TypeScript compiler API
  const tsSourceFile = ts.createSourceFile(
    basename(filePath),
    fileContent,
    ts.ScriptTarget.Latest,
    true,
  );

  // Find all classes
  const klasses = sourceFile.findClasses(tsSourceFile);

  // Use your exact pattern to get classes with their decorators
  return klasses.map((klass) => ({
    klass,
    decorators: sourceFile.findDecorators(klass),
  }));
}

// Demo
const results = findClassesAndDecorators("example.ts", fileContent);

console.log(`Found ${results.length} classes`);

// Process each class and show its decorators
results.forEach(({ klass, decorators }) => {
  const className = klass.name?.text || "Anonymous";

  console.log(`\nClass: ${className}`);
  console.log(`Has ${decorators.length} decorators`);

  if (decorators.length > 0) {
    console.log("Decorators:");
    decorators.forEach((decorator) => {
      console.log(`- @${decorator.expression.getText()}`);
    });
  }
});
