import ts from "typescript";

/**
 * Print TypeScript statements to a string
 */
export function print(sourceFile: ts.SourceFile): string {
    // Use the simpler printer from TypeScript
    const printer = ts.createPrinter({
      newLine: ts.NewLineKind.LineFeed,
      removeComments: false
    });

    return printer.printFile(sourceFile);
}
