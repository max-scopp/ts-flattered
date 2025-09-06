import ts from "typescript";

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
