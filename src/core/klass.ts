import ts from "typescript";
import { type DecoratorFilterOptions, findDecorators } from "../helpers/finder";
import type { CommentContent, TriviaOptions } from "../helpers/trivia";
import { addComments } from "../helpers/trivia";
import { type BuildableAST, buildFluentApi } from "../utils/buildFluentApi";
import { ctor as ctorBuilder } from "./ctor";
import { fromDecorator } from "./decorator";
import { method as methodBuilder } from "./method";
import { $abstract, $export, $readonly } from "./modifier";
import { prop } from "./prop";

export class KlassBuilder implements BuildableAST {
  #decl: ts.ClassDeclaration;

  constructor({
    name,
    members,
    mods,
    typeParams,
    heritage,
  }: {
    name: string;
    members?: ts.ClassElement[];
    mods?: ts.ModifierLike[];
    typeParams?: ts.TypeParameterDeclaration[];
    heritage?: ts.HeritageClause[];
  });
  constructor(from: ts.ClassDeclaration);
  constructor(
    optionsOrFrom:
      | {
          name: string;
          members?: ts.ClassElement[];
          mods?: ts.ModifierLike[];
          typeParams?: ts.TypeParameterDeclaration[];
          heritage?: ts.HeritageClause[];
        }
      | ts.ClassDeclaration
  ) {
    if ("name" in optionsOrFrom) {
      this.#decl = ts.factory.createClassDeclaration(
        optionsOrFrom.mods,
        ts.factory.createIdentifier(optionsOrFrom.name),
        optionsOrFrom.typeParams,
        optionsOrFrom.heritage,
        optionsOrFrom.members ?? [],
      );
    } else {
      this.#decl = optionsOrFrom;
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

    // Update the class with the new decorator
    const updatedModifiers = this.#decl.modifiers.map((modifier) => {
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

      // Update the class with the new decorator
      const updatedModifiers = this.#decl.modifiers!.map((modifier) => {
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

  // ========== Property Update Methods ==========

  /**
   * Update a property on the class using a callback function with a flexible find condition
   * @param findCondition Function to determine which property to update (returns true for the target property)
   * @param updateFn Function that receives the existing property and returns the updated one
   * @returns The updated property builder or undefined if not found
   */
  updateProperty(
    findCondition: (property: ts.PropertyDeclaration) => boolean,
    updateFn: (property: ReturnType<typeof prop>) => ReturnType<typeof prop>,
  ): ReturnType<typeof prop> | undefined {
    // Find the property using the condition
    const propertyMember = this.#decl.members.find((member) => {
      return ts.isPropertyDeclaration(member) && findCondition(member);
    }) as ts.PropertyDeclaration | undefined;

    if (!propertyMember) {
      return undefined;
    }

    // Create a property builder from the existing property
    const propertyBuilder = prop(
      ts.isIdentifier(propertyMember.name)
        ? propertyMember.name.text
        : propertyMember.name!.getText(),
      propertyMember.type,
      !!propertyMember.questionToken,
    );

    // Apply existing modifiers
    if (propertyMember.modifiers) {
      propertyMember.modifiers.forEach((mod) => {
        if (ts.isModifier(mod)) {
          propertyBuilder.$mod(mod);
        }
      });
    }

    // Apply existing initializer
    if (propertyMember.initializer) {
      propertyBuilder.$init(propertyMember.initializer);
    }

    // Apply the update function
    const updatedProperty = updateFn(propertyBuilder);

    // Update the class with the new property
    const updatedMembers = this.#decl.members.map((member) => {
      if (member === propertyMember) {
        return updatedProperty.get();
      }
      return member;
    });

    this.#decl = ts.factory.updateClassDeclaration(
      this.#decl,
      this.#decl.modifiers,
      this.#decl.name,
      this.#decl.typeParameters,
      this.#decl.heritageClauses,
      updatedMembers,
    );

    return updatedProperty;
  }

  /**
   * Convenience method: Update property by name
   * @param propertyName The name of the property to update
   * @param updateFn Function that receives the existing property and returns the updated one
   * @returns The updated property builder or undefined if not found
   */
  updatePropertyByName(
    propertyName: string,
    updateFn: (property: ReturnType<typeof prop>) => ReturnType<typeof prop>,
  ): ReturnType<typeof prop> | undefined {
    return this.updateProperty((property) => {
      if (ts.isIdentifier(property.name)) {
        return property.name.text === propertyName;
      }
      return property.name?.getText() === propertyName;
    }, updateFn);
  }

  /**
   * Update all properties that match a filter condition
   * @param findCondition Function to determine which properties to update (returns true for target properties)
   * @param updateFn Function that receives the existing property and returns the updated one
   * @returns Array of updated property builders
   */
  updatePropertiesByFilter(
    findCondition: (property: ts.PropertyDeclaration) => boolean,
    updateFn: (property: ReturnType<typeof prop>) => ReturnType<typeof prop>,
  ): Array<ReturnType<typeof prop>> {
    const updatedProperties: Array<ReturnType<typeof prop>> = [];
    const foundProperties = this.#decl.members.filter((member) => {
      return ts.isPropertyDeclaration(member) && findCondition(member);
    }) as ts.PropertyDeclaration[];

    if (foundProperties.length === 0) {
      return updatedProperties;
    }

    // Update each found property
    for (const foundProperty of foundProperties) {
      // Create property builder from existing property to preserve decorators and comments
      const propertyBuilder = prop(foundProperty);

      const updatedProperty = updateFn(propertyBuilder);
      updatedProperties.push(updatedProperty);

      // Update the class with the new property
      const updatedMembers = this.#decl.members.map((member) => {
        if (member === foundProperty) {
          return updatedProperty.get();
        }
        return member;
      });

      this.#decl = ts.factory.updateClassDeclaration(
        this.#decl,
        this.#decl.modifiers,
        this.#decl.name,
        this.#decl.typeParameters,
        this.#decl.heritageClauses,
        updatedMembers,
      );
    }

    return updatedProperties;
  }

  // ========== Method Update Methods ==========

  /**
   * Update a method on the class using a callback function with a flexible find condition
   * @param findCondition Function to determine which method to update (returns true for the target method)
   * @param updateFn Function that receives the existing method and returns the updated one
   * @returns The updated method builder or undefined if not found
   */
  updateMethod(
    findCondition: (method: ts.MethodDeclaration) => boolean,
    updateFn: (
      method: ReturnType<typeof methodBuilder>,
    ) => ReturnType<typeof methodBuilder>,
  ): ReturnType<typeof methodBuilder> | undefined {
    // Find the method using the condition
    const methodMember = this.#decl.members.find((member) => {
      return ts.isMethodDeclaration(member) && findCondition(member);
    }) as ts.MethodDeclaration | undefined;

    if (!methodMember) {
      return undefined;
    }

    // Create a method builder from the existing method
    const methodBuilderInstance = methodBuilder(
      ts.isIdentifier(methodMember.name)
        ? methodMember.name.text
        : methodMember.name!.getText(),
      Array.from(methodMember.parameters),
      methodMember.body!,
      methodMember.modifiers ? Array.from(methodMember.modifiers) : undefined,
    );

    // Apply the update function
    const updatedMethod = updateFn(methodBuilderInstance);

    // Update the class with the new method
    const updatedMembers = this.#decl.members.map((member) => {
      if (member === methodMember) {
        return updatedMethod.get();
      }
      return member;
    });

    this.#decl = ts.factory.updateClassDeclaration(
      this.#decl,
      this.#decl.modifiers,
      this.#decl.name,
      this.#decl.typeParameters,
      this.#decl.heritageClauses,
      updatedMembers,
    );

    return updatedMethod;
  }

  /**
   * Convenience method: Update method by name
   * @param methodName The name of the method to update
   * @param updateFn Function that receives the existing method and returns the updated one
   * @returns The updated method builder or undefined if not found
   */
  updateMethodByName(
    methodName: string,
    updateFn: (
      method: ReturnType<typeof methodBuilder>,
    ) => ReturnType<typeof methodBuilder>,
  ): ReturnType<typeof methodBuilder> | undefined {
    return this.updateMethod((method) => {
      if (ts.isIdentifier(method.name)) {
        return method.name.text === methodName;
      }
      return method.name?.getText() === methodName;
    }, updateFn);
  }

  /**
   * Update all methods that match a filter condition
   * @param findCondition Function to determine which methods to update (returns true for target methods)
   * @param updateFn Function that receives the existing method and returns the updated one
   * @returns Array of updated method builders
   */
  updateMethodsByFilter(
    findCondition: (method: ts.MethodDeclaration) => boolean,
    updateFn: (
      method: ReturnType<typeof methodBuilder>,
    ) => ReturnType<typeof methodBuilder>,
  ): Array<ReturnType<typeof methodBuilder>> {
    const updatedMethods: Array<ReturnType<typeof methodBuilder>> = [];
    const foundMethods = this.#decl.members.filter((member) => {
      return ts.isMethodDeclaration(member) && findCondition(member);
    }) as ts.MethodDeclaration[];

    if (foundMethods.length === 0) {
      return updatedMethods;
    }

    // Update each found method
    for (const foundMethod of foundMethods) {
      // Create method builder from existing method to preserve decorators and comments
      const methodBuilderInstance = methodBuilder(foundMethod);

      const updatedMethod = updateFn(methodBuilderInstance);
      updatedMethods.push(updatedMethod);

      // Update the class with the new method
      const updatedMembers = this.#decl.members.map((member) => {
        if (member === foundMethod) {
          return updatedMethod.get();
        }
        return member;
      });

      this.#decl = ts.factory.updateClassDeclaration(
        this.#decl,
        this.#decl.modifiers,
        this.#decl.name,
        this.#decl.typeParameters,
        this.#decl.heritageClauses,
        updatedMembers,
      );
    }

    return updatedMethods;
  }

  // ========== Constructor Update Methods ==========

  /**
   * Update the constructor on the class using a callback function
   * @param updateFn Function that receives the existing constructor and returns the updated one
   * @returns The updated constructor builder or undefined if not found
   */
  updateConstructor(
    updateFn: (
      constructor: ReturnType<typeof ctorBuilder>,
    ) => ReturnType<typeof ctorBuilder>,
  ): ReturnType<typeof ctorBuilder> | undefined {
    // Find the constructor
    const constructorMember = this.#decl.members.find((member) => {
      return ts.isConstructorDeclaration(member);
    }) as ts.ConstructorDeclaration | undefined;

    if (!constructorMember) {
      return undefined;
    }

    // Create a constructor builder from the existing constructor
    const constructorBuilderInstance = ctorBuilder(
      Array.from(constructorMember.parameters),
      constructorMember.body!,
    );

    // Apply existing modifiers
    if (constructorMember.modifiers) {
      constructorMember.modifiers.forEach((mod) => {
        if (ts.isModifier(mod)) {
          constructorBuilderInstance.$mod(mod);
        }
      });
    }

    // Apply the update function
    const updatedConstructor = updateFn(constructorBuilderInstance);

    // Update the class with the new constructor
    const updatedMembers = this.#decl.members.map((member) => {
      if (member === constructorMember) {
        return updatedConstructor.get();
      }
      return member;
    });

    this.#decl = ts.factory.updateClassDeclaration(
      this.#decl,
      this.#decl.modifiers,
      this.#decl.name,
      this.#decl.typeParameters,
      this.#decl.heritageClauses,
      updatedMembers,
    );

    return updatedConstructor;
  }

  // ========== Comment Methods ==========

  /**
   * Add leading comment(s) to the class declaration
   * @param comment Comment content to add
   * @returns The class builder for chaining
   */
  addLeadingComment(comment: CommentContent): this {
    this.#decl = addComments(this.#decl, { leading: [comment] });
    return this;
  }

  /**
   * Add trailing comment(s) to the class declaration
   * @param comment Comment content to add
   * @returns The class builder for chaining
   */
  addTrailingComment(comment: CommentContent): this {
    this.#decl = addComments(this.#decl, { trailing: [comment] });
    return this;
  }

  /**
   * Add multiple comments to the class declaration
   * @param options Trivia options with leading and/or trailing comments
   * @returns The class builder for chaining
   */
  addComments(options: TriviaOptions): this {
    this.#decl = addComments(this.#decl, options);
    return this;
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
  name: string,
  members?: ts.ClassElement[],
  mods?: ts.ModifierLike[]
): ReturnType<typeof buildFluentApi>;
export function klass(existingClass: ts.ClassDeclaration): ReturnType<typeof buildFluentApi>;
export function klass(
  nameOrExisting: string | ts.ClassDeclaration,
  members: ts.ClassElement[] = [],
  mods?: ts.ModifierLike[],
) {
  if (typeof nameOrExisting === "string") {
    return buildFluentApi(KlassBuilder, {
      name: nameOrExisting,
      members,
      mods,
    });
  } else {
    return buildFluentApi(KlassBuilder, nameOrExisting);
  }
}
