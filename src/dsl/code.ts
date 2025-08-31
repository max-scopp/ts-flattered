type TemplateValue = string | number | boolean | null | undefined;

interface SourceLocation {
  file: string;
  line: number;
  column: number;
}

interface CodeBlock {
  id: string;
  content: string;
  source: SourceLocation;
}

// Global registry for source mapping
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

  findBlockByGeneratedLine(
    _generatedFile: string,
    _generatedLine: number,
  ): CodeBlock | undefined {
    // This would be used to map from generated line numbers back to source
    // For now, we'll implement a simple approach based on comments
    for (const block of this.codeBlocks.values()) {
      // This is a simplified mapping - in practice, you'd need more sophisticated line tracking
      if (block.content.includes(`/* ${block.id} */`)) {
        return block;
      }
    }
    return undefined;
  }

  getAllBlocks(): CodeBlock[] {
    return Array.from(this.codeBlocks.values());
  }

  clear(): void {
    this.codeBlocks.clear();
    this.nextId = 1;
  }
}

export const sourceMapRegistry = new SourceMapRegistry();

function getCallSite(): SourceLocation {
  const stack = new Error().stack;
  if (!stack) {
    return { file: "unknown", line: 0, column: 0 };
  }

  // Split stack trace into lines and find the caller (skip Error, getCallSite, and code function)
  const lines = stack.split("\n");
  const callerLine = lines[3]; // lines[0] = Error, lines[1] = getCallSite, lines[2] = code function, lines[3] = actual caller

  if (!callerLine) {
    return { file: "unknown", line: 0, column: 0 };
  }

  // Extract file path, line, and column from stack trace
  // Stack trace format varies, but typically: "at function (file:line:column)" or "at file:line:column"
  const match =
    callerLine.match(/\(([^:]+):(\d+):(\d+)\)/) ||
    callerLine.match(/at ([^:]+):(\d+):(\d+)/);

  if (match) {
    const [, file, line, column] = match;
    return {
      file: (file?.split("/").pop() ?? file) || "unknown",
      line: line ? parseInt(line, 10) : 0,
      column: column ? parseInt(column, 10) : 0,
    };
  }

  return { file: "unknown", line: 0, column: 0 };
}

export function code(
  strings: TemplateStringsArray,
  ...values: TemplateValue[]
): string {
  const content = strings.reduce(
    (acc, str, i) => acc + str + (values[i] ?? ""),
    "",
  );
  const source = getCallSite();

  // Register this code block and get its ID
  const blockId = sourceMapRegistry.register(content, source);

  // Return the content with a source map comment
  return `/* ${blockId} */ ${content}`;
}

// Helper function to extract code block ID from generated content
export function extractCodeBlockId(
  generatedContent: string,
  lineNumber: number,
): string | undefined {
  const lines = generatedContent.split("\n");
  const line = lines[lineNumber - 1]; // Convert to 0-based index

  if (!line) return undefined;

  // Look for the source map comment pattern in current line and nearby lines
  for (
    let i = Math.max(0, lineNumber - 3);
    i < Math.min(lines.length, lineNumber + 2);
    i++
  ) {
    const searchLine = lines[i];
    const match = searchLine?.match(/\/\*\s*(tscb:\d+)\s*\*\//);
    if (match) {
      return match[1];
    }
  }

  return undefined;
}

// Map a diagnostic back to its original source location
export function mapDiagnosticToSource(
  generatedContent: string,
  generatedLine: number,
): SourceLocation | undefined {
  const blockId = extractCodeBlockId(generatedContent, generatedLine);
  if (!blockId) return undefined;

  return sourceMapRegistry.getSourceLocation(blockId);
}
