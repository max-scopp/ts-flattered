import ts from "typescript";
import { type BuildableAST, buildFluentApi } from "../utils/buildFluentApi";
import { $private, $protected, $public } from "./modifier";
import { param } from "./params";

class CtorBuilder implements BuildableAST {
  #decl: ts.ConstructorDeclaration;

  constructor({
    args,
    body,
  }: {
    args: ts.ParameterDeclaration[];
    body: ts.Block;
  }) {
    this.#decl = ts.factory.createConstructorDeclaration(
      undefined, // modifiers
      args,
      body,
    );
  }

  // Fluent modifier methods
  $private() {
    this.#decl = ts.factory.updateConstructorDeclaration(
      this.#decl,
      [...(this.#decl.modifiers || []), $private()],
      this.#decl.parameters,
      this.#decl.body,
    );
    return this;
  }

  $protected() {
    this.#decl = ts.factory.updateConstructorDeclaration(
      this.#decl,
      [...(this.#decl.modifiers || []), $protected()],
      this.#decl.parameters,
      this.#decl.body,
    );
    return this;
  }

  $public() {
    this.#decl = ts.factory.updateConstructorDeclaration(
      this.#decl,
      [...(this.#decl.modifiers || []), $public()],
      this.#decl.parameters,
      this.#decl.body,
    );
    return this;
  }

  $mod(mod: ts.Modifier) {
    this.#decl = ts.factory.updateConstructorDeclaration(
      this.#decl,
      [...(this.#decl.modifiers || []), mod],
      this.#decl.parameters,
      this.#decl.body,
    );
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

    this.#decl = ts.factory.updateConstructorDeclaration(
      this.#decl,
      this.#decl.modifiers,
      [...this.#decl.parameters, paramDecl],
      this.#decl.body,
    );
    return this;
  }

  get(): ts.ConstructorDeclaration {
    return this.#decl;
  }
}

export const ctor = (args: ts.ParameterDeclaration[], body: ts.Block) =>
  buildFluentApi(CtorBuilder, { args, body });
