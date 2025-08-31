import type { SourceFile } from "ts-morph";
import { logger } from "../log";
import type { TsFlatteredStatement } from "./file";
import type { Registry } from "./registry";

interface ModuleImports {
  namedImports: Set<string>;
  typeOnlyNamedImports: Set<string>;
  defaultImports: Set<string>;
  namespaceImports: Set<string>;
}

/**
 * Resolve imports for a file based on its statements and registry
 */
export function resolveImports(
  statements: TsFlatteredStatement[],
  fileRegistry: Registry,
): Map<string, ModuleImports> {
  const importsByModule = new Map<string, ModuleImports>();

  for (const stmt of statements) {
    const importedSymbols = stmt.getImportedSymbols();

    for (const symbol of importedSymbols) {
      const registration = fileRegistry.getSymbolRegistration(symbol);

      if (registration) {
        const {
          filePath,
          importType = "named",
          isTypeOnly = false,
        } = registration;

        if (!importsByModule.has(filePath)) {
          importsByModule.set(filePath, {
            namedImports: new Set(),
            typeOnlyNamedImports: new Set(),
            defaultImports: new Set(),
            namespaceImports: new Set(),
          });
        }

        const moduleImports = importsByModule.get(filePath);
        if (!moduleImports) continue;

        addImportByType(moduleImports, symbol, importType, isTypeOnly);
      } else {
        logger.warn(`Warning: Symbol '${symbol}' not found in registry`);
      }
    }
  }

  return importsByModule;
}

/**
 * Add resolved imports to a source file
 */
export function addResolvedImports(
  sourceFile: SourceFile,
  imports: Map<string, ModuleImports>,
): void {
  for (const [filePath, moduleImports] of imports) {
    const {
      namedImports,
      typeOnlyNamedImports,
      defaultImports,
      namespaceImports,
    } = moduleImports;

    const importStructure: {
      moduleSpecifier: string;
      namedImports?: (string | { name: string; isTypeOnly: boolean })[];
      defaultImport?: string;
      namespaceImport?: string;
    } = {
      moduleSpecifier: filePath,
    };

    // Add named imports
    if (namedImports.size > 0) {
      importStructure.namedImports = Array.from(namedImports);
    }

    // Add type-only named imports
    if (typeOnlyNamedImports.size > 0) {
      const typeOnlyImports = Array.from(typeOnlyNamedImports).map((name) => ({
        name,
        isTypeOnly: true,
      }));

      if (importStructure.namedImports) {
        importStructure.namedImports.push(...typeOnlyImports);
      } else {
        importStructure.namedImports = typeOnlyImports;
      }
    }

    // Add default import (take first one if multiple)
    if (defaultImports.size > 0) {
      importStructure.defaultImport = Array.from(defaultImports)[0];
    }

    // Add namespace import (take first one if multiple)
    if (namespaceImports.size > 0) {
      importStructure.namespaceImport = Array.from(namespaceImports)[0];
    }

    sourceFile.addImportDeclaration(importStructure);
  }
}

function addImportByType(
  moduleImports: ModuleImports,
  symbol: string,
  importType: "named" | "default" | "namespace",
  isTypeOnly: boolean,
): void {
  switch (importType) {
    case "default":
      moduleImports.defaultImports.add(symbol);
      break;
    case "namespace":
      moduleImports.namespaceImports.add(symbol);
      break;
    case "named":
    default:
      if (isTypeOnly) {
        moduleImports.typeOnlyNamedImports.add(symbol);
      } else {
        moduleImports.namedImports.add(symbol);
      }
      break;
  }
}
