import type { SourceFile } from "./file";
import ts from "typescript";
import path from "path";

export class SourceFileRegistry {
  private files = new Map<string, SourceFile>();

  register(sourceFile: SourceFile, filePath?: string): void {
    const fileName = sourceFile.getFileName();
    this.files.set(filePath || fileName, sourceFile);
  }

  registerFile(filePath: string, sourceFile: SourceFile): void {
    this.files.set(filePath, sourceFile);
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
   * Update the path of a file in the registry
   */
  updateFilePath(oldPath: string, newPath: string): void {
    const sourceFile = this.files.get(oldPath);
    if (sourceFile) {
      this.files.delete(oldPath);
      this.files.set(newPath, sourceFile);
    }
  }

  rewriteAllRelativeImports(fromBase: string, toBase: string): void {
    console.log(`Moving files from "${fromBase}" to "${toBase}"`);

    const newFiles = new Map<string, SourceFile>();

    for (const [filePath, sourceFile] of this.files) {
      console.log(`Processing: ${filePath}`);

      const newFilePath = this.calculateNewPath(filePath, fromBase, toBase);
      console.log(`  -> ${newFilePath}`);

      if (this.isPathCorrupted(newFilePath, filePath)) {
        console.error(`Path corrupted, keeping original: ${newFilePath}`);
        newFiles.set(filePath, sourceFile);
        continue;
      }

      if (this.canUpdateImports(sourceFile)) {
        try {
          this.updateFileImports(sourceFile, filePath, newFilePath);
          console.log(`  ✓ Imports updated`);
        } catch (error) {
          console.error(`  ❌ Import update failed:`, error);
        }
      }

      this.setFileName(sourceFile, newFilePath);
      newFiles.set(newFilePath, sourceFile);
    }

    this.files = newFiles;
    console.log(`Registry now contains ${this.files.size} files`);
  }

  private calculateNewPath(filePath: string, fromBase: string, toBase: string): string {
    try {
      // Normalize paths to use consistent separators
      const normalizedFilePath = path.normalize(filePath);
      const normalizedFromBase = path.normalize(fromBase);
      const normalizedToBase = path.normalize(toBase);

      console.log(`    Calculating: "${normalizedFilePath}" from "${normalizedFromBase}" to "${normalizedToBase}"`);

      // Check if the file path starts with the fromBase
      if (normalizedFilePath.startsWith(normalizedFromBase)) {
        // Extract the relative part after fromBase
        let relativePart = normalizedFilePath.substring(normalizedFromBase.length);

        // Remove leading path separator if present
        if (relativePart.startsWith('/') || relativePart.startsWith('\\')) {
          relativePart = relativePart.substring(1);
        }

        // Join the relative part with the new base
        const newPath = path.join(normalizedToBase, relativePart);
        console.log(`    Result: "${newPath}"`);
        return newPath;
      } else {
        // If file is not under fromBase, use simple string replacement
        const newPath = normalizedFilePath.replace(normalizedFromBase, normalizedToBase);
        console.log(`    Fallback result: "${newPath}"`);
        return newPath;
      }
    } catch (error) {
      console.error(`Error calculating new path for "${filePath}":`, error);
      return filePath; // Return original on error
    }
  }  private isPathCorrupted(newPath: string, originalPath: string): boolean {
    try {
      // Check for obvious corruption patterns
      if (newPath.includes('componentsrc/out') ||
          newPath.includes('srcout') ||
          newPath.includes('tsxtsx') ||
          newPath.includes('srcsrc')) {
        return true;
      }

      // Check if path length has grown unreasonably
      if (newPath.length > originalPath.length * 2) {
        return true;
      }

      // Check if the path has become malformed
      try {
        path.parse(newPath);
      } catch {
        return true; // Path.parse failed, path is malformed
      }

      // Check if the new path has invalid characters or structure
      if (newPath.includes('//') || newPath.includes('\\\\')) {
        return true;
      }

      return false;
    } catch {
      return true; // Any error in validation means the path is likely corrupted
    }
  }

  private canUpdateImports(sourceFile: SourceFile): boolean {
    return typeof (sourceFile as any).updateImports === 'function';
  }

  private updateFileImports(sourceFile: SourceFile, oldPath: string, newPath: string): void {
    // Validate the source file has proper AST structure
    if (!this.isValidSourceFile(sourceFile)) {
      console.warn(`  ⚠️  Source file has invalid AST structure, skipping import updates`);
      return;
    }

    (sourceFile as any).updateImports((importDecl: ts.ImportDeclaration) => {
      try {
        // Validate the import declaration node
        if (!this.isValidImportDeclaration(importDecl)) {
          console.warn(`  ⚠️  Invalid import declaration, keeping original`);
          return importDecl;
        }

        const moduleSpecifier = this.extractModuleSpecifier(importDecl);

        if (!moduleSpecifier) {
          console.warn(`  ⚠️  Could not extract module specifier, keeping original`);
          return importDecl;
        }

        if (this.isRelativeImportPath(moduleSpecifier)) {
          const newModuleSpecifier = this.calculateNewImportPath(moduleSpecifier, oldPath, newPath);
          console.log(`    Rewriting: "${moduleSpecifier}" -> "${newModuleSpecifier}"`);

          // Create a proper new import declaration with proper AST structure
          return this.createUpdatedImportDeclaration(importDecl, newModuleSpecifier);
        }

        return importDecl;
      } catch (error) {
        console.error(`  ❌ Error processing import declaration:`, error);
        return importDecl; // Return original on any error
      }
    });
  }

  /**
   * Validate that a source file has proper AST structure
   */
  private isValidSourceFile(sourceFile: SourceFile): boolean {
    try {
      const statements = sourceFile.getStatements();
      return Array.isArray(statements) && statements.every(stmt =>
        stmt && typeof stmt === 'object' && 'kind' in stmt
      );
    } catch {
      return false;
    }
  }

  /**
   * Validate that an import declaration has proper AST structure
   */
  private isValidImportDeclaration(importDecl: ts.ImportDeclaration): boolean {
    return !!(
      importDecl &&
      importDecl.kind === ts.SyntaxKind.ImportDeclaration &&
      importDecl.moduleSpecifier &&
      typeof importDecl.moduleSpecifier === 'object'
    );
  }

  /**
   * Safely extract module specifier from import declaration
   */
  private extractModuleSpecifier(importDecl: ts.ImportDeclaration): string | null {
    try {
      if (ts.isStringLiteral(importDecl.moduleSpecifier)) {
        const text = importDecl.moduleSpecifier.text;
        return typeof text === 'string' ? text : null;
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Check if import path is relative using proper path analysis
   */
  private isRelativeImportPath(importPath: string): boolean {
    if (!importPath || typeof importPath !== 'string') {
      return false;
    }
    return importPath.startsWith('./') || importPath.startsWith('../');
  }

  /**
   * Calculate new import path using Node.js path utilities
   */
  private calculateNewImportPath(importPath: string, oldFilePath: string, newFilePath: string): string {
    try {
      // Get directory paths using Node.js path utilities
      const oldDir = path.dirname(path.resolve(oldFilePath));
      const newDir = path.dirname(path.resolve(newFilePath));

      // Resolve the absolute path of the imported file from old location
      const absoluteImportPath = path.resolve(oldDir, importPath);

      // Calculate the new relative path from new location
      let newRelativePath = path.relative(newDir, absoluteImportPath);

      // Normalize path separators for cross-platform compatibility
      newRelativePath = newRelativePath.replace(/\\/g, '/');

      // Ensure proper relative path format
      if (!newRelativePath.startsWith('.')) {
        newRelativePath = './' + newRelativePath;
      }

      return newRelativePath;
    } catch (error) {
      console.error(`Error calculating new import path for "${importPath}":`, error);
      return importPath; // Return original on error
    }
  }

  /**
   * Create a properly formed updated import declaration
   */
  private createUpdatedImportDeclaration(
    originalDecl: ts.ImportDeclaration,
    newModuleSpecifier: string
  ): ts.ImportDeclaration {
    try {
      // Create a new string literal with proper AST structure
      const newModuleSpecifierNode = ts.factory.createStringLiteral(newModuleSpecifier);

      // Use TypeScript's factory to create a properly formed import declaration
      return ts.factory.updateImportDeclaration(
        originalDecl,
        originalDecl.modifiers,
        originalDecl.importClause,
        newModuleSpecifierNode,
        originalDecl.attributes,
      );
    } catch (error) {
      console.error(`Error creating updated import declaration:`, error);
      return originalDecl; // Return original on error
    }
  }

  private setFileName(sourceFile: SourceFile, newPath: string): void {
    try {
      (sourceFile as any).fileName = newPath;
    } catch {
      // Ignore if readonly
    }
  }

  writeAllFiles(): Map<string, string> {
    const result = new Map<string, string>();

    for (const [filePath, sourceFile] of this.files) {
      try {
        let content: string;

        if (typeof (sourceFile as any).print === 'function') {
          content = (sourceFile as any).print();
        } else if (typeof sourceFile.getFullText === 'function') {
          content = sourceFile.getFullText();
        } else {
          const printer = ts.createPrinter({ removeComments: false });
          content = printer.printFile(sourceFile as any);
        }

        result.set(filePath, content);

      } catch (error) {
        console.error(`Failed to generate content for ${filePath}:`, error);
        result.set(filePath, `// Error generating content`);
      }
    }

    return result;
  }

  debugState(): void {
    console.log('=== REGISTRY ===');
    console.log(`Files: ${this.files.size}`);
    for (const [path, file] of this.files) {
      console.log(`  ${path} (${file.getFileName()})`);
    }
  }
}
