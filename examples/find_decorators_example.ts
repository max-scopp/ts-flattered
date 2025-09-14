import { fileFromString } from '../src/modules/file';

/**
 * Example showing how to use the file().findDecorators() API
 * to analyze decorators in a TypeScript file
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

// Method 1: Create file from string content
function analyzeFromString() {
  console.log('=== Analyzing from string content ===');
  const sourceFile = fileFromString('example.ts', sampleCode);

  // Find all classes in the file
  const classes = sourceFile.findClasses();
  console.log(`Found ${classes.length} classes`);

  // For each class, find its decorators
  classes.forEach(klass => {
    const className = klass.name?.text || 'Anonymous';
    console.log(`\nClass: ${className}`);

    const decorators = sourceFile.findDecorators(klass);
    console.log(`  Has ${decorators.length} decorators`);

    // Process each decorator
    decorators.forEach(decorator => {
      const info = sourceFile.getDecoratorInfo(decorator);
      console.log(`  - @${info.name}`);

      if (info.arguments.length > 0) {
        console.log('    Arguments:');
        info.arguments.forEach((arg, index) => {
          console.log(`    - Arg ${index}:`, JSON.stringify(arg));
        });
      }
    });

    // Get class properties and their decorators
    const properties = sourceFile.getClassProperties(klass);
    console.log(`\n  Properties (${properties.length}):`);
    properties.forEach(prop => {
      console.log(`  - ${prop.name}${prop.isPrivate ? ' (private)' : ''}${prop.isReadonly ? ' (readonly)' : ''}`);

      if (prop.decorators.length > 0) {
        console.log('    Decorators:');
        prop.decorators.forEach(dec => {
          console.log(`    - @${dec.name}`);
          if (dec.arguments.length > 0) {
            console.log('      Arguments:', JSON.stringify(dec.arguments));
          }
        });
      }
    });

    // Get class methods and their decorators
    const methods = sourceFile.getClassMethods(klass);
    console.log(`\n  Methods (${methods.length}):`);
    methods.forEach(method => {
      console.log(`  - ${method.name}${method.isPrivate ? ' (private)' : ''}`);

      if (method.decorators.length > 0) {
        console.log('    Decorators:');
        method.decorators.forEach(dec => {
          console.log(`    - @${dec.name}`);
          if (dec.arguments.length > 0) {
            console.log('      Arguments:', JSON.stringify(dec.arguments));
          }
        });
      }

      if (method.parameters.length > 0) {
        console.log('    Parameters:');
        method.parameters.forEach(param => {
          console.log(`    - ${param.name}${param.type ? `: ${param.type}` : ''}`);
          if (param.decorators.length > 0) {
            console.log('      Decorators:');
            param.decorators.forEach(dec => {
              console.log(`      - @${dec.name}`);
            });
          }
        });
      }
    });
  });
}

// Method 2: Process using flatMap like in your example
function analyzeWithFlatMap() {
  console.log('\n=== Analyzing with flatMap approach ===');
  const sourceFile = fileFromString('example.ts', sampleCode);

  // Find all classes and their decorators in one operation
  const classesWithDecorators = sourceFile.findClasses()
    .flatMap(klass => ({
      klass,
      decorators: sourceFile.findDecorators(klass),
    }));

  // Process the results
  classesWithDecorators.forEach(({ klass, decorators }) => {
    const className = klass.name?.text || 'Anonymous';
    console.log(`\nClass: ${className} - Has ${decorators.length} decorators`);

    // Process each decorator
    decorators.forEach(decorator => {
      const info = sourceFile.getDecoratorInfo(decorator);
      console.log(`  - @${info.name} with ${info.arguments.length} arguments`);
    });

    // For a complete analysis, you could also get properties and methods here
  });
}

// Method 3: Process a file from path if it exists
// Run the examples
analyzeFromString();
analyzeWithFlatMap();
