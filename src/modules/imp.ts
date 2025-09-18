import ts from "typescript";
import { $export } from "../core/modifier";
import { type BuildableAST, buildFluentApi } from "../utils/buildFluentApi";

export interface ImportOptions {
  namedImports?: string[];
  defaultImport?: string;
  namespaceImport?: string;
  typeOnlyNamedImports?: string[];
  moduleSpecifier: string;
  isDefaultTypeOnly?: boolean;
}

class ImportBuilder implements BuildableAST {
  #decl: ts.ImportDeclaration;

  constructor(options: ImportOptions) {
    this.#decl = this.createImportDeclaration(options);
  }

  private createImportDeclaration(
    options: ImportOptions,
  ): ts.ImportDeclaration {
    let importClause: ts.ImportClause | undefined;

    if (options.defaultImport) {
      if (
        options.namedImports ||
        options.namespaceImport ||
        options.typeOnlyNamedImports
      ) {
        // Default + named imports
        const namedBindings = this.createNamedBindings(options);
        importClause = ts.factory.createImportClause(
          options.isDefaultTypeOnly ?? false,
          ts.factory.createIdentifier(options.defaultImport),
          namedBindings,
        );
      } else {
        // Default only
        importClause = ts.factory.createImportClause(
          options.isDefaultTypeOnly ?? false,
          ts.factory.createIdentifier(options.defaultImport),
          undefined,
        );
      }
    } else if (options.namespaceImport) {
      // Namespace import
      importClause = ts.factory.createImportClause(
        false,
        undefined,
        ts.factory.createNamespaceImport(
          ts.factory.createIdentifier(options.namespaceImport),
        ),
      );
    } else if (options.namedImports || options.typeOnlyNamedImports) {
      // Named imports only
      const namedBindings = this.createNamedBindings(options);
      importClause = ts.factory.createImportClause(
        false,
        undefined,
        namedBindings,
      );
    }

    return ts.factory.createImportDeclaration(
      undefined, // modifiers
      importClause,
      ts.factory.createStringLiteral(options.moduleSpecifier),
    );
  }

  private createNamedBindings(
    options: ImportOptions,
  ): ts.NamedImportBindings | undefined {
    const elements: ts.ImportSpecifier[] = [];

    // Add regular named imports
    if (options.namedImports) {
      for (const name of options.namedImports) {
        elements.push(
          ts.factory.createImportSpecifier(
            false,
            undefined,
            ts.factory.createIdentifier(name),
          ),
        );
      }
    }

    // Add type-only named imports
    if (options.typeOnlyNamedImports) {
      for (const name of options.typeOnlyNamedImports) {
        elements.push(
          ts.factory.createImportSpecifier(
            true,
            undefined,
            ts.factory.createIdentifier(name),
          ),
        );
      }
    }

    return elements.length > 0
      ? ts.factory.createNamedImports(elements)
      : undefined;
  }

  // Fluent modifier methods
  $export() {
    this.#decl = ts.factory.updateImportDeclaration(
      this.#decl,
      [...(this.#decl.modifiers || []), $export()],
      this.#decl.importClause,
      this.#decl.moduleSpecifier,
      this.#decl.attributes,
    );
    return this;
  }

  // Dynamic methods to modify the import
  addNamedImport(name: string, isTypeOnly = false) {
    const currentClause = this.#decl.importClause;
    if (!currentClause) return this;

    const newSpecifier = ts.factory.createImportSpecifier(
      isTypeOnly,
      undefined,
      ts.factory.createIdentifier(name),
    );

    let newNamedBindings: ts.NamedImportBindings | undefined;

    if (currentClause.namedBindings) {
      if (ts.isNamedImports(currentClause.namedBindings)) {
        // Add to existing named imports
        newNamedBindings = ts.factory.updateNamedImports(
          currentClause.namedBindings,
          [...currentClause.namedBindings.elements, newSpecifier],
        );
      } else {
        // Convert namespace import to named imports
        newNamedBindings = ts.factory.createNamedImports([newSpecifier]);
      }
    } else {
      // Create new named imports
      newNamedBindings = ts.factory.createNamedImports([newSpecifier]);
    }

    const newImportClause = ts.factory.updateImportClause(
      currentClause,
      currentClause.isTypeOnly,
      currentClause.name,
      newNamedBindings,
    );

    this.#decl = ts.factory.updateImportDeclaration(
      this.#decl,
      this.#decl.modifiers,
      newImportClause,
      this.#decl.moduleSpecifier,
      this.#decl.attributes,
    );

    return this;
  }

  addTypeOnlyNamedImport(name: string) {
    return this.addNamedImport(name, true);
  }

  setDefaultImport(name: string, isTypeOnly = false) {
    const currentClause = this.#decl.importClause;
    const newNamedBindings = currentClause?.namedBindings;

    const newImportClause = ts.factory.createImportClause(
      isTypeOnly,
      ts.factory.createIdentifier(name),
      newNamedBindings,
    );

    this.#decl = ts.factory.updateImportDeclaration(
      this.#decl,
      this.#decl.modifiers,
      newImportClause,
      this.#decl.moduleSpecifier,
      this.#decl.attributes,
    );

    return this;
  }

  setNamespaceImport(name: string) {
    const newNamedBindings = ts.factory.createNamespaceImport(
      ts.factory.createIdentifier(name),
    );

    const newImportClause = ts.factory.createImportClause(
      false,
      undefined,
      newNamedBindings,
    );

    this.#decl = ts.factory.updateImportDeclaration(
      this.#decl,
      this.#decl.modifiers,
      newImportClause,
      this.#decl.moduleSpecifier,
      this.#decl.attributes,
    );

    return this;
  }

  get(): ts.ImportDeclaration {
    return this.#decl;
  }
}

export const imp = (options: ImportOptions) =>
  buildFluentApi(ImportBuilder, options);

/**
 * Merges two import declarations from the same module
 * @param existing The existing import declaration
 * @param newOptions The new import options to merge
 * @returns A new merged import declaration
 */
export function mergeImportDeclarations(
  existing: ts.ImportDeclaration,
  newOptions: ImportOptions,
): ts.ImportDeclaration {
  const existingClause = existing.importClause;
  const existingModuleSpecifier = existing.moduleSpecifier;

  // Start with existing elements
  const existingNamedImports: string[] = [];
  const existingTypeOnlyImports: string[] = [];
  let existingDefaultImport: string | undefined;
  let existingNamespaceImport: string | undefined;

  // Extract existing imports
  if (existingClause) {
    if (existingClause.name) {
      existingDefaultImport = existingClause.name.text;
    }

    if (existingClause.namedBindings) {
      if (ts.isNamespaceImport(existingClause.namedBindings)) {
        existingNamespaceImport = existingClause.namedBindings.name.text;
      } else if (ts.isNamedImports(existingClause.namedBindings)) {
        for (const element of existingClause.namedBindings.elements) {
          const importName = element.name.text;
          if (element.isTypeOnly) {
            existingTypeOnlyImports.push(importName);
          } else {
            existingNamedImports.push(importName);
          }
        }
      }
    }
  }

  // Merge with new options
  const mergedOptions: ImportOptions = {
    moduleSpecifier: newOptions.moduleSpecifier,
    defaultImport: newOptions.defaultImport || existingDefaultImport,
    namespaceImport: newOptions.namespaceImport || existingNamespaceImport,
    namedImports: [
      ...existingNamedImports,
      ...(newOptions.namedImports || []),
    ].filter((item, index, arr) => arr.indexOf(item) === index), // Remove duplicates
    typeOnlyNamedImports: [
      ...existingTypeOnlyImports,
      ...(newOptions.typeOnlyNamedImports || []),
    ].filter((item, index, arr) => arr.indexOf(item) === index), // Remove duplicates
    isDefaultTypeOnly: newOptions.isDefaultTypeOnly,
  };

  // Create new import with merged options
  return new ImportBuilder(mergedOptions).get();
}

/**
 * Extracts import options from an existing import declaration
 * @param importDecl The import declaration to extract from
 * @returns ImportOptions representing the declaration
 */
export function extractImportOptions(importDecl: ts.ImportDeclaration): ImportOptions {
  const options: ImportOptions = {
    moduleSpecifier: ts.isStringLiteral(importDecl.moduleSpecifier)
      ? importDecl.moduleSpecifier.text
      : "",
  };

  const clause = importDecl.importClause;
  if (!clause) return options;

  // Default import
  if (clause.name) {
    options.defaultImport = clause.name.text;
    options.isDefaultTypeOnly = clause.isTypeOnly;
  }

  // Named bindings
  if (clause.namedBindings) {
    if (ts.isNamespaceImport(clause.namedBindings)) {
      options.namespaceImport = clause.namedBindings.name.text;
    } else if (ts.isNamedImports(clause.namedBindings)) {
      const namedImports: string[] = [];
      const typeOnlyNamedImports: string[] = [];

      for (const element of clause.namedBindings.elements) {
        const importName = element.name.text;
        if (element.isTypeOnly) {
          typeOnlyNamedImports.push(importName);
        } else {
          namedImports.push(importName);
        }
      }

      if (namedImports.length > 0) {
        options.namedImports = namedImports;
      }
      if (typeOnlyNamedImports.length > 0) {
        options.typeOnlyNamedImports = typeOnlyNamedImports;
      }
    }
  }

  return options;
}
