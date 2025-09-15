import ts from "typescript";
import type { TriviaOptions, CommentContent } from "../helpers/trivia";
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
    name: string;
    members?: ts.TypeElement[];
    mods?: ts.ModifierLike[];
    typeParams?: ts.TypeParameterDeclaration[];
    heritage?: ts.HeritageClause[];
  }) {
    this.#decl = ts.factory.createInterfaceDeclaration(
      mods,
      ts.factory.createIdentifier(name),
      typeParams,
      heritage,
      members ?? [],
    );
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
    const heritageTypes = types.map(type => 
      typeof type === "string" 
        ? ts.factory.createExpressionWithTypeArguments(
            ts.factory.createIdentifier(type), 
            undefined
          )
        : ts.factory.createExpressionWithTypeArguments(
            type.typeName as ts.Expression, 
            type.typeArguments
          )
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

  // Add property
  addProperty(
    name: string,
    type: ts.TypeNode,
    optional = false,
    readonly = false,
  ) {
    const modifiers = readonly ? [ts.factory.createModifier(ts.SyntaxKind.ReadonlyKeyword)] : undefined;
    const questionToken = optional ? ts.factory.createToken(ts.SyntaxKind.QuestionToken) : undefined;
    
    const property = ts.factory.createPropertySignature(
      modifiers,
      ts.factory.createIdentifier(name),
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

  // Add method signature
  addMethod(
    name: string,
    parameters: ts.ParameterDeclaration[],
    returnType?: ts.TypeNode,
    optional = false,
  ) {
    const questionToken = optional ? ts.factory.createToken(ts.SyntaxKind.QuestionToken) : undefined;
    
    const method = ts.factory.createMethodSignature(
      undefined, // modifiers
      ts.factory.createIdentifier(name),
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
    const modifiers = readonly ? [ts.factory.createModifier(ts.SyntaxKind.ReadonlyKeyword)] : undefined;
    
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
export const interface_ = (
  name: string,
  members: ts.TypeElement[] = [],
  mods?: ts.ModifierLike[],
) => buildFluentApi(InterfaceBuilder, { name, members, mods });