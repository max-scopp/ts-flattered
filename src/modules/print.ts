import ts from "typescript";

/**
 * Print TypeScript statements to a string
 */
export function print(...statements: ts.Statement[]): string {
  const sourceFile = ts.createSourceFile(
    "temp.ts",
    "",
    ts.ScriptTarget.Latest,
    false,
    ts.ScriptKind.TS
  );

  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });

  // Create a temporary source file with the statements
  const tempSourceFile = ts.factory.updateSourceFile(sourceFile, statements);

  return printer.printFile(tempSourceFile);
}
