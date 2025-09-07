import ts from "typescript";

export const assign = (
  lhs: string | ts.Expression,
  rhs: ts.Expression,
): ts.BinaryExpression => {
  const left = typeof lhs === "string" ? ts.factory.createIdentifier(lhs) : lhs;
  return ts.factory.createBinaryExpression(
    left,
    ts.factory.createToken(ts.SyntaxKind.EqualsToken),
    rhs,
  );
};
