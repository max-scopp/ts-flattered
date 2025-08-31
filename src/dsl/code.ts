type TemplateValue = string | number | boolean | null | undefined;

export interface SourceLocation {
  file: string;
  line: number;
  column: number;
}

interface CodeBlock {
  id: string;
  content: string;
  source: SourceLocation;
}

/**
 * Simple source mapping registry for tracking code blocks
 * Provides basic source-to-generated code mapping capabilities
 */
class SourceMapRegistry {
  private codeBlocks = new Map<string, CodeBlock>();
  private nextId = 1;

  register(content: string, source: SourceLocation): string {
    const id = `tscb:${this.nextId++}`;
    this.codeBlocks.set(id, { id, content, source });
    return id;
  }

  getSourceLocation(id: string): SourceLocation | undefined {
    return this.codeBlocks.get(id)?.source;
  }

  clear(): void {
    this.codeBlocks.clear();
    this.nextId = 1;
  }
}

export const sourceMapRegistry = new SourceMapRegistry();

/**
 * Simple stack trace parser to get call site information
 * Returns basic file location or defaults for error cases
 */
function getCallSite(): SourceLocation {
  const DEFAULT_LOCATION: SourceLocation = {
    file: "unknown",
    line: 0,
    column: 0,
  };

  try {
    const stack = new Error().stack;
    if (!stack) return DEFAULT_LOCATION;

    const lines = stack.split("\n");
    const callerLine = lines[3]; // Skip Error, getCallSite, and code function
    if (!callerLine) return DEFAULT_LOCATION;

    const match =
      callerLine.match(/\(([^:]+):(\d+):(\d+)\)/) ||
      callerLine.match(/at ([^:]+):(\d+):(\d+)/);

    if (!match) return DEFAULT_LOCATION;

    const [, file, line, column] = match;
    return {
      file: file?.split("/").pop() || "unknown",
      line: line ? parseInt(line, 10) : 0,
      column: column ? parseInt(column, 10) : 0,
    };
  } catch {
    return DEFAULT_LOCATION;
  }
}

/**
 * Template literal function for creating trackable code blocks
 * Automatically registers source mapping information
 */
export function code(
  strings: TemplateStringsArray,
  ...values: TemplateValue[]
): string {
  const content = strings.reduce(
    (acc, str, i) => acc + str + (values[i] ?? ""),
    "",
  );

  const source = getCallSite();
  const blockId = sourceMapRegistry.register(content, source);

  return `/* ${blockId} */ ${content}`;
}

/**
 * Extract code block ID from generated content near a specific line
 */
function extractCodeBlockId(
  generatedContent: string,
  lineNumber: number,
): string | undefined {
  const lines = generatedContent.split("\n");
  const startLine = Math.max(0, lineNumber - 3);
  const endLine = Math.min(lines.length, lineNumber + 2);

  for (let i = startLine; i < endLine; i++) {
    const line = lines[i];
    const match = line?.match(/\/\*\s*(tscb:\d+)\s*\*\//);
    if (match) return match[1];
  }

  return undefined;
}

/**
 * Map a diagnostic back to its original source location
 */
export function mapDiagnosticToSource(
  generatedContent: string,
  generatedLine: number,
): SourceLocation | undefined {
  const blockId = extractCodeBlockId(generatedContent, generatedLine);
  return blockId ? sourceMapRegistry.getSourceLocation(blockId) : undefined;
}
