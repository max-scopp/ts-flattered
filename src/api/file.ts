import type ts from "typescript";
import { type ClassOptions, cls } from "../cls";
import { type ImportOptions, imp } from "../imp";
import { print } from "../print";
import { type VariableOptions, variable } from "../variable";

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
    const classDecl = cls(options);
    this.addStatement(classDecl);
    return classDecl;
  }

  addVariable(options: VariableOptions): ts.VariableStatement {
    const variableDecl = variable(options);
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
