
import ts from "typescript";

export function computeTypeAsString(
  checker: ts.TypeChecker,
  node: ts.TypeNode | ts.Expression | undefined,
  sourceFile: ts.SourceFile,
): string {
  if (!node) return "unknown";

  let type: ts.Type | undefined;

  try {
    if (ts.isTypeNode(node)) {
      type = checker.getTypeFromTypeNode(node);
    } else if (ts.isExpression(node)) {
      type = checker.getTypeAtLocation(node);

      // explicitly widen boolean, string, number literals
      if (type.flags & ts.TypeFlags.BooleanLiteral) {
        type = checker.getBaseTypeOfLiteralType(type); // false -> boolean
      } else if (type.flags & ts.TypeFlags.StringLiteral) {
        type = checker.getBaseTypeOfLiteralType(type); // "foo" -> string
      } else if (type.flags & ts.TypeFlags.NumberLiteral) {
        type = checker.getBaseTypeOfLiteralType(type); // 123 -> number
      }
    }
  } catch {}

  if (type) {
    return checker.typeToString(type);
  }

  return node.getText(sourceFile);
}


export function getTypeAsString(
  checker: ts.TypeChecker,
  node: ts.TypeNode,
): string {
  const type = checker.getTypeFromTypeNode(node);
  return checker.typeToString(type);
}

export function computeConstructorType(
  checker: ts.TypeChecker,
  node: ts.TypeNode | ts.Expression | undefined
): string | null {
  if (!node) return null;

  let type: ts.Type | undefined;

  try {
    if (ts.isTypeNode(node)) {
      type = checker.getTypeFromTypeNode(node);
    } else if (ts.isExpression(node)) {
      type = checker.getTypeAtLocation(node);
    }
  } catch {
    return null;
  }

  if (!type) return null;

  // Primitives
  if (type.flags & ts.TypeFlags.Boolean) return "Boolean";
  if (type.flags & ts.TypeFlags.BooleanLiteral) return "Boolean";

  if (type.flags & ts.TypeFlags.Number) return "Number";
  if (type.flags & ts.TypeFlags.NumberLiteral) return "Number";

  if (type.flags & ts.TypeFlags.String) return "String";
  if (type.flags & ts.TypeFlags.StringLiteral) return "String";

  // Function
  if (type.getCallSignatures().length > 0) return "Function";

  // Arrays
  if (checker.isArrayType(type)) return "Array";

  // Tuples
  if (checker.isTupleType?.(type)) return "Array";

  // Object
  if (type.flags & ts.TypeFlags.Object) return "Object";

  // Types that do not exist at runtime
  if (
    type.flags & ts.TypeFlags.Void ||
    type.flags & ts.TypeFlags.Unknown ||
    type.flags & ts.TypeFlags.Any
  ) {
    return null;
  }

  return null; // fallback for anything else
}
