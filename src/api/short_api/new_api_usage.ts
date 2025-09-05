import ts from "typescript";
import {
  _block,
  _classDecl,
  _ctor,
  _exprStmt,
  _methodDecl,
  _param,
  _propDecl,
  _tkn,
  _typeRef,
  $,
} from "../statements";

export interface ParamOptions {
  name: string;
  type: string;
  scope?: "public" | "private" | "protected";
  isOptional?: boolean;
  isReadonly?: boolean;
  defaultValue?: string;
  isRestParameter?: boolean;
}

export function param(options: ParamOptions): ts.ParameterDeclaration {
  const {
    name,
    type,
    scope,
    isOptional,
    isReadonly,
    defaultValue,
    isRestParameter,
  } = options;

  const modifiers: ts.ModifierLike[] = [];
  if (scope === "private") {
    modifiers.push(_tkn(ts.SyntaxKind.PrivateKeyword));
  } else if (scope === "protected") {
    modifiers.push(_tkn(ts.SyntaxKind.ProtectedKeyword));
  } else if (scope === "public") {
    modifiers.push(_tkn(ts.SyntaxKind.PublicKeyword));
  }
  if (isReadonly) {
    modifiers.push(_tkn(ts.SyntaxKind.ReadonlyKeyword));
  }

  return _param({
    modifiers: modifiers.length > 0 ? modifiers : undefined,
    dotDotDotToken: isRestParameter
      ? _tkn(ts.SyntaxKind.DotDotDotToken)
      : undefined,
    name,
    questionToken: isOptional ? _tkn(ts.SyntaxKind.QuestionToken) : undefined,
    type: _typeRef(type),
    initializer: defaultValue ? $(defaultValue) : undefined,
  });
}

export interface PropertyOptions {
  name: string;
  type: string;
  scope?: "public" | "private" | "protected";
  isReadonly?: boolean;
  isStatic?: boolean;
  initializer?: string;
}

export function property(options: PropertyOptions): ts.PropertyDeclaration {
  const { name, type, scope, isReadonly, isStatic, initializer } = options;

  const modifiers: ts.ModifierLike[] = [];
  if (scope === "private") {
    modifiers.push(_tkn(ts.SyntaxKind.PrivateKeyword));
  } else if (scope === "protected") {
    modifiers.push(_tkn(ts.SyntaxKind.ProtectedKeyword));
  } else if (scope === "public") {
    modifiers.push(_tkn(ts.SyntaxKind.PublicKeyword));
  }
  if (isReadonly) {
    modifiers.push(_tkn(ts.SyntaxKind.ReadonlyKeyword));
  }
  if (isStatic) {
    modifiers.push(_tkn(ts.SyntaxKind.StaticKeyword));
  }

  return _propDecl({
    modifiers: modifiers.length > 0 ? modifiers : undefined,
    name,
    type: _typeRef(type),
    initializer: initializer ? $(initializer) : undefined,
  });
}

export interface MethodOptions {
  name: string;
  parameters?: (ParamOptions | ts.ParameterDeclaration)[];
  returnType?: string;
  scope?: "public" | "private" | "protected";
  isStatic?: boolean;
  isAsync?: boolean;
  body?: ts.Statement[] | string;
}

export function method(options: MethodOptions): ts.MethodDeclaration {
  const {
    name,
    parameters = [],
    returnType,
    scope,
    isStatic,
    isAsync,
    body,
  } = options;

  const modifiers: ts.ModifierLike[] = [];
  if (scope === "private") {
    modifiers.push(_tkn(ts.SyntaxKind.PrivateKeyword));
  } else if (scope === "protected") {
    modifiers.push(_tkn(ts.SyntaxKind.ProtectedKeyword));
  } else if (scope === "public") {
    modifiers.push(_tkn(ts.SyntaxKind.PublicKeyword));
  }
  if (isStatic) {
    modifiers.push(_tkn(ts.SyntaxKind.StaticKeyword));
  }
  if (isAsync) {
    modifiers.push(_tkn(ts.SyntaxKind.AsyncKeyword));
  }

  const paramDecls = parameters.map((p) => {
    if (
      typeof p === "object" &&
      "name" in p &&
      typeof (p as ParamOptions).name === "string"
    ) {
      return param(p as ParamOptions);
    } else {
      return p as ts.ParameterDeclaration;
    }
  });

  let bodyBlock: ts.Block | undefined;
  if (typeof body === "string") {
    bodyBlock = _block(_exprStmt($(body)));
  } else if (Array.isArray(body)) {
    bodyBlock = _block(...body);
  }

  return _methodDecl({
    modifiers: modifiers.length > 0 ? modifiers : undefined,
    name,
    parameters: paramDecls,
    type: returnType ? _typeRef(returnType) : undefined,
    body: bodyBlock,
  });
}

export interface CtorOptions {
  parameters?: (ParamOptions | ts.ParameterDeclaration)[];
  scope?: "public" | "private" | "protected";
  body?: ts.Statement[] | string;
}

export function ctor(options: CtorOptions): ts.ConstructorDeclaration {
  const { parameters = [], scope, body } = options;

  const modifiers: ts.ModifierLike[] = [];
  if (scope === "private") {
    modifiers.push(_tkn(ts.SyntaxKind.PrivateKeyword));
  } else if (scope === "protected") {
    modifiers.push(_tkn(ts.SyntaxKind.ProtectedKeyword));
  } else if (scope === "public") {
    modifiers.push(_tkn(ts.SyntaxKind.PublicKeyword));
  }

  const paramDecls = parameters.map((p) => {
    if (
      typeof p === "object" &&
      "name" in p &&
      typeof (p as ParamOptions).name === "string"
    ) {
      return param(p as ParamOptions);
    } else {
      return p as ts.ParameterDeclaration;
    }
  });

  let bodyBlock: ts.Block | undefined;
  if (typeof body === "string") {
    bodyBlock = _block(_exprStmt($(body)));
  } else if (Array.isArray(body)) {
    bodyBlock = _block(...body);
  }

  return _ctor({
    modifiers: modifiers.length > 0 ? modifiers : undefined,
    parameters: paramDecls,
    body: bodyBlock,
  });
}

export interface ClassOptions {
  name: string;
  isExported?: boolean;
  extends?: string;
  implements?: string[];
  members: (ts.ClassElement | PropertyOptions | MethodOptions | CtorOptions)[];
}

export function cls(options: ClassOptions): ts.ClassDeclaration {
  const {
    name,
    isExported,
    extends: extendsClass,
    implements: implementsInterfaces,
    members,
  } = options;

  const modifiers: ts.ModifierLike[] = [];
  if (isExported) {
    modifiers.push(_tkn(ts.SyntaxKind.ExportKeyword));
  }

  const heritageClauses: ts.HeritageClause[] = [];
  if (extendsClass) {
    heritageClauses.push(
      ts.factory.createHeritageClause(ts.SyntaxKind.ExtendsKeyword, [
        ts.factory.createExpressionWithTypeArguments(
          ts.factory.createIdentifier(extendsClass),
          undefined,
        ),
      ]),
    );
  }
  if (implementsInterfaces && implementsInterfaces.length > 0) {
    heritageClauses.push(
      ts.factory.createHeritageClause(
        ts.SyntaxKind.ImplementsKeyword,
        implementsInterfaces.map((i) =>
          ts.factory.createExpressionWithTypeArguments(
            ts.factory.createIdentifier(i),
            undefined,
          ),
        ),
      ),
    );
  }

  const classMembers: ts.ClassElement[] = members.map((member) => {
    if ("name" in member && "type" in member && !("parameters" in member)) {
      // It's a property
      return property(member as PropertyOptions);
    } else if ("parameters" in member) {
      // It's a method or ctor
      if ("name" in member) {
        return method(member as MethodOptions);
      } else {
        return ctor(member as CtorOptions);
      }
    } else {
      // It's already a ClassElement
      return member as ts.ClassElement;
    }
  });

  return _classDecl({
    modifiers: modifiers.length > 0 ? modifiers : undefined,
    name,
    heritageClauses: heritageClauses.length > 0 ? heritageClauses : undefined,
    members: classMembers,
  });
}

export function code(statements: string | ts.Statement[]): ts.Statement[] {
  if (typeof statements === "string") {
    // Simple string body - wrap in expression statement
    return [_exprStmt($(statements))];
  } else {
    return statements;
  }
}
