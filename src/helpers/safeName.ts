import ts from "typescript";

/**
 * Safely extract the text from an identifier, working around fluent API proxy issues
 */
export function getIdentifierText(identifier: ts.Identifier): string {
  // Try to access the escapedText property directly from the object
  const obj = identifier as any;

  // Look for escapedText in the object or its prototypes
  if (obj.escapedText && typeof obj.escapedText === 'string') {
    return obj.escapedText;
  }

  // Look deeper in the object structure
  if (obj.escapedText && typeof obj.escapedText === 'object' && obj.escapedText.escapedText) {
    return obj.escapedText.escapedText;
  }

  // Try the text property as fallback
  if (obj.text && typeof obj.text === 'string') {
    return obj.text;
  }

  // Look deeper for text
  if (obj.text && typeof obj.text === 'object' && obj.text.escapedText) {
    return obj.text.escapedText;
  }

  // Last resort: try to extract from the object keys/values
  const keys = Object.keys(obj);
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === 'string' && value.match(/^[a-zA-Z_$][a-zA-Z0-9_$]*$/)) {
      return value;
    }
  }

  // Really last resort
  return 'Unknown';
}

/**
 * Safely get class name from a class declaration
 */
export function getClassNameSafe(classDecl: ts.ClassDeclaration): string | undefined {
  if (!classDecl.name) return undefined;

  if (ts.isIdentifier(classDecl.name)) {
    return getIdentifierText(classDecl.name);
  }

  return undefined;
}
