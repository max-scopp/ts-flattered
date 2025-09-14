import ts from "typescript";
import { extractDecoratorInfo } from "../core/decorator";
import { klass } from "../core/klass";
import { const_, let_, var_ } from "../core/variable";
import { type BuildableAST, buildFluentApi } from "../utils/buildFluentApi";
import { type ImportOptions, imp } from "./imp";
import { print } from "./print";

/**
 * Type representing a SourceFile with the fluent API methods
 */
export type SourceFile = FileBuilder & ts.SourceFile;

/**
 * Options for creating a source file
 */
export interface SourceFileOptions {
  fileName: string;
  content: string;
  scriptTarget?: ts.ScriptTarget;
}

/**
 * Options for adding a class to a source file
 */
export interface ClassOptions {
  name: string;
  members?: ts.ClassElement[];
  mods?: ts.ModifierLike[];
}

/**
 * Options for adding a variable to a source file
 */
export interface VariableOptions {
  name: string;
  initializer?: ts.Expression;
  kind: "const" | "let" | "var";
}

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
 * Builder for a TypeScript source file
 */
class FileBuilder implements BuildableAST {
  #sourceFile: ts.SourceFile;
  #statements: ts.NodeArray<ts.Statement>;

  constructor({ fileName, content, scriptTarget = ts.ScriptTarget.Latest }: SourceFileOptions) {
    // Create a source file from content string
    this.#sourceFile = ts.createSourceFile(
      fileName,
      content,
      scriptTarget,
      true // setParentNodes
    );

    // Get the statements from the source file
    this.#statements = this.#sourceFile.statements;
  }

  // Methods for adding statements
  addStatement(...statements: ts.Statement[]) {
    // Create a new source file with the added statements
    this.#sourceFile = ts.factory.updateSourceFile(
      this.#sourceFile,
      [...this.#statements, ...statements],
      this.#sourceFile.isDeclarationFile,
      this.#sourceFile.referencedFiles,
      this.#sourceFile.typeReferenceDirectives,
      this.#sourceFile.hasNoDefaultLib,
      this.#sourceFile.libReferenceDirectives
    );

    // Update statements reference
    this.#statements = this.#sourceFile.statements;
    return this;
  }

  // Method for adding statements at the beginning
  prependStatement(...statements: ts.Statement[]) {
    // Create a new source file with the prepended statements
    this.#sourceFile = ts.factory.updateSourceFile(
      this.#sourceFile,
      [...statements, ...this.#statements],
      this.#sourceFile.isDeclarationFile,
      this.#sourceFile.referencedFiles,
      this.#sourceFile.typeReferenceDirectives,
      this.#sourceFile.hasNoDefaultLib,
      this.#sourceFile.libReferenceDirectives
    );

    // Update statements reference
    this.#statements = this.#sourceFile.statements;
    return this;
  }

  addImport(options: ImportOptions) {
    const importDecl = imp(options);
    this.addStatement(importDecl);
    return this;
  }

  // Internal method for auto-resolved imports (added at the beginning)
  addAutoImport(options: ImportOptions) {
    const importDecl = imp(options);
    this.prependStatement(importDecl);
    return this;
  }

  addClass(options: ClassOptions) {
    const classDecl = klass(options.name, options.members, options.mods);
    this.addStatement(classDecl);
    return this;
  }

  addVariable(options: VariableOptions) {
    let variableDecl: ts.VariableStatement;
    if (options.kind === "const") {
      variableDecl = const_(options.name, options.initializer);
    } else if (options.kind === "let") {
      variableDecl = let_(options.name, options.initializer);
    } else {
      variableDecl = var_(options.name, options.initializer);
    }
    this.addStatement(variableDecl);
    return this;
  }

  getStatements(): readonly ts.Statement[] {
    return this.#statements;
  }

  getFileName(): string {
    return this.#sourceFile.fileName;
  }

  print(): string {
    return print(this.#sourceFile);
  }

  get(): ts.SourceFile {
    return this.#sourceFile;
  }

  /**
   * Find all class declarations in the source file
   * @returns Array of class declarations
   */
  findClasses(): ts.ClassDeclaration[] {
    const classes: ts.ClassDeclaration[] = [];

    // Helper function to visit nodes recursively
    const visit = (node: ts.Node) => {
      if (ts.isClassDeclaration(node)) {
        classes.push(node);
      }

      ts.forEachChild(node, visit);
    };

    // Start visiting from the source file
    visit(this.#sourceFile);

    return classes;
  }

  /**
   * Find a class declaration by name
   * @param name The name of the class to find
   * @returns The class declaration or undefined if not found
   */
  findClass(name: string): ts.ClassDeclaration | undefined {
    return this.findClasses().find(classDecl =>
      classDecl.name && classDecl.name.text === name
    );
  }

  /**
   * Find decorators for a specific node (class, property, method, etc.)
   * @param node The node to find decorators for
   * @returns Array of decorators or empty array if none found
   */
  findDecorators(node: ts.Node): ts.Decorator[] {
    // First try the standard property accessor
    type NodeWithDecorators = ts.Node & { decorators?: readonly ts.Decorator[] };
    const nodeWithDecorators = node as NodeWithDecorators;

    if (nodeWithDecorators.decorators) {
      return Array.from(nodeWithDecorators.decorators);
    }

    // If that fails, try to find decorators using direct AST traversal
    // This is needed because TypeScript doesn't always expose decorators directly
    return this.findDecoratorsForNode(node);
  }

  /**
   * Advanced decorator finder that uses direct AST traversal to find decorators
   * for a specific node, working around limitations in TypeScript's AST
   *
   * @param targetNode The node to find decorators for
   * @returns Array of decorators found for the node
   */
  private findDecoratorsForNode(targetNode: ts.Node): ts.Decorator[] {
    // Get all decorators in the source file
    const allDecorators = this.findAllDecoratorsInSource();

    // Map from decorated nodes to their decorators
    const decoratorMap = new Map<ts.Node, ts.Decorator[]>();

    // For each decorator, find its parent (the decorated node)
    for (const decorator of allDecorators) {
      // Find the parent node that this decorator is decorating
      let decoratedNode: ts.Node | undefined;

      const findParent = (node: ts.Node) => {
        // Skip visiting the decorator itself to avoid loops
        if (node === decorator) return;

        ts.forEachChild(node, child => {
          if (child === decorator) {
            decoratedNode = node;
            return;
          }

          if (!decoratedNode) {
            findParent(child);
          }
        });
      };

      findParent(this.#sourceFile);

      if (decoratedNode) {
        const decs = decoratorMap.get(decoratedNode) || [];
        decs.push(decorator);
        decoratorMap.set(decoratedNode, decs);
      }
    }

    // Return decorators for our target node
    return decoratorMap.get(targetNode) || [];
  }

  /**
   * Find all decorators in the source file
   * @returns Array of all decorator nodes
   */
  private findAllDecoratorsInSource(): ts.Decorator[] {
    const decorators: ts.Decorator[] = [];

    const visit = (node: ts.Node) => {
      if (ts.isDecorator(node)) {
        decorators.push(node);
      }

      ts.forEachChild(node, visit);
    };

    visit(this.#sourceFile);

    return decorators;
  }

  /**
   * Get decorator information in a more structured format
   * @param decorator The decorator node to analyze
   * @returns Structured decorator information
   */
  getDecoratorInfo(decorator: ts.Decorator): DecoratorInfo {
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
   * @param classDeclaration The class declaration to analyze
   * @returns Array of property information with decorators
   */
  getClassProperties(classDeclaration: ts.ClassDeclaration): ClassPropertyInfo[] {
    const properties: ClassPropertyInfo[] = [];

    for (const member of classDeclaration.members) {
      if (ts.isPropertyDeclaration(member)) {
        const propertyName = ts.isIdentifier(member.name) ? member.name.text : 'unknown';
        const decorators = this.findDecorators(member).map(d => this.getDecoratorInfo(d));

        properties.push({
          name: propertyName,
          decorators,
          isPrivate: !!member.modifiers?.some(m => m.kind === ts.SyntaxKind.PrivateKeyword),
          isStatic: !!member.modifiers?.some(m => m.kind === ts.SyntaxKind.StaticKeyword),
          isReadonly: !!member.modifiers?.some(m => m.kind === ts.SyntaxKind.ReadonlyKeyword),
          type: member.type ? this.#sourceFile.text.substring(member.type.pos, member.type.end) : undefined
        });
      }
    }

    return properties;
  }

  /**
   * Find all methods of a class with their decorators
   * @param classDeclaration The class declaration to analyze
   * @returns Array of method information with decorators
   */
  getClassMethods(classDeclaration: ts.ClassDeclaration): ClassMethodInfo[] {
    const methods: ClassMethodInfo[] = [];

    for (const member of classDeclaration.members) {
      if (ts.isMethodDeclaration(member)) {
        const methodName = ts.isIdentifier(member.name) ? member.name.text : 'unknown';
        const decorators = this.findDecorators(member).map(d => this.getDecoratorInfo(d));

        methods.push({
          name: methodName,
          decorators,
          isPrivate: !!member.modifiers?.some(m => m.kind === ts.SyntaxKind.PrivateKeyword),
          isStatic: !!member.modifiers?.some(m => m.kind === ts.SyntaxKind.StaticKeyword),
          parameters: member.parameters.map(param => {
            const paramName = ts.isIdentifier(param.name) ? param.name.text : 'unknown';
            const paramDecorators = this.findDecorators(param).map(d => this.getDecoratorInfo(d));
            return {
              name: paramName,
              decorators: paramDecorators,
              type: param.type ? this.#sourceFile.text.substring(param.type.pos, param.type.end) : undefined
            };
          })
        });
      }
    }

    return methods;
  }
}

/**
 * Creates a new TypeScript source file with fluent API
 *
 * @param fileName The name of the source file
 * @param content Initial content (defaults to empty string)
 * @param scriptTarget The TypeScript script target (defaults to Latest)
 * @returns A fluent builder for the source file
 */
export const file = (
  fileName: string,
  content: string = "",
  scriptTarget: ts.ScriptTarget = ts.ScriptTarget.Latest
): SourceFile => {
  return buildFluentApi(FileBuilder, {
    fileName,
    content,
    scriptTarget,
  });
};

/**
 * Creates a source file from existing file content string
 *
 * @param fileName The name of the source file
 * @param content The TypeScript code content
 * @param scriptTarget The TypeScript script target (defaults to Latest)
 * @returns A fluent builder for the source file
 */
export const fileFromString = (
  fileName: string,
  content: string,
  scriptTarget: ts.ScriptTarget = ts.ScriptTarget.Latest
): SourceFile => {
  return file(fileName, content, scriptTarget);
};

/**
 * Creates a source file from an existing file path
 *
 * @param filePath The path to the TypeScript file to read
 * @param scriptTarget The TypeScript script target (defaults to Latest)
 * @returns A fluent builder for the source file
 */
export const fileFromPath = (
  filePath: string,
  scriptTarget: ts.ScriptTarget = ts.ScriptTarget.Latest
): SourceFile => {
  // Read from disk
  let content: string;
  try {
    const fs = require('fs');
    content = fs.readFileSync(filePath, 'utf-8');
  } catch (error) {
    throw new Error(`Failed to read file at ${filePath}: ${error}`);
  }

  // Get the filename from the path
  const fileName = filePath.split(/[/\\]/).pop() || filePath;

  return fileFromString(fileName, content, scriptTarget);
};
