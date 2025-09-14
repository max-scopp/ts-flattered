import ts from "typescript";
import { type BuildableAST, buildFluentApi } from "../utils/buildFluentApi";

type DecoratorArgValue = string | number | boolean;

/**
 * Structure for options when creating a decorator
 */
export interface DecoratorOptions {
  name: string;
  args?: Array<Record<string, DecoratorArgValue>>;
}

/**
 * Interface for working with decorator arguments in a typed way
 */
export interface DecoratorArgumentInfo {
  name: string;
  arguments: Array<Record<string, unknown> | string | number | boolean | Array<unknown>>;
}

/**
 * Extract values from an object literal expression
 * @param obj The object literal to extract values from
 * @returns A record of property names to values
 */
export function extractObjectLiteralValues(obj: ts.ObjectLiteralExpression): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const prop of obj.properties) {
    if (ts.isPropertyAssignment(prop)) {
      const propName = ts.isIdentifier(prop.name)
        ? prop.name.text
        : ts.isStringLiteral(prop.name)
          ? prop.name.text
          : undefined;

      if (propName) {
        result[propName] = extractValueFromNode(prop.initializer);
      }
    }
  }

  return result;
}

/**
 * Extract a value from any TypeScript node
 * @param node The node to extract a value from
 * @returns The extracted value
 */
export function extractValueFromNode(node: ts.Node): unknown {
  if (ts.isObjectLiteralExpression(node)) {
    return extractObjectLiteralValues(node);
  } else if (ts.isStringLiteral(node)) {
    return node.text;
  } else if (ts.isNumericLiteral(node)) {
    return Number(node.text);
  } else if (node.kind === ts.SyntaxKind.TrueKeyword) {
    return true;
  } else if (node.kind === ts.SyntaxKind.FalseKeyword) {
    return false;
  } else if (ts.isArrayLiteralExpression(node)) {
    return node.elements.map(el => extractValueFromNode(el));
  }
  return undefined;
}

/**
 * Extract the name and arguments from a decorator
 * @param decorator The decorator node to analyze
 * @returns Structured information about the decorator
 */
export function extractDecoratorInfo(decorator: ts.Decorator): DecoratorArgumentInfo {
  // Extract the name
  let name = 'unknown';
  if (ts.isCallExpression(decorator.expression) && ts.isIdentifier(decorator.expression.expression)) {
    name = decorator.expression.expression.text;
  } else if (ts.isIdentifier(decorator.expression)) {
    name = decorator.expression.text;
  }

  // Extract arguments
  const args: Array<Record<string, unknown> | string | number | boolean | Array<unknown>> = [];

  if (ts.isCallExpression(decorator.expression)) {
    for (const arg of decorator.expression.arguments) {
      const extractedArg = extractValueFromNode(arg);
      if (
        typeof extractedArg === 'string' ||
        typeof extractedArg === 'number' ||
        typeof extractedArg === 'boolean' ||
        Array.isArray(extractedArg) ||
        (extractedArg !== null && typeof extractedArg === 'object')
      ) {
        args.push(extractedArg as Record<string, unknown> | string | number | boolean | Array<unknown>);
      }
    }
  }

  return {
    name,
    arguments: args
  };
}

// Decorator Builder
class DecoratorBuilder implements BuildableAST {
  #decorator: ts.Decorator;
  #name: string;

  constructor(options: DecoratorOptions | ts.Decorator) {
    if ('kind' in options && ts.isDecorator(options)) {
      // Initialize from existing decorator
      this.#decorator = options;

      // Extract name from existing decorator for easier access
      if (ts.isCallExpression(options.expression) && ts.isIdentifier(options.expression.expression)) {
        this.#name = options.expression.expression.text;
      } else if (ts.isIdentifier(options.expression)) {
        this.#name = options.expression.text;
      } else {
        this.#name = 'unknown';
      }
    } else {
      // Initialize from options
      const { name, args } = options as DecoratorOptions;
      this.#name = name;

      let callExpression: ts.CallExpression | ts.Identifier;

      if (args && args.length > 0) {
        const argExpressions = args.map((arg) =>
          ts.factory.createObjectLiteralExpression(
            Object.entries(arg).map(([key, value]) =>
              ts.factory.createPropertyAssignment(
                key,
                typeof value === "string"
                  ? ts.factory.createStringLiteral(value)
                  : typeof value === "number"
                    ? ts.factory.createNumericLiteral(value)
                    : typeof value === "boolean"
                      ? value
                        ? ts.factory.createTrue()
                        : ts.factory.createFalse()
                      : ts.factory.createStringLiteral(String(value)),
              ),
            ),
          ),
        );

        callExpression = ts.factory.createCallExpression(
          ts.factory.createIdentifier(name),
          undefined,
          argExpressions,
        );
      } else {
        callExpression = ts.factory.createIdentifier(name);
      }

      this.#decorator = ts.factory.createDecorator(callExpression);
    }
  }

  /**
   * Get the name of the decorator
   * @returns Decorator name
   */
  getName(): string {
    return this.#name;
  }

  /**
   * Get argument information from the decorator in a structured format
   * @returns Structured argument information
   */
  getArgumentInfo(): DecoratorArgumentInfo {
    return extractDecoratorInfo(this.#decorator);
  }

  /**
   * Get the first object-style argument from the decorator with strong typing
   * @returns Strongly typed object argument
   */
  getArgumentObject<T>(): T | undefined {
    if (!ts.isCallExpression(this.#decorator.expression)) {
      return undefined;
    }

    const args = this.#decorator.expression.arguments;
    if (args.length === 0) {
      return undefined;
    }

    const firstArg = args[0];
    if (firstArg && ts.isObjectLiteralExpression(firstArg)) {
      return extractObjectLiteralValues(firstArg) as unknown as T;
    }

    return undefined;
  }

  get(): ts.Decorator {
    return this.#decorator;
  }
}

/**
 * Create a decorator from name and arguments
 * @param name Decorator name
 * @param args Optional decorator arguments
 * @returns A fluent decorator builder
 */
export const decorator = (
  name: string,
  args?: Array<Record<string, DecoratorArgValue>>,
) => buildFluentApi(DecoratorBuilder, { name, args });

/**
 * Create a decorator builder from an existing TypeScript decorator node
 * @param existingDecorator The existing TypeScript decorator node
 * @returns A fluent decorator builder
 */
export const fromDecorator = (existingDecorator: ts.Decorator) =>
  buildFluentApi(DecoratorBuilder, existingDecorator);
