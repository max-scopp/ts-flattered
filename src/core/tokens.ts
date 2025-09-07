import ts from "typescript";

// Expression tokens
export const this_ = (): ts.ThisExpression => ts.factory.createThis();

export const super_ = (): ts.SuperExpression => ts.factory.createSuper();

// Literals
export const $ = (value: string | number | boolean): ts.Expression => {
  if (typeof value === "string") {
    return ts.factory.createStringLiteral(value);
  } else if (typeof value === "number") {
    return ts.factory.createNumericLiteral(value);
  } else if (typeof value === "boolean") {
    return value ? ts.factory.createTrue() : ts.factory.createFalse();
  }
  throw new Error(`Unsupported literal type: ${typeof value}`);
};

// Call expression
export const call = (
  fn: string | ts.Expression,
  args: ts.Expression[],
): ts.CallExpression => {
  const expression =
    typeof fn === "string" ? ts.factory.createIdentifier(fn) : fn;
  return ts.factory.createCallExpression(expression, undefined, args);
};

// Return statement
export const ret = (expr?: ts.Expression): ts.ReturnStatement =>
  ts.factory.createReturnStatement(expr);
