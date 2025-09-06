import ts from "typescript";

export const block = (stmts: (ts.Statement | ts.Expression)[]): ts.Block => {
  const statements = stmts.map((stmt) =>
    ts.isStatement(stmt) ? stmt : ts.factory.createExpressionStatement(stmt),
  );
  return ts.factory.createBlock(statements, true);
};
