import ts from "typescript";
import { runPerformanceTest } from "./test_utils";

// Example 3: Raw ts.factory API
function example3() {
  const greeter = ts.factory.createClassDeclaration(
    [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
    ts.factory.createIdentifier("Greeter"),
    undefined,
    undefined,
    [
      ts.factory.createPropertyDeclaration(
        [ts.factory.createModifier(ts.SyntaxKind.ReadonlyKeyword)],
        "message",
        undefined,
        ts.factory.createTypeReferenceNode("string"),
        undefined,
      ),
      ts.factory.createConstructorDeclaration(
        undefined,
        [
          ts.factory.createParameterDeclaration(
            [ts.factory.createModifier(ts.SyntaxKind.ReadonlyKeyword)],
            undefined,
            "message",
            undefined,
            ts.factory.createTypeReferenceNode("string"),
            undefined,
          ),
        ],
        ts.factory.createBlock([
          ts.factory.createExpressionStatement(
            ts.factory.createBinaryExpression(
              ts.factory.createPropertyAccessExpression(
                ts.factory.createThis(),
                "message",
              ),
              ts.factory.createToken(ts.SyntaxKind.EqualsToken),
              ts.factory.createIdentifier("message"),
            ),
          ),
        ]),
      ),
      ts.factory.createMethodDeclaration(
        [ts.factory.createModifier(ts.SyntaxKind.AsyncKeyword)],
        undefined,
        "greet",
        undefined,
        undefined,
        [],
        undefined,
        ts.factory.createBlock([
          ts.factory.createExpressionStatement(
            ts.factory.createCallExpression(
              ts.factory.createPropertyAccessExpression(
                ts.factory.createIdentifier("console"),
                "log",
              ),
              undefined,
              [ts.factory.createStringLiteral("Hello, world!")],
            ),
          ),
          ts.factory.createReturnStatement(
            ts.factory.createStringLiteral("done"),
          ),
        ]),
      ),
    ],
  );

  return greeter;
}

console.log("Performance Report: Raw ts.factory API");
console.log("========================================");

runPerformanceTest("Raw ts.factory API", example3);
