import ts from "typescript";
import { type BuildableAST, buildFluentApi } from "../utils/buildFluentApi";
import { $private, $protected, $public, $readonly } from "./modifier";

class ParamsBuilder implements BuildableAST {
  #decl: ts.ParameterDeclaration | null = null;
  #mods: ts.ModifierLike[];
  #name: string;
  #type?: ts.TypeNode;
  #optional: boolean;
  #initializer?: ts.Expression;

  constructor({
    name,
    type,
    optional,
    initializer,
  }: {
    name: string;
    type?: ts.TypeNode;
    optional?: boolean;
    initializer?: ts.Expression;
  }) {
    this.#name = name;
    this.#type = type;
    this.#optional = optional ?? false;
    this.#initializer = initializer;
    this.#mods = [];
  }

  // Fluent modifier methods
  $readonly() {
    this.#mods.push($readonly());
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

  build(): ts.ParameterDeclaration {
    this.#decl = ts.factory.createParameterDeclaration(
      this.#mods,
      undefined, // no dotDotDotToken for now
      this.#name,
      this.#optional
        ? ts.factory.createToken(ts.SyntaxKind.QuestionToken)
        : undefined,
      this.#type,
      this.#initializer,
    );
    return this.#decl;
  }

  update(): ts.ParameterDeclaration {
    if (!this.#decl) throw new Error("Parameter declaration not built");

    return ts.factory.updateParameterDeclaration(
      this.#decl,
      this.#mods,
      this.#decl.dotDotDotToken,
      this.#decl.name,
      this.#optional
        ? ts.factory.createToken(ts.SyntaxKind.QuestionToken)
        : undefined,
      this.#type,
      this.#initializer,
    );
  }
}

export const param = (
  name: string,
  type?: ts.TypeNode,
  optional?: boolean,
  initializer?: ts.Expression,
) => buildFluentApi(ParamsBuilder, { name, type, optional, initializer });
