import { type CompilerOptions, Project, type SourceFile } from "ts-morph";
import { logger } from "../log";
import { mapDiagnosticToSource } from "./code";
import type { TsFlatteredImport } from "./import";
import {
  registry as globalRegistry,
  type Registry,
  type TsFlatteredFile,
} from "./registry";

const defaultProject = new Project({
  useInMemoryFileSystem: true,
  // tsConfigFilePath: "./tsconfig.json",
});

export function createProject(compilerOptions?: CompilerOptions): Project;
export function createProject(tsconfigPath?: string): Project;
export function createProject(
  compilerOptionsOrTsConfigPath?: CompilerOptions | string,
): Project {
  if (typeof compilerOptionsOrTsConfigPath === "string") {
    return new Project({
      tsConfigFilePath: compilerOptionsOrTsConfigPath,
    });
  }

  return new Project({
    compilerOptions: compilerOptionsOrTsConfigPath,
    useInMemoryFileSystem: true,
  });
}

export interface TsFlatteredStatement {
  addToSourceFile(sourceFile: SourceFile): void;
  getExportedSymbols(): string[];
  getImportedSymbols(): string[];
}

export interface SourceFileOptions {
  registry?: Registry;
  barrel?: BarrelOptions | boolean;
  project?: Project;
  compilerOptions?: CompilerOptions;
  tsconfigPath?: string;
  imports?: TsFlatteredImport[];
}

export interface BarrelOptions {
  /** RegExp pattern to match file paths to include */
  pathMatcher?: RegExp;
  /** Specific symbols to export from matched files */
  symbols?: string[];
}

export function sourceFile(
  name: string,
  statements: TsFlatteredStatement[] = [],
  opts?: SourceFileOptions,
) {
  const fileRegistry = opts?.registry ?? globalRegistry;

  // Use the project from options, or the registry's project
  const project: Project = opts?.project ?? fileRegistry.project;

  const barrelConfig = opts?.barrel;

  const file = {
    name,
    statements,
    registry: fileRegistry,
    externalImports: opts?.imports ?? [],

    addStatement(stmt: TsFlatteredStatement) {
      this.statements.push(stmt);
    },

    addImport(imp: TsFlatteredImport) {
      this.externalImports.push(imp);
    },

    // Walk statements and find symbols for import resolution
    resolveImports() {
      const importsByModule = new Map<
        string,
        {
          namedImports: Set<string>;
          typeOnlyNamedImports: Set<string>;
          defaultImports: Set<string>;
          namespaceImports: Set<string>;
        }
      >();

      for (const stmt of this.statements) {
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
          } else {
            logger.warn(`Warning: Symbol '${symbol}' not found in registry`);
          }
        }
      }

      return importsByModule;
    },

    render(): string {
      const sourceFile = project.createSourceFile(`./${file.name}`, "");

      // Add barrel exports first if enabled
      if (barrelConfig) {
        this.addBarrelExports(sourceFile);
      }

      // Add external imports
      for (const externalImport of this.externalImports) {
        externalImport.addToSourceFile(sourceFile);
      }

      // Add all resolved imports from registry (both internal and external)
      const imports = this.resolveImports();
      for (const [filePath, moduleImports] of imports) {
        const {
          namedImports,
          typeOnlyNamedImports,
          defaultImports,
          namespaceImports,
        } = moduleImports;

        // Create import declaration with proper structure
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
          if (importStructure.namedImports) {
            // Merge with existing named imports, marking type-only ones
            importStructure.namedImports = [
              ...importStructure.namedImports,
              ...Array.from(typeOnlyNamedImports).map((name) => ({
                name,
                isTypeOnly: true,
              })),
            ];
          } else {
            importStructure.namedImports = Array.from(typeOnlyNamedImports).map(
              (name) => ({ name, isTypeOnly: true }),
            );
          }
        }

        // Add default import
        if (defaultImports.size > 0) {
          importStructure.defaultImport = Array.from(defaultImports)[0]; // Take first one if multiple
        }

        // Add namespace import
        if (namespaceImports.size > 0) {
          importStructure.namespaceImport = Array.from(namespaceImports)[0]; // Take first one if multiple
        }

        sourceFile.addImportDeclaration(importStructure);
      }

      // Add statements
      for (const stmt of this.statements) {
        stmt.addToSourceFile(sourceFile);
      }

      return sourceFile.getFullText();
    },

    getProject(): Project {
      return project;
    },

    addBarrelExports(sourceFile: SourceFile): void {
      if (!barrelConfig) return;

      const barrelOpts = barrelConfig === true ? {} : barrelConfig;
      const allFiles = fileRegistry.getFiles();

      for (const file of allFiles) {
        if (!this.shouldIncludeFileInBarrel(file, barrelOpts)) continue;

        const moduleSpecifier = `./${file.name.replace(/.tsx?$/, "")}`;

        if (barrelOpts.symbols && barrelOpts.symbols.length > 0) {
          // Export only specific symbols
          sourceFile.addExportDeclaration({
            namedExports: barrelOpts.symbols,
            moduleSpecifier,
          });
        } else {
          // Export all symbols from the file (default behavior)
          const fileExports: string[] = [];
          for (const stmt of file.statements) {
            fileExports.push(...stmt.getExportedSymbols());
          }

          if (fileExports.length > 0) {
            sourceFile.addExportDeclaration({
              namedExports: fileExports,
              moduleSpecifier,
            });
          }
        }
      }
    },

    shouldIncludeFileInBarrel(
      file: TsFlatteredFile,
      barrelOpts: BarrelOptions,
    ): boolean {
      // Always skip self
      if (file.name === this.name) return false;

      // If path matcher is provided, use it to filter files
      if (barrelOpts.pathMatcher) {
        return barrelOpts.pathMatcher.test(file.name);
      }

      // Default: include all files (except self)
      return true;
    },
  };

  // Automatically register the file with the registry
  fileRegistry.push(file);

  return file;
}

export async function writeAll(opts?: {
  outputDir?: string;
  registry?: Registry;
  project?: Project;
  skipDiagnostics?: boolean;
}): Promise<void> {
  const options = {
    outputDir: "./out",
    skipDiagnostics: true,
    ...opts,
  };

  const fs = await import("node:fs/promises");
  const path = await import("node:path");

  const fileRegistry = options?.registry ?? globalRegistry;

  // Determine which project to use
  const usedProject: Project = options.project ?? defaultProject;

  logger.start(`Generating code to ${options.outputDir}`);
  const start = performance.now();

  // Ensure output directory exists
  await fs.mkdir(options.outputDir, { recursive: true });

  // Get all files from registry and render them
  const allFiles = fileRegistry.getFiles();

  if (allFiles.length === 0) {
    logger.warn("No files found to generate");
    return;
  }

  // Generate all files first
  const fileContents = new Map<string, string>();

  for (const [index, file] of allFiles.entries()) {
    // Update progress
    logger.await(`[%d/${allFiles.length}] Generating ${file.name}`, index + 1);

    const content = file.render();
    fileContents.set(file.name, content);

    // Add the file to the used project for diagnostics
    // Remove existing file if it exists, then create new one
    const existingFile = usedProject.getSourceFile(`./${file.name}`);
    if (existingFile) {
      existingFile.delete();
    }
    usedProject.createSourceFile(`./${file.name}`, content);
  }

  // Write all files in parallel
  const writePromises = Array.from(fileContents.entries()).map(
    async ([fileName, content]) => {
      const filePath = path.join(options.outputDir, fileName);

      // Ensure subdirectories exist
      const dir = path.dirname(filePath);
      await fs.mkdir(dir, { recursive: true });

      await fs.writeFile(filePath, content, "utf-8");
    },
  );

  await Promise.all(writePromises);

  // Run global diagnostics on the entire project AFTER all files are written
  if (!options.skipDiagnostics) {
    logger.time("diagnostics-total");
    const globalDiagnostics = usedProject.getPreEmitDiagnostics();
    logger.timeEnd("diagnostics-total");

    if (globalDiagnostics.length > 0) {
      logger.time("diagnostics-processing");
      logger.warn(`Found ${globalDiagnostics.length} global diagnostic(s):`);
      for (const diagnostic of globalDiagnostics) {
        const sourceFile = diagnostic.getSourceFile();
        const message = diagnostic.getMessageText();
        const lineNumber = diagnostic.getLineNumber();
        const fileName = sourceFile?.getBaseName() ?? "unknown";

        // Try to map the diagnostic back to the original source
        let locationInfo = `${fileName}:${lineNumber}`;
        if (sourceFile && lineNumber) {
          const generatedContent = sourceFile.getFullText();
          const originalSource = mapDiagnosticToSource(
            generatedContent,
            lineNumber,
          );
          if (originalSource) {
            locationInfo = `${originalSource.file}:${originalSource.line}:${originalSource.column} (generated ${fileName}:${lineNumber})`;
          }
        }

        if (diagnostic.getCategory() === 1) {
          // Error
          logger.error(`  ${locationInfo}: ${message}`);
        } else {
          logger.warn(`  ${locationInfo}: ${message}`);
        }
      }
      logger.timeEnd("diagnostics-processing");
    }
  }
  logger.complete(
    `${allFiles.length} files written in ${(performance.now() - start).toFixed(3)}ms to ${options.outputDir}`,
  );
}
