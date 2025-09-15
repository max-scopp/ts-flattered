import ts from "typescript";
import { type DecoratorFilterOptions, findDecorators } from "../helpers/finder";
import type { CommentContent, TriviaOptions } from "../helpers/trivia";
import { addComments } from "../helpers/trivia";
import { type BuildableAST, buildFluentApi } from "../utils/buildFluentApi";
import { fromDecorator } from "./decorator";
import { $async, $private, $protected, $public, $static } from "./modifier";
import { param } from "./params";

class MethodBuilder implements BuildableAST {
  #decl: ts.MethodDeclaration;

  constructor({
    name,
    args,
    body,
    mods,
    typeParams,
    returnType,
  }: {
    name: string;
    args: ts.ParameterDeclaration[];
    body: ts.Block;
    mods?: ts.ModifierLike[];
    typeParams?: ts.TypeParameterDeclaration[];
    returnType?: ts.TypeNode;
  }) {
    this.#decl = ts.factory.createMethodDeclaration(
      mods,
      undefined, // asterisk token
      name,
      undefined, // question token
      typeParams,
      args,
      returnType,
      body,
    );
  }

  // Fluent modifier methods
  $private() {
    this.#decl = ts.factory.updateMethodDeclaration(
      this.#decl,
      [...(this.#decl.modifiers || []), $private()],
      this.#decl.asteriskToken,
      this.#decl.name,
      this.#decl.questionToken,
      this.#decl.typeParameters,
      this.#decl.parameters,
      this.#decl.type,
      this.#decl.body,
    );
    return this;
  }

  $protected() {
    this.#decl = ts.factory.updateMethodDeclaration(
      this.#decl,
      [...(this.#decl.modifiers || []), $protected()],
      this.#decl.asteriskToken,
      this.#decl.name,
      this.#decl.questionToken,
      this.#decl.typeParameters,
      this.#decl.parameters,
      this.#decl.type,
      this.#decl.body,
    );
    return this;
  }

  $public() {
    this.#decl = ts.factory.updateMethodDeclaration(
      this.#decl,
      [...(this.#decl.modifiers || []), $public()],
      this.#decl.asteriskToken,
      this.#decl.name,
      this.#decl.questionToken,
      this.#decl.typeParameters,
      this.#decl.parameters,
      this.#decl.type,
      this.#decl.body,
    );
    return this;
  }

  $static() {
    this.#decl = ts.factory.updateMethodDeclaration(
      this.#decl,
      [...(this.#decl.modifiers || []), $static()],
      this.#decl.asteriskToken,
      this.#decl.name,
      this.#decl.questionToken,
      this.#decl.typeParameters,
      this.#decl.parameters,
      this.#decl.type,
      this.#decl.body,
    );
    return this;
  }

  $async() {
    this.#decl = ts.factory.updateMethodDeclaration(
      this.#decl,
      [...(this.#decl.modifiers || []), $async()],
      this.#decl.asteriskToken,
      this.#decl.name,
      this.#decl.questionToken,
      this.#decl.typeParameters,
      this.#decl.parameters,
      this.#decl.type,
      this.#decl.body,
    );
    return this;
  }

  $mod(mod: ts.Modifier) {
    this.#decl = ts.factory.updateMethodDeclaration(
      this.#decl,
      [...(this.#decl.modifiers || []), mod],
      this.#decl.asteriskToken,
      this.#decl.name,
      this.#decl.questionToken,
      this.#decl.typeParameters,
      this.#decl.parameters,
      this.#decl.type,
      this.#decl.body,
    );
    return this;
  }

  // Add parameter
  addParam(name: string, type?: ts.TypeNode) {
    const newParam = param(name, type).get();
    this.#decl = ts.factory.updateMethodDeclaration(
      this.#decl,
      this.#decl.modifiers,
      this.#decl.asteriskToken,
      this.#decl.name,
      this.#decl.questionToken,
      this.#decl.typeParameters,
      [...this.#decl.parameters, newParam],
      this.#decl.type,
      this.#decl.body,
    );
    return this;
  }

  // Set return type
  $returnType(type: ts.TypeNode) {
    this.#decl = ts.factory.updateMethodDeclaration(
      this.#decl,
      this.#decl.modifiers,
      this.#decl.asteriskToken,
      this.#decl.name,
      this.#decl.questionToken,
      this.#decl.typeParameters,
      this.#decl.parameters,
      type,
      this.#decl.body,
    );
    return this;
  }

  // ========== Decorator Update Methods ==========

  /**
   * Update a decorator on the method using a callback function with a flexible find condition
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

    // Update the method with the new decorator
    const updatedModifiers = this.#decl.modifiers.map((modifier) => {
      if (modifier === decoratorModifier) {
        return updatedDecorator.get();
      }
      return modifier;
    });

    this.#decl = ts.factory.updateMethodDeclaration(
      this.#decl,
      updatedModifiers,
      this.#decl.asteriskToken,
      this.#decl.name,
      this.#decl.questionToken,
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

      // Update the method with the new decorator
      const updatedModifiers = this.#decl.modifiers!.map((modifier) => {
        if (modifier === foundDecorator) {
          return updatedDecorator.get();
        }
        return modifier;
      });

      this.#decl = ts.factory.updateMethodDeclaration(
        this.#decl,
        updatedModifiers,
        this.#decl.asteriskToken,
        this.#decl.name,
        this.#decl.questionToken,
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
   * Add leading comment(s) to the method declaration
   * @param comment Comment content to add
   * @returns The method builder for chaining
   */
  addLeadingComment(comment: CommentContent): this {
    this.#decl = addComments(this.#decl, { leading: [comment] });
    return this;
  }

  /**
   * Add trailing comment(s) to the method declaration
   * @param comment Comment content to add
   * @returns The method builder for chaining
   */
  addTrailingComment(comment: CommentContent): this {
    this.#decl = addComments(this.#decl, { trailing: [comment] });
    return this;
  }

  /**
   * Add multiple comments to the method declaration
   * @param options Trivia options with leading and/or trailing comments
   * @returns The method builder for chaining
   */
  addComments(options: TriviaOptions): this {
    this.#decl = addComments(this.#decl, options);
    return this;
  }

  get(): ts.MethodDeclaration {
    return this.#decl;
  }
}

export const method = (
  name: string,
  args: ts.ParameterDeclaration[],
  body: ts.Block,
  mods?: ts.ModifierLike[],
) => buildFluentApi(MethodBuilder, { name, args, body, mods });
