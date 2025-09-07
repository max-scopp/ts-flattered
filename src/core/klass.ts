import ts from "typescript";
import { type BuildableAST, buildFluentApi } from "../utils/buildFluentApi";
import { $abstract, $export, $readonly } from "./modifier";

export class KlassBuilder implements BuildableAST {
  #decl: ts.ClassDeclaration;

  constructor({
    name,
    members,
    mods,
    typeParams,
    heritage,
  }: {
    name: string;
    members?: ts.ClassElement[];
    mods?: ts.ModifierLike[];
    typeParams?: ts.TypeParameterDeclaration[];
    heritage?: ts.HeritageClause[];
  }) {
    this.#decl = ts.factory.createClassDeclaration(
      mods,
      ts.factory.createIdentifier(name),
      typeParams,
      heritage,
      members ?? [],
    );
  }

  // Fluent modifier methods
  $export() {
    this.#decl = ts.factory.updateClassDeclaration(
      this.#decl,
      [...(this.#decl.modifiers || []), $export()],
      this.#decl.name,
      this.#decl.typeParameters,
      this.#decl.heritageClauses,
      this.#decl.members,
    );
    return this;
  }

  $abstract() {
    this.#decl = ts.factory.updateClassDeclaration(
      this.#decl,
      [...(this.#decl.modifiers || []), $abstract()],
      this.#decl.name,
      this.#decl.typeParameters,
      this.#decl.heritageClauses,
      this.#decl.members,
    );
    return this;
  }

  $readonly() {
    this.#decl = ts.factory.updateClassDeclaration(
      this.#decl,
      [...(this.#decl.modifiers || []), $readonly()],
      this.#decl.name,
      this.#decl.typeParameters,
      this.#decl.heritageClauses,
      this.#decl.members,
    );
    return this;
  }

  $mod(mod: ts.Modifier) {
    this.#decl = ts.factory.updateClassDeclaration(
      this.#decl,
      [...(this.#decl.modifiers || []), mod],
      this.#decl.name,
      this.#decl.typeParameters,
      this.#decl.heritageClauses,
      this.#decl.members,
    );
    return this;
  }

  addMember(member: ts.ClassElement) {
    this.#decl = ts.factory.updateClassDeclaration(
      this.#decl,
      this.#decl.modifiers,
      this.#decl.name,
      this.#decl.typeParameters,
      this.#decl.heritageClauses,
      [...this.#decl.members, member],
    );
    return this;
  }

  addTypeParam(param: ts.TypeParameterDeclaration) {
    this.#decl = ts.factory.updateClassDeclaration(
      this.#decl,
      this.#decl.modifiers,
      this.#decl.name,
      [...(this.#decl.typeParameters || []), param],
      this.#decl.heritageClauses,
      this.#decl.members,
    );
    return this;
  }

  get(): ts.ClassDeclaration {
    return this.#decl;
  }
}

export const klass = (
  name: string,
  members: ts.ClassElement[] = [],
  mods?: ts.ModifierLike[],
) =>
  buildFluentApi(KlassBuilder, {
    name,
    members,
    mods,
  });
