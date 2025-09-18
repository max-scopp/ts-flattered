import { relative, dirname } from "path";
import { mkdir, writeFile } from "fs/promises";
import ts from "typescript";
import { print } from "../src/modules/print"; // Adjust import path as needed
import { programRegistry } from "your-registry-location"; // Adjust import as needed

/**
 * Corrected version of writeAllFiles function
 */
export async function writeAllFiles(
  inProgram: ts.Program,
  newSourceFiles: Map<string, ts.SourceFile>,
  ctx: PencelContext,
): Promise<void> {
  let progress = 1;

  const inCompilerOptions = inProgram.getCompilerOptions();

  const base = inCompilerOptions.rootDir ?? ".";
  const outBase = relative(ctx.cwd, getOutputBasePath(ctx));

  console.log(`Rewriting imports from base "${base}" to "${outBase}"`);

  // Debug registry state before rewriting
  console.log("Registry state before rewriting:");
  programRegistry.debugState();

  // Perform the import rewriting
  programRegistry.rewriteAllRelativeImports(base, outBase);

  // Debug registry state after rewriting
  console.log("Registry state after rewriting:");
  programRegistry.debugState();

  // IMPORTANT: Use getAllWithPaths() instead of getAll() to get files with updated paths
  const allFiles = programRegistry.getAllWithPaths();

  console.log(`Writing ${allFiles.size} files...`);

  await Promise.all(
    Array.from(allFiles.entries()).map(
      async ([filePath, sf], _idx, all) => {
        try {
          console.log(`Writing file: ${filePath}`);

          // Ensure directory exists
          await mkdir(dirname(filePath), { recursive: true });

          // Print the source file
          const printed = await print(sf, { biome: { projectDir: ctx.cwd } });

          // Check if content is empty and log warning
          if (printed.length === 0) {
            console.warn(`Warning: File ${filePath} has empty content!`);
            console.warn(`SourceFile properties:`, {
              fileName: sf.fileName,
              hasStatements: !!sf.getStatements,
              statementsLength: sf.getStatements?.()?.length
            });
          }

          progress++;
          percentage(progress / all.length, {
            prefix: "Writing",
          });

          return writeFile(filePath, printed);
        } catch (error) {
          console.error(`Error writing file ${filePath}:`, error);
          throw error;
        }
      },
    ),
  );

  console.log(`Successfully wrote ${allFiles.size} files`);
}

/**
 * Alternative approach: If you want to be extra safe, you can also
 * rewrite imports on individual files instead of using the registry method
 */
export async function writeAllFilesSafe(
  inProgram: ts.Program,
  newSourceFiles: Map<string, ts.SourceFile>,
  ctx: PencelContext,
): Promise<void> {
  let progress = 1;

  const inCompilerOptions = inProgram.getCompilerOptions();
  const base = inCompilerOptions.rootDir ?? ".";
  const outBase = relative(ctx.cwd, getOutputBasePath(ctx));

  // Get all files from registry
  const allFiles = programRegistry.getAll();

  await Promise.all(
    Array.from(allFiles.entries()).map(
      async ([originalPath, sf], _idx, all) => {
        try {
          // Calculate the new path for this specific file
          const relativePath = originalPath.startsWith(base)
            ? originalPath.substring(base.length).replace(/^[\/\\]/, "")
            : originalPath;
          const newPath = `${outBase}/${relativePath}`.replace(/[\/\\]+/g, "/");

          console.log(`Processing: ${originalPath} -> ${newPath}`);

          // Rewrite relative imports for this specific file
          sf.rewriteRelativeImports(originalPath, newPath);

          // Ensure directory exists
          await mkdir(dirname(newPath), { recursive: true });

          // Print the source file
          const printed = await print(sf, { biome: { projectDir: ctx.cwd } });

          if (printed.length === 0) {
            console.warn(`Warning: File ${newPath} has empty content!`);
          }

          progress++;
          percentage(progress / all.length, {
            prefix: "Writing",
          });

          return writeFile(newPath, printed);
        } catch (error) {
          console.error(`Error processing file ${originalPath}:`, error);
          throw error;
        }
      },
    ),
  );
}
