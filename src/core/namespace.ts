import ts from "typescript";
import type { CommentContent, TriviaOptions } from "../helpers/trivia";
import { addComments } from "../helpers/trivia";
import { type BuildableAST, buildFluentApi } from "../utils/buildFluentApi";
import { $export } from "./modifier";

class NamespaceBuilder implements BuildableAST {
  #decl: ts.ModuleDeclaration;

  constructor({
    name,
    statements,
    mods,
    isNamespace,
  }: {
    name: string;
    statements?: ts.Statement[];
    mods?: ts.ModifierLike[];
    isNamespace?: boolean;
  }) {
    // Create namespace using ModuleDeclaration with namespace flag
    this.#decl = ts.factory.createModuleDeclaration(
      mods,
      ts.factory.createIdentifier(name),
      ts.factory.createModuleBlock(statements ?? []),
      isNamespace !== false ? ts.NodeFlags.Namespace : ts.NodeFlags.None,
    );
  }

  // Fluent modifier methods
  $export() {
    this.#decl = ts.factory.updateModuleDeclaration(
      this.#decl,
      [...(this.#decl.modifiers || []), $export()],
      this.#decl.name,
      this.#decl.body,
    );
    return this;
  }

  $mod(mod: ts.Modifier) {
    this.#decl = ts.factory.updateModuleDeclaration(
      this.#decl,
      [...(this.#decl.modifiers || []), mod],
      this.#decl.name,
      this.#decl.body,
    );
    return this;
  }

  // Add statement to namespace body
  addStatement(statement: ts.Statement) {
    const currentBody = this.#decl.body as ts.ModuleBlock;
    const updatedStatements = [...currentBody.statements, statement];

    this.#decl = ts.factory.updateModuleDeclaration(
      this.#decl,
      this.#decl.modifiers,
      this.#decl.name,
      ts.factory.updateModuleBlock(currentBody, updatedStatements),
    );
    return this;
  }

  // Add multiple statements
  addStatements(statements: ts.Statement[]) {
    const currentBody = this.#decl.body as ts.ModuleBlock;
    const updatedStatements = [...currentBody.statements, ...statements];

    this.#decl = ts.factory.updateModuleDeclaration(
      this.#decl,
      this.#decl.modifiers,
      this.#decl.name,
      ts.factory.updateModuleBlock(currentBody, updatedStatements),
    );
    return this;
  }

  // ========== Comment Methods ==========

  /**
   * Add leading comment(s) to the namespace declaration
   * @param comment Comment content to add
   * @returns The namespace builder for chaining
   */
  addLeadingComment(comment: CommentContent): this {
    this.#decl = addComments(this.#decl, { leading: [comment] });
    return this;
  }

  /**
   * Add trailing comment(s) to the namespace declaration
   * @param comment Comment content to add
   * @returns The namespace builder for chaining
   */
  addTrailingComment(comment: CommentContent): this {
    this.#decl = addComments(this.#decl, { trailing: [comment] });
    return this;
  }

  /**
   * Add multiple comments to the namespace declaration
   * @param options Trivia options with leading and/or trailing comments
   * @returns The namespace builder for chaining
   */
  addComments(options: TriviaOptions): this {
    this.#decl = addComments(this.#decl, options);
    return this;
  }

  get(): ts.ModuleDeclaration {
    return this.#decl;
  }
}

/**
 * Create a namespace declaration
 * @param name The namespace name
 * @param statements Optional statements to include in the namespace
 * @param mods Optional modifiers
 */
export const namespace = (
  name: string,
  statements: ts.Statement[] = [],
  mods?: ts.ModifierLike[],
) =>
  buildFluentApi(NamespaceBuilder, {
    name,
    statements,
    mods,
    isNamespace: true,
  });

/**
 * Create a module declaration (for ambient modules like declare module "...")
 * @param name The module name (can be string literal for ambient modules)
 * @param statements Optional statements to include in the module
 * @param mods Optional modifiers
 */
export const module = (
  name: string,
  statements: ts.Statement[] = [],
  mods?: ts.ModifierLike[],
) =>
  buildFluentApi(NamespaceBuilder, {
    name,
    statements,
    mods,
    isNamespace: false,
  });
