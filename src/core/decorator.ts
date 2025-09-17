import ts from "typescript";
import { type BuildableAST, buildFluentApi } from "../utils/buildFluentApi";
import { objLiteral } from "./object";

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

  /**
   * Set a property in a specific argument's object, creating the object if it doesn't exist
   * @param index The argument index (defaults to 0)
   * @param key The property key to set
   * @param value The value to set
   * @returns The decorator builder for chaining
   */
  setArgumentProperty(index: number = 0, key: string, value: DecoratorArgValue): DecoratorBuilder {
    return this.updateArgumentObject(index, (obj) => obj.set(key, value));
  }

  /**
   * Set multiple properties in a specific argument's object
   * @param index The argument index (defaults to 0)
   * @param properties Object containing key-value pairs to set
   * @returns The decorator builder for chaining
   */
  setArgumentProperties(index: number = 0, properties: Record<string, DecoratorArgValue>): DecoratorBuilder {
    return this.updateArgumentObject(index, (obj) => obj.setMany(properties));
  }

  /**
   * Remove a property from a specific argument's object
   * @param index The argument index (defaults to 0)
   * @param key The property key to remove
   * @returns The decorator builder for chaining
   */
  removeArgumentProperty(index: number = 0, key: string): DecoratorBuilder {
    return this.updateArgumentObject(index, (obj) => obj.remove(key));
  }

  /**
   * Add an argument to the decorator call
   * @param value The argument value to add
   * @returns The decorator builder for chaining
   */
  addArgument(value: DecoratorArgValue | Record<string, DecoratorArgValue>): DecoratorBuilder {
    if (!ts.isCallExpression(this.#decorator.expression)) {
      // Convert to call expression
      const argExpression = typeof value === 'object' && !Array.isArray(value)
        ? this.createObjectExpression(value)
        : this.createValueExpression(value as DecoratorArgValue);

      const callExpression = ts.factory.createCallExpression(
        this.#decorator.expression,
        undefined,
        [argExpression]
      );

      this.#decorator = ts.factory.createDecorator(callExpression);
      return this;
    }

    const currentArgs = this.#decorator.expression.arguments;
    const argExpression = typeof value === 'object' && !Array.isArray(value)
      ? this.createObjectExpression(value)
      : this.createValueExpression(value as DecoratorArgValue);

    const newArgs = [...currentArgs, argExpression];
    const newCallExpression = ts.factory.updateCallExpression(
      this.#decorator.expression,
      this.#decorator.expression.expression,
      this.#decorator.expression.typeArguments,
      newArgs
    );

    this.#decorator = ts.factory.createDecorator(newCallExpression);
    return this;
  }

  /**
   * Helper method to create a value expression from a primitive or object
   */
  private createValueExpression(value: DecoratorArgValue): ts.Expression {
    if (typeof value === "string") {
      return ts.factory.createStringLiteral(value);
    } else if (typeof value === "number") {
      return ts.factory.createNumericLiteral(value);
    } else if (typeof value === "boolean") {
      return value ? ts.factory.createTrue() : ts.factory.createFalse();
    }
    return ts.factory.createStringLiteral(String(value));
  }

  /**
   * Helper method to create an object literal expression
   */
  private createObjectExpression(obj: Record<string, DecoratorArgValue>): ts.ObjectLiteralExpression {
    return ts.factory.createObjectLiteralExpression(
      Object.entries(obj).map(([key, value]) =>
        ts.factory.createPropertyAssignment(
          key,
          this.createValueExpression(value)
        )
      )
    );
  }

  /**
   * Helper method to update a property in an object literal
   */
  private updateObjectLiteralProperty(
    obj: ts.ObjectLiteralExpression,
    key: string,
    value: DecoratorArgValue
  ): ts.ObjectLiteralExpression {
    const existingProperties = obj.properties.filter(prop => {
      if (ts.isPropertyAssignment(prop)) {
        const propName = ts.isIdentifier(prop.name)
          ? prop.name.text
          : ts.isStringLiteral(prop.name)
            ? prop.name.text
            : undefined;
        return propName !== key;
      }
      return true;
    });

    const newProperty = ts.factory.createPropertyAssignment(
      key,
      this.createValueExpression(value)
    );

    return ts.factory.updateObjectLiteralExpression(
      obj,
      [...existingProperties, newProperty]
    );
  }

  /**
   * Update an argument at a specific index
   * @param index The argument index to update
   * @param value The new value for the argument
   * @returns The decorator builder for chaining
   */
  updateArgument(index: number, value: DecoratorArgValue | Record<string, DecoratorArgValue> | ts.Expression): DecoratorBuilder {
    if (!ts.isCallExpression(this.#decorator.expression)) {
      // Convert to call expression if needed
      const argExpression = this.createArgumentExpression(value);
      const callExpression = ts.factory.createCallExpression(
        this.#decorator.expression,
        undefined,
        index === 0 ? [argExpression] : new Array(index + 1).fill(ts.factory.createNull()).map((_, i) => i === index ? argExpression : ts.factory.createNull())
      );
      this.#decorator = ts.factory.createDecorator(callExpression);
      return this;
    }

    const currentArgs = [...this.#decorator.expression.arguments];

    // Extend args array if needed
    while (currentArgs.length <= index) {
      currentArgs.push(ts.factory.createNull());
    }

    // Update the specific argument
    currentArgs[index] = this.createArgumentExpression(value);

    const newCallExpression = ts.factory.updateCallExpression(
      this.#decorator.expression,
      this.#decorator.expression.expression,
      this.#decorator.expression.typeArguments,
      currentArgs
    );

    this.#decorator = ts.factory.createDecorator(newCallExpression);
    return this;
  }

  /**
   * Remove an argument at a specific index
   * @param index The argument index to remove
   * @returns The decorator builder for chaining
   */
  removeArgument(index: number): DecoratorBuilder {
    if (!ts.isCallExpression(this.#decorator.expression)) {
      return this; // Nothing to remove
    }

    const currentArgs = [...this.#decorator.expression.arguments];
    if (index < 0 || index >= currentArgs.length) {
      return this; // Index out of bounds
    }

    currentArgs.splice(index, 1);

    const newCallExpression = ts.factory.updateCallExpression(
      this.#decorator.expression,
      this.#decorator.expression.expression,
      this.#decorator.expression.typeArguments,
      currentArgs
    );

    this.#decorator = ts.factory.createDecorator(newCallExpression);
    return this;
  }

  /**
   * Get an object builder for a specific argument (if it's an object)
   * @param index The argument index
   * @returns Object builder or undefined if not an object
   */
  getArgumentObjectBuilder(index: number = 0): ReturnType<typeof objLiteral> | undefined {
    if (!ts.isCallExpression(this.#decorator.expression)) {
      return undefined;
    }

    const args = this.#decorator.expression.arguments;
    if (index < 0 || index >= args.length) {
      return undefined;
    }

    const arg = args[index];
    if (arg && ts.isObjectLiteralExpression(arg)) {
      return objLiteral({ from: arg });
    }

    return undefined;
  }

  /**
   * Update an object argument using a callback, creating the object if it doesn't exist
   * @param index The argument index
   * @param updateFn Function to update the object
   * @returns The decorator builder for chaining
   */
  updateArgumentObject(index: number, updateFn: (objBuilder: ReturnType<typeof objLiteral>) => ReturnType<typeof objLiteral>): DecoratorBuilder {
    // Ensure we have a call expression
    if (!ts.isCallExpression(this.#decorator.expression)) {
      const callExpression = ts.factory.createCallExpression(
        this.#decorator.expression,
        undefined,
        []
      );
      this.#decorator = ts.factory.createDecorator(callExpression);
    }

    // Now we know it's a call expression
    const callExpression = this.#decorator.expression as ts.CallExpression;
    const currentArgs = [...callExpression.arguments];

    // Extend args array if needed with null placeholders
    while (currentArgs.length <= index) {
      currentArgs.push(ts.factory.createNull());
    }

    // Get or create the object at the specified index
    let objectBuilder: ReturnType<typeof objLiteral>;
    const existingArg = currentArgs[index];

    if (existingArg && ts.isObjectLiteralExpression(existingArg)) {
      // Use existing object
      objectBuilder = objLiteral(existingArg);
    } else {
      // Create new empty object
      objectBuilder = objLiteral();
    }

    // Apply the update function
    const updatedObject = updateFn(objectBuilder);

    // Update the argument with the new object
    currentArgs[index] = updatedObject.get();

    const newCallExpression = ts.factory.updateCallExpression(
      callExpression,
      callExpression.expression,
      callExpression.typeArguments,
      currentArgs
    );

    this.#decorator = ts.factory.createDecorator(newCallExpression);
    return this;
  }

  /**
   * Helper method to create an argument expression from a value, object, or existing expression
   */
  private createArgumentExpression(value: DecoratorArgValue | Record<string, DecoratorArgValue> | ts.Expression): ts.Expression {
    // Check if it's already a TypeScript expression
    if (typeof value === "object" && value !== null && 'kind' in value) {
      return value as ts.Expression;
    } else if (typeof value === "object" && !Array.isArray(value)) {
      return objLiteral(value as Record<string, DecoratorArgValue>).get();
    } else if (typeof value === "string") {
      return ts.factory.createStringLiteral(value);
    } else if (typeof value === "number") {
      return ts.factory.createNumericLiteral(value);
    } else if (typeof value === "boolean") {
      return value ? ts.factory.createTrue() : ts.factory.createFalse();
    }
    return ts.factory.createStringLiteral(String(value));
  }

  // ========== Async Method Variants ==========

  /**
   * Async version of updateArgumentObject - allows async callback functions
   */
  async updateArgumentObjectAsync(
    index: number,
    updateFn: (objBuilder: ReturnType<typeof objLiteral>) => Promise<ReturnType<typeof objLiteral>>
  ): Promise<DecoratorBuilder> {
    // Ensure we have a call expression
    if (!ts.isCallExpression(this.#decorator.expression)) {
      const callExpression = ts.factory.createCallExpression(
        this.#decorator.expression,
        undefined,
        []
      );
      this.#decorator = ts.factory.createDecorator(callExpression);
    }

    // Now we know it's a call expression
    const callExpression = this.#decorator.expression as ts.CallExpression;
    const currentArgs = [...callExpression.arguments];

    // Extend args array if needed with null placeholders
    while (currentArgs.length <= index) {
      currentArgs.push(ts.factory.createNull());
    }

    // Get or create the object at the specified index
    let objectBuilder: ReturnType<typeof objLiteral>;
    const existingArg = currentArgs[index];

    if (existingArg && ts.isObjectLiteralExpression(existingArg)) {
      // Use existing object
      objectBuilder = objLiteral(existingArg);
    } else {
      // Create new empty object
      objectBuilder = objLiteral();
    }

    // Apply the update function asynchronously
    const updatedObject = await updateFn(objectBuilder);

    // Update the argument with the new object
    currentArgs[index] = updatedObject.get();

    const newCallExpression = ts.factory.updateCallExpression(
      callExpression,
      callExpression.expression,
      callExpression.typeArguments,
      currentArgs
    );

    this.#decorator = ts.factory.createDecorator(newCallExpression);
    return this;
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
