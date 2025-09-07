import ts from "typescript";
import { type BuildableAST, buildFluentApi } from "../utils/buildFluentApi";

// If Statement Builder
class IfBuilder implements BuildableAST {
  #stmt: ts.IfStatement;

  constructor({
    condition,
    thenStatement,
    elseStatement,
  }: {
    condition: ts.Expression;
    thenStatement?: ts.Statement;
    elseStatement?: ts.Statement;
  }) {
    this.#stmt = ts.factory.createIfStatement(
      condition,
      thenStatement ?? ts.factory.createBlock([]),
      elseStatement,
    );
  }

  thenClause(statement: ts.Statement) {
    this.#stmt = ts.factory.updateIfStatement(
      this.#stmt,
      this.#stmt.expression,
      statement,
      this.#stmt.elseStatement,
    );
    return this;
  }

  elseClause(statement: ts.Statement) {
    this.#stmt = ts.factory.updateIfStatement(
      this.#stmt,
      this.#stmt.expression,
      this.#stmt.thenStatement,
      statement,
    );
    return this;
  }

  get(): ts.IfStatement {
    return this.#stmt;
  }
}

// Expression Statement helpers
export const exprStmt = (expression: ts.Expression): ts.ExpressionStatement =>
  ts.factory.createExpressionStatement(expression);

// Simplified if statement API
export const if_ = (
  condition: ts.Expression,
  thenStatement?: ts.Statement,
  elseStatement?: ts.Statement,
) => buildFluentApi(IfBuilder, { condition, thenStatement, elseStatement });

// While Statement Builder
class WhileStatementBuilder implements BuildableAST {
  #stmt: ts.WhileStatement;

  constructor({
    condition,
    statement,
  }: {
    condition: ts.Expression;
    statement?: ts.Statement;
  }) {
    this.#stmt = ts.factory.createWhileStatement(
      condition,
      statement ?? ts.factory.createBlock([]),
    );
  }

  body(statement: ts.Statement) {
    this.#stmt = ts.factory.updateWhileStatement(
      this.#stmt,
      this.#stmt.expression,
      statement,
    );
    return this;
  }

  get(): ts.WhileStatement {
    return this.#stmt;
  }
}

// For Statement Builder
class ForStatementBuilder implements BuildableAST {
  #stmt: ts.ForStatement;

  constructor({
    initializer,
    condition,
    incrementor,
    statement,
  }: {
    initializer?: ts.ForInitializer;
    condition?: ts.Expression;
    incrementor?: ts.Expression;
    statement?: ts.Statement;
  }) {
    this.#stmt = ts.factory.createForStatement(
      initializer,
      condition,
      incrementor,
      statement ?? ts.factory.createBlock([]),
    );
  }

  body(statement: ts.Statement) {
    this.#stmt = ts.factory.updateForStatement(
      this.#stmt,
      this.#stmt.initializer,
      this.#stmt.condition,
      this.#stmt.incrementor,
      statement,
    );
    return this;
  }

  get(): ts.ForStatement {
    return this.#stmt;
  }
}

export const while_ = (condition: ts.Expression) =>
  buildFluentApi(WhileStatementBuilder, { condition });

export const for_ = (
  initializer?: ts.ForInitializer,
  condition?: ts.Expression,
  incrementor?: ts.Expression,
) =>
  buildFluentApi(ForStatementBuilder, { initializer, condition, incrementor });
