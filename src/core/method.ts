import ts from "typescript";
import { type BuildableAST, buildFluentApi } from "../utils/buildFluentApi";
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
