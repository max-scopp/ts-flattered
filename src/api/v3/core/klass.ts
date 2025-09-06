import ts from "typescript";
import { type BuildableAST, buildFluentApi } from "../utils/buildFluentApi";
import { $abstract, $export, $readonly } from "./modifier";

class KlassBuilder implements BuildableAST {
  #decl: ts.ClassDeclaration | null = null;
  #mods: ts.ModifierLike[];
  #members: ts.ClassElement[];
  #name: string;
  #typeParams: ts.TypeParameterDeclaration[];
  #heritageClauses: ts.HeritageClause[];

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
    this.#name = name;
    this.#members = members ?? [];
    this.#mods = mods ?? [];
    this.#typeParams = typeParams ?? [];
    this.#heritageClauses = heritage ?? [];
  }

  // Fluent modifier methods
  $export() {
    this.#mods.push($export());
    return this;
  }

  $abstract() {
    this.#mods.push($abstract());
    return this;
  }

  $readonly() {
    this.#mods.push($readonly());
    return this;
  }

  $mod(mod: ts.Modifier) {
    this.#mods.push(mod);
    return this;
  }

  addMember(member: ts.ClassElement) {
    this.#members.push(member);
    return this;
  }

  addTypeParam(param: ts.TypeParameterDeclaration) {
    this.#typeParams.push(param);
    return this;
  }

  build(): ts.ClassDeclaration {
    this.#decl = ts.factory.createClassDeclaration(
      this.#mods,
      this.#name,
      this.#typeParams,
      this.#heritageClauses,
      this.#members,
    );
    return this.#decl;
  }

  update(): ts.ClassDeclaration {
    if (!this.#decl) throw new Error("Class declaration not built");

    return ts.factory.updateClassDeclaration(
      this.#decl,
      this.#mods,
      this.#decl.name,
      this.#typeParams,
      this.#heritageClauses,
      this.#members,
    );
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
