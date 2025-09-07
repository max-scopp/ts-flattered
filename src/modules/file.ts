import type ts from "typescript";
import { klass } from "../core/klass";
import { const_, let_, var_ } from "../core/variable";
import { type ImportOptions, imp } from "./imp";
import { print } from "./print";

/**
 * A TypeScript source file representation
 */
export class SourceFile {
  private statements: ts.Statement[] = [];

  constructor(readonly fileName: string) {}

  addStatement(...statements: ts.Statement[]): void {
    this.statements.push(...statements);
  }

  addImport(options: ImportOptions): ts.ImportDeclaration {
    const importDecl = imp(options);
    this.addStatement(importDecl);
    return importDecl;
  }

  // Internal method for auto-resolved imports (added at the beginning)
  addAutoImport(options: ImportOptions): ts.ImportDeclaration {
    const importDecl = imp(options);
    this.statements.unshift(importDecl); // Add at beginning
    return importDecl;
  }

  addClass(options: ClassOptions): ts.ClassDeclaration {
    const classDecl = klass(options.name, options.members, options.mods);
    this.addStatement(classDecl);
    return classDecl;
  }

  addVariable(options: VariableOptions): ts.VariableStatement {
    let variableDecl: ts.VariableStatement;
    if (options.kind === "const") {
      variableDecl = const_(options.name, options.initializer);
    } else if (options.kind === "let") {
      variableDecl = let_(options.name, options.initializer);
    } else {
      variableDecl = var_(options.name, options.initializer);
    }
    this.addStatement(variableDecl);
    return variableDecl;
  }

  getStatements(): readonly ts.Statement[] {
    return this.statements;
  }

  print(): string {
    return print(...this.statements);
  }
}

// Type definitions
export interface ClassOptions {
  name: string;
  members?: ts.ClassElement[];
  mods?: ts.ModifierLike[];
}

export interface VariableOptions {
  name: string;
  initializer?: ts.Expression;
  kind: "const" | "let" | "var";
}
