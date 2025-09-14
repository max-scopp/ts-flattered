import ts from "typescript";
import { fileFromString } from "../src/modules/file";

/**
 * Example using file().findDecorators() similar to the requested pattern
 */

// Sample TypeScript code with decorators
const fileContent = `
import { Component, Injectable } from '@angular/core';

@Component({
  selector: 'app-root',
  template: '<h1>Hello World</h1>'
})
export class AppComponent {
  @Input() title: string = 'My App';

  constructor() { }

  @HostListener('click')
  onClick() {
    console.log('Clicked');
  }
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
 */
function findClassesAndDecorators(filePath: string, fileContent: string) {
  const sourceFile = fileFromString(filePath, fileContent);
  const classes = sourceFile.findClasses();

  console.log(`Found ${classes.length} classes`);

  // Using the flatMap approach as requested
  return classes.map((klass) => {
    // Try to get the decorators
    const classDecorators = sourceFile.findDecorators(klass);

    return {
      className: klass.name?.text || "Anonymous",
      klass,
      decorators: classDecorators,
      // Also collect information about decorators
      decoratorInfo: classDecorators.map((dec) =>
        sourceFile.getDecoratorInfo(dec),
      ),
    };
  });
}

/**
 * Helper function to traverse the AST and find all decorators directly
 */
function findAllDecorators(sourceFile: ts.SourceFile) {
  const decorators: ts.Decorator[] = [];

  function visit(node: ts.Node) {
    // Check if this node is a decorator
    if (ts.isDecorator(node)) {
      decorators.push(node);
    }

    // Visit children
    ts.forEachChild(node, visit);
  }

  // Start the traversal
  visit(sourceFile);

  return decorators;
}

/**
 * Create a mapping from decorated nodes to their decorators
 */
function createDecoratorMap(sourceFile: ts.SourceFile) {
  // Get all decorators
  const allDecorators = findAllDecorators(sourceFile);
  console.log(`Found ${allDecorators.length} total decorators in source`);

  const decoratorMap = new Map<ts.Node, ts.Decorator[]>();

  // For each decorator, find its parent (the decorated node)
  for (const decorator of allDecorators) {
    // Get parent of decorator (which is the decorated node)
    // We need to walk up the tree to find the parent
    let parent: ts.Node | undefined;

    function findParent(node: ts.Node) {
      ts.forEachChild(node, (child) => {
        if (child === decorator) {
          parent = node;
          return;
        }

        if (!parent) {
          findParent(child);
        }
      });
    }

    findParent(sourceFile);

    if (parent) {
      const decorators = decoratorMap.get(parent) || [];
      decorators.push(decorator);
      decoratorMap.set(parent, decorators);
    }
  }

  return decoratorMap;
}

// Example 1: Basic findClassesAndDecorators
const classesWithDecorators = findClassesAndDecorators(
  "example.ts",
  fileContent,
);

console.log("\nClasses with decorators:");
for (const { className, decorators, decoratorInfo } of classesWithDecorators) {
  console.log(`\n${className}: ${decorators.length} decorators`);

  if (decoratorInfo.length > 0) {
    for (const info of decoratorInfo) {
      console.log(`  - @${info.name}`);
      if (info.arguments.length > 0) {
        console.log(`    Arguments: ${JSON.stringify(info.arguments)}`);
      }
    }
  }
}

// Example 2: Using direct AST traversal as a fallback
console.log("\n=== Using direct AST traversal ===");
const sourceFile = fileFromString("example.ts", fileContent);
const decoratorMap = createDecoratorMap(sourceFile);

console.log(`\nCreated decorator map with ${decoratorMap.size} entries`);

// Let's check each class against our map
const classes = sourceFile.findClasses();
for (const klass of classes) {
  const className = klass.name?.text || "Anonymous";
  const decorators = Array.from(decoratorMap.entries())
    .filter(([node]) => node === klass)
    .flatMap(([_, decs]) => decs);

  console.log(`\n${className}: ${decorators.length} decorators found via map`);

  for (const decorator of decorators) {
    const expressionText = decorator.expression.getText(sourceFile.get());
    console.log(`  - @${expressionText}`);
  }
}
