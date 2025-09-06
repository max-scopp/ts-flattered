import ts from "typescript";

export const $export = () =>
  ts.factory.createModifier(ts.SyntaxKind.ExportKeyword);

export const $abstract = () =>
  ts.factory.createModifier(ts.SyntaxKind.AbstractKeyword);

export const $async = () =>
  ts.factory.createModifier(ts.SyntaxKind.AsyncKeyword);

export const $readonly = () =>
  ts.factory.createModifier(ts.SyntaxKind.ReadonlyKeyword);

export const $private = () =>
  ts.factory.createModifier(ts.SyntaxKind.PrivateKeyword);

export const $protected = () =>
  ts.factory.createModifier(ts.SyntaxKind.ProtectedKeyword);

export const $public = () =>
  ts.factory.createModifier(ts.SyntaxKind.PublicKeyword);

export const $static = () =>
  ts.factory.createModifier(ts.SyntaxKind.StaticKeyword);
