import ts from "typescript";
import { type BuildableAST, buildFluentApi } from "../utils/buildFluentApi";
import { $export } from "./modifier";

// Variable Declaration Builder
class VariableDeclarationBuilder implements BuildableAST {
  #stmt: ts.VariableStatement;

  constructor({
    name,
    initializer,
    kind,
    type,
    mods,
  }: {
    name: string;
    initializer?: ts.Expression;
    kind: ts.NodeFlags;
    type?: ts.TypeNode;
    mods?: ts.ModifierLike[];
  }) {
    const declaration = ts.factory.createVariableDeclaration(
      name,
      undefined, // exclamation token
      type,
      initializer,
    );
    const declarationList = ts.factory.createVariableDeclarationList(
      [declaration],
      kind,
    );
    this.#stmt = ts.factory.createVariableStatement(mods, declarationList);
  }

  $export() {
    this.#stmt = ts.factory.updateVariableStatement(
      this.#stmt,
      [...(this.#stmt.modifiers || []), $export()],
      this.#stmt.declarationList,
    );
    return this;
  }

  $type(type: ts.TypeNode) {
    const currentDecl = this.#stmt.declarationList.declarations[0];
    if (!currentDecl) return this;
    const newDecl = ts.factory.updateVariableDeclaration(
      currentDecl,
      currentDecl.name,
      currentDecl.exclamationToken,
      type,
      currentDecl.initializer,
    );
    const newList = ts.factory.updateVariableDeclarationList(
      this.#stmt.declarationList,
      [newDecl],
    );
    this.#stmt = ts.factory.updateVariableStatement(
      this.#stmt,
      this.#stmt.modifiers,
      newList,
    );
    return this;
  }

  $init(initializer: ts.Expression) {
    const currentDecl = this.#stmt.declarationList.declarations[0];
    if (!currentDecl) return this;
    const newDecl = ts.factory.updateVariableDeclaration(
      currentDecl,
      currentDecl.name,
      currentDecl.exclamationToken,
      currentDecl.type,
      initializer,
    );
    const newList = ts.factory.updateVariableDeclarationList(
      this.#stmt.declarationList,
      [newDecl],
    );
    this.#stmt = ts.factory.updateVariableStatement(
      this.#stmt,
      this.#stmt.modifiers,
      newList,
    );
    return this;
  }

  get(): ts.VariableStatement {
    return this.#stmt;
  }
}

export const const_ = (name: string, initializer?: ts.Expression) =>
  buildFluentApi(VariableDeclarationBuilder, {
    name,
    initializer,
    kind: ts.NodeFlags.Const,
  });

export const let_ = (name: string, initializer?: ts.Expression) =>
  buildFluentApi(VariableDeclarationBuilder, {
    name,
    initializer,
    kind: ts.NodeFlags.Let,
  });

export const var_ = (name: string, initializer?: ts.Expression) =>
  buildFluentApi(VariableDeclarationBuilder, {
    name,
    initializer,
    kind: ts.NodeFlags.None,
  });
