import ts from "typescript";
import { extractDecoratorInfo } from "../core/decorator";
import { getImportModule } from "./moduleResolver";

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
 * Options for filtering decorators
 */
export interface DecoratorFilterOptions {
  /** Filter by decorator name (exact match) */
  name?: string;
  /** Filter by decorator name using regex pattern */
  nameRegex?: RegExp;
  /** Filter by module from which the decorator was imported */
  module?: string;
  /** Filter by module using regex pattern */
  moduleRegex?: RegExp;
  /** Source file containing the decorators (required for module filtering) */
  sourceFile: ts.SourceFile;
}

/**
 * Options for filtering methods
 */
export interface MethodFilterOptions {
  /** Filter by method name (exact match) */
  name?: string;
  /** Filter by method name using regex pattern */
  nameRegex?: RegExp;
  /** Filter by visibility */
  isPrivate?: boolean;
  /** Filter by static modifier */
  isStatic?: boolean;
  /** Filter by decorators */
  decorators?: {
    /** Filter by decorator name (exact match) */
    name?: string;
    /** Filter by decorator name using regex pattern */
    nameRegex?: RegExp;
    /** Filter by module from which the decorator was imported */
    module?: string;
    /** Filter by module using regex pattern */
    moduleRegex?: RegExp;
  };
  /** Source file containing the methods (required for decorator module filtering) */
  sourceFile?: ts.SourceFile;
}

/**
 * Options for filtering properties
 */
export interface PropertyFilterOptions {
  /** Filter by property name (exact match) */
  name?: string;
  /** Filter by property name using regex pattern */
  nameRegex?: RegExp;
  /** Filter by visibility */
  isPrivate?: boolean;
  /** Filter by static modifier */
  isStatic?: boolean;
  /** Filter by readonly modifier */
  isReadonly?: boolean;
  /** Filter by decorators */
  decorators?: {
    /** Filter by decorator name (exact match) */
    name?: string;
    /** Filter by decorator name using regex pattern */
    nameRegex?: RegExp;
    /** Filter by module from which the decorator was imported */
    module?: string;
    /** Filter by module using regex pattern */
    moduleRegex?: RegExp;
  };
  /** Source file containing the properties (required for decorator module filtering) */
  sourceFile?: ts.SourceFile;
}

/**
 * Options for filtering parameters
 */
export interface ParameterFilterOptions {
  /** Filter by parameter name (exact match) */
  name?: string;
  /** Filter by parameter name using regex pattern */
  nameRegex?: RegExp;
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
 * @param node The node to find decorators for
 * @param options Optional filtering options
 * @returns Array of decorators or empty array if none found
 */
export function findDecorators(node: ts.Node, options?: DecoratorFilterOptions): ts.Decorator[] {
  // TypeScript stores decorators in the 'decorators' property (older versions)
  // or as part of 'modifiers' (newer versions)
  const decorators: ts.Decorator[] = [];

  // Check if the node has decorators property (legacy)
  if ('decorators' in node && node.decorators) {
    decorators.push(...(node.decorators as ts.Decorator[]));
  }

  // Check modifiers for decorators (modern approach)
  if ('modifiers' in node && node.modifiers) {
    const modifiers = node.modifiers as readonly ts.ModifierLike[];
    for (const modifier of modifiers) {
      if (ts.isDecorator(modifier)) {
        decorators.push(modifier);
      }
    }
  }

  // Apply filters if options are provided
  if (options) {
    return decorators.filter(decorator => {
      const decoratorInfo = extractDecoratorInfo(decorator);
      const decoratorName = decoratorInfo.name;

      // Filter by exact name
      if (options.name && decoratorName !== options.name) {
        return false;
      }

      // Filter by name regex
      if (options.nameRegex && !options.nameRegex.test(decoratorName)) {
        return false;
      }

      // Filter by module (requires checking import statements)
      if (options.module || options.moduleRegex) {
        const importModule = getImportModule(decoratorName, options.sourceFile);

        if (options.module && importModule !== options.module) {
          return false;
        }

        if (options.moduleRegex && (!importModule || !options.moduleRegex.test(importModule))) {
          return false;
        }
      }

      return true;
    });
  }

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
 * Find all methods of a class
 * @param classDeclaration The class declaration to analyze
 * @param options Optional filtering options
 * @returns Array of method declarations
 */
export function findMethods(classDeclaration: ts.ClassDeclaration, options?: MethodFilterOptions): ts.MethodDeclaration[] {
  const methods: ts.MethodDeclaration[] = [];

  for (const member of classDeclaration.members) {
    if (ts.isMethodDeclaration(member)) {
      methods.push(member);
    }
  }

  // Apply filters if options are provided
  if (options) {
    return methods.filter(method => {
      const methodName = ts.isIdentifier(method.name) ? method.name.text : 'unknown';

      // Filter by exact name
      if (options.name && methodName !== options.name) {
        return false;
      }

      // Filter by name regex
      if (options.nameRegex && !options.nameRegex.test(methodName)) {
        return false;
      }

      // Filter by private modifier
      if (options.isPrivate !== undefined) {
        const isPrivate = !!method.modifiers?.some(m => m.kind === ts.SyntaxKind.PrivateKeyword);
        if (options.isPrivate !== isPrivate) {
          return false;
        }
      }

      // Filter by static modifier
      if (options.isStatic !== undefined) {
        const isStatic = !!method.modifiers?.some(m => m.kind === ts.SyntaxKind.StaticKeyword);
        if (options.isStatic !== isStatic) {
          return false;
        }
      }

      // Filter by decorators
      if (options.decorators) {
        const decoratorOptions: DecoratorFilterOptions | undefined = options.sourceFile ? {
          name: options.decorators.name,
          nameRegex: options.decorators.nameRegex,
          module: options.decorators.module,
          moduleRegex: options.decorators.moduleRegex,
          sourceFile: options.sourceFile
        } : undefined;

        const decorators = findDecorators(method, decoratorOptions);

        // If we're filtering by decorators but none match, exclude this method
        if (decorators.length === 0) {
          return false;
        }
      }

      return true;
    });
  }

  return methods;
}

/**
 * Find all parameters of a method or function
 * @param method The method or function declaration to analyze
 * @param options Optional filtering options
 * @returns Array of parameter declarations
 */
export function findParameters(method: ts.MethodDeclaration | ts.FunctionDeclaration | ts.ConstructorDeclaration, options?: ParameterFilterOptions): ts.ParameterDeclaration[] {
  const parameters = [...method.parameters];

  // Apply filters if options are provided
  if (options) {
    return parameters.filter(param => {
      const paramName = ts.isIdentifier(param.name) ? param.name.text : 'unknown';

      // Filter by exact name
      if (options.name && paramName !== options.name) {
        return false;
      }

      // Filter by name regex
      if (options.nameRegex && !options.nameRegex.test(paramName)) {
        return false;
      }

      return true;
    });
  }

  return parameters;
}

/**
 * Find all properties of a class
 * @param classDeclaration The class declaration to analyze
 * @param options Optional filtering options
 * @returns Array of property declarations
 */
export function findProperties(classDeclaration: ts.ClassDeclaration, options?: PropertyFilterOptions): ts.PropertyDeclaration[] {
  const properties: ts.PropertyDeclaration[] = [];

  for (const member of classDeclaration.members) {
    if (ts.isPropertyDeclaration(member)) {
      properties.push(member);
    }
  }

  // Apply filters if options are provided
  if (options) {
    return properties.filter(property => {
      const propertyName = ts.isIdentifier(property.name) ? property.name.text : 'unknown';

      // Filter by exact name
      if (options.name && propertyName !== options.name) {
        return false;
      }

      // Filter by name regex
      if (options.nameRegex && !options.nameRegex.test(propertyName)) {
        return false;
      }

      // Filter by private modifier
      if (options.isPrivate !== undefined) {
        const isPrivate = !!property.modifiers?.some(m => m.kind === ts.SyntaxKind.PrivateKeyword);
        if (options.isPrivate !== isPrivate) {
          return false;
        }
      }

      // Filter by static modifier
      if (options.isStatic !== undefined) {
        const isStatic = !!property.modifiers?.some(m => m.kind === ts.SyntaxKind.StaticKeyword);
        if (options.isStatic !== isStatic) {
          return false;
        }
      }

      // Filter by readonly modifier
      if (options.isReadonly !== undefined) {
        const isReadonly = !!property.modifiers?.some(m => m.kind === ts.SyntaxKind.ReadonlyKeyword);
        if (options.isReadonly !== isReadonly) {
          return false;
        }
      }

      // Filter by decorators
      if (options.decorators) {
        const decoratorOptions: DecoratorFilterOptions | undefined = options.sourceFile ? {
          name: options.decorators.name,
          nameRegex: options.decorators.nameRegex,
          module: options.decorators.module,
          moduleRegex: options.decorators.moduleRegex,
          sourceFile: options.sourceFile
        } : undefined;

        const decorators = findDecorators(property, decoratorOptions);

        // If we're filtering by decorators but none match, exclude this property
        if (decorators.length === 0) {
          return false;
        }
      }

      return true;
    });
  }

  return properties;
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
      const decorators = findDecorators(member).map(d => getDecoratorInfo(d));

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
      const decorators = findDecorators(member).map(d => getDecoratorInfo(d));

      methods.push({
        name: methodName,
        decorators,
        isPrivate: !!member.modifiers?.some(m => m.kind === ts.SyntaxKind.PrivateKeyword),
        isStatic: !!member.modifiers?.some(m => m.kind === ts.SyntaxKind.StaticKeyword),
        parameters: member.parameters.map(param => {
          const paramName = ts.isIdentifier(param.name) ? param.name.text : 'unknown';
          const paramDecorators = findDecorators(param).map(d => getDecoratorInfo(d));
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
