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
import { type PostprocessOptions, print } from "./print";
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
  ClassMethodInfo,
  ClassPropertyInfo,
  DecoratorInfo,
  ParameterInfo,
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

  /**
   * Updates existing classes in the source file using a callback function
   * The callback receives a klass builder for each class and should return the modified class
   */
  updateClasses(
    updateFn: (
      classBuilder: ReturnType<typeof klass>,
    ) => ReturnType<typeof klass>,
  ) {
    const updatedStatements = this.#statements.map((statement) => {
      if (ts.isClassDeclaration(statement)) {
        // Create a klass builder for the existing class
        const classBuilder = klass(statement);
        // Apply the update function
        const updatedBuilder = updateFn(classBuilder);
        // Return the updated class declaration
        return updatedBuilder.get();
      }
      return statement;
    });

    // Update the source file with the modified statements
    this.#sourceFile = ts.factory.updateSourceFile(
      this.#sourceFile,
      updatedStatements,
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

  /**
   * Updates a specific class by name in the source file
   */
  updateClass(
    className: string,
    updateFn: (
      classBuilder: ReturnType<typeof klass>,
    ) => ReturnType<typeof klass>,
  ) {
    return this.updateClasses((classBuilder) => {
      const classDecl = classBuilder.get();
      if (classDecl.name?.text === className) {
        return updateFn(classBuilder);
      }
      return classBuilder;
    });
  }

  /**
   * Updates existing functions in the source file using a callback function
   */
  updateFunctions(
    updateFn: (statement: ts.FunctionDeclaration) => ts.FunctionDeclaration,
  ) {
    const updatedStatements = this.#statements.map((statement) => {
      if (ts.isFunctionDeclaration(statement)) {
        return updateFn(statement);
      }
      return statement;
    });

    // Update the source file with the modified statements
    this.#sourceFile = ts.factory.updateSourceFile(
      this.#sourceFile,
      updatedStatements,
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

  /**
   * Updates a specific function by name in the source file
   */
  updateFunction(
    functionName: string,
    updateFn: (statement: ts.FunctionDeclaration) => ts.FunctionDeclaration,
  ) {
    return this.updateFunctions((statement) => {
      if (statement.name?.text === functionName) {
        return updateFn(statement);
      }
      return statement;
    });
  }

  /**
   * Updates existing variable statements in the source file using a callback function
   */
  updateVariableStatements(
    updateFn: (statement: ts.VariableStatement) => ts.VariableStatement,
  ) {
    const updatedStatements = this.#statements.map((statement) => {
      if (ts.isVariableStatement(statement)) {
        return updateFn(statement);
      }
      return statement;
    });

    // Update the source file with the modified statements
    this.#sourceFile = ts.factory.updateSourceFile(
      this.#sourceFile,
      updatedStatements,
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

  /**
   * Updates a specific variable by name in the source file
   */
  updateVariable(
    variableName: string,
    updateFn: (statement: ts.VariableStatement) => ts.VariableStatement,
  ) {
    return this.updateVariableStatements((statement) => {
      // Check if this variable statement contains the variable we're looking for
      const hasVariable = statement.declarationList.declarations.some(
        (decl) => ts.isIdentifier(decl.name) && decl.name.text === variableName,
      );

      if (hasVariable) {
        return updateFn(statement);
      }
      return statement;
    });
  }

  /**
   * Updates existing interface declarations in the source file using a callback function
   */
  updateInterfaces(
    updateFn: (statement: ts.InterfaceDeclaration) => ts.InterfaceDeclaration,
  ) {
    const updatedStatements = this.#statements.map((statement) => {
      if (ts.isInterfaceDeclaration(statement)) {
        return updateFn(statement);
      }
      return statement;
    });

    // Update the source file with the modified statements
    this.#sourceFile = ts.factory.updateSourceFile(
      this.#sourceFile,
      updatedStatements,
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

  /**
   * Updates a specific interface by name in the source file
   */
  updateInterface(
    interfaceName: string,
    updateFn: (statement: ts.InterfaceDeclaration) => ts.InterfaceDeclaration,
  ) {
    return this.updateInterfaces((statement) => {
      if (statement.name.text === interfaceName) {
        return updateFn(statement);
      }
      return statement;
    });
  }

  /**
   * Updates existing type alias declarations in the source file using a callback function
   */
  updateTypeAliases(
    updateFn: (statement: ts.TypeAliasDeclaration) => ts.TypeAliasDeclaration,
  ) {
    const updatedStatements = this.#statements.map((statement) => {
      if (ts.isTypeAliasDeclaration(statement)) {
        return updateFn(statement);
      }
      return statement;
    });

    // Update the source file with the modified statements
    this.#sourceFile = ts.factory.updateSourceFile(
      this.#sourceFile,
      updatedStatements,
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

  /**
   * Updates a specific type alias by name in the source file
   */
  updateTypeAlias(
    typeName: string,
    updateFn: (statement: ts.TypeAliasDeclaration) => ts.TypeAliasDeclaration,
  ) {
    return this.updateTypeAliases((statement) => {
      if (statement.name.text === typeName) {
        return updateFn(statement);
      }
      return statement;
    });
  }

  /**
   * Updates existing enum declarations in the source file using a callback function
   */
  updateEnums(updateFn: (statement: ts.EnumDeclaration) => ts.EnumDeclaration) {
    const updatedStatements = this.#statements.map((statement) => {
      if (ts.isEnumDeclaration(statement)) {
        return updateFn(statement);
      }
      return statement;
    });

    // Update the source file with the modified statements
    this.#sourceFile = ts.factory.updateSourceFile(
      this.#sourceFile,
      updatedStatements,
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

  /**
   * Updates a specific enum by name in the source file
   */
  updateEnum(
    enumName: string,
    updateFn: (statement: ts.EnumDeclaration) => ts.EnumDeclaration,
  ) {
    return this.updateEnums((statement) => {
      if (statement.name.text === enumName) {
        return updateFn(statement);
      }
      return statement;
    });
  }

  /**
   * Updates existing import declarations in the source file using a callback function
   */
  updateImports(
    updateFn: (statement: ts.ImportDeclaration) => ts.ImportDeclaration,
  ) {
    const updatedStatements = this.#statements.map((statement) => {
      if (ts.isImportDeclaration(statement)) {
        return updateFn(statement);
      }
      return statement;
    });

    // Update the source file with the modified statements
    this.#sourceFile = ts.factory.updateSourceFile(
      this.#sourceFile,
      updatedStatements,
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

  /**
   * Updates existing export declarations in the source file using a callback function
   */
  updateExports(
    updateFn: (statement: ts.ExportDeclaration) => ts.ExportDeclaration,
  ) {
    const updatedStatements = this.#statements.map((statement) => {
      if (ts.isExportDeclaration(statement)) {
        return updateFn(statement);
      }
      return statement;
    });

    // Update the source file with the modified statements
    this.#sourceFile = ts.factory.updateSourceFile(
      this.#sourceFile,
      updatedStatements,
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

  /**
   * Generic method to update any statement type using a filter and update function
   */
  updateStatements<T extends ts.Statement>(
    filter: (statement: ts.Statement) => statement is T,
    updateFn: (statement: T) => T,
  ) {
    const updatedStatements = this.#statements.map((statement) => {
      if (filter(statement)) {
        return updateFn(statement);
      }
      return statement;
    });

    // Update the source file with the modified statements
    this.#sourceFile = ts.factory.updateSourceFile(
      this.#sourceFile,
      updatedStatements,
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

  /**
   * Prepends a comment banner to the beginning of the source file
   * @param banner The banner text (without comment markers)
   * @param style The comment style: 'block' or 'line' (default: 'block')
   */
  prependBanner(banner: string, style: "block" | "line" = "block"): this {
    let commentText: string;

    if (style === "block") {
      // Create a block comment
      commentText = `/*\n${banner
        .split("\n")
        .map((line) => ` * ${line}`)
        .join("\n")}\n */\n\n`;
    } else {
      // Create line comments
      commentText =
        banner
          .split("\n")
          .map((line) => `// ${line}`)
          .join("\n") + "\n\n";
    }

    // Get the current source text
    const currentText = this.#sourceFile.getFullText();

    // Prepend the banner to the source text
    const newText = commentText + currentText;

    // Create a new source file with the banner
    this.#sourceFile = ts.createSourceFile(
      this.#sourceFile.fileName,
      newText,
      this.#sourceFile.languageVersion,
      true, // setParentNodes
    );

    // Update statements reference
    this.#statements = this.#sourceFile.statements;
    return this;
  }

  /**
   * Prepends a unique marker comment to the source file
   * @param marker The unique identifier/marker text
   * @param description Optional description for the marker
   * @returns The FileBuilder instance for chaining
   */
  prependMarker(marker: string, description?: string): this {
    const markerText = description
      ? `Generated by ${marker}: ${description}`
      : `Generated by ${marker}`;

    const timestamp = new Date().toISOString();
    const banner = `${markerText}\nGenerated at: ${timestamp}`;

    return this.prependBanner(banner);
  }

  /**
   * Prepends a copyright notice to the source file
   * @param year The copyright year (defaults to current year)
   * @param holder The copyright holder
   * @param license Optional license information
   * @returns The FileBuilder instance for chaining
   */
  prependCopyright(
    year: number | string = new Date().getFullYear(),
    holder: string,
    license?: string,
  ): this {
    let copyrightText = `Copyright (c) ${year} ${holder}`;

    if (license) {
      copyrightText += `\nLicense: ${license}`;
    }

    return this.prependBanner(copyrightText);
  }

  getStatements(): readonly ts.Statement[] {
    return this.#statements;
  }

  getFileName(): string {
    return this.#sourceFile.fileName;
  }

  print(postprocess?: PostprocessOptions): Promise<string> {
    return print(this.#sourceFile, postprocess);
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
