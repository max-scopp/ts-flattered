import { Biome, Distribution } from "@biomejs/js-api";
import ts from "typescript";

export interface PostprocessOptions {
  biome?: { projectDir: string };
}

/**
 * Print TypeScript source file to a string with good formatting defaults
 */
export async function print(
  sourceFile: ts.SourceFile,
  postprocess?: PostprocessOptions,
): Promise<string> {
  try {
    // Validate source file before printing
    if (!sourceFile) {
      throw new Error("Source file is null or undefined");
    }

    // Ensure the source file has required properties
    if (!sourceFile.fileName) {
      (sourceFile as any).fileName = "unknown.ts";
    }

    if (!sourceFile.statements) {
      console.warn("Source file has no statements array, creating empty array");
      (sourceFile as any).statements = [];
    }

    // Check for corrupted fileName
    if (sourceFile.fileName && sourceFile.fileName.length > 500) {
      console.warn(`Source file has suspiciously long fileName: ${sourceFile.fileName.substring(0, 100)}...`);
      (sourceFile as any).fileName = "corrupted-filename.ts";
    }

    // Validate that this looks like a proper source file
    if (typeof sourceFile.kind !== 'undefined' && sourceFile.kind !== ts.SyntaxKind.SourceFile) {
      console.warn(`Source file has unexpected kind: ${sourceFile.kind}`);
    }

    // Check if the source file has the required structure for printing
    if (!sourceFile.hasOwnProperty('kind')) {
      console.warn("Source file missing 'kind' property, attempting to reconstruct");
      (sourceFile as any).kind = ts.SyntaxKind.SourceFile;
    }

    // Ensure essential properties are present
    if (sourceFile.languageVersion === undefined) {
      (sourceFile as any).languageVersion = ts.ScriptTarget.Latest;
    }

    const printer = ts.createPrinter({
      newLine: ts.NewLineKind.LineFeed,
      removeComments: false,
      omitTrailingSemicolon: false,
    });

    let result: string;

    try {
      result = printer.printFile(sourceFile);
    } catch (printError) {
      console.error("Primary print method failed, attempting alternative approach:", printError);

      // Fallback: try to print individual statements
      if (sourceFile.statements && sourceFile.statements.length > 0) {
        try {
          const statementsText = sourceFile.statements
            .map(stmt => printer.printNode(ts.EmitHint.Unspecified, stmt, sourceFile))
            .join('\n');
          result = statementsText;
          console.log("Successfully printed using statement-by-statement approach");
        } catch (statementError) {
          console.error("Statement-by-statement printing also failed:", statementError);
          const errorMessage = printError instanceof Error ? printError.message : String(printError);
          throw new Error(`Unable to print source file: ${errorMessage}`);
        }
      } else {
        console.warn("Source file has no statements to print");
        result = "";
      }
    }

    if (postprocess?.biome && result.length > 0) {
      try {
        const biome = await Biome.create({ distribution: Distribution.NODE });
        const { projectKey } = await biome.openProject(
          postprocess.biome.projectDir,
        );

        const formatted = await biome.formatContent(projectKey, result, {
          filePath: sourceFile.fileName,
        });

        return formatted.content;
      } catch (biomeError) {
        console.warn("Biome formatting failed, returning unformatted content:", biomeError);
        return result;
      }
    }

    return result;
  } catch (error) {
    console.error("Error printing source file:", error);
    console.error("Source file properties:", {
      fileName: sourceFile?.fileName,
      hasStatements: !!sourceFile?.statements,
      statementsLength: sourceFile?.statements?.length,
      isDeclarationFile: sourceFile?.isDeclarationFile,
      kind: sourceFile?.kind,
      languageVersion: sourceFile?.languageVersion
    });

    // Last resort fallback
    if (sourceFile?.statements && sourceFile.statements.length > 0) {
      try {
        // Try to manually construct basic content
        const printer = ts.createPrinter();
        const content = sourceFile.statements
          .map(stmt => {
            try {
              return printer.printNode(ts.EmitHint.Unspecified, stmt, sourceFile);
            } catch {
              return "// Failed to print statement";
            }
          })
          .join('\n');
        console.log("Used emergency fallback printing method");
        return content;
      } catch (fallbackError) {
        console.error("Emergency fallback also failed:", fallbackError);
      }
    }

    return "// Error: Could not print source file content";
  }
}
