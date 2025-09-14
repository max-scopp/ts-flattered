import * as path from "node:path";
import ts from "typescript";
import { type BuildableAST, buildFluentApi } from "../utils/buildFluentApi";
import { type SymbolResolver, symbolResolver } from "./symbolResolver";

/**
 * Options for creating a TypeScript program
 */
export interface ProgramOptions {
  /** TypeScript compiler options */
  compilerOptions?: ts.CompilerOptions;
  /** Entry file paths */
  rootNames?: string[];
  /** Custom compiler host */
  host?: ts.CompilerHost;
  /** Existing TypeScript program to adopt */
  program?: ts.Program;
}

/**
 * Minimal builder for TypeScript program focused on symbol resolution
 */
export class ProgramBuilder implements BuildableAST {
  #program: ts.Program;
  #lazySymbolResolver: SymbolResolver | null = null;

  constructor(options: ProgramOptions = {}) {
    if (options.program) {
      // Use the provided program as-is
      this.#program = options.program;
    } else {
      // Create new program with provided options
      const compilerOptions = options.compilerOptions ?? {
        target: ts.ScriptTarget.ESNext,
        module: ts.ModuleKind.ESNext,
        moduleResolution: ts.ModuleResolutionKind.Bundler,
        skipLibCheck: true,
        skipDefaultLibCheck: true,
        strict: false,
      };

      const host = options.host ?? ts.createCompilerHost(compilerOptions);
      const rootNames = options.rootNames ?? [];

      this.#program = ts.createProgram(rootNames, compilerOptions, host);
    }
  }

  /**
   * Get a SymbolResolver for the current program
   *
   * This resolver can be used to analyze symbols, check decorator origins,
   * and resolve imports in the program's source files.
   *
   * Uses lazy initialization - will create the resolver on first access
   * and return the cached instance on subsequent calls.
   *
   * @returns A SymbolResolver instance
   */
  get symbolResolver(): SymbolResolver {
    if (!this.#lazySymbolResolver) {
      this.#lazySymbolResolver = symbolResolver(this.#program);
    }
    return this.#lazySymbolResolver;
  }

  /**
   * Required method to satisfy the BuildableAST interface
   * Returns the TypeScript program
   */
  get(): ts.Program {
    return this.#program;
  }
}

/**
 * Create a TypeScript program focused on symbol resolution
 *
 * @param options Program configuration options
 * @returns A program builder instance with fluent method chaining
 * @example
 * ```ts
 * // Create a program from file paths
 * const prog = program({
 *   rootNames: ['./src/index.ts'],
 *   compilerOptions: { strict: true }
 * });
 *
 * // Access the symbol resolver
 * const resolver = prog.symbolResolver;
 *
 * // Access the underlying TypeScript program
 * const tsProgram = prog.get();
 * ```
 */
export const program = (options: ProgramOptions = {}) => {
  return buildFluentApi(ProgramBuilder, options);
};

/**
 * Create a program builder from an existing TypeScript Program
 *
 * @param tsProgram The existing TypeScript Program to adopt as-is
 * @param options Additional program options
 * @returns A program builder instance that wraps the existing program
 * @example
 * ```ts
 * // Adopt an existing TypeScript program
 * const existingProgram = ts.createProgram(...);
 * const prog = programFromTs(existingProgram);
 *
 * // Access the symbol resolver
 * const resolver = prog.symbolResolver;
 * ```
 */
export const programFromTs = (
  tsProgram: ts.Program,
  options: Omit<ProgramOptions, "program"> = {},
) => {
  const programOptions: ProgramOptions = {
    ...options,
    program: tsProgram,
  };

  return program(programOptions);
};

/**
 * Create a program builder from a tsconfig.json file
 *
 * @param tsconfigPath Path to the tsconfig.json file
 * @returns A program builder instance with fluent method chaining
 * @example
 * ```ts
 * // Create from tsconfig.json
 * const prog = programFromTsConfig('./tsconfig.json');
 *
 * // Access the symbol resolver
 * const resolver = prog.symbolResolver;
 * ```
 */
export const programFromTsConfig = (tsconfigPath: string) => {
  const configFile = ts.readConfigFile(tsconfigPath, ts.sys.readFile);
  if (configFile.error) {
    throw new Error(
      ts.formatDiagnosticsWithColorAndContext([configFile.error], {
        getCanonicalFileName: f => f,
        getCurrentDirectory: ts.sys.getCurrentDirectory,
        getNewLine: () => ts.sys.newLine,
      }),
    );
  }

  const configDir = path.dirname(tsconfigPath);
  const parsed = ts.parseJsonConfigFileContent(
    configFile.config,
    ts.sys,
    configDir,
  );

  return programFromTs(ts.createProgram({
    rootNames: parsed.fileNames,
    options: parsed.options,
  }));
};
