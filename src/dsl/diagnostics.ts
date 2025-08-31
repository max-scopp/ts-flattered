import type { Project } from "ts-morph";
import { logger } from "../log";
import { mapDiagnosticToSource } from "./code";

/**
 * Run diagnostics on a project and log results with source mapping
 */
export function runDiagnostics(project: Project): void {
  logger.time("diagnostics-total");
  const globalDiagnostics = project.getPreEmitDiagnostics();
  logger.timeEnd("diagnostics-total");

  if (globalDiagnostics.length === 0) return;

  logger.time("diagnostics-processing");
  logger.warn(`Found ${globalDiagnostics.length} global diagnostic(s):`);

  for (const diagnostic of globalDiagnostics) {
    const sourceFile = diagnostic.getSourceFile();
    const message = diagnostic.getMessageText();
    const lineNumber = diagnostic.getLineNumber();
    const fileName = sourceFile?.getBaseName() ?? "unknown";

    // Try to map the diagnostic back to the original source
    let locationInfo = `${fileName}:${lineNumber}`;
    if (sourceFile && lineNumber) {
      const generatedContent = sourceFile.getFullText();
      const originalSource = mapDiagnosticToSource(
        generatedContent,
        lineNumber,
      );
      if (originalSource) {
        locationInfo = `${originalSource.file}:${originalSource.line}:${originalSource.column} (generated ${fileName}:${lineNumber})`;
      }
    }

    // Log error or warning based on diagnostic category
    if (diagnostic.getCategory() === 1) {
      logger.error(`  ${locationInfo}: ${message}`);
    } else {
      logger.warn(`  ${locationInfo}: ${message}`);
    }
  }

  logger.timeEnd("diagnostics-processing");
}
