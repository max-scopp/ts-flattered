import ts from "typescript";
import { type BuildableAST, buildFluentApi } from "../utils/buildFluentApi";

type ObjectValuePrimitive = string | number | boolean | null | undefined;

type ObjectValue = 
  | ObjectValuePrimitive
  | ts.Expression
  | { [key: string]: ObjectValue }
  | ObjectValue[];

/**
 * Builder for TypeScript object literal expressions
 */
class ObjectLiteralBuilder implements BuildableAST {
  #obj: ts.ObjectLiteralExpression;

  constructor(options: { 
    properties?: Record<string, ObjectValue>; 
    from?: ts.ObjectLiteralExpression;
  } = {}) {
    if (options.from) {
      // Adopt from existing object literal
      this.#obj = options.from;
    } else {
      // Create new object literal
      const properties = options.properties || {};
      const propAssignments = Object.entries(properties).map(([key, value]) =>
        ts.factory.createPropertyAssignment(
          key,
          this.createValueExpression(value)
        )
      );
      
      this.#obj = ts.factory.createObjectLiteralExpression(propAssignments);
    }
  }

  /**
   * Set a property in the object
   */
  set(key: string, value: ObjectValue): ObjectLiteralBuilder {
    const existingProperties = this.#obj.properties.filter(prop => {
      if (ts.isPropertyAssignment(prop)) {
        const propName = this.getPropertyName(prop);
        return propName !== key;
      }
      return true;
    });

    const newProperty = ts.factory.createPropertyAssignment(
      key,
      this.createValueExpression(value)
    );

    this.#obj = ts.factory.updateObjectLiteralExpression(
      this.#obj,
      [...existingProperties, newProperty]
    );

    return this;
  }

  /**
   * Set multiple properties at once
   */
  setMany(properties: Record<string, ObjectValue>): ObjectLiteralBuilder {
    for (const [key, value] of Object.entries(properties)) {
      this.set(key, value);
    }
    return this;
  }

  /**
   * Remove a property from the object
   */
  remove(key: string): ObjectLiteralBuilder {
    const filteredProperties = this.#obj.properties.filter(prop => {
      if (ts.isPropertyAssignment(prop)) {
        const propName = this.getPropertyName(prop);
        return propName !== key;
      }
      return true;
    });

    this.#obj = ts.factory.updateObjectLiteralExpression(
      this.#obj,
      filteredProperties
    );

    return this;
  }

  /**
   * Check if a property exists
   */
  has(key: string): boolean {
    return this.#obj.properties.some(prop => {
      if (ts.isPropertyAssignment(prop)) {
        const propName = this.getPropertyName(prop);
        return propName === key;
      }
      return false;
    });
  }

  /**
   * Get a property value (returns the raw expression)
   */
  getProperty(key: string): ts.Expression | undefined {
    for (const prop of this.#obj.properties) {
      if (ts.isPropertyAssignment(prop)) {
        const propName = this.getPropertyName(prop);
        if (propName === key) {
          return prop.initializer;
        }
      }
    }
    return undefined;
  }

  /**
   * Get all property names
   */
  getPropertyNames(): string[] {
    return this.#obj.properties
      .filter(ts.isPropertyAssignment)
      .map(prop => this.getPropertyName(prop))
      .filter((name): name is string => name !== undefined);
  }

  /**
   * Clear all properties
   */
  clear(): ObjectLiteralBuilder {
    this.#obj = ts.factory.updateObjectLiteralExpression(
      this.#obj,
      []
    );
    return this;
  }

  /**
   * Clone this object builder
   */
  clone(): ObjectLiteralBuilder {
    return new ObjectLiteralBuilder({ from: this.#obj });
  }

  /**
   * Get the object as a Record<string, ObjectValue>
   */
  toRecord(): Record<string, ObjectValue> {
    const result: Record<string, ObjectValue> = {};
    
    for (const prop of this.#obj.properties) {
      if (ts.isPropertyAssignment(prop)) {
        const propName = this.getPropertyName(prop);
        if (propName) {
          result[propName] = this.extractValueFromExpression(prop.initializer);
        }
      }
    }
    
    return result;
  }

  /**
   * Helper to extract ObjectValue from TypeScript expression
   */
  private extractValueFromExpression(expr: ts.Expression): ObjectValue {
    if (ts.isStringLiteral(expr)) {
      return expr.text;
    } else if (ts.isNumericLiteral(expr)) {
      return Number(expr.text);
    } else if (expr.kind === ts.SyntaxKind.TrueKeyword) {
      return true;
    } else if (expr.kind === ts.SyntaxKind.FalseKeyword) {
      return false;
    } else if (expr.kind === ts.SyntaxKind.NullKeyword) {
      return null;
    } else if (ts.isIdentifier(expr) && expr.text === "undefined") {
      return undefined;
    } else if (ts.isObjectLiteralExpression(expr)) {
      // Recursively extract nested object literals
      const nestedObject: Record<string, ObjectValue> = {};
      for (const prop of expr.properties) {
        if (ts.isPropertyAssignment(prop)) {
          const propName = this.getPropertyName(prop);
          if (propName) {
            nestedObject[propName] = this.extractValueFromExpression(prop.initializer);
          }
        }
      }
      return nestedObject;
    } else if (ts.isArrayLiteralExpression(expr)) {
      // Recursively extract array literals
      return expr.elements.map(element => {
        if (ts.isOmittedExpression(element)) {
          return undefined;
        }
        return this.extractValueFromExpression(element);
      });
    }
    // For truly complex expressions that can't be resolved to simple values, return the expression
    return expr;
  }

  /**
   * Helper to get property name from property assignment
   */
  private getPropertyName(prop: ts.PropertyAssignment): string | undefined {
    if (ts.isIdentifier(prop.name)) {
      return prop.name.text;
    } else if (ts.isStringLiteral(prop.name)) {
      return prop.name.text;
    }
    return undefined;
  }

  /**
   * Helper to create expression from value
   */
  private createValueExpression(value: ObjectValue): ts.Expression {
    if (value === null) {
      return ts.factory.createNull();
    } else if (value === undefined) {
      return ts.factory.createIdentifier("undefined");
    } else if (typeof value === "string") {
      return ts.factory.createStringLiteral(value);
    } else if (typeof value === "number") {
      return ts.factory.createNumericLiteral(value);
    } else if (typeof value === "boolean") {
      return value ? ts.factory.createTrue() : ts.factory.createFalse();
    } else if (Array.isArray(value)) {
      // Handle arrays recursively
      const elements = value.map(item => this.createValueExpression(item));
      return ts.factory.createArrayLiteralExpression(elements);
    } else if (typeof value === "object" && value !== null) {
      // Check if it's already a TypeScript expression
      if ('kind' in value && ts.isExpression(value as any)) {
        return value as ts.Expression;
      }
      // Handle nested objects
      const properties = Object.entries(value).map(([key, val]) =>
        ts.factory.createPropertyAssignment(key, this.createValueExpression(val))
      );
      return ts.factory.createObjectLiteralExpression(properties);
    }
    return ts.factory.createStringLiteral(String(value));
  }

  get(): ts.ObjectLiteralExpression {
    return this.#obj;
  }
}

/**
 * Create a new object literal builder
 */
export function objLiteral(): ObjectLiteralBuilder & ts.ObjectLiteralExpression;

export function objLiteral(
  properties: Record<string, ObjectValue>
): ObjectLiteralBuilder & ts.ObjectLiteralExpression;

export function objLiteral(
  existing: ts.ObjectLiteralExpression
): ObjectLiteralBuilder & ts.ObjectLiteralExpression;

export function objLiteral(
  input?: Record<string, ObjectValue> | ts.ObjectLiteralExpression
) {
  if (input && 'kind' in input) {
    // Adopt from existing object literal
    return buildFluentApi(ObjectLiteralBuilder, { from: input as ts.ObjectLiteralExpression });
  } else {
    // Create new object literal with properties
    return buildFluentApi(ObjectLiteralBuilder, { properties: input as Record<string, ObjectValue> });
  }
}