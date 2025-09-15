import { Biome, Distribution } from "@biomejs/js-api";
import ts from "typescript";

export interface PostprocessOptions {
  biome?: { projectDir: string };
}

export interface PrintOptions {
  preserveNewlines?: boolean;
  insertBlankLinesBetweenStatements?: boolean;
  newLine?: ts.NewLineKind;
  removeComments?: boolean;
}

/**
 * Print TypeScript statements to a string
 */
export async function print(
  sourceFile: ts.SourceFile,
  postprocess?: PostprocessOptions,
  options?: PrintOptions,
): Promise<string> {
  const printOptions = {
    preserveNewlines: true,
    insertBlankLinesBetweenStatements: true,
    newLine: ts.NewLineKind.LineFeed,
    removeComments: false,
    ...options,
  };

  const printer = ts.createPrinter({
    newLine: printOptions.newLine,
    removeComments: printOptions.removeComments,
    omitTrailingSemicolon: false,
  });

  let result: string;

  if (
    printOptions.preserveNewlines ||
    printOptions.insertBlankLinesBetweenStatements
  ) {
    // Print statements individually with custom spacing
    const statements = sourceFile.statements;
    const printedStatements: string[] = [];

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (!statement) continue;

      const printed = printer.printNode(
        ts.EmitHint.Unspecified,
        statement,
        sourceFile,
      );

      printedStatements.push(printed);

      // Add blank lines between certain statement types for better readability
      if (
        printOptions.insertBlankLinesBetweenStatements &&
        i < statements.length - 1
      ) {
        const currentStatement = statements[i];
        const nextStatement = statements[i + 1];

        // Add blank line between classes, interfaces, functions, etc.
        if (
          currentStatement &&
          nextStatement &&
          shouldAddBlankLine(currentStatement, nextStatement)
        ) {
          printedStatements.push("");
        }
      }
    }

    result = printedStatements.join("\n");
  } else {
    result = printer.printFile(sourceFile);
  }

  if (postprocess?.biome) {
    const biome = await Biome.create({ distribution: Distribution.NODE });
    const { projectKey } = await biome.openProject(
      postprocess.biome.projectDir,
    );

    const formatted = await biome.formatContent(projectKey, result, {
      filePath: sourceFile.fileName,
    });

    return formatted.content;
  }

  return result;
}

/**
 * Determine if a blank line should be added between two statements
 */
function shouldAddBlankLine(
  current: ts.Statement,
  next: ts.Statement,
): boolean {
  // Add blank lines between:
  // - Classes
  // - Interfaces
  // - Functions
  // - Type aliases
  // - Enums
  // - Different statement types

  const isSignificantStatement = (stmt: ts.Statement): boolean => {
    return (
      ts.isClassDeclaration(stmt) ||
      ts.isInterfaceDeclaration(stmt) ||
      ts.isFunctionDeclaration(stmt) ||
      ts.isTypeAliasDeclaration(stmt) ||
      ts.isEnumDeclaration(stmt)
    );
  };

  // Always add blank line before significant statements (unless current is import)
  if (isSignificantStatement(next) && !ts.isImportDeclaration(current)) {
    return true;
  }

  // Add blank line after significant statements (unless next is export/import)
  if (
    isSignificantStatement(current) &&
    !ts.isImportDeclaration(next) &&
    !ts.isExportDeclaration(next)
  ) {
    return true;
  }

  // Add blank line between different statement types
  if (current.kind !== next.kind) {
    // Exception: don't add blank line between imports
    if (ts.isImportDeclaration(current) && ts.isImportDeclaration(next)) {
      return false;
    }
    // Exception: don't add blank line between variable statements
    if (ts.isVariableStatement(current) && ts.isVariableStatement(next)) {
      return false;
    }
    return true;
  }

  return false;
}
