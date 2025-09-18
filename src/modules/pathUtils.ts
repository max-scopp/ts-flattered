import path from "path";
import ts from "typescript";

/**
 * Resolves a relative import path from one file location to another
 * @param importPath The original import path (e.g., "../../utils/helpers")
 * @param fromFile The original file path
 * @param toFile The target file path
 * @returns The new relative import path
 */
export function resolveRelativeImport(
  importPath: string,
  fromFile: string,
  toFile: string,
): string {
  // If it's not a relative import, return as-is
  if (!importPath.startsWith(".")) {
    return importPath;
  }

  // Get directory paths
  const fromDir = path.dirname(fromFile);
  const toDir = path.dirname(toFile);

  // Resolve the absolute path of the imported file
  const absoluteImportPath = path.resolve(fromDir, importPath);

  // Calculate the new relative path from the target location
  let newRelativePath = path.relative(toDir, absoluteImportPath);

  // Ensure forward slashes and proper relative path format
  newRelativePath = newRelativePath.replace(/\\/g, "/");

  // Ensure it starts with ./ or ../
  if (!newRelativePath.startsWith(".")) {
    newRelativePath = "./" + newRelativePath;
  }

  return newRelativePath;
}

/**
 * Rewrites an import path when a file is moved from one location to another
 * @param importPath The original import path
 * @param originalFilePath The original file path
 * @param newFilePath The new file path
 * @returns The rewritten import path
 */
export function rewriteImportPath(
  importPath: string,
  originalFilePath: string,
  newFilePath: string,
): string {
  return resolveRelativeImport(importPath, originalFilePath, newFilePath);
}

/**
 * Extracts the module specifier from an import declaration
 * @param importDecl The import declaration node
 * @returns The module specifier string
 */
export function getImportModuleSpecifier(importDecl: ts.ImportDeclaration): string {
  if (ts.isStringLiteral(importDecl.moduleSpecifier)) {
    return importDecl.moduleSpecifier.text;
  }
  return "";
}

/**
 * Checks if an import path is relative
 * @param importPath The import path to check
 * @returns True if the import is relative
 */
export function isRelativeImport(importPath: string): boolean {
  return importPath.startsWith("./") || importPath.startsWith("../");
}

/**
 * Normalizes a file path (handles different OS path separators)
 * @param filePath The file path to normalize
 * @returns Normalized path with forward slashes
 */
export function normalizePath(filePath: string): string {
  return filePath.replace(/\\/g, "/");
}

/**
 * Gets the relative path between two directories
 * @param from The source directory
 * @param to The target directory
 * @returns The relative path between directories
 */
export function getRelativePath(from: string, to: string): string {
  const relativePath = path.relative(from, to);
  return normalizePath(relativePath);
}

/**
 * Resolves the absolute path of an imported module
 * @param importPath The import path
 * @param fromFile The file making the import
 * @returns The resolved absolute path
 */
export function resolveImportPath(importPath: string, fromFile: string): string {
  if (!isRelativeImport(importPath)) {
    return importPath; // Return as-is for non-relative imports
  }

  const fromDir = path.dirname(fromFile);
  return path.resolve(fromDir, importPath);
}

/**
 * Calculates the new import path when moving a file
 * @param importPath The original import path
 * @param fromPath The original file location
 * @param toPath The new file location
 * @returns The adjusted import path
 */
export function calculateNewImportPath(
  importPath: string,
  fromPath: string,
  toPath: string,
): string {
  if (!isRelativeImport(importPath)) {
    return importPath; // Non-relative imports don't change
  }

  // Resolve the absolute target of the import
  const absoluteTarget = resolveImportPath(importPath, fromPath);

  // Calculate new relative path from new location
  const newDir = path.dirname(toPath);
  let newRelativePath = path.relative(newDir, absoluteTarget);

  // Normalize and ensure proper relative format
  newRelativePath = normalizePath(newRelativePath);

  if (!newRelativePath.startsWith(".")) {
    newRelativePath = "./" + newRelativePath;
  }

  return newRelativePath;
}
