import ts from "typescript";
import { type BuildableAST, buildFluentApi } from "./utils/buildFluentApi";

export const $any = (): ts.KeywordTypeNode =>
  ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword);

export const $string = (): ts.KeywordTypeNode =>
  ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword);

export const $number = (): ts.KeywordTypeNode =>
  ts.factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword);

export const $boolean = (): ts.KeywordTypeNode =>
  ts.factory.createKeywordTypeNode(ts.SyntaxKind.BooleanKeyword);

export const $ref = (name: string): ts.TypeReferenceNode =>
  ts.factory.createTypeReferenceNode(name);

// Union type
export const union = (...types: ts.TypeNode[]): ts.UnionTypeNode =>
  ts.factory.createUnionTypeNode(types);

// Array type
export const arrayType = (elementType: ts.TypeNode): ts.ArrayTypeNode =>
  ts.factory.createArrayTypeNode(elementType);

// Type Interface Builder for inline object types
class TypeInterfaceBuilder implements BuildableAST {
  #type: ts.TypeLiteralNode;

  constructor({
    properties,
  }: {
    properties?: Array<{
      name: string;
      type: ts.TypeNode;
      optional?: boolean;
    }>;
  }) {
    const members =
      properties?.map((prop) =>
        ts.factory.createPropertySignature(
          undefined, // modifiers
          prop.name,
          prop.optional
            ? ts.factory.createToken(ts.SyntaxKind.QuestionToken)
            : undefined,
          prop.type,
        ),
      ) ?? [];

    this.#type = ts.factory.createTypeLiteralNode(members);
  }

  prop(name: string, type: ts.TypeNode, optional = false) {
    const newProp = ts.factory.createPropertySignature(
      undefined,
      name,
      optional
        ? ts.factory.createToken(ts.SyntaxKind.QuestionToken)
        : undefined,
      type,
    );
    this.#type = ts.factory.createTypeLiteralNode([
      ...this.#type.members,
      newProp,
    ]);
    return this;
  }

  get(): ts.TypeLiteralNode {
    return this.#type;
  }
}

export const typeInterface = (
  properties: Array<{
    name: string;
    type: ts.TypeNode;
    optional?: boolean;
  }> = [],
) => buildFluentApi(TypeInterfaceBuilder, { properties });
