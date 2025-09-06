import ts from "typescript";
import { type BuildableAST, buildFluentApi } from "../utils/buildFluentApi";

type DecoratorArgValue = string | number | boolean;

// Decorator Builder
class DecoratorBuilder implements BuildableAST {
  #decorator: ts.Decorator;

  constructor({
    name,
    args,
  }: {
    name: string;
    args?: Array<Record<string, DecoratorArgValue>>;
  }) {
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

  get(): ts.Decorator {
    return this.#decorator;
  }
}

export const decorator = (
  name: string,
  args?: Array<Record<string, DecoratorArgValue>>,
) => buildFluentApi(DecoratorBuilder, { name, args });
