import ts from "typescript";
import type { TriviaOptions, CommentContent } from "../helpers/trivia";
import { addComments } from "../helpers/trivia";
import { type BuildableAST, buildFluentApi } from "../utils/buildFluentApi";

class GlobalBuilder implements BuildableAST {
  #decl: ts.ModuleDeclaration;

  constructor({
    statements,
  }: {
    statements?: ts.Statement[];
  }) {
    // Create a global declaration using ModuleDeclaration
    this.#decl = ts.factory.createModuleDeclaration(
      [ts.factory.createModifier(ts.SyntaxKind.DeclareKeyword)],
      ts.factory.createIdentifier("global"),
      ts.factory.createModuleBlock(statements ?? []),
      ts.NodeFlags.GlobalAugmentation,
    );
  }

  // Add statement to global body
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
   * Add leading comment(s) to the global declaration
   * @param comment Comment content to add
   * @returns The global builder for chaining
   */
  addLeadingComment(comment: CommentContent): this {
    this.#decl = addComments(this.#decl, { leading: [comment] });
    return this;
  }

  /**
   * Add trailing comment(s) to the global declaration
   * @param comment Comment content to add
   * @returns The global builder for chaining
   */
  addTrailingComment(comment: CommentContent): this {
    this.#decl = addComments(this.#decl, { trailing: [comment] });
    return this;
  }

  /**
   * Add multiple comments to the global declaration
   * @param options Trivia options with leading and/or trailing comments
   * @returns The global builder for chaining
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
 * Create a global declaration (declare global { ... })
 * @param statements Optional statements to include in the global block
 */
export const global = (statements: ts.Statement[] = []) => 
  buildFluentApi(GlobalBuilder, { statements });