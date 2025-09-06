import ts from "typescript";
import { type BuildableAST, buildFluentApi } from "../utils/buildFluentApi";
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
