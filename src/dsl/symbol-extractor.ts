/**
 * Symbol extraction utilities for TypeScript code analysis
 * Provides functions to extract type and code symbols from strings
 */

const BUILT_IN_TYPES = new Set([
  "String",
  "Number",
  "Boolean",
  "Array",
  "Promise",
  "Date",
  "Object",
  "Error",
  "RegExp",
  "Map",
  "Set",
  "WeakMap",
  "WeakSet",
  "JSON",
  "Math",
  "console",
  "window",
  "document",
  "Buffer",
  "process",
]);

const SYMBOL_PATTERNS = [
  /\bnew\s+([A-Z][a-zA-Z0-9]*)\s*\(/g, // new ClassName()
  /\b([A-Z][a-zA-Z0-9]*)\.[a-zA-Z]/g, // ClassName.method
  /:\s*([A-Z][a-zA-Z0-9]*)\b/g, // : ClassName
  /\bas\s+([A-Z][a-zA-Z0-9]*)\b/g, // as ClassName
  /<([A-Z][a-zA-Z0-9]*)[>,\s]/g, // <ClassName>
  /\bimplements\s+([A-Z][a-zA-Z0-9]*)\b/g, // implements ClassName
  /\bextends\s+([A-Z][a-zA-Z0-9]*)\b/g, // extends ClassName
  /\b([A-Z][a-zA-Z0-9]*)\s*\(/g, // ClassName() - function calls
];

/**
 * Extract type symbols from TypeScript type annotations
 * Handles basic cases like "Dog", "Dog[]", "Promise<Dog>"
 */
export function extractTypeSymbols(typeStr: string): string[] {
  if (!typeStr) return [];

  const matches = typeStr.match(/\b[A-Z][a-zA-Z0-9]*\b/g);
  return matches ? matches.filter((symbol) => !BUILT_IN_TYPES.has(symbol)) : [];
}

/**
 * Extract symbols from TypeScript/JavaScript code strings
 * Identifies class/type references in various contexts
 */
export function extractCodeSymbols(codeStr: string): string[] {
  if (!codeStr) return [];

  const symbols = new Set<string>();

  for (const pattern of SYMBOL_PATTERNS) {
    let match = pattern.exec(codeStr);
    while (match !== null) {
      const symbol = match[1];
      if (symbol && !BUILT_IN_TYPES.has(symbol)) {
        symbols.add(symbol);
      }
      match = pattern.exec(codeStr);
    }
  }

  return Array.from(symbols);
}

/**
 * Extract all symbols from parameters array
 */
export function extractParameterSymbols(
  params: Array<{ type: string }>,
): string[] {
  const symbols = new Set<string>();

  for (const param of params) {
    const typeSymbols = extractTypeSymbols(param.type);
    for (const symbol of typeSymbols) {
      symbols.add(symbol);
    }
  }

  return Array.from(symbols);
}
