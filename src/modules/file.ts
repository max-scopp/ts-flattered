import ts from "typescript";
import { klass } from "../core/klass";
import { const_, let_, var_ } from "../core/variable";
import type {
  ClassMethodInfo,
  ClassPropertyInfo,
  DecoratorInfo,
  ParameterInfo,
} from "../helpers/finder";
import { type BuildableAST, buildFluentApi } from "../utils/buildFluentApi";
import { type ImportOptions, imp } from "./imp";
import { print } from "./print";

/**
 * Type representing a SourceFile with the fluent API methods
 */
export type SourceFile = FileBuilder & ts.SourceFile;

/**
 * Options for creating a source file
 */
export interface SourceFileOptions {
  fileName: string;
  content: string;
  scriptTarget?: ts.ScriptTarget;
}

/**
 * Options for creating a source file from an existing SourceFile
 */
export interface SourceFileFromTsOptions {
  sourceFile: ts.SourceFile;
}

/**
 * Options for adding a class to a source file
 */
export interface ClassOptions {
  name: string;
  members?: ts.ClassElement[];
  mods?: ts.ModifierLike[];
}

/**
 * Options for adding a variable to a source file
 */
export interface VariableOptions {
  name: string;
  initializer?: ts.Expression;
  kind: "const" | "let" | "var";
}

// Re-export types from helpers
export type {
  ClassMethodInfo, ClassPropertyInfo, DecoratorInfo, ParameterInfo
};

/**
 * Builder for a TypeScript source file
 */
class FileBuilder implements BuildableAST {
  #sourceFile: ts.SourceFile;
  #statements: ts.NodeArray<ts.Statement>;

  constructor(options: SourceFileOptions | SourceFileFromTsOptions) {
    if ("sourceFile" in options) {
      // Create from existing SourceFile
      this.#sourceFile = options.sourceFile;
    } else {
      // Create a source file from content string
      this.#sourceFile = ts.createSourceFile(
        options.fileName,
        options.content,
        options.scriptTarget ?? ts.ScriptTarget.Latest,
        true, // setParentNodes
      );
    }

    // Get the statements from the source file
    this.#statements = this.#sourceFile.statements;
  }

  // Methods for adding statements
  addStatement(...statements: ts.Statement[]) {
    // Create a new source file with the added statements
    this.#sourceFile = ts.factory.updateSourceFile(
      this.#sourceFile,
      [...this.#statements, ...statements],
      this.#sourceFile.isDeclarationFile,
      this.#sourceFile.referencedFiles,
      this.#sourceFile.typeReferenceDirectives,
      this.#sourceFile.hasNoDefaultLib,
      this.#sourceFile.libReferenceDirectives,
    );

    // Update statements reference
    this.#statements = this.#sourceFile.statements;
    return this;
  }

  // Method for adding statements at the beginning
  prependStatement(...statements: ts.Statement[]) {
    // Create a new source file with the prepended statements
    this.#sourceFile = ts.factory.updateSourceFile(
      this.#sourceFile,
      [...statements, ...this.#statements],
      this.#sourceFile.isDeclarationFile,
      this.#sourceFile.referencedFiles,
      this.#sourceFile.typeReferenceDirectives,
      this.#sourceFile.hasNoDefaultLib,
      this.#sourceFile.libReferenceDirectives,
    );

    // Update statements reference
    this.#statements = this.#sourceFile.statements;
    return this;
  }

  addImport(options: ImportOptions) {
    const importDecl = imp(options);
    this.addStatement(importDecl);
    return this;
  }

  // Internal method for auto-resolved imports (added at the beginning)
  addAutoImport(options: ImportOptions) {
    const importDecl = imp(options);
    this.prependStatement(importDecl);
    return this;
  }

  addClass(options: ClassOptions) {
    const classDecl = klass(options.name, options.members, options.mods);
    this.addStatement(classDecl);
    return this;
  }

  addVariable(options: VariableOptions) {
    let variableDecl: ts.VariableStatement;
    if (options.kind === "const") {
      variableDecl = const_(options.name, options.initializer);
    } else if (options.kind === "let") {
      variableDecl = let_(options.name, options.initializer);
    } else {
      variableDecl = var_(options.name, options.initializer);
    }
    this.addStatement(variableDecl);
    return this;
  }

  getStatements(): readonly ts.Statement[] {
    return this.#statements;
  }

  getFileName(): string {
    return this.#sourceFile.fileName;
  }

  print(): string {
    return print(this.#sourceFile);
  }

  get(): ts.SourceFile {
    return this.#sourceFile;
  }
}

/**
 * Creates a new TypeScript source file with fluent API
 *
 * @param fileName The name of the source file
 * @param content Initial content (defaults to empty string)
 * @param scriptTarget The TypeScript script target (defaults to Latest)
 * @returns A fluent builder for the source file
 */
export const file = (
  fileName: string,
  content: string = "",
  scriptTarget: ts.ScriptTarget = ts.ScriptTarget.Latest,
) => {
  return buildFluentApi(FileBuilder, {
    fileName,
    content,
    scriptTarget,
  });
};

/**
 * Creates a source file from existing file content string
 *
 * @param fileName The name of the source file
 * @param content The TypeScript code content
 * @param scriptTarget The TypeScript script target (defaults to Latest)
 * @returns A fluent builder for the source file
 */
export const fileFromString = (
  fileName: string,
  content: string,
  scriptTarget: ts.ScriptTarget = ts.ScriptTarget.Latest,
) => {
  return file(fileName, content, scriptTarget);
};

/**
 * Creates a source file from an existing file path
 *
 * @param filePath The path to the TypeScript file to read
 * @param scriptTarget The TypeScript script target (defaults to Latest)
 * @returns A fluent builder for the source file
 */
export const fileFromPath = (
  filePath: string,
  scriptTarget: ts.ScriptTarget = ts.ScriptTarget.Latest,
) => {
  // Read from disk
  let content: string;
  try {
    const fs = require("fs");
    content = fs.readFileSync(filePath, "utf-8");
  } catch (error) {
    throw new Error(`Failed to read file at ${filePath}: ${error}`);
  }

  // Get the filename from the path
  const fileName = filePath.split(/[/\\]/).pop() || filePath;

  return fileFromString(fileName, content, scriptTarget);
};

/**
 * Creates a source file from an existing TypeScript SourceFile
 *
 * @param sourceFile The existing TypeScript SourceFile to wrap
 * @returns A fluent builder for the source file
 */
export const fileFromSourceFile = (sourceFile: ts.SourceFile) => {
  return buildFluentApi(FileBuilder, { sourceFile });
};
