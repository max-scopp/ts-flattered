import ts from "typescript";
import { type DecoratorFilterOptions, findDecorators } from "../helpers/finder";
import { type BuildableAST, buildFluentApi } from "../utils/buildFluentApi";
import { fromDecorator } from "./decorator";
import {
  $export,
  $private,
  $protected,
  $public,
  $readonly,
  $static,
} from "./modifier";

class PropBuilder implements BuildableAST {
  #decl: ts.PropertyDeclaration;

  constructor({
    name,
    type,
    optional,
  }: {
    name: string;
    type?: ts.TypeNode;
    optional?: boolean;
  }) {
    this.#decl = ts.factory.createPropertyDeclaration(
      undefined, // modifiers
      name,
      optional
        ? ts.factory.createToken(ts.SyntaxKind.QuestionToken)
        : undefined,
      type,
      undefined, // initializer
    );
  }

  // Fluent modifier methods
  $export() {
    this.#decl = ts.factory.updatePropertyDeclaration(
      this.#decl,
      [...(this.#decl.modifiers || []), $export()],
      this.#decl.name,
      this.#decl.questionToken,
      this.#decl.type,
      this.#decl.initializer,
    );
    return this;
  }

  $readonly() {
    this.#decl = ts.factory.updatePropertyDeclaration(
      this.#decl,
      [...(this.#decl.modifiers || []), $readonly()],
      this.#decl.name,
      this.#decl.questionToken,
      this.#decl.type,
      this.#decl.initializer,
    );
    return this;
  }

  $static() {
    this.#decl = ts.factory.updatePropertyDeclaration(
      this.#decl,
      [...(this.#decl.modifiers || []), $static()],
      this.#decl.name,
      this.#decl.questionToken,
      this.#decl.type,
      this.#decl.initializer,
    );
    return this;
  }

  $private() {
    this.#decl = ts.factory.updatePropertyDeclaration(
      this.#decl,
      [...(this.#decl.modifiers || []), $private()],
      this.#decl.name,
      this.#decl.questionToken,
      this.#decl.type,
      this.#decl.initializer,
    );
    return this;
  }

  $protected() {
    this.#decl = ts.factory.updatePropertyDeclaration(
      this.#decl,
      [...(this.#decl.modifiers || []), $protected()],
      this.#decl.name,
      this.#decl.questionToken,
      this.#decl.type,
      this.#decl.initializer,
    );
    return this;
  }

  $public() {
    this.#decl = ts.factory.updatePropertyDeclaration(
      this.#decl,
      [...(this.#decl.modifiers || []), $public()],
      this.#decl.name,
      this.#decl.questionToken,
      this.#decl.type,
      this.#decl.initializer,
    );
    return this;
  }

  $mod(mod: ts.Modifier) {
    this.#decl = ts.factory.updatePropertyDeclaration(
      this.#decl,
      [...(this.#decl.modifiers || []), mod],
      this.#decl.name,
      this.#decl.questionToken,
      this.#decl.type,
      this.#decl.initializer,
    );
    return this;
  }

  // Set optional
  $optional() {
    this.#decl = ts.factory.updatePropertyDeclaration(
      this.#decl,
      this.#decl.modifiers,
      this.#decl.name,
      ts.factory.createToken(ts.SyntaxKind.QuestionToken),
      this.#decl.type,
      this.#decl.initializer,
    );
    return this;
  }

  // Set initializer
  $init(initializer: ts.Expression) {
    this.#decl = ts.factory.updatePropertyDeclaration(
      this.#decl,
      this.#decl.modifiers,
      this.#decl.name,
      this.#decl.questionToken,
      this.#decl.type,
      initializer,
    );
    return this;
  }

  // ========== Decorator Update Methods ==========

  /**
   * Update a decorator on the property using a callback function with a flexible find condition
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

    // Update the property with the new decorator
    const updatedModifiers = this.#decl.modifiers.map((modifier) => {
      if (modifier === decoratorModifier) {
        return updatedDecorator.get();
      }
      return modifier;
    });

    this.#decl = ts.factory.updatePropertyDeclaration(
      this.#decl,
      updatedModifiers,
      this.#decl.name,
      this.#decl.questionToken,
      this.#decl.type,
      this.#decl.initializer,
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

      // Update the property with the new decorator
      const updatedModifiers = this.#decl.modifiers!.map((modifier) => {
        if (modifier === foundDecorator) {
          return updatedDecorator.get();
        }
        return modifier;
      });

      this.#decl = ts.factory.updatePropertyDeclaration(
        this.#decl,
        updatedModifiers,
        this.#decl.name,
        this.#decl.questionToken,
        this.#decl.type,
        this.#decl.initializer,
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

  get(): ts.PropertyDeclaration {
    return this.#decl;
  }
}

export const prop = (name: string, type?: ts.TypeNode, optional?: boolean) =>
  buildFluentApi(PropBuilder, { name, type, optional });
