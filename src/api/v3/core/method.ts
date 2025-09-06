import ts from "typescript";
import { type BuildableAST, buildFluentApi } from "../utils/buildFluentApi";
import { $async, $private, $protected, $public, $static } from "./modifier";
import { param } from "./params";

class MethodBuilder implements BuildableAST {
  #decl: ts.MethodDeclaration | null = null;
  #mods: ts.ModifierLike[];
  #parameters: ts.ParameterDeclaration[];
  #body: ts.Block;
  #name: string;
  #typeParams: ts.TypeParameterDeclaration[];
  #returnType?: ts.TypeNode;

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
    this.#name = name;
    this.#parameters = args;
    this.#body = body;
    this.#mods = mods ?? [];
    this.#typeParams = typeParams ?? [];
    this.#returnType = returnType;
  }

  // Fluent modifier methods
  $private() {
    this.#mods.push($private());
    return this;
  }

  $protected() {
    this.#mods.push($protected());
    return this;
  }

  $public() {
    this.#mods.push($public());
    return this;
  }

  $static() {
    this.#mods.push($static());
    return this;
  }

  $async() {
    this.#mods.push($async());
    return this;
  }

  $mod(mod: ts.Modifier) {
    this.#mods.push(mod);
    return this;
  }

  // Add parameter
  addParam(name: string, type?: ts.TypeNode) {
    this.#parameters.push(param(name, type).build());
    return this;
  }

  // Set return type
  $returnType(type: ts.TypeNode) {
    this.#returnType = type;
    return this;
  }

  build(): ts.MethodDeclaration {
    this.#decl = ts.factory.createMethodDeclaration(
      this.#mods,
      undefined, // asterisk token
      this.#name,
      undefined, // question token
      this.#typeParams,
      this.#parameters,
      this.#returnType,
      this.#body,
    );
    return this.#decl;
  }

  update(): ts.MethodDeclaration {
    if (!this.#decl) throw new Error("Method declaration not built");

    return ts.factory.updateMethodDeclaration(
      this.#decl,
      this.#mods,
      this.#decl.asteriskToken,
      this.#decl.name,
      this.#decl.questionToken,
      this.#typeParams,
      this.#parameters,
      this.#returnType,
      this.#body,
    );
  }
}

export const method = (
  name: string,
  args: ts.ParameterDeclaration[],
  body: ts.Block,
  mods?: ts.ModifierLike[],
) => buildFluentApi(MethodBuilder, { name, args, body, mods });
