import ts from "typescript";
import { type BuildableAST, buildFluentApi } from "../utils/buildFluentApi";
import {
  $export,
  $private,
  $protected,
  $public,
  $readonly,
  $static,
} from "./modifier";

class PropBuilder implements BuildableAST {
  #decl: ts.PropertyDeclaration | null = null;
  #mods: ts.ModifierLike[];
  #name: string;
  #type?: ts.TypeNode;
  #optional: boolean;
  #initializer?: ts.Expression;

  constructor({
    name,
    type,
    optional,
  }: {
    name: string;
    type?: ts.TypeNode;
    optional?: boolean;
  }) {
    this.#name = name;
    this.#type = type;
    this.#optional = optional ?? false;
    this.#mods = [];
  }

  // Fluent modifier methods
  $export() {
    this.#mods.push($export());
    return this;
  }

  $readonly() {
    this.#mods.push($readonly());
    return this;
  }

  $static() {
    this.#mods.push($static());
    return this;
  }

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

  $mod(mod: ts.Modifier) {
    this.#mods.push(mod);
    return this;
  }

  // Set optional
  $optional() {
    this.#optional = true;
    return this;
  }

  // Set initializer
  $init(initializer: ts.Expression) {
    this.#initializer = initializer;
    return this;
  }

  get(): ts.PropertyDeclaration {
    this.#decl = ts.factory.createPropertyDeclaration(
      this.#mods,
      this.#name,
      this.#optional
        ? ts.factory.createToken(ts.SyntaxKind.QuestionToken)
        : undefined,
      this.#type,
      this.#initializer,
    );
    return this.#decl;
  }

  update(): ts.PropertyDeclaration {
    if (!this.#decl) throw new Error("Property declaration not built");

    return ts.factory.updatePropertyDeclaration(
      this.#decl,
      this.#mods,
      this.#decl.name,
      this.#optional
        ? ts.factory.createToken(ts.SyntaxKind.QuestionToken)
        : undefined,
      this.#type,
      this.#initializer,
    );
  }
}

export const prop = (name: string, type?: ts.TypeNode, optional?: boolean) =>
  buildFluentApi(PropBuilder, { name, type, optional });
