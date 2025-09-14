import ts from "typescript";
import { fileFromString } from "../src/modules/file";

/**
 * Example showing how to use file().findDecorators() like requested
 * with enhanced decorator detection capabilities
 */

// Sample TypeScript code with decorators
const sampleCode = `
import { Component, Injectable, Input } from '@angular/core';

@Component({
  selector: 'app-example',
  template: '<div>Example Component</div>'
})
export class ExampleComponent {
  @Input() inputProp: string = '';

  constructor() {}
}

@Injectable()
export class MyService {
  getData() {
    return 'Data';
  }
}
`;

/**
 * Enhanced decorator finder using direct AST traversal
 * @param sourceFile The source file to search for decorators
 * @returns Map of nodes to their decorators
 */
function findAllDecoratorsInSource(
  sourceFile: ts.SourceFile,
): Map<ts.Node, ts.Decorator[]> {
  // First find all decorator nodes in the file
  const decoratorNodes: ts.Decorator[] = [];

  const findDecorators = (node: ts.Node) => {
    if (ts.isDecorator(node)) {
      decoratorNodes.push(node);
    }

    ts.forEachChild(node, findDecorators);
  };

  findDecorators(sourceFile);

  // Build a map of decorated nodes to their decorators
  const decoratorMap = new Map<ts.Node, ts.Decorator[]>();

  // For each decorator, find its parent (the decorated node)
  for (const decorator of decoratorNodes) {
    // Find the parent node that this decorator is decorating
    let decoratedNode: ts.Node | undefined;

    const findParent = (node: ts.Node) => {
      // Skip visiting the decorator itself to avoid loops
      if (node === decorator) return;

      ts.forEachChild(node, (child) => {
        if (child === decorator) {
          decoratedNode = node;
          return;
        }

        if (!decoratedNode) {
          findParent(child);
        }
      });
    };

    findParent(sourceFile);

    if (decoratedNode) {
      const decs = decoratorMap.get(decoratedNode) || [];
      decs.push(decorator);
      decoratorMap.set(decoratedNode, decs);
    }
  }

  return decoratorMap;
}

/**
 * Function to find classes with their decorators, similar to your example
 */
function findClassesAndDecorators(filePath: string, fileContent: string) {
  // Parse the source file
  const sourceFile = fileFromString(filePath, fileContent);

  // Find all classes
  const classes = sourceFile.findClasses();

  // Find all decorators in the source file
  const decoratorMap = findAllDecoratorsInSource(sourceFile.get());

  // Map classes to their decorators
  return classes.map((klass) => ({
    klass,
    className: klass.name?.text || "Anonymous",
    decorators: decoratorMap.get(klass) || [],
  }));
}

// Usage example
const classesWithDecorators = findClassesAndDecorators(
  "example.ts",
  sampleCode,
);

// Display results
console.log(`Found ${classesWithDecorators.length} classes`);

for (const { className, decorators } of classesWithDecorators) {
  console.log(`\nClass: ${className}`);
  console.log(`Has ${decorators.length} decorators`);

  for (const decorator of decorators) {
    const decoratorText = decorator.expression.getText();
    console.log(`- @${decoratorText}`);
  }
}

// This shows how to use file().findDecorators() in a similar way to your example
console.log("\n=== Using pattern similar to your example ===");

const sourceFile = fileFromString("example.ts", sampleCode);
const decoratorMap = findAllDecoratorsInSource(sourceFile.get());
const klasses = sourceFile.findClasses();

// Using the exact pattern from your request
const result = klasses.map((klass) => ({
  klass,
  decorators: decoratorMap.get(klass) || [],
}));

// Display results
for (const { klass, decorators } of result) {
  const className = klass.name?.text || "Anonymous";
  console.log(`\nClass: ${className}`);
  console.log(`Has ${decorators.length} decorators`);

  for (const decorator of decorators) {
    const decoratorText = decorator.expression.getText();
    console.log(`- @${decoratorText}`);
  }
}
