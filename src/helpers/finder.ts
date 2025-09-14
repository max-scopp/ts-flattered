import ts from "typescript";
import { extractDecoratorInfo } from "../core/decorator";

/**
 * Information about a decorator
 */
export interface DecoratorInfo {
  name: string;
  arguments: Array<Record<string, unknown> | string | number | boolean | unknown[]>;
}

/**
 * Information about a class property
 */
export interface ClassPropertyInfo {
  name: string;
  decorators: DecoratorInfo[];
  isPrivate: boolean;
  isStatic: boolean;
  isReadonly: boolean;
  type?: string;
}

/**
 * Information about a method parameter
 */
export interface ParameterInfo {
  name: string;
  decorators: DecoratorInfo[];
  type?: string;
}

/**
 * Information about a class method
 */
export interface ClassMethodInfo {
  name: string;
  decorators: DecoratorInfo[];
  isPrivate: boolean;
  isStatic: boolean;
  parameters: ParameterInfo[];
}

/**
 * Find all class declarations in a source file
 * @param sourceFile The source file to search in
 * @returns Array of class declarations
 */
export function findClasses(sourceFile: ts.SourceFile): ts.ClassDeclaration[] {
  const classes: ts.ClassDeclaration[] = [];

  // Helper function to visit nodes recursively
  const visit = (node: ts.Node) => {
    if (ts.isClassDeclaration(node)) {
      classes.push(node);
    }

    ts.forEachChild(node, visit);
  };

  // Start visiting from the source file
  visit(sourceFile);

  return classes;
}

/**
 * Find a class declaration by name in a source file
 * @param sourceFile The source file to search in
 * @param name The name of the class to find
 * @returns The class declaration or undefined if not found
 */
export function findClass(sourceFile: ts.SourceFile, name: string): ts.ClassDeclaration | undefined {
  return findClasses(sourceFile).find(classDecl =>
    classDecl.name && classDecl.name.text === name
  );
}

/**
 * Find decorators for a specific node (class, property, method, etc.)
 * @param sourceFile The source file containing the node
 * @param node The node to find decorators for
 * @returns Array of decorators or empty array if none found
 */
export function findDecorators(sourceFile: ts.SourceFile, node: ts.Node): ts.Decorator[] {
  const decorators: ts.Decorator[] = [];

  // Simple AST traversal to find decorators
  function visit(n: ts.Node) {
    if (ts.isDecorator(n)) {
      // Check if this decorator belongs to our target node
      // A decorator is a child of the node it decorates
      if (n.parent === node) {
        decorators.push(n);
      }
    }
    ts.forEachChild(n, visit);
  }

  // Start from the source file or the node itself to find its decorator children
  // We need to traverse from the source file to find all decorators
  ts.forEachChild(sourceFile, visit);

  return decorators;
}

/**
 * Get decorator information in a more structured format
 * @param decorator The decorator node to analyze
 * @returns Structured decorator information
 */
export function getDecoratorInfo(decorator: ts.Decorator): DecoratorInfo {
  // Use the shared utility function from decorator.ts
  const info = extractDecoratorInfo(decorator);

  // Return using our interface structure
  return {
    name: info.name,
    arguments: info.arguments
  };
}

/**
 * Find all properties of a class with their decorators
 * @param sourceFile The source file containing the class
 * @param classDeclaration The class declaration to analyze
 * @returns Array of property information with decorators
 */
export function getClassProperties(sourceFile: ts.SourceFile, classDeclaration: ts.ClassDeclaration): ClassPropertyInfo[] {
  const properties: ClassPropertyInfo[] = [];

  for (const member of classDeclaration.members) {
    if (ts.isPropertyDeclaration(member)) {
      const propertyName = ts.isIdentifier(member.name) ? member.name.text : 'unknown';
      const decorators = findDecorators(sourceFile, member).map(d => getDecoratorInfo(d));

      properties.push({
        name: propertyName,
        decorators,
        isPrivate: !!member.modifiers?.some(m => m.kind === ts.SyntaxKind.PrivateKeyword),
        isStatic: !!member.modifiers?.some(m => m.kind === ts.SyntaxKind.StaticKeyword),
        isReadonly: !!member.modifiers?.some(m => m.kind === ts.SyntaxKind.ReadonlyKeyword),
        type: member.type ? member.type.getText(sourceFile) : undefined
      });
    }
  }

  return properties;
}

/**
 * Find all methods of a class with their decorators
 * @param sourceFile The source file containing the class
 * @param classDeclaration The class declaration to analyze
 * @returns Array of method information with decorators
 */
export function getClassMethods(sourceFile: ts.SourceFile, classDeclaration: ts.ClassDeclaration): ClassMethodInfo[] {
  const methods: ClassMethodInfo[] = [];

  for (const member of classDeclaration.members) {
    if (ts.isMethodDeclaration(member)) {
      const methodName = ts.isIdentifier(member.name) ? member.name.text : 'unknown';
      const decorators = findDecorators(sourceFile, member).map(d => getDecoratorInfo(d));

      methods.push({
        name: methodName,
        decorators,
        isPrivate: !!member.modifiers?.some(m => m.kind === ts.SyntaxKind.PrivateKeyword),
        isStatic: !!member.modifiers?.some(m => m.kind === ts.SyntaxKind.StaticKeyword),
        parameters: member.parameters.map(param => {
          const paramName = ts.isIdentifier(param.name) ? param.name.text : 'unknown';
          const paramDecorators = findDecorators(sourceFile, param).map(d => getDecoratorInfo(d));
          return {
            name: paramName,
            decorators: paramDecorators,
            type: param.type ? param.type.getText(sourceFile) : undefined
          };
        })
      });
    }
  }

  return methods;
}
