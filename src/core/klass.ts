import ts from "typescript";
import { findDecorators, type DecoratorFilterOptions } from "../helpers/finder";
import { buildFluentApi, type BuildableAST } from "../utils/buildFluentApi";
import { fromDecorator } from "./decorator";
import { $abstract, $export, $readonly } from "./modifier";

export class KlassBuilder implements BuildableAST {
  #decl: ts.ClassDeclaration;

  constructor({
    name,
    members,
    mods,
    typeParams,
    heritage,
    from,
  }: {
    name?: string;
    members?: ts.ClassElement[];
    mods?: ts.ModifierLike[];
    typeParams?: ts.TypeParameterDeclaration[];
    heritage?: ts.HeritageClause[];
    from?: ts.ClassDeclaration;
  }) {
    if (from) {
      // Adopt from existing ClassDeclaration
      this.#decl = from;
    } else {
      // Create new ClassDeclaration
      if (!name) {
        throw new Error("name is required when not adopting from existing ClassDeclaration");
      }
      this.#decl = ts.factory.createClassDeclaration(
        mods,
        ts.factory.createIdentifier(name),
        typeParams,
        heritage,
        members ?? [],
      );
    }
  }

  // Fluent modifier methods
  $export() {
    this.#decl = ts.factory.updateClassDeclaration(
      this.#decl,
      [...(this.#decl.modifiers || []), $export()],
      this.#decl.name,
      this.#decl.typeParameters,
      this.#decl.heritageClauses,
      this.#decl.members,
    );
    return this;
  }

  $abstract() {
    this.#decl = ts.factory.updateClassDeclaration(
      this.#decl,
      [...(this.#decl.modifiers || []), $abstract()],
      this.#decl.name,
      this.#decl.typeParameters,
      this.#decl.heritageClauses,
      this.#decl.members,
    );
    return this;
  }

  $readonly() {
    this.#decl = ts.factory.updateClassDeclaration(
      this.#decl,
      [...(this.#decl.modifiers || []), $readonly()],
      this.#decl.name,
      this.#decl.typeParameters,
      this.#decl.heritageClauses,
      this.#decl.members,
    );
    return this;
  }

  $mod(mod: ts.Modifier) {
    this.#decl = ts.factory.updateClassDeclaration(
      this.#decl,
      [...(this.#decl.modifiers || []), mod],
      this.#decl.name,
      this.#decl.typeParameters,
      this.#decl.heritageClauses,
      this.#decl.members,
    );
    return this;
  }

  addMember(member: ts.ClassElement) {
    this.#decl = ts.factory.updateClassDeclaration(
      this.#decl,
      this.#decl.modifiers,
      this.#decl.name,
      this.#decl.typeParameters,
      this.#decl.heritageClauses,
      [...this.#decl.members, member],
    );
    return this;
  }

  addTypeParam(param: ts.TypeParameterDeclaration) {
    this.#decl = ts.factory.updateClassDeclaration(
      this.#decl,
      this.#decl.modifiers,
      this.#decl.name,
      [...(this.#decl.typeParameters || []), param],
      this.#decl.heritageClauses,
      this.#decl.members,
    );
    return this;
  }

  rename(newName: string) {
    this.#decl = ts.factory.updateClassDeclaration(
      this.#decl,
      this.#decl.modifiers,
      ts.factory.createIdentifier(newName),
      this.#decl.typeParameters,
      this.#decl.heritageClauses,
      this.#decl.members,
    );
    return this;
  }

  /**
   * Update a decorator on the class using a callback function with a flexible find condition
   * @param findCondition Function to determine which decorator to update (returns true for the target decorator)
   * @param updateFn Function that receives the existing decorator and returns the updated one
   * @returns The updated decorator builder or undefined if not found
   */
  updateDecorator(
    findCondition: (decorator: ts.Decorator) => boolean,
    updateFn: (decorator: ReturnType<typeof fromDecorator>) => ReturnType<typeof fromDecorator>
  ): ReturnType<typeof fromDecorator> | undefined {
    if (!this.#decl.modifiers) {
      return undefined;
    }

    // Find the decorator using the condition
    const decoratorModifier = this.#decl.modifiers.find(modifier => {
      return ts.isDecorator(modifier) && findCondition(modifier);
    }) as ts.Decorator | undefined;

    if (!decoratorModifier) {
      return undefined;
    }

    // Create a decorator builder from the existing decorator
    const decoratorBuilder = fromDecorator(decoratorModifier);
    
    // Apply the update function
    const updatedDecorator = updateFn(decoratorBuilder);

    // Update the class with the new decorator
    const updatedModifiers = this.#decl.modifiers.map(modifier => {
      if (modifier === decoratorModifier) {
        return updatedDecorator.get();
      }
      return modifier;
    });

    this.#decl = ts.factory.updateClassDeclaration(
      this.#decl,
      updatedModifiers,
      this.#decl.name,
      this.#decl.typeParameters,
      this.#decl.heritageClauses,
      this.#decl.members,
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
    updateFn: (decorator: ReturnType<typeof fromDecorator>) => ReturnType<typeof fromDecorator>
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

      // Update the class with the new decorator
      const updatedModifiers = this.#decl.modifiers!.map(modifier => {
        if (modifier === foundDecorator) {
          return updatedDecorator.get();
        }
        return modifier;
      });

      this.#decl = ts.factory.updateClassDeclaration(
        this.#decl,
        updatedModifiers,
        this.#decl.name,
        this.#decl.typeParameters,
        this.#decl.heritageClauses,
        this.#decl.members,
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
    updateFn: (decorator: ReturnType<typeof fromDecorator>) => ReturnType<typeof fromDecorator>
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
    updateFn: (decorator: ReturnType<typeof fromDecorator>) => ReturnType<typeof fromDecorator>
  ): ReturnType<typeof fromDecorator> | undefined {
    const options: DecoratorFilterOptions = { 
      name,
      sourceFile
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
  updateDecoratorByName(decoratorName: string, updateFn: (decorator: ReturnType<typeof fromDecorator>) => ReturnType<typeof fromDecorator>): ReturnType<typeof fromDecorator> | undefined {
    return this.updateDecorator(
      (decorator) => {
        // Extract decorator name
        let name = '';
        if (ts.isCallExpression(decorator.expression) && ts.isIdentifier(decorator.expression.expression)) {
          name = decorator.expression.expression.text;
        } else if (ts.isIdentifier(decorator.expression)) {
          name = decorator.expression.text;
        }
        return name === decoratorName;
      },
      updateFn
    );
  }

  get(): ts.ClassDeclaration {
    return this.#decl;
  }
}

export function klass(
  name: string,
  members?: ts.ClassElement[],
  mods?: ts.ModifierLike[],
): KlassBuilder & ts.ClassDeclaration;

export function klass(
  existing: ts.ClassDeclaration,
): KlassBuilder & ts.ClassDeclaration;

export function klass(
  nameOrExisting: string | ts.ClassDeclaration,
  members: ts.ClassElement[] = [],
  mods?: ts.ModifierLike[],
) {
  if (typeof nameOrExisting === "string") {
    // Standard creation with name
    return buildFluentApi(KlassBuilder, {
      name: nameOrExisting,
      members,
      mods,
    });
  } else {
    // Adopt from existing ClassDeclaration
    return buildFluentApi(KlassBuilder, {
      from: nameOrExisting,
    });
  }
}
