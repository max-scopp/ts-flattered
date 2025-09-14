import ts from "typescript";
import { fromDecorator } from "../src/core/decorator";
import { fileFromString } from "../src/modules/file";

// Helper function to find decorators manually from source text
function findDecoratorsInSource(
  sourceFile: ts.SourceFile,
): Map<number, ts.Decorator[]> {
  const decoratorsByParentPos = new Map<number, ts.Decorator[]>();

  // Function to visit each node in the AST
  function visit(node: ts.Node) {
    // Look specifically for decorator nodes
    if (node.kind === ts.SyntaxKind.Decorator) {
      const decorator = node as ts.Decorator;
      // Find the parent node position (next node after decorator that isn't a decorator)
      const parent = node.parent;

      // If parent exists, store decorator keyed by parent node position
      if (parent) {
        const parentPos = parent.pos;
        if (!decoratorsByParentPos.has(parentPos)) {
          decoratorsByParentPos.set(parentPos, []);
        }
        decoratorsByParentPos.get(parentPos)?.push(decorator);
      }
    }

    // Continue traversing the AST
    ts.forEachChild(node, visit);
  }

  // Start visiting from the source file root
  visit(sourceFile);

  return decoratorsByParentPos;
}

// Sample TypeScript code with a decorated class
const codeWithDecorators = `
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.css'],
  animations: ['fadeIn', 'fadeOut'],
  providers: [
    { provide: 'UserService', useClass: UserServiceImpl }
  ]
})
export class UserComponent {
  @Input() userId: number = 0;

  constructor(private service: UserService) {}

  @LogMethod('User action')
  onUserAction(id: number): void {
    console.log('User action:', id);
  }
}
`;

// Parse the source file using the fileFromString API
const sourceFile = fileFromString("user.component.ts", codeWithDecorators);

console.log("Analyzing classes and decorators using the file API...\n");

// Print source file content for reference
console.log("Source file content:");
console.log("---------------------------");
console.log(sourceFile.print());
console.log("---------------------------\n");

// Find all classes in the source file
const classes = sourceFile.findClasses();
console.log(`Found ${classes.length} classes in the file.\n`);

// Find all decorators in the source file
const decoratorMap = findDecoratorsInSource(sourceFile);

// Process each class
for (const classDecl of classes) {
  const className = classDecl.name ? classDecl.name.text : "Anonymous";
  console.log(`\n=== Class: ${className} ===`);

  // Find decorators for this class using our custom finder
  const decorators = decoratorMap.get(classDecl.pos) || [];
  console.log(`Class decorators: ${decorators.length}`);

  // Process each decorator on the class
  for (const decorator of decorators) {
    const decoratorInfo = sourceFile.getDecoratorInfo(decorator);
    console.log(`\n@${decoratorInfo.name}`);

    if (decoratorInfo.arguments.length > 0) {
      console.log("Arguments:");
      console.log(JSON.stringify(decoratorInfo.arguments, null, 2));

      // Use the fromDecorator API to get typed decorator arguments
      const decoratorBuilder = fromDecorator(decorator);

      // Define a type for the Component decorator
      interface ComponentConfig {
        selector: string;
        templateUrl: string;
        styleUrls: string[];
        animations?: string[];
        providers?: Array<Record<string, unknown>>;
      }

      // Get strongly-typed argument object
      const componentConfig =
        decoratorBuilder.getArgumentObject<ComponentConfig>();
      if (componentConfig) {
        console.log("\nTyped Component Configuration:");
        console.log(`- Selector: ${componentConfig.selector}`);
        console.log(`- Template URL: ${componentConfig.templateUrl}`);
        console.log(`- Style URLs: ${componentConfig.styleUrls.join(", ")}`);

        if (componentConfig.animations) {
          console.log(`- Animations: ${componentConfig.animations.join(", ")}`);
        }

        if (componentConfig.providers) {
          console.log("- Providers:");
          componentConfig.providers.forEach((provider) => {
            console.log(`  ${JSON.stringify(provider)}`);
          });
        }
      }
    }
  }

  // Get class properties
  const properties = sourceFile.getClassProperties(classDecl);
  console.log(`\nClass properties: ${properties.length}`);

  for (const prop of properties) {
    console.log(
      `- ${prop.isPrivate ? "private " : ""}${prop.name}${prop.type ? ": " + prop.type : ""}`,
    );

    if (prop.decorators.length > 0) {
      console.log(
        `  Decorators: ${prop.decorators.map((d) => "@" + d.name).join(", ")}`,
      );

      // Print decorator arguments if any
      for (const dec of prop.decorators) {
        if (dec.arguments.length > 0) {
          console.log(
            `  @${dec.name} arguments: ${JSON.stringify(dec.arguments)}`,
          );
        }
      }
    }
  }

  // Get class methods
  const methods = sourceFile.getClassMethods(classDecl);
  console.log(`\nClass methods: ${methods.length}`);

  for (const method of methods) {
    console.log(
      `- ${method.isPrivate ? "private " : ""}${method.name}(${method.parameters.map((p) => p.name).join(", ")})`,
    );

    if (method.decorators.length > 0) {
      console.log(
        `  Decorators: ${method.decorators.map((d) => "@" + d.name).join(", ")}`,
      );

      // Print decorator arguments if any
      for (const dec of method.decorators) {
        if (dec.arguments.length > 0) {
          console.log(
            `  @${dec.name} arguments: ${JSON.stringify(dec.arguments)}`,
          );
        }
      }
    }

    // Check for parameter decorators
    for (const param of method.parameters) {
      if (param.decorators.length > 0) {
        console.log(
          `  Parameter '${param.name}' decorators: ${param.decorators.map((d) => "@" + d.name).join(", ")}`,
        );
      }
    }
  }
}
