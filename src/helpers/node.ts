import ts from "typescript";

/**
 * Convert any AST node (that could represent a name) into a string.
 */
export function nodeToString(node: ts.Node | undefined, sourceFile: ts.SourceFile): string {
  if (!node) return "anonymous";

  // Many named nodes have `.text`
  if (
    ts.isIdentifier(node) ||
    ts.isStringLiteral(node) ||
    ts.isNumericLiteral(node) ||
    ts.isPrivateIdentifier(node)
  ) {
    return node.text;
  }

  // For anything else, just return its source representation
  return node.getText(sourceFile);
}
