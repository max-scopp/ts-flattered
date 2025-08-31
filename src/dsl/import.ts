import type { SourceFile } from "ts-morph";

export interface TsFlatteredImport {
  moduleSpecifier: string;
  namedImports?: string[];
  defaultImport?: string;
  namespaceImport?: string;
  addToSourceFile(sourceFile: SourceFile): void;
}

export interface ImportOptions {
  moduleSpecifier: string;
  namedImports?: string[];
  defaultImport?: string;
  namespaceImport?: string;
}

export function imp(options: ImportOptions): TsFlatteredImport;
export function imp(
  moduleSpecifier: string,
  namedImports?: string[],
): TsFlatteredImport;
export function imp(
  optionsOrModuleSpecifier: ImportOptions | string,
  namedImports?: string[],
): TsFlatteredImport {
  let options: ImportOptions;

  if (typeof optionsOrModuleSpecifier === "string") {
    options = {
      moduleSpecifier: optionsOrModuleSpecifier,
      namedImports,
    };
  } else {
    options = optionsOrModuleSpecifier;
  }

  return {
    moduleSpecifier: options.moduleSpecifier,
    namedImports: options.namedImports,
    defaultImport: options.defaultImport,
    namespaceImport: options.namespaceImport,

    addToSourceFile(sourceFile: SourceFile): void {
      sourceFile.addImportDeclaration({
        moduleSpecifier: options.moduleSpecifier,
        namedImports: options.namedImports,
        defaultImport: options.defaultImport,
        namespaceImport: options.namespaceImport,
      });
    },
  };
}
