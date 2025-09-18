import type { SourceFile } from "./file";
import { isRelativeImport, getImportModuleSpecifier, resolveImportPath, calculateNewImportPath } from "./pathUtils";
import ts from "typescript";

/**
 * Configuration for external dependency imports
 */
export interface ExternalDependency {
  /** The module specifier (e.g., "@angular/common/http") */
  moduleSpecifier: string;
  /** Named exports from this module */
  namedExports?: string[];
  /** Default export name */
  defaultExport?: string;
  /** Type-only exports */
  typeOnlyExports?: string[];
  /** Whether the default import is type-only */
  isDefaultTypeOnly?: boolean;
}

/**
 * Information about an import dependency
 */
export interface ImportDependency {
  /** The importing file path */
  fromFile: string;
  /** The imported module specifier */
  moduleSpecifier: string;
  /** Whether this is a relative import */
  isRelative: boolean;
  /** The resolved absolute path (for relative imports) */
  resolvedPath?: string;
  /** The import declaration node */
  importDeclaration: ts.ImportDeclaration;
}

/**
 * Registry to hold all SourceFile instances and track dependencies
 */
export class SourceFileRegistry {
  private files = new Map<string, SourceFile>();
  private externalDependencies = new Map<string, ExternalDependency>();
  private importDependencies = new Map<string, ImportDependency[]>();
  private fileLocations = new Map<string, string>(); // fileName -> filePath

  register(sourceFile: SourceFile, filePath?: string): void {
    const fileName = sourceFile.getFileName();
    this.files.set(fileName, sourceFile);

    if (filePath) {
      this.fileLocations.set(fileName, filePath);
    } else {
      // Use the fileName as filePath if not provided
      this.fileLocations.set(fileName, fileName);
    }

    // Analyze and store import dependencies
    this.analyzeImportDependencies(sourceFile);
  }

  registerFile(filePath: string, sourceFile: SourceFile): void {
    this.register(sourceFile, filePath);
  }

  unregister(fileName: string): void {
    this.files.delete(fileName);
    this.importDependencies.delete(fileName);
    this.fileLocations.delete(fileName);
  }

  get(fileName: string): SourceFile | undefined {
    return this.files.get(fileName);
  }

  getAll(): Map<string, SourceFile> {
    return new Map(this.files);
  }

  clear(): void {
    this.files.clear();
    this.importDependencies.clear();
    this.fileLocations.clear();
    this.externalDependencies.clear();
  }

  /**
   * Get the registered file path for a file name
   */
  getFilePath(fileName: string): string | undefined {
    return this.fileLocations.get(fileName);
  }

  /**
   * Update the file path for a registered file
   */
  updateFilePath(fileName: string, newPath: string): void {
    if (this.files.has(fileName)) {
      this.fileLocations.set(fileName, newPath);
    }
  }

  /**
   * Analyze import dependencies for a source file
   */
  private analyzeImportDependencies(sourceFile: SourceFile): void {
    const fileName = sourceFile.getFileName();
    const filePath = this.fileLocations.get(fileName) || fileName;
    const dependencies: ImportDependency[] = [];

    // Get all import declarations
    const statements = sourceFile.getStatements();
    for (const statement of statements) {
      if (ts.isImportDeclaration(statement)) {
        const moduleSpecifier = getImportModuleSpecifier(statement);
        const isRelative = isRelativeImport(moduleSpecifier);

        let resolvedPath: string | undefined;
        if (isRelative) {
          // For relative imports, resolve the absolute path
          try {
            resolvedPath = resolveImportPath(moduleSpecifier, filePath);
          } catch {
            // Path resolution failed, continue without resolved path
          }
        }

        dependencies.push({
          fromFile: filePath,
          moduleSpecifier,
          isRelative,
          resolvedPath,
          importDeclaration: statement,
        });
      }
    }

    this.importDependencies.set(fileName, dependencies);
  }

  /**
   * Get import dependencies for a file
   */
  getImportDependencies(fileName: string): ImportDependency[] {
    return this.importDependencies.get(fileName) || [];
  }

  /**
   * Rewrite relative imports for all registered files when moving from one base to another
   */
  rewriteAllRelativeImports(fromBase: string, toBase: string): void {
    for (const [fileName, sourceFile] of this.files) {
      const currentPath = this.fileLocations.get(fileName) || fileName;

      // Calculate new path
      const relativePath = currentPath.startsWith(fromBase)
        ? currentPath.substring(fromBase.length).replace(/^[\/\\]/, "")
        : currentPath;
      const newPath = `${toBase}/${relativePath}`.replace(/[\/\\]+/g, "/");

      // Update file location
      this.updateFilePath(fileName, newPath);

      // Rewrite imports in the file
      this.rewriteFileImports(sourceFile, currentPath, newPath);
    }
  }

  /**
   * Rewrite imports in a specific file
   */
  private rewriteFileImports(sourceFile: SourceFile, oldPath: string, newPath: string): void {
    sourceFile.updateImports((importDecl) => {
      const moduleSpecifier = getImportModuleSpecifier(importDecl);

      if (isRelativeImport(moduleSpecifier)) {
        const newModuleSpecifier = calculateNewImportPath(moduleSpecifier, oldPath, newPath);

        return ts.factory.updateImportDeclaration(
          importDecl,
          importDecl.modifiers,
          importDecl.importClause,
          ts.factory.createStringLiteral(newModuleSpecifier),
          importDecl.attributes,
        );
      }

      return importDecl;
    });

    // Re-analyze dependencies after update
    this.analyzeImportDependencies(sourceFile);
  }

  /**
   * Get all files that import from a specific file
   */
  getFilesThatImport(targetFilePath: string): string[] {
    const importingFiles: string[] = [];

    for (const [fileName, dependencies] of this.importDependencies) {
      const filePath = this.fileLocations.get(fileName) || fileName;

      for (const dependency of dependencies) {
        if (dependency.isRelative && dependency.resolvedPath) {
          // Normalize paths for comparison
          const normalizedTarget = targetFilePath.replace(/\\/g, "/");
          const normalizedResolved = dependency.resolvedPath.replace(/\\/g, "/");

          if (normalizedResolved.includes(normalizedTarget)) {
            importingFiles.push(filePath);
            break;
          }
        }
      }
    }

    return importingFiles;
  }

  /**
   * Register an external dependency
   */
  registerExternalDependency(dependency: ExternalDependency): void {
    this.externalDependencies.set(dependency.moduleSpecifier, dependency);
  }

  /**
   * Get an external dependency by module specifier
   */
  getExternalDependency(
    moduleSpecifier: string,
  ): ExternalDependency | undefined {
    return this.externalDependencies.get(moduleSpecifier);
  }

  /**
   * Get all external dependencies
   */
  getAllExternalDependencies(): Map<string, ExternalDependency> {
    return new Map(this.externalDependencies);
  }

  /**
   * Find external dependency by export name
   */
  findExternalDependencyByExport(
    exportName: string,
  ): ExternalDependency | undefined {
    for (const dependency of this.externalDependencies.values()) {
      if (
        dependency.namedExports?.includes(exportName) ||
        dependency.defaultExport === exportName ||
        dependency.typeOnlyExports?.includes(exportName)
      ) {
        return dependency;
      }
    }
    return undefined;
  }

  /**
   * Clear external dependencies
   */
  clearExternalDependencies(): void {
    this.externalDependencies.clear();
  }
}
