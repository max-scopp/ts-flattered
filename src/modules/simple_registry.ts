import type { SourceFile } from "./file";
import { isRelativeImport, getImportModuleSpecifier, calculateNewImportPath } from "./pathUtils";
import ts from "typescript";
import path from "path";

/**
 * Simple registry focused purely on import rewriting
 * No fancy features, just what works
 */
export class SimpleSourceFileRegistry {
  private files = new Map<string, SourceFile>();

  /**
   * Register a source file with its path
   */
  register(filePath: string, sourceFile: SourceFile): void {
    this.files.set(filePath, sourceFile);
  }

  /**
   * Get a source file by path
   */
  get(filePath: string): SourceFile | undefined {
    return this.files.get(filePath);
  }

  /**
   * Get all files
   */
  getAll(): Map<string, SourceFile> {
    return new Map(this.files);
  }

  /**
   * Clear all files
   */
  clear(): void {
    this.files.clear();
  }

  /**
   * Rewrite relative imports when moving files from one directory to another
   * @param fromBase - Source directory (e.g., "src/components")
   * @param toBase - Target directory (e.g., "src/out")
   */
  rewriteAllRelativeImports(fromBase: string, toBase: string): void {
    const newFiles = new Map<string, SourceFile>();

    for (const [filePath, sourceFile] of this.files) {
      // Calculate new file path
      const newPath = this.calculateNewPath(filePath, fromBase, toBase);

      // Update imports in the file
      this.updateFileImports(sourceFile, filePath, newPath);

      // Store with new path
      newFiles.set(newPath, sourceFile);

      // Update the source file's internal path if possible
      try {
        (sourceFile as any).fileName = newPath;
      } catch {
        // Ignore if we can't update fileName
      }
    }

    // Replace the file map
    this.files = newFiles;
  }

  /**
   * Calculate the new path for a file when moving directories
   */
  private calculateNewPath(filePath: string, fromBase: string, toBase: string): string {
    const normalizedFilePath = path.normalize(filePath);
    const normalizedFromBase = path.normalize(fromBase);
    const normalizedToBase = path.normalize(toBase);

    if (normalizedFilePath.startsWith(normalizedFromBase)) {
      const relativePart = path.relative(normalizedFromBase, normalizedFilePath);
      return path.join(normalizedToBase, relativePart);
    }

    // If file is not under fromBase, just replace the base part
    return normalizedFilePath.replace(normalizedFromBase, normalizedToBase);
  }

  /**
   * Update imports in a single file
   */
  private updateFileImports(sourceFile: SourceFile, oldPath: string, newPath: string): void {
    if (typeof sourceFile.updateImports !== 'function') {
      return; // Skip if no updateImports method
    }

    try {
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
    } catch (error) {
      console.error(`Error updating imports for ${oldPath}:`, error);
      // Continue without throwing - at least the file path will be updated
    }
  }

  /**
   * Write all files to their new locations
   * Returns a map of filePath -> content
   */
  writeAllFiles(): Map<string, string> {
    const output = new Map<string, string>();

    for (const [filePath, sourceFile] of this.files) {
      try {
        let content: string;

        // Try different methods to get content
        if (typeof (sourceFile as any).print === 'function') {
          content = (sourceFile as any).print();
        } else if (typeof sourceFile.getFullText === 'function') {
          content = sourceFile.getFullText();
        } else {
          // Last resort - use TypeScript printer
          const printer = ts.createPrinter();
          content = printer.printFile(sourceFile as any);
        }

        output.set(filePath, content);
      } catch (error) {
        console.error(`Error writing file ${filePath}:`, error);
        output.set(filePath, `// Error generating content for ${filePath}`);
      }
    }

    return output;
  }
}
