import type { ClassDeclaration } from "ts-morph";
import type { TsFlatteredParam } from "./param";
import {
  extractCodeSymbols,
  extractParameterSymbols,
  extractTypeSymbols,
} from "./symbol-extractor";

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
      const parameters = (opts.params ?? []).map((p) => ({
        name: p.name,
        type: p.type,
        scope: p.scope,
        isReadonly: p.readonly,
        isRestParameter: p.isRestParameter,
      }));

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

      // Extract symbols from parameters
      if (opts.params) {
        const paramSymbols = extractParameterSymbols(opts.params);
        for (const symbol of paramSymbols) {
          symbols.add(symbol);
        }
      }

      // Extract symbols from return type
      if (opts.returnType) {
        const returnSymbols = extractTypeSymbols(opts.returnType);
        for (const symbol of returnSymbols) {
          symbols.add(symbol);
        }
      }

      // Extract symbols from method body
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
