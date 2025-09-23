import ts from "typescript";
import type { CommentContent, TriviaOptions } from "../helpers/trivia";
import { addComments } from "../helpers/trivia";
import { type BuildableAST, buildFluentApi } from "../utils/buildFluentApi";
import { $export } from "./modifier";

class InterfaceBuilder implements BuildableAST {
  #decl: ts.InterfaceDeclaration;

  constructor({
    name,
    members,
    mods,
    typeParams,
    heritage,
  }: {
    name: string | ts.Identifier;
    members?: readonly ts.TypeElement[];
    mods?: ts.ModifierLike[];
    typeParams?: ts.TypeParameterDeclaration[];
    heritage?: ts.HeritageClause[];
  });
  constructor(from: ts.InterfaceDeclaration);
  constructor(
    optionsOrFrom:
      | {
          name: string | ts.Identifier;
          members?: readonly ts.TypeElement[];
          mods?: ts.ModifierLike[];
          typeParams?: ts.TypeParameterDeclaration[];
          heritage?: ts.HeritageClause[];
        }
      | ts.InterfaceDeclaration
  ) {
    if ("kind" in optionsOrFrom && "pos" in optionsOrFrom) {
      // Adopting existing AST node - preserves trivia
      this.#decl = optionsOrFrom;
    } else {
      // Creating new node from options
      const nameNode = typeof optionsOrFrom.name === 'string'
        ? ts.factory.createIdentifier(optionsOrFrom.name)
        : optionsOrFrom.name;

      this.#decl = ts.factory.createInterfaceDeclaration(
        optionsOrFrom.mods,
        nameNode,
        optionsOrFrom.typeParams,
        optionsOrFrom.heritage,
        ts.factory.createNodeArray(optionsOrFrom.members ?? []),
      );
    }
  }

  // Fluent modifier methods
  $export() {
    this.#decl = ts.factory.updateInterfaceDeclaration(
      this.#decl,
      [...(this.#decl.modifiers || []), $export()],
      this.#decl.name,
      this.#decl.typeParameters,
      this.#decl.heritageClauses,
      this.#decl.members,
    );
    return this;
  }

  $mod(mod: ts.Modifier) {
    this.#decl = ts.factory.updateInterfaceDeclaration(
      this.#decl,
      [...(this.#decl.modifiers || []), mod],
      this.#decl.name,
      this.#decl.typeParameters,
      this.#decl.heritageClauses,
      this.#decl.members,
    );
    return this;
  }

  // Add extends clause
  extends(...types: (string | ts.TypeReferenceNode)[]) {
    const heritageTypes = types.map((type) =>
      typeof type === "string"
        ? ts.factory.createExpressionWithTypeArguments(
            ts.factory.createIdentifier(type),
            undefined,
          )
        : ts.factory.createExpressionWithTypeArguments(
            type.typeName as ts.Expression,
            type.typeArguments,
          ),
    );

    const extendsClause = ts.factory.createHeritageClause(
      ts.SyntaxKind.ExtendsKeyword,
      heritageTypes,
    );

    this.#decl = ts.factory.updateInterfaceDeclaration(
      this.#decl,
      this.#decl.modifiers,
      this.#decl.name,
      this.#decl.typeParameters,
      [extendsClause],
      this.#decl.members,
    );
    return this;
  }

  /**
   * Add a property to the interface
   * @example
   * ```ts
   * // Simple property
   * addProperty('myProp', stringType);
   *
   * // String literal property
   * addProperty(ts.factory.createStringLiteral('my-prop'), stringType);
   *
   * // Computed property
   * addProperty(ts.factory.createComputedPropertyName(expr), stringType);
   * ```
   */
  addProperty(
    name: string | ts.PropertyName,
    type: ts.TypeNode,
    optional = false,
    readonly = false,
  ) {
    const modifiers = readonly
      ? [ts.factory.createModifier(ts.SyntaxKind.ReadonlyKeyword)]
      : undefined;
    const questionToken = optional
      ? ts.factory.createToken(ts.SyntaxKind.QuestionToken)
      : undefined;

    const propertyName = typeof name === 'string'
      ? ts.factory.createIdentifier(name)
      : name;

    const property = ts.factory.createPropertySignature(
      modifiers,
      propertyName,
      questionToken,
      type,
    );

    this.#decl = ts.factory.updateInterfaceDeclaration(
      this.#decl,
      this.#decl.modifiers,
      this.#decl.name,
      this.#decl.typeParameters,
      this.#decl.heritageClauses,
      [...this.#decl.members, property],
    );
    return this;
  }

  /**
   * Add a method signature to the interface
   * @example
   * ```ts
   * // Simple method
   * addMethod('myMethod', params, returnType);
   *
   * // String literal method
   * addMethod(ts.factory.createStringLiteral('my-method'), params, returnType);
   *
   * // Computed method name
   * addMethod(ts.factory.createComputedPropertyName(expr), params, returnType);
   * ```
   */
  addMethod(
    name: string | ts.PropertyName,
    parameters: ts.ParameterDeclaration[],
    returnType?: ts.TypeNode,
    optional = false,
  ) {
    const questionToken = optional
      ? ts.factory.createToken(ts.SyntaxKind.QuestionToken)
      : undefined;

    const methodName = typeof name === 'string'
      ? ts.factory.createIdentifier(name)
      : name;

    const method = ts.factory.createMethodSignature(
      undefined, // modifiers
      methodName,
      questionToken,
      undefined, // type parameters
      parameters,
      returnType,
    );

    this.#decl = ts.factory.updateInterfaceDeclaration(
      this.#decl,
      this.#decl.modifiers,
      this.#decl.name,
      this.#decl.typeParameters,
      this.#decl.heritageClauses,
      [...this.#decl.members, method],
    );
    return this;
  }

  // Add call signature
  addCallSignature(
    parameters: ts.ParameterDeclaration[],
    returnType?: ts.TypeNode,
  ) {
    const callSignature = ts.factory.createCallSignature(
      undefined, // type parameters
      parameters,
      returnType,
    );

    this.#decl = ts.factory.updateInterfaceDeclaration(
      this.#decl,
      this.#decl.modifiers,
      this.#decl.name,
      this.#decl.typeParameters,
      this.#decl.heritageClauses,
      [...this.#decl.members, callSignature],
    );
    return this;
  }

  // Add construct signature
  addConstructSignature(
    parameters: ts.ParameterDeclaration[],
    returnType?: ts.TypeNode,
  ) {
    const constructSignature = ts.factory.createConstructSignature(
      undefined, // type parameters
      parameters,
      returnType,
    );

    this.#decl = ts.factory.updateInterfaceDeclaration(
      this.#decl,
      this.#decl.modifiers,
      this.#decl.name,
      this.#decl.typeParameters,
      this.#decl.heritageClauses,
      [...this.#decl.members, constructSignature],
    );
    return this;
  }

  // Add index signature
  addIndexSignature(
    keyName: string,
    keyType: ts.TypeNode,
    valueType: ts.TypeNode,
    readonly = false,
  ) {
    const modifiers = readonly
      ? [ts.factory.createModifier(ts.SyntaxKind.ReadonlyKeyword)]
      : undefined;

    const parameter = ts.factory.createParameterDeclaration(
      undefined, // modifiers
      undefined, // dotDotDotToken
      ts.factory.createIdentifier(keyName),
      undefined, // questionToken
      keyType,
      undefined, // initializer
    );

    const indexSignature = ts.factory.createIndexSignature(
      modifiers,
      [parameter],
      valueType,
    );

    this.#decl = ts.factory.updateInterfaceDeclaration(
      this.#decl,
      this.#decl.modifiers,
      this.#decl.name,
      this.#decl.typeParameters,
      this.#decl.heritageClauses,
      [...this.#decl.members, indexSignature],
    );
    return this;
  }

  // Add any member
  addMember(member: ts.TypeElement) {
    this.#decl = ts.factory.updateInterfaceDeclaration(
      this.#decl,
      this.#decl.modifiers,
      this.#decl.name,
      this.#decl.typeParameters,
      this.#decl.heritageClauses,
      [...this.#decl.members, member],
    );
    return this;
  }

  // ========== Comment Methods ==========

  /**
   * Add leading comment(s) to the interface declaration
   * @param comment Comment content to add
   * @returns The interface builder for chaining
   */
  addLeadingComment(comment: CommentContent): this {
    this.#decl = addComments(this.#decl, { leading: [comment] });
    return this;
  }

  /**
   * Add trailing comment(s) to the interface declaration
   * @param comment Comment content to add
   * @returns The interface builder for chaining
   */
  addTrailingComment(comment: CommentContent): this {
    this.#decl = addComments(this.#decl, { trailing: [comment] });
    return this;
  }

  /**
   * Add multiple comments to the interface declaration
   * @param options Trivia options with leading and/or trailing comments
   * @returns The interface builder for chaining
   */
  addComments(options: TriviaOptions): this {
    this.#decl = addComments(this.#decl, options);
    return this;
  }

  get(): ts.InterfaceDeclaration {
    return this.#decl;
  }
}

/**
 * Create an interface declaration
 * @param name The interface name
 * @param members Optional interface members
 * @param mods Optional modifiers
 */
export function interface_(
  name: string | ts.Identifier,
  members?: ts.TypeElement[],
  mods?: ts.ModifierLike[],
): InterfaceBuilder & ts.InterfaceDeclaration;
export function interface_(existingInterface: ts.InterfaceDeclaration): InterfaceBuilder & ts.InterfaceDeclaration;
export function interface_(
  nameOrInterface: string | ts.Identifier | ts.InterfaceDeclaration,
  members: ts.TypeElement[] = [],
  mods?: ts.ModifierLike[],
) {
  if (nameOrInterface instanceof Object && "kind" in nameOrInterface && nameOrInterface.kind === ts.SyntaxKind.InterfaceDeclaration) {
    return buildFluentApi(InterfaceBuilder, nameOrInterface);
  } else {
    const nameNode = typeof nameOrInterface === 'string'
      ? ts.factory.createIdentifier(nameOrInterface)
      : nameOrInterface;

    // Create interface declaration
    const decl = ts.factory.createInterfaceDeclaration(
      mods,
      nameNode,
      undefined,
      undefined,
      ts.factory.createNodeArray(members),
    );

    return buildFluentApi(InterfaceBuilder, decl);
  }
}
