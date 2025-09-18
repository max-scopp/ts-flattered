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
import { type ImportOptions, imp, mergeImportDeclarations, extractImportOptions } from "./imp";
import { type PostprocessOptions, print } from "./print";
import { calculateNewImportPath, isRelativeImport, getImportModuleSpecifier } from "./pathUtils";
import type { SourceFileRegistry } from "./registry";

// Re-export SourceFileRegistry for convenience
export { SourceFileRegistry } from "./registry";
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
  registry?: SourceFileRegistry;
  autoRegister?: boolean;
}

/**
 * Options for creating a source file from an existing SourceFile
 */
export interface SourceFileFromTsOptions {
  sourceFile: ts.SourceFile;
  registry?: SourceFileRegistry;
  autoRegister?: boolean;
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
  #registry?: SourceFileRegistry;
  #originalPath?: string; // Track original file path for import rewriting

  constructor(options: SourceFileOptions | SourceFileFromTsOptions) {
    if ("sourceFile" in options) {
      // Create from existing SourceFile
      this.#sourceFile = options.sourceFile;
      this.#originalPath = options.sourceFile.fileName;
    } else {
      // Create a source file from content string
      this.#sourceFile = ts.createSourceFile(
        options.fileName,
        options.content,
        options.scriptTarget ?? ts.ScriptTarget.Latest,
        true, // setParentNodes
      );
      this.#originalPath = options.fileName;
    }

    // Get the statements from the source file
    this.#statements = this.#sourceFile.statements;

    // Store registry reference and auto-register if requested
    this.#registry = options.registry;
    if (options.autoRegister && this.#registry) {
      this.#registry.register(this as any, this.#originalPath);
    }
  }

  /**
   * Private helper to safely update the source file while preserving all properties
   */
  private updateSourceFile(newStatements: ts.Statement[]): void {
    try {
      // Create a new source file with preserved properties
      this.#sourceFile = ts.factory.updateSourceFile(
        this.#sourceFile,
        newStatements,
        this.#sourceFile.isDeclarationFile ?? false,
        this.#sourceFile.referencedFiles ?? [],
        this.#sourceFile.typeReferenceDirectives ?? [],
        this.#sourceFile.hasNoDefaultLib ?? false,
        this.#sourceFile.libReferenceDirectives ?? [],
      );

      // Ensure the updated source file has all required properties
      if (!this.#sourceFile.fileName) {
        (this.#sourceFile as any).fileName = this.#originalPath || "";
      }

      // Update statements reference
      this.#statements = this.#sourceFile.statements;
    } catch (error) {
      console.error("Error updating source file:", error);
      // Fallback: recreate the source file from scratch
      const content = ts.createPrinter().printFile(this.#sourceFile);
      this.#sourceFile = ts.createSourceFile(
        this.#sourceFile.fileName || this.#originalPath || "",
        content,
        this.#sourceFile.languageVersion ?? ts.ScriptTarget.Latest,
        true // setParentNodes
      );
      this.#statements = this.#sourceFile.statements;
    }
  }

  // Methods for adding statements
  addStatement(...statements: (ts.Statement | string)[]) {
    // Convert strings to proper AST nodes
    const astStatements = statements.map(stmt => {
      if (typeof stmt === 'string') {
        return this.createStatementFromString(stmt);
      }
      return stmt;
    });

    // Create a new source file with the added statements
    this.updateSourceFile([...this.#statements, ...astStatements]);

    return this;
  }

  // Method for adding statements at the beginning
  prependStatement(...statements: (ts.Statement | string)[]) {
    // Convert strings to proper AST nodes
    const astStatements = statements.map(stmt => {
      if (typeof stmt === 'string') {
        return this.createStatementFromString(stmt);
      }
      return stmt;
    });

    // Create a new source file with the prepended statements
    this.updateSourceFile([...astStatements, ...this.#statements]);

    return this;
  }

  /**
   * Create a proper TypeScript AST statement from a string
   */
  private createStatementFromString(code: string): ts.Statement {
    try {
      // Create a temporary source file to parse the statement
      const tempSourceFile = ts.createSourceFile(
        'temp.ts',
        code,
        ts.ScriptTarget.Latest,
        true
      );

      // Extract the first statement from the temporary source file
      if (tempSourceFile.statements.length > 0) {
        const statement = tempSourceFile.statements[0];

        // Ensure the statement has proper AST structure
        if (statement && statement.kind !== undefined) {
          return statement;
        }
      }

      // Fallback: create an expression statement from the string
      // This handles simple expressions like "export const foo = 'bar';"
      return ts.factory.createExpressionStatement(
        ts.factory.createIdentifier('/* Failed to parse: ' + code.replace(/\*\//g, '') + ' */')
      );
    } catch (error) {
      console.error('Error creating statement from string:', error);
      // Create a comment statement as fallback
      return ts.factory.createExpressionStatement(
        ts.factory.createIdentifier('/* Error parsing: ' + code.replace(/\*\//g, '') + ' */')
      );
    }
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
    this.updateSourceFile(updatedStatements);

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
    this.updateSourceFile(updatedStatements);

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
    this.updateSourceFile(updatedStatements);

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
    this.updateSourceFile(updatedStatements);

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
    this.updateSourceFile(updatedStatements);

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
    this.updateSourceFile(updatedStatements);

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
    this.updateSourceFile(updatedStatements);

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
    this.updateSourceFile(updatedStatements);

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
    this.updateSourceFile(updatedStatements);

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

  // ========== Async Method Variants ==========

  /**
   * Async version of updateClasses - allows async callback functions
   */
  async updateClassesAsync(
    updateFn: (
      classBuilder: ReturnType<typeof klass>,
    ) => Promise<ReturnType<typeof klass>>,
  ) {
    const updatedStatements = await Promise.all(
      this.#statements.map(async (statement) => {
        if (ts.isClassDeclaration(statement)) {
          // Create a klass builder for the existing class
          const classBuilder = klass(statement);
          // Apply the update function asynchronously
          const updatedBuilder = await updateFn(classBuilder);
          // Return the updated class declaration
          return updatedBuilder.get();
        }
        return statement;
      })
    );

    // Update the source file with the modified statements
    this.updateSourceFile(updatedStatements);

    // Update statements reference
    this.#statements = this.#sourceFile.statements;
    return this;
  }

  /**
   * Async version of updateClass - allows async callback functions
   */
  async updateClassAsync(
    className: string,
    updateFn: (
      classBuilder: ReturnType<typeof klass>,
    ) => Promise<ReturnType<typeof klass>>,
  ) {
    return this.updateClassesAsync(async (classBuilder) => {
      const classDecl = classBuilder.get();
      if (classDecl.name?.text === className) {
        return await updateFn(classBuilder);
      }
      return classBuilder;
    });
  }

  /**
   * Async version of updateFunctions - allows async callback functions
   */
  async updateFunctionsAsync(
    updateFn: (statement: ts.FunctionDeclaration) => Promise<ts.FunctionDeclaration>,
  ) {
    const updatedStatements = await Promise.all(
      this.#statements.map(async (statement) => {
        if (ts.isFunctionDeclaration(statement)) {
          return await updateFn(statement);
        }
        return statement;
      })
    );

    // Update the source file with the modified statements
    this.updateSourceFile(updatedStatements);

    // Update statements reference
    this.#statements = this.#sourceFile.statements;
    return this;
  }

  /**
   * Async version of updateFunction - allows async callback functions
   */
  async updateFunctionAsync(
    functionName: string,
    updateFn: (statement: ts.FunctionDeclaration) => Promise<ts.FunctionDeclaration>,
  ) {
    return this.updateFunctionsAsync(async (statement) => {
      if (statement.name?.text === functionName) {
        return await updateFn(statement);
      }
      return statement;
    });
  }

  /**
   * Async version of updateVariableStatements - allows async callback functions
   */
  async updateVariableStatementsAsync(
    updateFn: (statement: ts.VariableStatement) => Promise<ts.VariableStatement>,
  ) {
    const updatedStatements = await Promise.all(
      this.#statements.map(async (statement) => {
        if (ts.isVariableStatement(statement)) {
          return await updateFn(statement);
        }
        return statement;
      }),
    );

    // Update the source file with the modified statements
    this.updateSourceFile(updatedStatements);

    // Update statements reference
    this.#statements = this.#sourceFile.statements;
    return this;
  }

  /**
   * Async version of updateVariable - allows async callback functions
   */
  async updateVariableAsync(
    variableName: string,
    updateFn: (statement: ts.VariableStatement) => Promise<ts.VariableStatement>,
  ) {
    return this.updateVariableStatementsAsync(async (statement) => {
      // Check if this variable statement declares the target variable
      const declaresVariable = statement.declarationList.declarations.some(
        (declaration) =>
          ts.isIdentifier(declaration.name) && declaration.name.text === variableName,
      );
      if (declaresVariable) {
        return await updateFn(statement);
      }
      return statement;
    });
  }

  /**
   * Async version of updateInterfaces - allows async callback functions
   */
  async updateInterfacesAsync(
    updateFn: (statement: ts.InterfaceDeclaration) => Promise<ts.InterfaceDeclaration>,
  ) {
    const updatedStatements = await Promise.all(
      this.#statements.map(async (statement) => {
        if (ts.isInterfaceDeclaration(statement)) {
          return await updateFn(statement);
        }
        return statement;
      }),
    );

    // Update the source file with the modified statements
    this.updateSourceFile(updatedStatements);

    // Update statements reference
    this.#statements = this.#sourceFile.statements;
    return this;
  }

  /**
   * Async version of updateInterface - allows async callback functions
   */
  async updateInterfaceAsync(
    interfaceName: string,
    updateFn: (statement: ts.InterfaceDeclaration) => Promise<ts.InterfaceDeclaration>,
  ) {
    return this.updateInterfacesAsync(async (statement) => {
      if (statement.name.text === interfaceName) {
        return await updateFn(statement);
      }
      return statement;
    });
  }

  /**
   * Async version of updateTypeAliases - allows async callback functions
   */
  async updateTypeAliasesAsync(
    updateFn: (statement: ts.TypeAliasDeclaration) => Promise<ts.TypeAliasDeclaration>,
  ) {
    const updatedStatements = await Promise.all(
      this.#statements.map(async (statement) => {
        if (ts.isTypeAliasDeclaration(statement)) {
          return await updateFn(statement);
        }
        return statement;
      }),
    );

    // Update the source file with the modified statements
    this.updateSourceFile(updatedStatements);

    // Update statements reference
    this.#statements = this.#sourceFile.statements;
    return this;
  }

  /**
   * Async version of updateTypeAlias - allows async callback functions
   */
  async updateTypeAliasAsync(
    aliasName: string,
    updateFn: (statement: ts.TypeAliasDeclaration) => Promise<ts.TypeAliasDeclaration>,
  ) {
    return this.updateTypeAliasesAsync(async (statement) => {
      if (statement.name.text === aliasName) {
        return await updateFn(statement);
      }
      return statement;
    });
  }

  /**
   * Async version of updateEnums - allows async callback functions
   */
  async updateEnumsAsync(
    updateFn: (statement: ts.EnumDeclaration) => Promise<ts.EnumDeclaration>,
  ) {
    const updatedStatements = await Promise.all(
      this.#statements.map(async (statement) => {
        if (ts.isEnumDeclaration(statement)) {
          return await updateFn(statement);
        }
        return statement;
      }),
    );

    // Update the source file with the modified statements
    this.updateSourceFile(updatedStatements);

    // Update statements reference
    this.#statements = this.#sourceFile.statements;
    return this;
  }

  /**
   * Async version of updateEnum - allows async callback functions
   */
  async updateEnumAsync(
    enumName: string,
    updateFn: (statement: ts.EnumDeclaration) => Promise<ts.EnumDeclaration>,
  ) {
    return this.updateEnumsAsync(async (statement) => {
      if (statement.name.text === enumName) {
        return await updateFn(statement);
      }
      return statement;
    });
  }

  /**
   * Async version of updateImports - allows async callback functions
   */
  async updateImportsAsync(
    updateFn: (statement: ts.ImportDeclaration) => Promise<ts.ImportDeclaration>,
  ) {
    const updatedStatements = await Promise.all(
      this.#statements.map(async (statement) => {
        if (ts.isImportDeclaration(statement)) {
          return await updateFn(statement);
        }
        return statement;
      }),
    );

    // Update the source file with the modified statements
    this.updateSourceFile(updatedStatements);

    // Update statements reference
    this.#statements = this.#sourceFile.statements;
    return this;
  }

  /**
   * Async version of updateExports - allows async callback functions
   */
  async updateExportsAsync(
    updateFn: (statement: ts.ExportDeclaration) => Promise<ts.ExportDeclaration>,
  ) {
    const updatedStatements = await Promise.all(
      this.#statements.map(async (statement) => {
        if (ts.isExportDeclaration(statement)) {
          return await updateFn(statement);
        }
        return statement;
      }),
    );

    // Update the source file with the modified statements
    this.updateSourceFile(updatedStatements);

    // Update statements reference
    this.#statements = this.#sourceFile.statements;
    return this;
  }

  /**
   * Rewrite relative imports when moving file from one directory to another
   * @param fromDir The original directory path
   * @param toDir The target directory path
   */
  rewriteRelativeImports(fromDir: string, toDir: string): this {
    const originalFileName = this.#originalPath || this.#sourceFile.fileName;

    // Calculate the original full path and new full path
    const fileName = originalFileName.split(/[\/\\]/).pop() || originalFileName;
    const originalPath = `${fromDir}/${fileName}`.replace(/[\/\\]+/g, "/");
    const newPath = `${toDir}/${fileName}`.replace(/[\/\\]+/g, "/");

    return this.rewriteRelativeImportsFullPath(originalPath, newPath);
  }

  /**
   * Rewrite relative imports when moving file from one full path to another
   * @param fromPath The original file path
   * @param toPath The target file path
   */
  rewriteRelativeImportsFullPath(fromPath: string, toPath: string): this {
    this.updateImports((importDecl) => {
      const moduleSpecifier = getImportModuleSpecifier(importDecl);

      if (isRelativeImport(moduleSpecifier)) {
        const newModuleSpecifier = calculateNewImportPath(moduleSpecifier, fromPath, toPath);

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

    // Update the tracked original path
    this.#originalPath = toPath;

    // Update registry if present
    if (this.#registry) {
      this.#registry.updateFilePath(this.#sourceFile.fileName, toPath);
    }

    return this;
  }

  /**
   * Add or update an import in the source file
   * If an import from the same module already exists, it will be merged
   * @param options Import configuration
   * @param position Position to insert the import ('start' | 'end' | number)
   */
  addOrUpdateImport(options: ImportOptions, position: 'start' | 'end' | number = 'start'): this {
    // Check if import from this module already exists
    const existingImportIndex = this.#statements.findIndex((stmt) => {
      if (ts.isImportDeclaration(stmt)) {
        const moduleSpecifier = getImportModuleSpecifier(stmt);
        return moduleSpecifier === options.moduleSpecifier;
      }
      return false;
    });

    if (existingImportIndex !== -1) {
      // Update existing import
      const existingImport = this.#statements[existingImportIndex] as ts.ImportDeclaration;
      const updatedImport = mergeImportDeclarations(existingImport, options);

      const newStatements = [...this.#statements];
      newStatements[existingImportIndex] = updatedImport;

      this.updateSourceFile(newStatements);
    } else {
      // Add new import
      const newImport = imp(options).get();

      if (position === 'start') {
        this.prependStatement(newImport);
      } else if (position === 'end') {
        this.addStatement(newImport);
      } else {
        // Insert at specific position
        const newStatements = [...this.#statements];
        newStatements.splice(position, 0, newImport);

        this.updateSourceFile(newStatements);
      }
    }

    // Update statements reference
    this.#statements = this.#sourceFile.statements;
    return this;
  }

  /**
   * Remove an import by module specifier
   * @param moduleSpecifier The module to remove imports for
   */
  removeImport(moduleSpecifier: string): this {
    const newStatements = this.#statements.filter((stmt) => {
      if (ts.isImportDeclaration(stmt)) {
        const stmtModuleSpecifier = getImportModuleSpecifier(stmt);
        return stmtModuleSpecifier !== moduleSpecifier;
      }
      return true;
    });

    this.updateSourceFile(newStatements);

    this.#statements = this.#sourceFile.statements;
    return this;
  }

  /**
   * Remove specific named imports from a module
   * @param moduleSpecifier The module to remove imports from
   * @param namedImports Array of named import names to remove
   */
  removeNamedImports(moduleSpecifier: string, namedImports: string[]): this {
    const newStatements = this.#statements.map((stmt) => {
      if (ts.isImportDeclaration(stmt)) {
        const stmtModuleSpecifier = getImportModuleSpecifier(stmt);

        if (stmtModuleSpecifier === moduleSpecifier && stmt.importClause?.namedBindings) {
          const namedBindings = stmt.importClause.namedBindings;

          if (ts.isNamedImports(namedBindings)) {
            // Filter out the specified named imports
            const remainingElements = namedBindings.elements.filter(
              (element) => !namedImports.includes(element.name.text)
            );

            // If no elements remain and no default import, remove the entire import
            if (remainingElements.length === 0 && !stmt.importClause.name) {
              return null; // Mark for removal
            }

            // Update with remaining elements
            const updatedNamedBindings = ts.factory.updateNamedImports(
              namedBindings,
              remainingElements
            );

            const updatedClause = ts.factory.updateImportClause(
              stmt.importClause,
              stmt.importClause.isTypeOnly,
              stmt.importClause.name,
              updatedNamedBindings
            );

            return ts.factory.updateImportDeclaration(
              stmt,
              stmt.modifiers,
              updatedClause,
              stmt.moduleSpecifier,
              stmt.attributes,
            );
          }
        }
      }

      return stmt;
    }).filter((stmt): stmt is ts.Statement => stmt !== null);

    this.updateSourceFile(newStatements);

    this.#statements = this.#sourceFile.statements;
    return this;
  }

  /**
   * Get the registry associated with this file
   */
  getRegistry(): SourceFileRegistry | undefined {
    return this.#registry;
  }

  /**
   * Set or update the registry for this file
   */
  setRegistry(registry: SourceFileRegistry, autoRegister: boolean = true): this {
    this.#registry = registry;
    if (autoRegister) {
      registry.register(this as any, this.#originalPath);
    }
    return this;
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
 * @param scriptTargetOrOptions The TypeScript script target or full options object
 * @returns A fluent builder for the source file
 */
export function file(
  fileName: string,
  content?: string,
  scriptTargetOrOptions?: ts.ScriptTarget | { registry?: SourceFileRegistry; autoRegister?: boolean; scriptTarget?: ts.ScriptTarget }
): FileBuilder & ts.SourceFile;
export function file(
  options: SourceFileOptions
): FileBuilder & ts.SourceFile;
export function file(
  fileNameOrOptions: string | SourceFileOptions,
  content: string = "",
  scriptTargetOrOptions: ts.ScriptTarget | { registry?: SourceFileRegistry; autoRegister?: boolean; scriptTarget?: ts.ScriptTarget } = ts.ScriptTarget.Latest,
) {
  if (typeof fileNameOrOptions === 'string') {
    // Legacy signature: file(fileName, content?, scriptTarget?)
    const options: SourceFileOptions = {
      fileName: fileNameOrOptions,
      content,
      scriptTarget: typeof scriptTargetOrOptions === 'number'
        ? scriptTargetOrOptions
        : scriptTargetOrOptions?.scriptTarget ?? ts.ScriptTarget.Latest,
      registry: typeof scriptTargetOrOptions === 'object' ? scriptTargetOrOptions.registry : undefined,
      autoRegister: typeof scriptTargetOrOptions === 'object' ? scriptTargetOrOptions.autoRegister : undefined,
    };

    return buildFluentApi(FileBuilder, options);
  } else {
    // New signature: file(options)
    return buildFluentApi(FileBuilder, fileNameOrOptions);
  }
}

/**
 * Creates a source file from existing file content string
 *
 * @param fileName The name of the source file
 * @param content The TypeScript code content
 * @param scriptTarget The TypeScript script target (defaults to Latest)
 * @param registry Optional registry for auto-registration
 * @param autoRegister Whether to auto-register with the registry
 * @returns A fluent builder for the source file
 */
export const fileFromString = (
  fileName: string,
  content: string,
  scriptTarget: ts.ScriptTarget = ts.ScriptTarget.Latest,
  registry?: SourceFileRegistry,
  autoRegister: boolean = true,
) => {
  return file({
    fileName,
    content,
    scriptTarget,
    registry,
    autoRegister: registry ? autoRegister : false,
  });
};

/**
 * Creates a source file from an existing file path
 *
 * @param filePath The path to the TypeScript file to read
 * @param scriptTarget The TypeScript script target (defaults to Latest)
 * @param registry Optional registry for auto-registration
 * @param autoRegister Whether to auto-register with the registry
 * @returns A fluent builder for the source file
 */
export const fileFromPath = (
  filePath: string,
  scriptTarget: ts.ScriptTarget = ts.ScriptTarget.Latest,
  registry?: SourceFileRegistry,
  autoRegister: boolean = true,
) => {
  // Read from disk
  let content: string;
  try {
    const fs = require("fs");
    content = fs.readFileSync(filePath, "utf-8");
  } catch (error) {
    throw new Error(`Failed to read file at ${filePath}: ${error}`);
  }

  // Use the full filePath as fileName for better tracking
  return fileFromString(filePath, content, scriptTarget, registry, autoRegister);
};

/**
 * Creates a source file from an existing TypeScript SourceFile
 *
 * @param sourceFile The existing TypeScript SourceFile to wrap
 * @param registry Optional registry for auto-registration
 * @param autoRegister Whether to auto-register with the registry
 * @returns A fluent builder for the source file
 */
export const fileFromSourceFile = (
  sourceFile: ts.SourceFile,
  registry?: SourceFileRegistry,
  autoRegister: boolean = true,
) => {
  return buildFluentApi(FileBuilder, {
    sourceFile,
    registry,
    autoRegister: registry ? autoRegister : false,
  });
};
