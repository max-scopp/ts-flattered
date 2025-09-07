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
  #decl: ts.PropertyDeclaration;

  constructor({
    name,
    type,
    optional,
  }: {
    name: string;
    type?: ts.TypeNode;
    optional?: boolean;
  }) {
    this.#decl = ts.factory.createPropertyDeclaration(
      undefined, // modifiers
      name,
      optional
        ? ts.factory.createToken(ts.SyntaxKind.QuestionToken)
        : undefined,
      type,
      undefined, // initializer
    );
  }

  // Fluent modifier methods
  $export() {
    this.#decl = ts.factory.updatePropertyDeclaration(
      this.#decl,
      [...(this.#decl.modifiers || []), $export()],
      this.#decl.name,
      this.#decl.questionToken,
      this.#decl.type,
      this.#decl.initializer,
    );
    return this;
  }

  $readonly() {
    this.#decl = ts.factory.updatePropertyDeclaration(
      this.#decl,
      [...(this.#decl.modifiers || []), $readonly()],
      this.#decl.name,
      this.#decl.questionToken,
      this.#decl.type,
      this.#decl.initializer,
    );
    return this;
  }

  $static() {
    this.#decl = ts.factory.updatePropertyDeclaration(
      this.#decl,
      [...(this.#decl.modifiers || []), $static()],
      this.#decl.name,
      this.#decl.questionToken,
      this.#decl.type,
      this.#decl.initializer,
    );
    return this;
  }

  $private() {
    this.#decl = ts.factory.updatePropertyDeclaration(
      this.#decl,
      [...(this.#decl.modifiers || []), $private()],
      this.#decl.name,
      this.#decl.questionToken,
      this.#decl.type,
      this.#decl.initializer,
    );
    return this;
  }

  $protected() {
    this.#decl = ts.factory.updatePropertyDeclaration(
      this.#decl,
      [...(this.#decl.modifiers || []), $protected()],
      this.#decl.name,
      this.#decl.questionToken,
      this.#decl.type,
      this.#decl.initializer,
    );
    return this;
  }

  $public() {
    this.#decl = ts.factory.updatePropertyDeclaration(
      this.#decl,
      [...(this.#decl.modifiers || []), $public()],
      this.#decl.name,
      this.#decl.questionToken,
      this.#decl.type,
      this.#decl.initializer,
    );
    return this;
  }

  $mod(mod: ts.Modifier) {
    this.#decl = ts.factory.updatePropertyDeclaration(
      this.#decl,
      [...(this.#decl.modifiers || []), mod],
      this.#decl.name,
      this.#decl.questionToken,
      this.#decl.type,
      this.#decl.initializer,
    );
    return this;
  }

  // Set optional
  $optional() {
    this.#decl = ts.factory.updatePropertyDeclaration(
      this.#decl,
      this.#decl.modifiers,
      this.#decl.name,
      ts.factory.createToken(ts.SyntaxKind.QuestionToken),
      this.#decl.type,
      this.#decl.initializer,
    );
    return this;
  }

  // Set initializer
  $init(initializer: ts.Expression) {
    this.#decl = ts.factory.updatePropertyDeclaration(
      this.#decl,
      this.#decl.modifiers,
      this.#decl.name,
      this.#decl.questionToken,
      this.#decl.type,
      initializer,
    );
    return this;
  }

  get(): ts.PropertyDeclaration {
    return this.#decl;
  }
}

export const prop = (name: string, type?: ts.TypeNode, optional?: boolean) =>
  buildFluentApi(PropBuilder, { name, type, optional });
