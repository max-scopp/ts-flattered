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
