import ts from "typescript";
import { fileFromString } from "../src/modules/file";

/**
 * Example that uses the enhanced file().findDecorators() API
 * to find and process decorators on classes, properties, and methods
 */

// Sample TypeScript code with decorators
const sampleCode = `
import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-example',
  template: '<div>Example Component</div>'
})
export class ExampleComponent {
  @Input() inputProp: string = '';

  @Output()
  outputEvent = new EventEmitter<string>();

  private _value: number = 0;

  @Log()
  calculateValue(): number {
    return this._value * 2;
  }
}

function Log() {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    // Log method execution
  };
}
`;

/**
 * Process the source file using the improved findDecorators method
 */
function analyzeWithFileApi() {
  console.log("=== Using FileBuilder API ===");
  const sourceFile = fileFromString("example.ts", sampleCode);

  // Find all classes
  const classes = sourceFile.findClasses();
  console.log(`Found ${classes.length} classes\n`);

  // Process each class and its members
  classes.forEach((klass) => {
    const className = klass.name?.text || "Anonymous";
    console.log(`Class: ${className}`);

    // Find class decorators using the enhanced findDecorators method
    const classDecorators = sourceFile.findDecorators(klass);
    console.log(`Class decorators: ${classDecorators.length}`);

    // Process each class decorator
    classDecorators.forEach((decorator) => {
      const info = sourceFile.getDecoratorInfo(decorator);
      console.log(`- @${info.name}`);
      if (info.arguments.length > 0) {
        console.log(`  Arguments: ${JSON.stringify(info.arguments)}`);
      }
    });

    // Get property information
    const properties = sourceFile.getClassProperties(klass);
    console.log(`\nProperties (${properties.length}):`);
    properties.forEach((prop) => {
      console.log(`- ${prop.name}${prop.isPrivate ? " (private)" : ""}`);

      if (prop.decorators.length > 0) {
        console.log(`  Decorators: ${prop.decorators.length}`);
        prop.decorators.forEach((dec) => {
          console.log(`  - @${dec.name}`);
        });
      }
    });

    // Get method information
    const methods = sourceFile.getClassMethods(klass);
    console.log(`\nMethods (${methods.length}):`);
    methods.forEach((method) => {
      console.log(`- ${method.name}${method.isPrivate ? " (private)" : ""}`);

      if (method.decorators.length > 0) {
        console.log(`  Decorators: ${method.decorators.length}`);
        method.decorators.forEach((dec) => {
          console.log(`  - @${dec.name}`);
        });
      }
    });

    console.log("\n---");
  });
}

// Run the example
analyzeWithFileApi();
