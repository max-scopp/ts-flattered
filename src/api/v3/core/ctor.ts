import ts from "typescript";
import { type BuildableAST, buildFluentApi } from "../utils/buildFluentApi";
import { $private, $protected, $public } from "./modifier";
import { param } from "./params";

class CtorBuilder implements BuildableAST {
  #decl: ts.ConstructorDeclaration | null = null;
  #mods: ts.ModifierLike[];
  #parameters: ts.ParameterDeclaration[];
  #body: ts.Block;

  constructor({
    args,
    body,
  }: {
    args: ts.ParameterDeclaration[];
    body: ts.Block;
  }) {
    this.#parameters = args;
    this.#body = body;
    this.#mods = [];
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

  $mod(mod: ts.Modifier) {
    this.#mods.push(mod);
    return this;
  }

  // Add parameter
  addArg(arg: {
    name: string;
    type?: ts.TypeNode;
    optional?: boolean;
    modifiers?: ts.ModifierLike[];
    dotDotDot?: boolean;
    initializer?: ts.Expression;
  }) {
    const p = param(arg.name, arg.type, arg.optional, arg.initializer);

    // Apply modifiers (filter out decorators)
    if (arg.modifiers) {
      arg.modifiers.forEach((mod) => {
        if (ts.isModifier(mod)) {
          p.$mod(mod);
        }
      });
    }

    let paramDecl = p.get();

    // Handle dotDotDot (rest parameters)
    if (arg.dotDotDot) {
      paramDecl = ts.factory.updateParameterDeclaration(
        paramDecl,
        paramDecl.modifiers,
        ts.factory.createToken(ts.SyntaxKind.DotDotDotToken),
        paramDecl.name,
        paramDecl.questionToken,
        paramDecl.type,
        paramDecl.initializer,
      );
    }

    this.#parameters.push(paramDecl);
    return this;
  }

  get(): ts.ConstructorDeclaration {
    this.#decl = ts.factory.createConstructorDeclaration(
      this.#mods,
      this.#parameters,
      this.#body,
    );
    return this.#decl;
  }

  update(): ts.ConstructorDeclaration {
    if (!this.#decl) throw new Error("Constructor declaration not built");

    return ts.factory.updateConstructorDeclaration(
      this.#decl,
      this.#mods,
      this.#parameters,
      this.#body,
    );
  }
}

export const ctor = (args: ts.ParameterDeclaration[], body: ts.Block) =>
  buildFluentApi(CtorBuilder, { args, body });
