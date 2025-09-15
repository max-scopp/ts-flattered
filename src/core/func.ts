import ts from "typescript";
import { type DecoratorFilterOptions, findDecorators } from "../helpers/finder";
import type { TriviaOptions, CommentContent } from "../helpers/trivia";
import { addComments } from "../helpers/trivia";
import { type BuildableAST, buildFluentApi } from "../utils/buildFluentApi";
import { fromDecorator } from "./decorator";
import { $async, $export } from "./modifier";

// Function Declaration Builder
class FunctionBuilder implements BuildableAST {
  #decl: ts.FunctionDeclaration;

  constructor({
    name,
    params,
    body,
    mods,
    typeParams,
    returnType,
  }: {
    name: string;
    params?: ts.ParameterDeclaration[];
    body?: ts.Block;
    mods?: ts.ModifierLike[];
    typeParams?: ts.TypeParameterDeclaration[];
    returnType?: ts.TypeNode;
  }) {
    this.#decl = ts.factory.createFunctionDeclaration(
      mods,
      undefined, // asterisk token
      name,
      typeParams,
      params ?? [],
      returnType,
      body,
    );
  }

  $export() {
    this.#decl = ts.factory.updateFunctionDeclaration(
      this.#decl,
      [...(this.#decl.modifiers || []), $export()],
      this.#decl.asteriskToken,
      this.#decl.name,
      this.#decl.typeParameters,
      this.#decl.parameters,
      this.#decl.type,
      this.#decl.body,
    );
    return this;
  }

  $async() {
    this.#decl = ts.factory.updateFunctionDeclaration(
      this.#decl,
      [...(this.#decl.modifiers || []), $async()],
      this.#decl.asteriskToken,
      this.#decl.name,
      this.#decl.typeParameters,
      this.#decl.parameters,
      this.#decl.type,
      this.#decl.body,
    );
    return this;
  }

  body(body: ts.Block) {
    this.#decl = ts.factory.updateFunctionDeclaration(
      this.#decl,
      this.#decl.modifiers,
      this.#decl.asteriskToken,
      this.#decl.name,
      this.#decl.typeParameters,
      this.#decl.parameters,
      this.#decl.type,
      body,
    );
    return this;
  }

  returnType(type: ts.TypeNode) {
    this.#decl = ts.factory.updateFunctionDeclaration(
      this.#decl,
      this.#decl.modifiers,
      this.#decl.asteriskToken,
      this.#decl.name,
      this.#decl.typeParameters,
      this.#decl.parameters,
      type,
      this.#decl.body,
    );
    return this;
  }

  // ========== Decorator Update Methods ==========

  /**
   * Update a decorator on the function using a callback function with a flexible find condition
   * @param findCondition Function to determine which decorator to update (returns true for the target decorator)
   * @param updateFn Function that receives the existing decorator and returns the updated one
   * @returns The updated decorator builder or undefined if not found
   */
  updateDecorator(
    findCondition: (decorator: ts.Decorator) => boolean,
    updateFn: (
      decorator: ReturnType<typeof fromDecorator>,
    ) => ReturnType<typeof fromDecorator>,
  ): ReturnType<typeof fromDecorator> | undefined {
    if (!this.#decl.modifiers) {
      return undefined;
    }

    // Find the decorator using the condition
    const decoratorModifier = this.#decl.modifiers.find((modifier) => {
      return ts.isDecorator(modifier) && findCondition(modifier);
    }) as ts.Decorator | undefined;

    if (!decoratorModifier) {
      return undefined;
    }

    // Create a decorator builder from the existing decorator
    const decoratorBuilder = fromDecorator(decoratorModifier);

    // Apply the update function
    const updatedDecorator = updateFn(decoratorBuilder);

    // Update the function with the new decorator
    const updatedModifiers = this.#decl.modifiers.map((modifier) => {
      if (modifier === decoratorModifier) {
        return updatedDecorator.get();
      }
      return modifier;
    });

    this.#decl = ts.factory.updateFunctionDeclaration(
      this.#decl,
      updatedModifiers,
      this.#decl.asteriskToken,
      this.#decl.name,
      this.#decl.typeParameters,
      this.#decl.parameters,
      this.#decl.type,
      this.#decl.body,
    );

    return updatedDecorator;
  }

  /**
   * Update decorator(s) using the same filtering options as findDecorators
   * @param options Decorator filter options (name, module, etc.)
   * @param updateFn Function that receives the existing decorator and returns the updated one
   * @returns Array of updated decorator builders
   */
  updateDecoratorsByFilter(
    options: DecoratorFilterOptions,
    updateFn: (
      decorator: ReturnType<typeof fromDecorator>,
    ) => ReturnType<typeof fromDecorator>,
  ): Array<ReturnType<typeof fromDecorator>> {
    // Use findDecorators to get matching decorators
    const foundDecorators = findDecorators(this.#decl, options);
    const updatedDecorators: Array<ReturnType<typeof fromDecorator>> = [];

    if (foundDecorators.length === 0 || !this.#decl.modifiers) {
      return updatedDecorators;
    }

    // Update each found decorator
    for (const foundDecorator of foundDecorators) {
      const decoratorBuilder = fromDecorator(foundDecorator);
      const updatedDecorator = updateFn(decoratorBuilder);
      updatedDecorators.push(updatedDecorator);

      // Update the function with the new decorator
      const updatedModifiers = this.#decl.modifiers!.map((modifier) => {
        if (modifier === foundDecorator) {
          return updatedDecorator.get();
        }
        return modifier;
      });

      this.#decl = ts.factory.updateFunctionDeclaration(
        this.#decl,
        updatedModifiers,
        this.#decl.asteriskToken,
        this.#decl.name,
        this.#decl.typeParameters,
        this.#decl.parameters,
        this.#decl.type,
        this.#decl.body,
      );
    }

    return updatedDecorators;
  }

  /**
   * Update the first decorator that matches the filter options
   * @param options Decorator filter options (name, module, etc.)
   * @param updateFn Function that receives the existing decorator and returns the updated one
   * @returns The updated decorator builder or undefined if not found
   */
  updateDecoratorByFilter(
    options: DecoratorFilterOptions,
    updateFn: (
      decorator: ReturnType<typeof fromDecorator>,
    ) => ReturnType<typeof fromDecorator>,
  ): ReturnType<typeof fromDecorator> | undefined {
    const results = this.updateDecoratorsByFilter(options, updateFn);
    return results.length > 0 ? results[0] : undefined;
  }

  /**
   * Convenience method: Update decorator by name with optional module verification
   * @param name Decorator name
   * @param sourceFile Source file for module resolution (required if module is specified)
   * @param module Optional module to verify the import (e.g., '@angular/core')
   * @param updateFn Function that receives the existing decorator and returns the updated one
   * @returns The updated decorator builder or undefined if not found
   */
  updateDecoratorVerified(
    name: string,
    sourceFile: ts.SourceFile,
    module: string | undefined,
    updateFn: (
      decorator: ReturnType<typeof fromDecorator>,
    ) => ReturnType<typeof fromDecorator>,
  ): ReturnType<typeof fromDecorator> | undefined {
    const options: DecoratorFilterOptions = {
      name,
      sourceFile,
    };
    if (module) {
      options.module = module;
    }

    return this.updateDecoratorByFilter(options, updateFn);
  }

  /**
   * Convenience method: Update decorator by name only (no module verification)
   * @param decoratorName The name of the decorator to update
   * @param updateFn Function that receives the existing decorator and returns the updated one
   * @returns The updated decorator builder or undefined if not found
   */
  updateDecoratorByName(
    decoratorName: string,
    updateFn: (
      decorator: ReturnType<typeof fromDecorator>,
    ) => ReturnType<typeof fromDecorator>,
  ): ReturnType<typeof fromDecorator> | undefined {
    return this.updateDecorator((decorator) => {
      // Extract decorator name
      let name = "";
      if (
        ts.isCallExpression(decorator.expression) &&
        ts.isIdentifier(decorator.expression.expression)
      ) {
        name = decorator.expression.expression.text;
      } else if (ts.isIdentifier(decorator.expression)) {
        name = decorator.expression.text;
      }
      return name === decoratorName;
    }, updateFn);
  }

  // ========== Comment Methods ==========

  /**
   * Add leading comment(s) to the function declaration
   * @param comment Comment content to add
   * @returns The function builder for chaining
   */
  addLeadingComment(comment: CommentContent): this {
    this.#decl = addComments(this.#decl, { leading: [comment] });
    return this;
  }

  /**
   * Add trailing comment(s) to the function declaration
   * @param comment Comment content to add
   * @returns The function builder for chaining
   */
  addTrailingComment(comment: CommentContent): this {
    this.#decl = addComments(this.#decl, { trailing: [comment] });
    return this;
  }

  /**
   * Add multiple comments to the function declaration
   * @param options Trivia options with leading and/or trailing comments
   * @returns The function builder for chaining
   */
  addComments(options: TriviaOptions): this {
    this.#decl = addComments(this.#decl, options);
    return this;
  }

  get(): ts.FunctionDeclaration {
    return this.#decl;
  }
}

// Arrow Function Builder
class ArrowFunctionBuilder implements BuildableAST {
  #expr: ts.ArrowFunction;

  constructor({
    params,
    body,
    typeParams,
    returnType,
    isAsync,
  }: {
    params?: ts.ParameterDeclaration[];
    body?: ts.ConciseBody;
    typeParams?: ts.TypeParameterDeclaration[];
    returnType?: ts.TypeNode;
    isAsync?: boolean;
  }) {
    this.#expr = ts.factory.createArrowFunction(
      isAsync
        ? [ts.factory.createModifier(ts.SyntaxKind.AsyncKeyword)]
        : undefined,
      typeParams,
      params ?? [],
      returnType,
      ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
      body ?? ts.factory.createBlock([]),
    );
  }

  $async() {
    this.#expr = ts.factory.updateArrowFunction(
      this.#expr,
      [ts.factory.createModifier(ts.SyntaxKind.AsyncKeyword)],
      this.#expr.typeParameters,
      this.#expr.parameters,
      this.#expr.type,
      this.#expr.equalsGreaterThanToken,
      this.#expr.body,
    );
    return this;
  }

  body(body: ts.ConciseBody) {
    this.#expr = ts.factory.updateArrowFunction(
      this.#expr,
      this.#expr.modifiers,
      this.#expr.typeParameters,
      this.#expr.parameters,
      this.#expr.type,
      this.#expr.equalsGreaterThanToken,
      body,
    );
    return this;
  }

  returnType(type: ts.TypeNode) {
    this.#expr = ts.factory.updateArrowFunction(
      this.#expr,
      this.#expr.modifiers,
      this.#expr.typeParameters,
      this.#expr.parameters,
      type,
      this.#expr.equalsGreaterThanToken,
      this.#expr.body,
    );
    return this;
  }

  get(): ts.ArrowFunction {
    return this.#expr;
  }
}

export const func = (
  name: string,
  params: ts.ParameterDeclaration[] = [],
  body?: ts.Block,
) => buildFluentApi(FunctionBuilder, { name, params, body });

export const arrow = (
  params: ts.ParameterDeclaration[] = [],
  body?: ts.ConciseBody,
) => buildFluentApi(ArrowFunctionBuilder, { params, body });
