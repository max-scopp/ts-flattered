import ts from "typescript";

// Create the class using ts.factory
const greeter = ts.factory.createClassDeclaration(
  [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
  ts.factory.createIdentifier("Greeter"),
  undefined, // typeParameters
  undefined, // heritageClauses
  [
    // Property: readonly message: string
    ts.factory.createPropertyDeclaration(
      [ts.factory.createModifier(ts.SyntaxKind.ReadonlyKeyword)],
      ts.factory.createIdentifier("message"),
      undefined, // questionToken
      ts.factory.createTypeReferenceNode("string"),
      undefined, // initializer
    ),
    // Constructor
    ts.factory.createConstructorDeclaration(
      undefined, // modifiers
      [
        ts.factory.createParameterDeclaration(
          [ts.factory.createModifier(ts.SyntaxKind.ReadonlyKeyword)],
          undefined, // dotDotDotToken
          ts.factory.createIdentifier("message"),
          undefined, // questionToken
          ts.factory.createTypeReferenceNode("string"),
          undefined, // initializer
        ),
      ],
      ts.factory.createBlock([
        ts.factory.createExpressionStatement(
          ts.factory.createBinaryExpression(
            ts.factory.createPropertyAccessExpression(
              ts.factory.createThis(),
              ts.factory.createIdentifier("message"),
            ),
            ts.factory.createToken(ts.SyntaxKind.EqualsToken),
            ts.factory.createIdentifier("message"),
          ),
        ),
      ]),
    ),
    // Method: async greet()
    ts.factory.createMethodDeclaration(
      [ts.factory.createModifier(ts.SyntaxKind.AsyncKeyword)],
      undefined, // asteriskToken
      ts.factory.createIdentifier("greet"),
      undefined, // questionToken
      undefined, // typeParameters
      [], // parameters
      undefined, // returnType
      ts.factory.createBlock([
        ts.factory.createExpressionStatement(
          ts.factory.createCallExpression(
            ts.factory.createPropertyAccessExpression(
              ts.factory.createIdentifier("console"),
              ts.factory.createIdentifier("log"),
            ),
            undefined, // typeArguments
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

// Print result
const sf = ts.factory.createSourceFile(
  [greeter],
  ts.factory.createToken(ts.SyntaxKind.EndOfFileToken),
  ts.NodeFlags.None,
);

const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
console.log(printer.printFile(sf));
