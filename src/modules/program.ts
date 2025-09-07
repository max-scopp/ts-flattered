import * as fs from "node:fs/promises";
import * as path from "node:path";
import ts from "typescript";
import { SourceFile } from "./file";
import { type ExternalDependency, SourceFileRegistry } from "./registry";

/**
 * A TypeScript program that manages source files and provides methods
 * to print and write all files with proper cross-references
 */
export class Program {
  private registry = new SourceFileRegistry();

  /**
   * Create a new source file and register it with the program
   */
  createSourceFile(fileName: string): SourceFile {
    const sourceFile = new SourceFile(fileName);
    this.registry.register(sourceFile);
    return sourceFile;
  }

  /**
   * Register an existing source file with the program
   */
  addSourceFile(sourceFile: SourceFile): void {
    this.registry.register(sourceFile);
  }

  /**
   * Get a source file by name
   */
  getSourceFile(fileName: string): SourceFile | undefined {
    return this.registry.get(fileName);
  }

  /**
   * Get all source files
   */
  getAllSourceFiles(): Map<string, SourceFile> {
    return this.registry.getAll();
  }

  /**
   * Remove a source file from the program
   */
  removeSourceFile(fileName: string): void {
    this.registry.unregister(fileName);
  }

  /**
   * Clear all source files from the program
   */
  clear(): void {
    this.registry.clear();
  }

  /**
   * Register an external dependency for auto-import resolution
   */
  addExternalDependency(dependency: ExternalDependency): void {
    this.registry.registerExternalDependency(dependency);
  }

  /**
   * Register multiple external dependencies at once
   */
  addExternalDependencies(dependencies: ExternalDependency[]): void {
    for (const dependency of dependencies) {
      this.registry.registerExternalDependency(dependency);
    }
  }

  /**
   * Auto-resolve imports and generate all files with proper cross-references
   */
  printAll(): Map<string, string> {
    const result = new Map<string, string>();
    const files = this.registry.getAll();

    for (const [fileName, sourceFile] of files) {
      // Analyze dependencies and auto-add imports
      const processedFile = this.resolveReferences(sourceFile, fileName);
      result.set(fileName, processedFile.print());
    }

    return result;
  }

  /**
   * Write all source files to an output directory in parallel
   */
  async writeAll(outputDir: string): Promise<void> {
    const start = performance.now();

    // Ensure output directory exists
    await fs.mkdir(outputDir, { recursive: true });

    // Generate all file contents with resolved references
    const fileContents = this.printAll();

    // Write all files in parallel
    const writePromises = Array.from(fileContents.entries()).map(
      async ([fileName, content]) => {
        const outputPath = path.join(outputDir, fileName);

        // Ensure the directory for this file exists
        const fileDir = path.dirname(outputPath);
        await fs.mkdir(fileDir, { recursive: true });

        // Write the file
        await fs.writeFile(outputPath, content, "utf8");
      },
    );

    await Promise.all(writePromises);

    console.log(
      `✅ Files written in ${(performance.now() - start).toFixed(3)}ms to ${outputDir}`,
    );
  }

  private resolveReferences(
    sourceFile: SourceFile,
    currentFileName: string,
  ): SourceFile {
    // Create a copy of the source file to avoid modifying the original
    const resolvedFile = new SourceFile(currentFileName);

    // Get all statements from the original file
    const statements = sourceFile.getStatements();

    // Track what we need to import
    const neededInternalImports = new Set<string>();
    const neededExternalImports = new Map<string, Set<string>>(); // moduleSpecifier -> exports
    const neededExternalTypeImports = new Map<string, Set<string>>(); // moduleSpecifier -> type exports
    const neededExternalDefaultImports = new Map<string, string>(); // moduleSpecifier -> default import

    // Analyze statements for cross-references
    for (const statement of statements) {
      this.analyzeStatement(
        statement,
        currentFileName,
        neededInternalImports,
        neededExternalImports,
        neededExternalTypeImports,
        neededExternalDefaultImports,
      );
      resolvedFile.addStatement(statement);
    }

    // Add auto-resolved internal imports
    for (const importPath of neededInternalImports) {
      const targetFile = this.registry.get(importPath);
      if (targetFile) {
        const exports = this.extractExports(targetFile);

        if (exports.length > 0) {
          resolvedFile.addAutoImport({
            namedImports: exports,
            moduleSpecifier: `./${importPath.replace(".ts", "")}`,
          });
        }
      }
    }

    // Add auto-resolved external imports
    for (const [moduleSpecifier, exports] of neededExternalImports) {
      const dependency = this.registry.getExternalDependency(moduleSpecifier);
      if (dependency && exports.size > 0) {
        resolvedFile.addAutoImport({
          namedImports: Array.from(exports),
          moduleSpecifier,
        });
      }
    }

    // Add auto-resolved external type imports
    for (const [moduleSpecifier, typeExports] of neededExternalTypeImports) {
      const dependency = this.registry.getExternalDependency(moduleSpecifier);
      if (dependency && typeExports.size > 0) {
        resolvedFile.addAutoImport({
          typeOnlyNamedImports: Array.from(typeExports),
          moduleSpecifier,
        });
      }
    }

    // Add auto-resolved external default imports
    for (const [
      moduleSpecifier,
      defaultImport,
    ] of neededExternalDefaultImports) {
      const dependency = this.registry.getExternalDependency(moduleSpecifier);
      if (dependency) {
        resolvedFile.addAutoImport({
          defaultImport,
          moduleSpecifier,
          isDefaultTypeOnly: dependency.isDefaultTypeOnly,
        });
      }
    }

    return resolvedFile;
  }

  private analyzeStatement(
    statement: ts.Statement,
    currentFileName: string,
    neededInternalImports: Set<string>,
    neededExternalImports: Map<string, Set<string>>,
    neededExternalTypeImports: Map<string, Set<string>>,
    neededExternalDefaultImports: Map<string, string>,
  ): void {
    // This is a simplified analysis - traverse the AST to find references
    // to classes/functions defined in other files
    // Helper function to safely get text from AST nodes
    const getNodeText = (node: ts.Node): string => {
      try {
        // For synthetic nodes, we need to use a printer instead of getText()
        const printer = ts.createPrinter();
        const tempSourceFile = ts.createSourceFile(
          "temp.ts",
          "",
          ts.ScriptTarget.Latest,
          false,
        );
        return printer.printNode(ts.EmitHint.Unspecified, node, tempSourceFile);
      } catch {
        return "";
      }
    };

    const statementText = getNodeText(statement);
    const files = this.registry.getAll();

    // Look for potential cross-references in other registered files
    for (const [fileName, sourceFile] of files) {
      if (fileName === currentFileName) continue;

      const exports = this.extractExports(sourceFile);
      for (const exportName of exports) {
        if (statementText.includes(exportName)) {
          neededInternalImports.add(fileName);
          break;
        }
      }
    }

    // Look for external dependencies
    this.analyzeExternalReferences(
      statementText,
      neededExternalImports,
      neededExternalTypeImports,
      neededExternalDefaultImports,
    );
  }

  private analyzeExternalReferences(
    statementText: string,
    neededExternalImports: Map<string, Set<string>>,
    neededExternalTypeImports: Map<string, Set<string>>,
    neededExternalDefaultImports: Map<string, string>,
  ): void {
    const externalDependencies = this.registry.getAllExternalDependencies();

    for (const [moduleSpecifier, dependency] of externalDependencies) {
      // Check for named exports
      if (dependency.namedExports) {
        for (const namedExport of dependency.namedExports) {
          if (statementText.includes(namedExport)) {
            if (!neededExternalImports.has(moduleSpecifier)) {
              neededExternalImports.set(moduleSpecifier, new Set());
            }
            const exportsSet = neededExternalImports.get(moduleSpecifier);
            if (exportsSet) {
              exportsSet.add(namedExport);
            }
          }
        }
      }

      // Check for type-only exports
      if (dependency.typeOnlyExports) {
        for (const typeExport of dependency.typeOnlyExports) {
          if (statementText.includes(typeExport)) {
            if (!neededExternalTypeImports.has(moduleSpecifier)) {
              neededExternalTypeImports.set(moduleSpecifier, new Set());
            }
            const typeExportsSet =
              neededExternalTypeImports.get(moduleSpecifier);
            if (typeExportsSet) {
              typeExportsSet.add(typeExport);
            }
          }
        }
      }

      // Check for default export
      if (
        dependency.defaultExport &&
        statementText.includes(dependency.defaultExport)
      ) {
        neededExternalDefaultImports.set(
          moduleSpecifier,
          dependency.defaultExport,
        );
      }
    }
  }

  private extractExports(sourceFile: SourceFile): string[] {
    const exports: string[] = [];
    const statements = sourceFile.getStatements();

    for (const statement of statements) {
      if (
        ts.isClassDeclaration(statement) &&
        statement.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
      ) {
        if (statement.name) {
          exports.push(statement.name.text);
        }
      }
      if (
        ts.isFunctionDeclaration(statement) &&
        statement.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
      ) {
        if (statement.name) {
          exports.push(statement.name.text);
        }
      }
      // Add more export types as needed
    }

    return exports;
  }
}
