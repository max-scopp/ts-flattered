import ts from "typescript";
import { type BuildableAST, buildFluentApi } from "../utils/buildFluentApi";

// Simple expression helpers
export const id = (name: string): ts.Identifier =>
  ts.factory.createIdentifier(name);

export const propAccess = (
  expr: string | ts.Expression,
  name: string,
): ts.PropertyAccessExpression => {
  const expression = typeof expr === "string" ? id(expr) : expr;
  return ts.factory.createPropertyAccessExpression(expression, name);
};

export const newExpr = (
  expression: string | ts.Expression,
  args: ts.Expression[] = [],
  typeArgs?: ts.TypeNode[],
): ts.NewExpression => {
  const expr = typeof expression === "string" ? id(expression) : expression;
  return ts.factory.createNewExpression(expr, typeArgs, args);
};

// Object Expression Builder
class ObjectExpressionBuilder implements BuildableAST {
  #expr: ts.ObjectLiteralExpression;

  constructor({
    properties,
    multiLine,
  }: {
    properties?: ts.ObjectLiteralElementLike[];
    multiLine?: boolean;
  }) {
    this.#expr = ts.factory.createObjectLiteralExpression(
      properties,
      multiLine,
    );
  }

  prop(key: string, value: ts.Expression) {
    const newProp = ts.factory.createPropertyAssignment(key, value);
    this.#expr = ts.factory.updateObjectLiteralExpression(this.#expr, [
      ...this.#expr.properties,
      newProp,
    ]);
    return this;
  }

  spread(expr: ts.Expression) {
    const newSpread = ts.factory.createSpreadAssignment(expr);
    this.#expr = ts.factory.updateObjectLiteralExpression(this.#expr, [
      ...this.#expr.properties,
      newSpread,
    ]);
    return this;
  }

  $multiLine() {
    this.#expr = ts.factory.updateObjectLiteralExpression(
      this.#expr,
      this.#expr.properties,
    );
    return this;
  }

  get(): ts.ObjectLiteralExpression {
    return this.#expr;
  }
}

export const obj = (
  properties: ts.ObjectLiteralElementLike[] = [],
  multiLine = false,
) => buildFluentApi(ObjectExpressionBuilder, { properties, multiLine });
