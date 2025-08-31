import type { SourceFile } from "ts-morph";
import type { TsFlatteredStatement } from "./file";
import type { TsFlatteredMethod } from "./method";

export interface TsFlatteredClass extends TsFlatteredStatement {
  name: string;
  decorators: string[];
  members: TsFlatteredMethod[];
}

export function cls(
  name: string,
  members: TsFlatteredMethod[] = [],
  decorators: string[] = [],
): TsFlatteredClass {
  return {
    name,
    decorators,
    members,

    addToSourceFile(sourceFile: SourceFile): void {
      const classDeclaration = sourceFile.addClass({
        name,
        isExported: true,
        decorators: decorators.map((d) => ({ name: d })),
      });

      for (const member of members) {
        member.addToClass(classDeclaration);
      }
    },

    getExportedSymbols(): string[] {
      return [name];
    },

    getImportedSymbols(): string[] {
      const symbols = new Set<string>();
      for (const member of members) {
        const memberSymbols = member.getImportedSymbols();
        for (const symbol of memberSymbols) {
          symbols.add(symbol);
        }
      }
      return Array.from(symbols);
    },
  };
}
