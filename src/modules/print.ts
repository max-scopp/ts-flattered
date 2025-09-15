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
  const printer = ts.createPrinter({
    newLine: ts.NewLineKind.LineFeed,
    removeComments: false,
    omitTrailingSemicolon: false,
  });

  const result = printer.printFile(sourceFile);

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
