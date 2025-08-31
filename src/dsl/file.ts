import { type CompilerOptions, Project, type SourceFile } from "ts-morph";
import { logger } from "../log";
import { addBarrelExports, type BarrelOptions } from "./barrel-manager";
import { runDiagnostics } from "./diagnostics";
import type { TsFlatteredImport } from "./import";
import { addResolvedImports, resolveImports } from "./import-resolver";
import {
  registry as globalRegistry,
  type Registry,
  type TsFlatteredFile,
} from "./registry";

const defaultProject = new Project({
  useInMemoryFileSystem: true,
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

export function sourceFile(
  name: string,
  statements: TsFlatteredStatement[] = [],
  opts?: SourceFileOptions,
) {
  const fileRegistry = opts?.registry ?? globalRegistry;
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

    render(): string {
      const sourceFile = project.createSourceFile(`./${file.name}`, "");

      // Add barrel exports first if enabled
      if (barrelConfig) {
        addBarrelExports(
          sourceFile,
          file.name,
          fileRegistry.getFiles(),
          barrelConfig,
        );
      }

      // Add external imports
      for (const externalImport of this.externalImports) {
        externalImport.addToSourceFile(sourceFile);
      }

      // Add all resolved imports from registry
      const imports = resolveImports(this.statements, fileRegistry);
      addResolvedImports(sourceFile, imports);

      // Add statements
      for (const stmt of this.statements) {
        stmt.addToSourceFile(sourceFile);
      }

      return sourceFile.getFullText();
    },

    getProject(): Project {
      return project;
    },
  };

  // Automatically register the file with the registry
  fileRegistry.push(file);

  return file;
}

export interface WriteAllOptions {
  outputDir?: string;
  registry?: Registry;
  project?: Project;
  skipDiagnostics?: boolean;
}

export async function writeAll(opts: WriteAllOptions = {}): Promise<void> {
  const options = {
    outputDir: "./out",
    skipDiagnostics: true,
    ...opts,
  };

  const fs = await import("node:fs/promises");
  const path = await import("node:path");

  const fileRegistry = options.registry ?? globalRegistry;
  const usedProject: Project = options.project ?? defaultProject;

  logger.start(`Generating code to ${options.outputDir}`);
  const start = performance.now();

  // Ensure output directory exists
  await fs.mkdir(options.outputDir, { recursive: true });

  const allFiles = fileRegistry.getFiles();
  if (allFiles.length === 0) {
    logger.warn("No files found to generate");
    return;
  }

  // Generate and write all files
  await generateAndWriteFiles(
    allFiles,
    usedProject,
    options.outputDir,
    fs,
    path,
  );

  // Run diagnostics if not skipped
  if (!options.skipDiagnostics) {
    runDiagnostics(usedProject);
  }

  logger.complete(
    `${allFiles.length} files written in ${(performance.now() - start).toFixed(3)}ms to ${options.outputDir}`,
  );
}

async function generateAndWriteFiles(
  allFiles: TsFlatteredFile[],
  usedProject: Project,
  outputDir: string,
  fs: typeof import("node:fs/promises"),
  path: typeof import("node:path"),
): Promise<void> {
  const fileContents = new Map<string, string>();

  // Generate all files first
  for (const [index, file] of allFiles.entries()) {
    logger.await(`[%d/${allFiles.length}] Generating ${file.name}`, index + 1);

    const content = file.render();
    fileContents.set(file.name, content);

    // Add the file to the used project for diagnostics
    const existingFile = usedProject.getSourceFile(`./${file.name}`);
    if (existingFile) {
      existingFile.delete();
    }
    usedProject.createSourceFile(`./${file.name}`, content);
  }

  // Write all files in parallel
  const writePromises = Array.from(fileContents.entries()).map(
    async ([fileName, content]) => {
      const filePath = path.join(outputDir, fileName);
      const dir = path.dirname(filePath);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, content, "utf-8");
    },
  );

  await Promise.all(writePromises);
}
