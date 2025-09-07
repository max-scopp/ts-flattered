import type { SourceFile } from "./file";

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
 * Registry to hold all SourceFile instances and external dependencies
 */
export class SourceFileRegistry {
  private files = new Map<string, SourceFile>();
  private externalDependencies = new Map<string, ExternalDependency>();

  register(sourceFile: SourceFile): void {
    this.files.set(sourceFile.fileName, sourceFile);
  }

  unregister(fileName: string): void {
    this.files.delete(fileName);
  }

  get(fileName: string): SourceFile | undefined {
    return this.files.get(fileName);
  }

  getAll(): Map<string, SourceFile> {
    return new Map(this.files);
  }

  clear(): void {
    this.files.clear();
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
