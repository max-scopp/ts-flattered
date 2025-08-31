import type { ClassDeclaration } from "ts-morph";
import type { TsFlatteredParam } from "./param";

export interface MethodOptions {
  name: string;
  params?: TsFlatteredParam[];
  returnType?: string;
  body?: string;
}

export interface TsFlatteredMethod {
  name: string;
  params?: TsFlatteredParam[];
  returnType?: string;
  body?: string;
  addToClass(classDeclaration: ClassDeclaration): void;
  getImportedSymbols(): string[];
}

export function method(opts: MethodOptions): TsFlatteredMethod {
  return {
    ...opts,

    addToClass(classDeclaration: ClassDeclaration): void {
      const parameters = (opts.params ?? []).map((p) => {
        return {
          name: p.name,
          type: p.type,
          scope: p.scope,
          isReadonly: p.readonly,
          isRestParameter: p.isRestParameter,
        };
      });

      if (opts.name === "constructor") {
        classDeclaration.addConstructor({
          parameters,
          statements: opts.body ?? "",
        });
      } else {
        classDeclaration.addMethod({
          name: opts.name,
          parameters,
          returnType: opts.returnType,
          statements: opts.body ?? "",
        });
      }
    },

    getImportedSymbols(): string[] {
      const symbols = new Set<string>();

      // Extract symbols from parameter types
      if (opts.params) {
        for (const param of opts.params) {
          const typeSymbols = extractTypeSymbols(param.type);
          for (const symbol of typeSymbols) {
            symbols.add(symbol);
          }
        }
      }

      // Extract symbols from return type
      if (opts.returnType) {
        const typeSymbols = extractTypeSymbols(opts.returnType);
        for (const symbol of typeSymbols) {
          symbols.add(symbol);
        }
      }

      // Extract symbols from method body (code blocks)
      if (opts.body) {
        const bodySymbols = extractCodeSymbols(opts.body);
        for (const symbol of bodySymbols) {
          symbols.add(symbol);
        }
      }

      return Array.from(symbols);
    },
  };
}

// Helper function to extract type symbols from type strings
function extractTypeSymbols(typeStr: string): string[] {
  // Simple heuristic: extract identifiers that start with uppercase
  // This handles basic cases like "Dog", "Dog[]", "Promise<Dog>"
  const matches = typeStr.match(/\b[A-Z][a-zA-Z0-9]*\b/g);
  return matches
    ? matches.filter(
        (match) =>
          // Filter out built-in types
          ![
            "String",
            "Number",
            "Boolean",
            "Array",
            "Promise",
            "Date",
            "Object",
          ].includes(match),
      )
    : [];
}

// Helper function to extract symbols from code blocks
function extractCodeSymbols(codeStr: string): string[] {
  // Extract identifiers that start with uppercase and look like class/type names
  // This includes constructor calls like "new MyClass()", static method calls like "MyClass.method()"
  // and type annotations in the code
  const symbols = new Set<string>();

  // Match patterns like:
  // - new ClassName()
  // - ClassName.staticMethod()
  // - variable: ClassName
  // - as ClassName
  // - <ClassName>
  // - implements ClassName
  // - extends ClassName
  const patterns = [
    /\bnew\s+([A-Z][a-zA-Z0-9]*)\s*\(/g, // new ClassName()
    /\b([A-Z][a-zA-Z0-9]*)\.[a-zA-Z]/g, // ClassName.method
    /:\s*([A-Z][a-zA-Z0-9]*)\b/g, // : ClassName
    /\bas\s+([A-Z][a-zA-Z0-9]*)\b/g, // as ClassName
    /<([A-Z][a-zA-Z0-9]*)[>,\s]/g, // <ClassName>
    /\bimplements\s+([A-Z][a-zA-Z0-9]*)\b/g, // implements ClassName
    /\bextends\s+([A-Z][a-zA-Z0-9]*)\b/g, // extends ClassName
    /\b([A-Z][a-zA-Z0-9]*)\s*\(/g, // ClassName() - function calls
  ];

  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(codeStr)) !== null) {
      const symbol = match[1];
      if (symbol && !isBuiltInType(symbol)) {
        symbols.add(symbol);
      }
    }
  }

  return Array.from(symbols);
}

// Helper function to check if a symbol is a built-in type
function isBuiltInType(symbol: string): boolean {
  const builtInTypes = [
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
  ];
  return builtInTypes.includes(symbol);
}
