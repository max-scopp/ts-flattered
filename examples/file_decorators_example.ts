import { basename } from "path";
import { fileFromString } from "../src/modules/file";

/**
 * Example demonstrating the usage of file().findDecorators()
 * in a pattern similar to the requested one
 */

// Sample TypeScript code with decorators
const fileContent = `
import { Component, Input, Output } from '@angular/core';

@Component({
  selector: 'app-example',
  template: '<div>Example Component</div>'
})
export class ExampleComponent {
  @Input() prop1: string = '';
  @Output() event1: any;
}
`;

/**
 * Function to find classes and decorators using the requested pattern
 */
function findClassesAndDecorators(filePath: string, fileContent: string) {
  // Create a source file from the content
  const sourceFile = fileFromString(basename(filePath), fileContent);

  // Find all classes in the file
  const klasses = sourceFile.findClasses();

  // Return classes with their decorators using the pattern requested
  return klasses.map((klass) => ({
    klass,
    decorators: sourceFile.findDecorators(klass),
  }));
}

// Use the function
const classesWithDecorators = findClassesAndDecorators(
  "example.ts",
  fileContent,
);

// Print results
console.log(`Found ${classesWithDecorators.length} classes`);

for (const { klass, decorators } of classesWithDecorators) {
  const className = klass.name?.text || "Anonymous";
  console.log(`\nClass: ${className}`);
  console.log(`Has ${decorators.length} decorators`);

  for (const decorator of decorators) {
    const decoratorInfo = fileFromString(
      "example.ts",
      fileContent,
    ).getDecoratorInfo(decorator);
    console.log(`- @${decoratorInfo.name}`);

    if (decoratorInfo.arguments.length > 0) {
      console.log(`  Arguments: ${JSON.stringify(decoratorInfo.arguments)}`);
    }
  }
}
