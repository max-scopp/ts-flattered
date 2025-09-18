import ts from "typescript";

/**
 * Provides advanced symbol resolution capabilities for TypeScript AST.
 *
 * This module allows you to analyze and resolve symbols in TypeScript code,
 * including checking where symbols are imported from and extracting type information.
 *
 * @example
 * ```ts
 * // Create a resolver from an existing TypeScript program
 * const program = ts.createProgram([filePath], compilerOptions);
 * const resolver = createSymbolResolver(program);
 *
 * // Check if a node's symbol matches specific criteria
 * const isComponentDecorator = resolver.checkSymbol(
 *   decoratorNode.expression,
 *   { fromPackage: /@angular\/core/, name: 'Component' }
 * );
 * ```
 */

/**
 * Symbol information with resolved origin and type details
 */
export interface ResolvedSymbol {
  /** The TypeScript symbol object */
  symbol: ts.Symbol;
  /** Symbol's name */
  name: string;
  /** Source file where the symbol is defined */
  sourceFile?: ts.SourceFile;
  /** Module specifier if symbol is imported from an external module */
  moduleSpecifier?: string;
  /** The declaration(s) of this symbol */
  declarations: ts.Declaration[];
  /** Type information from the type checker */
  type?: ts.Type;
  /** Whether symbol is exported from its source */
  isExported: boolean;
  /** Whether symbol is imported from a module */
  isImported: boolean;
  /** Whether symbol is local to the current file */
  isLocal: boolean;
}

/**
 * Options for creating a SymbolResolver
 */

/**
 * Options for symbol checking
 */
export interface SymbolCheckOptions {
  /** Module specifier to check if symbol is imported from */
  fromModule?: string | RegExp;
  /** Symbol name to check for */
  name?: string | RegExp;
  /** Check if symbol is from a specific package or namespace */
  fromPackage?: string | RegExp;
}

/**
 * Helper for resolving and analyzing TypeScript symbols in a source file
 */
export class SymbolResolver {
  #program: ts.Program;
  #typeChecker: ts.TypeChecker;

  /**
   * Create a new SymbolResolver
   *
   * @param program TypeScript Program instance
   */
  constructor(program: ts.Program) {
    this.#program = program;
    this.#typeChecker = program.getTypeChecker();
  }

  /**
   * Get the symbol at a specific location in a file
   *
   * @param node The AST node to get the symbol for
   * @param sourceFile Optional source file the node belongs to
   * @returns The resolved symbol information or undefined if not found
   */
  getSymbolAtNode(node: ts.Node, sourceFile?: ts.SourceFile): ResolvedSymbol | undefined {
    try {
      const symbol = this.#typeChecker.getSymbolAtLocation(node);
      if (!symbol) return undefined;

      return this.#createResolvedSymbol(symbol, sourceFile);
    } catch (error) {
      // If symbol resolution fails, return undefined to prevent crashes
      return undefined;
    }
  }

  /**
   * Check if a node's symbol matches specific criteria
   *
   * @param node The AST node to check
   * @param options Symbol matching options
   * @param sourceFile Optional source file the node belongs to
   * @returns True if the symbol matches all criteria
   */
  checkSymbol(node: ts.Node, options: SymbolCheckOptions, sourceFile?: ts.SourceFile): boolean {
    const resolvedSymbol = this.getSymbolAtNode(node, sourceFile);
    if (!resolvedSymbol) return false;

    // Check name if provided
    if (options.name) {
      const namePattern = options.name instanceof RegExp
        ? options.name
        : new RegExp(`^${options.name}$`);

      if (!namePattern.test(resolvedSymbol.name)) {
        return false;
      }
    }

    // Check module specifier if provided
    if (options.fromModule && resolvedSymbol.moduleSpecifier) {
      const modulePattern = options.fromModule instanceof RegExp
        ? options.fromModule
        : new RegExp(`^${options.fromModule}$`);

      if (!modulePattern.test(resolvedSymbol.moduleSpecifier)) {
        return false;
      }
    }

    // Check package if provided
    if (options.fromPackage && resolvedSymbol.moduleSpecifier) {
      const packagePattern = options.fromPackage instanceof RegExp
        ? options.fromPackage
        : new RegExp(options.fromPackage);

      if (!packagePattern.test(resolvedSymbol.moduleSpecifier)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Find all nodes in a file with symbols matching specific criteria
   *
   * @param sourceFile The source file to search in
   * @param options Symbol matching options
   * @returns Array of matching nodes
   */
  findNodesWithSymbol<T extends ts.Node>(
    sourceFile: ts.SourceFile,
    options: SymbolCheckOptions,
    nodeTypeGuard?: (node: ts.Node) => node is T
  ): T[] {
    const matches: T[] = [];

    const visit = (node: ts.Node) => {
      // Check if this node has a matching symbol
      if (this.checkSymbol(node, options, sourceFile)) {
        if (!nodeTypeGuard || nodeTypeGuard(node)) {
          matches.push(node as T);
        }
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
    return matches;
  }

  /**
   * Resolve what a decorator is referring to by getting its symbol
   *
   * @param decorator The decorator node to analyze
   * @param sourceFile Source file containing the decorator
   * @returns Resolved symbol information
   */
  resolveDecorator(decorator: ts.Decorator, sourceFile?: ts.SourceFile): ResolvedSymbol | undefined {
    // Get the decorator expression (e.g., Component or Component(...))
    let expression = decorator.expression;

    // If it's a call expression (Component(...)), get the expression being called
    if (ts.isCallExpression(expression)) {
      expression = expression.expression;
    }

    return this.getSymbolAtNode(expression, sourceFile);
  }

  /**
   * Find all decorators in a file matching specific criteria
   *
   * @param sourceFile The source file to search in
   * @param options Symbol matching options for the decorators
   * @returns Array of matching decorators
   */
  findDecorators(sourceFile: ts.SourceFile, options: SymbolCheckOptions): ts.Decorator[] {
    return this.findNodesWithSymbol(
      sourceFile,
      options,
      (node): node is ts.Decorator => ts.isDecorator(node)
    );
  }

  /**
   * Check if an import comes from a specific module
   *
   * @param importSpecifier The import specifier node
   * @param modulePattern Module name pattern to check
   * @param sourceFile Source file containing the import
   * @returns True if the import matches the pattern
   */
  isImportedFrom(
    importSpecifier: ts.ImportSpecifier,
    modulePattern: string | RegExp
  ): boolean {
    // Find the parent import declaration
    let current: ts.Node = importSpecifier;
    let importDecl: ts.ImportDeclaration | undefined;

    while (current?.parent) {
      if (ts.isImportDeclaration(current)) {
        importDecl = current;
        break;
      }
      current = current.parent;
    }

    if (!importDecl || !ts.isStringLiteral(importDecl.moduleSpecifier)) {
      return false;
    }

    const pattern = modulePattern instanceof RegExp
      ? modulePattern
      : new RegExp(`^${modulePattern}$`);

    return pattern.test(importDecl.moduleSpecifier.text);
  }

  /**
   * Get the type checker used by this resolver
   *
   * @returns The TypeScript type checker
   */
  getTypeChecker(): ts.TypeChecker {
    return this.#typeChecker;
  }

  /**
   * Get the TypeScript program used by this resolver
   *
   * @returns The TypeScript program
   */
  getProgram(): ts.Program {
    return this.#program;
  }

  /**
   * Create a detailed resolved symbol object from a TypeScript symbol
   */
  #createResolvedSymbol(symbol: ts.Symbol, sourceFile?: ts.SourceFile): ResolvedSymbol {
    // Get aliased symbol if this is an import
    const aliasedSymbol = symbol.flags & ts.SymbolFlags.Alias
      ? this.#typeChecker.getAliasedSymbol(symbol)
      : symbol;

    // Get declarations
    const declarations = aliasedSymbol.declarations || [];

    // Find the source file where the symbol is defined
    let declarationSourceFile: ts.SourceFile | undefined;
    if (declarations.length > 0 && declarations[0]) {
      declarationSourceFile = declarations[0].getSourceFile();
    }

    // Try to determine if this is an imported symbol
    let moduleSpecifier: string | undefined;
    let isImported = false;

    if (symbol !== aliasedSymbol && declarations.length > 0) {
      // This is an imported symbol
      isImported = true;

      // Try to get the module specifier
      const declaration = declarations[0];
      let importDecl: ts.ImportDeclaration | undefined;

      // Walk up the AST to find the import declaration
      let current: ts.Node | undefined = declaration;
      while (current && !importDecl) {
        if (ts.isImportDeclaration(current)) {
          importDecl = current;
        }
        current = current.parent;
      }

      if (importDecl && ts.isStringLiteral(importDecl.moduleSpecifier)) {
        moduleSpecifier = importDecl.moduleSpecifier.text;
      }
    }

    // Get type information
    let type: ts.Type | undefined;

    if (declarations.length > 0 && declarations[0]) {
      type = this.#typeChecker.getTypeOfSymbolAtLocation(
        aliasedSymbol,
        declarations[0]
      );
    } else if (sourceFile) {
      type = this.#typeChecker.getTypeOfSymbolAtLocation(
        aliasedSymbol,
        sourceFile
      );
    }

    return {
      symbol: aliasedSymbol,
      name: aliasedSymbol.getName(),
      sourceFile: declarationSourceFile,
      moduleSpecifier,
      declarations,
      type,
      isExported: !!(aliasedSymbol.flags & ts.SymbolFlags.ExportValue),
      isImported,
      isLocal: !isImported && declarationSourceFile === sourceFile
    };
  }
}

/**
 * Import the ProgramOptions interface and program creation methods from program.ts instead
 */

/**
 * Factory function to create a SymbolResolver from a program
 *
 * @param program TypeScript Program instance
 * @returns A new SymbolResolver instance
 */
export function symbolResolver(program: ts.Program): SymbolResolver {
  return new SymbolResolver(program);
}
