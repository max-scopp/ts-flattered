import { fromDecorator } from "../src/core/decorator";
import { fileFromString } from "../src/modules/file";

/**
 * Example demonstrating how to use the decorator extraction functionality
 */

// Sample TypeScript code with decorators
const sampleCode = `
import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-root',
  template: '<h1>{{title}}</h1>',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  @Input() title: string = 'My App';

  @Output()
  clicked = new EventEmitter<void>();

  handleClick() {
    this.clicked.emit();
  }
}
`;

// Parse the file and find decorators
const sourceFile = fileFromString("example.ts", sampleCode);
const classes = sourceFile.findClasses();

console.log(`Found ${classes.length} class(es)`);

// Process each class
for (const cls of classes) {
  const className = cls.name?.text || "Anonymous";
  console.log(`\nClass: ${className}`);

  // Find decorators on the class using file API
  const classDecorators = sourceFile.findDecorators(cls);
  console.log(`Class has ${classDecorators.length} decorator(s)`);

  for (const dec of classDecorators) {
    // Method 1: Use the file API
    const decorInfo = sourceFile.getDecoratorInfo(dec);
    console.log(`\nDecorator info using file.getDecoratorInfo():`);
    console.log(`- Name: ${decorInfo.name}`);
    console.log(`- Args: ${JSON.stringify(decorInfo.arguments, null, 2)}`);

    // Method 2: Use the decorator API directly
    const decorBuilder = fromDecorator(dec);
    console.log(`\nDecorator info using fromDecorator():`);
    console.log(`- Name: ${decorBuilder.getName()}`);

    // Get the typed arguments
    type ComponentOptions = {
      selector: string;
      template: string;
      styleUrls?: string[];
    };

    const options = decorBuilder.getArgumentObject<ComponentOptions>();
    if (options) {
      console.log(`- Typed arguments:`);
      console.log(`  • Selector: ${options.selector}`);
      console.log(`  • Template: ${options.template}`);
      if (options.styleUrls) {
        console.log(`  • StyleUrls: ${options.styleUrls.join(", ")}`);
      }
    }
  }

  // Get properties with decorators
  const properties = sourceFile.getClassProperties(cls);
  console.log(`\nProperties: ${properties.length}`);

  for (const prop of properties) {
    console.log(`\nProperty: ${prop.name}`);
    console.log(`Decorators: ${prop.decorators.length}`);

    for (const dec of prop.decorators) {
      console.log(`- @${dec.name}`);
    }
  }
}

// Example of flat-mapping classes to decorators as requested
console.log("\n=== Using flatMap pattern ===");
const decoratedClasses = sourceFile.findClasses().flatMap((klass) => ({
  klass,
  decorators: sourceFile.findDecorators(klass),
}));

for (const { klass, decorators } of decoratedClasses) {
  const className = klass.name?.text || "Anonymous";
  console.log(`\nClass: ${className} has ${decorators.length} decorator(s)`);

  for (const dec of decorators) {
    const info = sourceFile.getDecoratorInfo(dec);
    console.log(`- @${info.name}`);
  }
}
