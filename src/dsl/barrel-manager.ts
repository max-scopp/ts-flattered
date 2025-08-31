import type { SourceFile } from "ts-morph";
import type { TsFlatteredFile } from "./registry";

export interface BarrelOptions {
  /** RegExp pattern to match file paths to include */
  pathMatcher?: RegExp;
  /** Specific symbols to export from matched files */
  symbols?: string[];
}

/**
 * Add barrel exports to a source file
 */
export function addBarrelExports(
  sourceFile: SourceFile,
  fileName: string,
  allFiles: TsFlatteredFile[],
  barrelConfig: BarrelOptions | boolean,
): void {
  if (!barrelConfig) return;

  const barrelOpts = barrelConfig === true ? {} : barrelConfig;

  for (const file of allFiles) {
    if (!shouldIncludeFileInBarrel(file, fileName, barrelOpts)) {
      continue;
    }

    const moduleSpecifier = `./${file.name.replace(/.tsx?$/, "")}`;

    if (barrelOpts.symbols && barrelOpts.symbols.length > 0) {
      // Export only specific symbols
      sourceFile.addExportDeclaration({
        namedExports: barrelOpts.symbols,
        moduleSpecifier,
      });
    } else {
      // Export all symbols from the file
      const fileExports: string[] = [];
      for (const stmt of file.statements) {
        fileExports.push(...stmt.getExportedSymbols());
      }

      if (fileExports.length > 0) {
        sourceFile.addExportDeclaration({
          namedExports: fileExports,
          moduleSpecifier,
        });
      }
    }
  }
}

function shouldIncludeFileInBarrel(
  file: TsFlatteredFile,
  currentFileName: string,
  barrelOpts: BarrelOptions,
): boolean {
  // Always skip self
  if (file.name === currentFileName) return false;

  // If path matcher is provided, use it to filter files
  if (barrelOpts.pathMatcher) {
    return barrelOpts.pathMatcher.test(file.name);
  }

  // Default: include all files (except self)
  return true;
}
