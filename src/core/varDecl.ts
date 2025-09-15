import ts from "typescript";
import type { TriviaOptions, CommentContent } from "../helpers/trivia";
import { addComments } from "../helpers/trivia";
import { type BuildableAST, buildFluentApi } from "../utils/buildFluentApi";

class VarDeclBuilder implements BuildableAST {
  #decl: ts.VariableStatement;

  constructor({
    name,
    type,
    mods,
  }: {
    name: string;
    type?: ts.TypeNode;
    mods?: ts.ModifierLike[];
  }) {
    const declaration = ts.factory.createVariableDeclaration(
      name,
      undefined, // exclamation token
      type,
      undefined, // initializer
    );
    
    const declarationList = ts.factory.createVariableDeclarationList(
      [declaration],
      ts.NodeFlags.None, // var declaration
    );
    
    this.#decl = ts.factory.createVariableStatement(mods, declarationList);
  }

  // ========== Comment Methods ==========

  /**
   * Add leading comment(s) to the variable declaration
   * @param comment Comment content to add
   * @returns The variable declaration builder for chaining
   */
  addLeadingComment(comment: CommentContent): this {
    this.#decl = addComments(this.#decl, { leading: [comment] });
    return this;
  }

  /**
   * Add trailing comment(s) to the variable declaration
   * @param comment Comment content to add
   * @returns The variable declaration builder for chaining
   */
  addTrailingComment(comment: CommentContent): this {
    this.#decl = addComments(this.#decl, { trailing: [comment] });
    return this;
  }

  /**
   * Add multiple comments to the variable declaration
   * @param options Trivia options with leading and/or trailing comments
   * @returns The variable declaration builder for chaining
   */
  addComments(options: TriviaOptions): this {
    this.#decl = addComments(this.#decl, options);
    return this;
  }

  get(): ts.VariableStatement {
    return this.#decl;
  }
}

/**
 * Create a variable declaration for use in global or namespace contexts
 * @param name The variable name
 * @param type Optional type annotation
 * @param mods Optional modifiers
 */
export const varDecl = (
  name: string,
  type?: ts.TypeNode,
  mods?: ts.ModifierLike[],
) => buildFluentApi(VarDeclBuilder, { name, type, mods });