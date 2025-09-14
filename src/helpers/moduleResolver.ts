import ts from "typescript";

/**
 * Options for resolving module imports
 */
export interface ModuleResolverOptions {
  /** Include default imports */
  includeDefault?: boolean;
  /** Include named imports */
  includeNamed?: boolean;
  /** Include namespace imports */
  includeNamespace?: boolean;
}

/**
 * Information about an import
 */
export interface ImportInfo {
  /** The imported identifier name */
  identifier: string;
  /** The module it was imported from */
  module: string;
  /** The type of import (default, named, namespace) */
  type: 'default' | 'named' | 'namespace';
  /** For named imports, the original name if aliased */
  originalName?: string;
}

/**
 * Get the module from which an identifier was imported
 * @param identifier The identifier name to look for
 * @param sourceFile The source file to search in
 * @param options Options for controlling what types of imports to check
 * @returns The module name or undefined if not found
 */
export function getImportModule(
  identifier: string,
  sourceFile: ts.SourceFile,
  options: ModuleResolverOptions = {}
): string | undefined {
  const { includeDefault = true, includeNamed = true, includeNamespace = true } = options;

  // Find import declarations in the source file
  for (const statement of sourceFile.statements) {
    if (ts.isImportDeclaration(statement) && statement.moduleSpecifier && ts.isStringLiteral(statement.moduleSpecifier)) {
      const moduleName = statement.moduleSpecifier.text;

      if (statement.importClause) {
        // Check default import
        if (includeDefault && statement.importClause.name && statement.importClause.name.text === identifier) {
          return moduleName;
        }

        // Check named imports
        if (includeNamed && statement.importClause.namedBindings) {
          if (ts.isNamedImports(statement.importClause.namedBindings)) {
            for (const importSpecifier of statement.importClause.namedBindings.elements) {
              const importName = importSpecifier.propertyName ? importSpecifier.propertyName.text : importSpecifier.name.text;
              const localName = importSpecifier.name.text;

              // Check both the original import name and the local alias
              if (importName === identifier || localName === identifier) {
                return moduleName;
              }
            }
          }
          // Check namespace import
          else if (includeNamespace && ts.isNamespaceImport(statement.importClause.namedBindings)) {
            // For namespace imports like "import * as NS from 'module'",
            // the identifier would be used as NS.SomeName
            const namespaceIdentifier = statement.importClause.namedBindings.name.text;
            if (identifier.startsWith(namespaceIdentifier + '.')) {
              return moduleName;
            }
          }
        }
      }
    }
  }

  return undefined;
}

/**
 * Get all imports from a source file
 * @param sourceFile The source file to analyze
 * @param options Options for controlling what types of imports to include
 * @returns Array of import information
 */
export function getAllImports(
  sourceFile: ts.SourceFile,
  options: ModuleResolverOptions = {}
): ImportInfo[] {
  const { includeDefault = true, includeNamed = true, includeNamespace = true } = options;
  const imports: ImportInfo[] = [];

  for (const statement of sourceFile.statements) {
    if (ts.isImportDeclaration(statement) && statement.moduleSpecifier && ts.isStringLiteral(statement.moduleSpecifier)) {
      const moduleName = statement.moduleSpecifier.text;

      if (statement.importClause) {
        // Default import
        if (includeDefault && statement.importClause.name) {
          imports.push({
            identifier: statement.importClause.name.text,
            module: moduleName,
            type: 'default'
          });
        }

        // Named imports
        if (includeNamed && statement.importClause.namedBindings) {
          if (ts.isNamedImports(statement.importClause.namedBindings)) {
            for (const importSpecifier of statement.importClause.namedBindings.elements) {
              const originalName = importSpecifier.propertyName ? importSpecifier.propertyName.text : importSpecifier.name.text;
              const localName = importSpecifier.name.text;

              imports.push({
                identifier: localName,
                module: moduleName,
                type: 'named',
                originalName: importSpecifier.propertyName ? originalName : undefined
              });
            }
          }
          // Namespace import
          else if (includeNamespace && ts.isNamespaceImport(statement.importClause.namedBindings)) {
            imports.push({
              identifier: statement.importClause.namedBindings.name.text,
              module: moduleName,
              type: 'namespace'
            });
          }
        }
      }
    }
  }

  return imports;
}

/**
 * Check if an identifier is imported from a specific module
 * @param identifier The identifier to check
 * @param module The module to check against
 * @param sourceFile The source file to search in
 * @param options Options for controlling what types of imports to check
 * @returns True if the identifier is imported from the specified module
 */
export function isImportedFrom(
  identifier: string,
  module: string,
  sourceFile: ts.SourceFile,
  options?: ModuleResolverOptions
): boolean {
  const importModule = getImportModule(identifier, sourceFile, options);
  return importModule === module;
}

/**
 * Check if an identifier is imported from any module matching a regex pattern
 * @param identifier The identifier to check
 * @param modulePattern The regex pattern to match modules against
 * @param sourceFile The source file to search in
 * @param options Options for controlling what types of imports to check
 * @returns True if the identifier is imported from a module matching the pattern
 */
export function isImportedFromPattern(
  identifier: string,
  modulePattern: RegExp,
  sourceFile: ts.SourceFile,
  options?: ModuleResolverOptions
): boolean {
  const importModule = getImportModule(identifier, sourceFile, options);
  return importModule ? modulePattern.test(importModule) : false;
}
