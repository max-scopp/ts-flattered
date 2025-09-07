import ts from "typescript";
import { type BuildableAST, buildFluentApi } from "../utils/buildFluentApi";
import { $private, $protected, $public, $readonly } from "./modifier";

class ParamsBuilder implements BuildableAST {
  #decl: ts.ParameterDeclaration;

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
    this.#decl = ts.factory.createParameterDeclaration(
      undefined, // modifiers
      undefined, // no dotDotDotToken for now
      name,
      optional
        ? ts.factory.createToken(ts.SyntaxKind.QuestionToken)
        : undefined,
      type,
      initializer,
    );
  }

  // Fluent modifier methods
  $readonly() {
    this.#decl = ts.factory.updateParameterDeclaration(
      this.#decl,
      [...(this.#decl.modifiers || []), $readonly()],
      this.#decl.dotDotDotToken,
      this.#decl.name,
      this.#decl.questionToken,
      this.#decl.type,
      this.#decl.initializer,
    );
    return this;
  }

  $private() {
    this.#decl = ts.factory.updateParameterDeclaration(
      this.#decl,
      [...(this.#decl.modifiers || []), $private()],
      this.#decl.dotDotDotToken,
      this.#decl.name,
      this.#decl.questionToken,
      this.#decl.type,
      this.#decl.initializer,
    );
    return this;
  }

  $protected() {
    this.#decl = ts.factory.updateParameterDeclaration(
      this.#decl,
      [...(this.#decl.modifiers || []), $protected()],
      this.#decl.dotDotDotToken,
      this.#decl.name,
      this.#decl.questionToken,
      this.#decl.type,
      this.#decl.initializer,
    );
    return this;
  }

  $public() {
    this.#decl = ts.factory.updateParameterDeclaration(
      this.#decl,
      [...(this.#decl.modifiers || []), $public()],
      this.#decl.dotDotDotToken,
      this.#decl.name,
      this.#decl.questionToken,
      this.#decl.type,
      this.#decl.initializer,
    );
    return this;
  }

  $mod(mod: ts.Modifier) {
    this.#decl = ts.factory.updateParameterDeclaration(
      this.#decl,
      [...(this.#decl.modifiers || []), mod],
      this.#decl.dotDotDotToken,
      this.#decl.name,
      this.#decl.questionToken,
      this.#decl.type,
      this.#decl.initializer,
    );
    return this;
  }

  // Set optional
  $optional() {
    this.#decl = ts.factory.updateParameterDeclaration(
      this.#decl,
      this.#decl.modifiers,
      this.#decl.dotDotDotToken,
      this.#decl.name,
      ts.factory.createToken(ts.SyntaxKind.QuestionToken),
      this.#decl.type,
      this.#decl.initializer,
    );
    return this;
  }

  // Set initializer
  $init(initializer: ts.Expression) {
    this.#decl = ts.factory.updateParameterDeclaration(
      this.#decl,
      this.#decl.modifiers,
      this.#decl.dotDotDotToken,
      this.#decl.name,
      this.#decl.questionToken,
      this.#decl.type,
      initializer,
    );
    return this;
  }

  get(): ts.ParameterDeclaration {
    return this.#decl;
  }
}

export const param = (
  name: string,
  type?: ts.TypeNode,
  optional?: boolean,
  initializer?: ts.Expression,
) => buildFluentApi(ParamsBuilder, { name, type, optional, initializer });
