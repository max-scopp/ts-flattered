```ts
import type ts from "typescript";

class NotImplemented extends Error {
  constructor() {
    super("Not implemented");
  }
}

export namespace tsf {
  // #region Declarations

  export const func = (
    name: string,
    args: { name: string; type?: ts.TypeNode }[],
    body: ts.Block,
    mods?: ts.ModifierLike[],
  ): ts.FunctionDeclaration => {
    throw new NotImplemented();
  };

  export const prop = (
    name: string,
    type?: ts.TypeNode,
    mods?: ts.ModifierLike[],
  ): ts.PropertyDeclaration => {
    throw new NotImplemented();
  };

  export const method = (
    name: string,
    args: { name: string; type?: ts.TypeNode }[],
    body: ts.Block,
    mods?: ts.ModifierLike[],
  ): ts.MethodDeclaration => {
    throw new NotImplemented();
  };

  export const ctor = (
    args: { name: string; type?: ts.TypeNode }[],
    body: ts.Block,
    mods?: ts.ModifierLike[],
  ): ts.ConstructorDeclaration => {
    throw new NotImplemented();
  };

  // #endregion

  // #region Statements
  export const block = (stmts: (ts.Statement | ts.Expression)[]): ts.Block => {
    throw new NotImplemented();
  };
  export const exprStmt = (expr: ts.Expression): ts.ExpressionStatement => {
    throw new NotImplemented();
  };
  export const ret = (expr?: ts.Expression): ts.ReturnStatement => {
    throw new NotImplemented();
  };
  // #endregion

  // #region Expressions
  export const call = (
    fn: string | ts.Expression,
    args: ts.Expression[],
  ): ts.CallExpression => {
    throw new NotImplemented();
  };

  export const assign = (
    lhs: string | ts.Expression,
    rhs: ts.Expression,
  ): ts.BinaryExpression => {
    throw new NotImplemented();
  };

  export const this_ = (): ts.ThisExpression => {
    throw new NotImplemented();
  };

  export const super_ = (): ts.SuperExpression => {
    throw new NotImplemented();
  };

  // #endregion

  // #region Literals
  export const lit = (value: string | number | boolean): ts.Expression => {
    throw new NotImplemented();
  };
  // #endregion

  // #region Types
  // #endregion

  // #region Modifiers
  export namespace $mod {
    export const export_ = (): ts.Modifier => {
      throw new NotImplemented();
    };
    export const async = (): ts.Modifier => {
      throw new NotImplemented();
    };
    export const readonly = (): ts.Modifier => {
      throw new NotImplemented();
    };
  }
  // #endregion
}

```
