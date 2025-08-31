import type { Scope } from "ts-morph";

export interface TsFlatteredParam {
  name: string;
  type: string;
  scope?: Scope;
  readonly?: boolean;
  isRestParameter?: boolean;
}

export function param(
  name: string,
  type: string,
  readonly?: boolean,
  scope?: Scope,
): TsFlatteredParam {
  let actualName = name;
  let isRestParameter = false;

  if (name.startsWith("...")) {
    actualName = name.slice(3);
    isRestParameter = true;
  }

  return {
    name: actualName,
    type,
    scope,
    readonly,
    isRestParameter,
  };
}
