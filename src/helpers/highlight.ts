import { codeFrameColumns } from "@babel/code-frame";
import ts from "typescript";

/**
 * Options for all highlight functions
 */
export interface HighlightOptions {
  /** Number of context lines to show above and below the highlighted region */
  contextLines?: number;
  /** Optional message to display with the highlighted code (e.g., file name) */
  message?: string;
}

/**
 * Extended options for internal highlightNode function
 */
interface InternalHighlightOptions extends HighlightOptions {
  /** Optional end position to use instead of node.getEnd() */
  nodeEnd?: number;
}

/**
 * Generic highlighting function that can be used for any node
 */
function highlightNode(
  sourceFile: ts.SourceFile,
  node: ts.Node,
  options: InternalHighlightOptions = {}
) {
  // Set defaults
  const { contextLines = 2, nodeEnd, message } = options;

  // For declaration-only highlighting, use the name identifier end if provided
  const end = nodeEnd ?? node.getEnd();
  const start = node.getStart(sourceFile);

  // Convert positions into line/col (1-based for code-frame)
  const startLC = sourceFile.getLineAndCharacterOfPosition(start);
  const endLC = sourceFile.getLineAndCharacterOfPosition(end);

  const loc = {
    start: { line: startLC.line + 1, column: startLC.character + 1 },
    end: { line: endLC.line + 1, column: endLC.character + 1 },
  };

  // Get full text of the file
  const rawLines = sourceFile.getFullText();

  // Generate snippet with colors
  return codeFrameColumns(rawLines, loc, {
    highlightCode: true,
    linesAbove: contextLines,
    linesBelow: contextLines,
    message,
  });
}

/**
 * Highlight from the first to the last decorator on a class
 */
export function highlightDecorators(
  sourceFile: ts.SourceFile,
  decorators: ts.Decorator[],
  options: HighlightOptions = {}
) {
  const { contextLines = 2, message } = options;

  if (decorators.length === 0) {
    return "No decorators found.";
  }

  // Use character positions from the AST nodes
  const start = decorators.at(0)?.getStart(sourceFile) ?? 0;
  const end = decorators.at(-1)?.getEnd() ?? 0;

  // Convert positions into line/col (1-based for code-frame)
  const startLC = sourceFile.getLineAndCharacterOfPosition(start);
  const endLC = sourceFile.getLineAndCharacterOfPosition(end);

  const loc = {
    start: { line: startLC.line + 1, column: startLC.character + 1 },
    end: { line: endLC.line + 1, column: endLC.character + 1 },
  };

  // Get full text of the file
  const rawLines = sourceFile.getFullText();

  // Generate snippet with colors
  return codeFrameColumns(rawLines, loc, {
    highlightCode: true,
    linesAbove: contextLines,
    linesBelow: contextLines,
    message,
  });
}

/**
 * Highlight class declaration (not the entire class body)
 */
export function highlightClass(
  sourceFile: ts.SourceFile,
  classDecl: ts.ClassDeclaration,
  options: HighlightOptions = {}
) {
  const { contextLines = 2, message } = options;

  // Find where the class declaration ends (after heritage clauses but before open brace)
  let declarationEnd = classDecl.name?.getEnd() ?? classDecl.getStart(sourceFile);

  // Include type parameters if they exist
  if (classDecl.typeParameters?.length) {
    const lastTypeParam = classDecl.typeParameters.at(-1);
    if (lastTypeParam) {
      declarationEnd = lastTypeParam.getEnd();
    }
  }

  // Include heritage clauses if they exist
  if (classDecl.heritageClauses?.length) {
    const lastHeritageClause = classDecl.heritageClauses.at(-1);
    if (lastHeritageClause) {
      declarationEnd = lastHeritageClause.getEnd();
    }
  }

  // Find opening brace position
  const classText = classDecl.getText(sourceFile);
  const openBracePos = classText.indexOf("{");
  if (openBracePos !== -1) {
    declarationEnd = classDecl.getStart(sourceFile) + openBracePos;
  }

  return highlightNode(sourceFile, classDecl, { contextLines, nodeEnd: declarationEnd, message });
}

/**
 * Highlight function declaration (not the entire function body)
 */
export function highlightFunction(
  sourceFile: ts.SourceFile,
  funcDecl: ts.FunctionDeclaration,
  options: HighlightOptions = {}
) {
  const { contextLines = 2, message } = options;

  // Find where the function declaration ends (before open brace)
  const funcText = funcDecl.getText(sourceFile);
  const openBracePos = funcText.indexOf("{");

  let declarationEnd = funcDecl.getEnd();
  if (openBracePos !== -1) {
    declarationEnd = funcDecl.getStart(sourceFile) + openBracePos;
  }

  return highlightNode(sourceFile, funcDecl, { contextLines, nodeEnd: declarationEnd, message });
}

/**
 * Highlight method declaration (not the entire method body)
 */
export function highlightMethod(
  sourceFile: ts.SourceFile,
  methodDecl: ts.MethodDeclaration,
  options: HighlightOptions = {}
) {
  const { contextLines = 2, message } = options;

  // Find where the method declaration ends (before open brace)
  const methodText = methodDecl.getText(sourceFile);
  const openBracePos = methodText.indexOf("{");

  let declarationEnd = methodDecl.getEnd();
  if (openBracePos !== -1) {
    declarationEnd = methodDecl.getStart(sourceFile) + openBracePos;
  }

  return highlightNode(sourceFile, methodDecl, { contextLines, nodeEnd: declarationEnd, message });
}

/**
 * Highlight property declaration
 */
export function highlightProperty(
  sourceFile: ts.SourceFile,
  propDecl: ts.PropertyDeclaration,
  options: HighlightOptions = {}
) {
  const { contextLines = 2, message } = options;
  return highlightNode(sourceFile, propDecl, { contextLines, message });
}

/**
 * Highlight constructor declaration (not the entire constructor body)
 */
export function highlightConstructor(
  sourceFile: ts.SourceFile,
  ctorDecl: ts.ConstructorDeclaration,
  options: HighlightOptions = {}
) {
  const { contextLines = 2, message } = options;

  // Find where the constructor declaration ends (before open brace)
  const ctorText = ctorDecl.getText(sourceFile);
  const openBracePos = ctorText.indexOf("{");

  let declarationEnd = ctorDecl.getEnd();
  if (openBracePos !== -1) {
    declarationEnd = ctorDecl.getStart(sourceFile) + openBracePos;
  }

  return highlightNode(sourceFile, ctorDecl, { contextLines, nodeEnd: declarationEnd, message });
}

/**
 * Highlight interface declaration (not the entire interface body)
 */
export function highlightInterface(
  sourceFile: ts.SourceFile,
  interfaceDecl: ts.InterfaceDeclaration,
  options: HighlightOptions = {}
) {
  const { contextLines = 2, message } = options;

  // Find where the interface declaration ends (before open brace)
  const interfaceText = interfaceDecl.getText(sourceFile);
  const openBracePos = interfaceText.indexOf("{");

  let declarationEnd = interfaceDecl.getEnd();
  if (openBracePos !== -1) {
    declarationEnd = interfaceDecl.getStart(sourceFile) + openBracePos;
  }

  return highlightNode(sourceFile, interfaceDecl, { contextLines, nodeEnd: declarationEnd, message });
}

/**
 * Highlight type alias declaration (just the declaration, not the entire type)
 */
export function highlightTypeAlias(
  sourceFile: ts.SourceFile,
  typeDecl: ts.TypeAliasDeclaration,
  options: HighlightOptions = {}
) {
  const { contextLines = 2, message } = options;

  // Find where the type name ends (after equals sign)
  const typeText = typeDecl.getText(sourceFile);
  const equalPos = typeText.indexOf("=");

  let declarationEnd = typeDecl.name.getEnd();
  if (equalPos !== -1) {
    declarationEnd = typeDecl.getStart(sourceFile) + equalPos + 1;
  }

  return highlightNode(sourceFile, typeDecl, { contextLines, nodeEnd: declarationEnd, message });
}

/**
 * Highlight import declaration
 */
export function highlightImport(
  sourceFile: ts.SourceFile,
  importDecl: ts.ImportDeclaration,
  options: HighlightOptions = {}
) {
  const { contextLines = 2, message } = options;
  return highlightNode(sourceFile, importDecl, { contextLines, message });
}

/**
 * Highlight export declaration
 */
export function highlightExport(
  sourceFile: ts.SourceFile,
  exportDecl: ts.ExportDeclaration,
  options: HighlightOptions = {}
) {
  const { contextLines = 2, message } = options;
  return highlightNode(sourceFile, exportDecl, { contextLines, message });
}

/**
 * Highlight enum declaration (just the declaration, not the entire enum body)
 */
export function highlightEnum(
  sourceFile: ts.SourceFile,
  enumDecl: ts.EnumDeclaration,
  options: HighlightOptions = {}
) {
  const { contextLines = 2, message } = options;

  // Find where the enum declaration ends (before open brace)
  const enumText = enumDecl.getText(sourceFile);
  const openBracePos = enumText.indexOf("{");

  let declarationEnd = enumDecl.getEnd();
  if (openBracePos !== -1) {
    declarationEnd = enumDecl.getStart(sourceFile) + openBracePos;
  }

  return highlightNode(sourceFile, enumDecl, { contextLines, nodeEnd: declarationEnd, message });
}

/**
 * Highlight variable declaration (single or multiple)
 */
export function highlightVariable(
  sourceFile: ts.SourceFile,
  varDecl: ts.VariableDeclaration | ts.VariableStatement,
  options: HighlightOptions = {}
) {
  const { contextLines = 2, message } = options;
  return highlightNode(sourceFile, varDecl, { contextLines, message });
}

/**
 * Highlight parameter declaration
 */
export function highlightParameter(
  sourceFile: ts.SourceFile,
  paramDecl: ts.ParameterDeclaration,
  options: HighlightOptions = {}
) {
  const { contextLines = 2, message } = options;
  return highlightNode(sourceFile, paramDecl, { contextLines, message });
}

/**
 * Highlight statement (any type of statement)
 */
export function highlightStatement(
  sourceFile: ts.SourceFile,
  stmt: ts.Statement,
  options: HighlightOptions = {}
) {
  const { contextLines = 2, message } = options;
  return highlightNode(sourceFile, stmt, { contextLines, message });
}

/**
 * Highlight expression (any type of expression)
 */
export function highlightExpression(
  sourceFile: ts.SourceFile,
  expr: ts.Expression,
  options: HighlightOptions = {}
) {
  const { contextLines = 2, message } = options;
  return highlightNode(sourceFile, expr, { contextLines, message });
}

/**
 * Highlight a block of code (for statements, function bodies, etc.)
 */
export function highlightBlock(
  sourceFile: ts.SourceFile,
  block: ts.Block,
  options: HighlightOptions = {}
) {
  const { contextLines = 2, message } = options;
  return highlightNode(sourceFile, block, { contextLines, message });
}

/**
 * Highlight a specific range within a source file
 */
export function highlightRange(
  sourceFile: ts.SourceFile,
  startPos: number,
  endPos: number,
  options: HighlightOptions = {}
) {
  const { contextLines = 2, message } = options;

  // Convert positions into line/col (1-based for code-frame)
  const startLC = sourceFile.getLineAndCharacterOfPosition(startPos);
  const endLC = sourceFile.getLineAndCharacterOfPosition(endPos);

  const loc = {
    start: { line: startLC.line + 1, column: startLC.character + 1 },
    end: { line: endLC.line + 1, column: endLC.character + 1 },
  };

  // Get full text of the file
  const rawLines = sourceFile.getFullText();

  // Generate snippet with colors
  return codeFrameColumns(rawLines, loc, {
    highlightCode: true,
    linesAbove: contextLines,
    linesBelow: contextLines,
    message,
  });
}

/**
 * Highlight multiple nodes together
 */
export function highlightNodes(
  sourceFile: ts.SourceFile,
  nodes: ts.Node[],
  options: HighlightOptions = {}
) {
  const { contextLines = 2, message } = options;

  if (nodes.length === 0) {
    return "No nodes found.";
  }

  // Find the start of the first node and the end of the last node
  const start = Math.min(...nodes.map(node => node.getStart(sourceFile)));
  const end = Math.max(...nodes.map(node => node.getEnd()));

  return highlightRange(sourceFile, start, end, { contextLines, message });
}

/**
 * Highlight decorators and their target node
 */
export function highlightDecoratorsWithTarget(
  sourceFile: ts.SourceFile,
  decorators: ts.Decorator[],
  target: ts.Node,
  options: HighlightOptions = {}
) {
  const { contextLines = 2, message } = options;

  if (decorators.length === 0) {
    return highlightNode(sourceFile, target, { contextLines, message });
  }

  // Get start position of all decorators, ensuring there are decorators
  const decoratorStarts = decorators.map(d => d.getStart(sourceFile));
  const start = Math.min(...decoratorStarts);

  // Find the ending position - typically the opening brace or end of declaration
  let endPos = target.getEnd();
  const targetText = target.getText(sourceFile);
  const openBraceIndex = targetText.indexOf("{");
  if (openBraceIndex !== -1) {
    endPos = target.getStart(sourceFile) + openBraceIndex;
  }

  return highlightRange(sourceFile, start, endPos, { contextLines, message });
}

/**
 * Smart highlight function that automatically determines the best way to highlight a node
 * based on its type. Will only highlight declarations and not entire bodies for appropriate nodes.
 */
export function highlight(
  sourceFile: ts.SourceFile,
  node: ts.Node,
  options: HighlightOptions = {}
): string {
  if (ts.isClassDeclaration(node)) {
    return highlightClass(sourceFile, node as ts.ClassDeclaration, options);
  } else if (ts.isFunctionDeclaration(node)) {
    return highlightFunction(sourceFile, node as ts.FunctionDeclaration, options);
  } else if (ts.isMethodDeclaration(node)) {
    return highlightMethod(sourceFile, node as ts.MethodDeclaration, options);
  } else if (ts.isPropertyDeclaration(node)) {
    return highlightProperty(sourceFile, node as ts.PropertyDeclaration, options);
  } else if (ts.isConstructorDeclaration(node)) {
    return highlightConstructor(sourceFile, node as ts.ConstructorDeclaration, options);
  } else if (ts.isInterfaceDeclaration(node)) {
    return highlightInterface(sourceFile, node as ts.InterfaceDeclaration, options);
  } else if (ts.isTypeAliasDeclaration(node)) {
    return highlightTypeAlias(sourceFile, node as ts.TypeAliasDeclaration, options);
  } else if (ts.isImportDeclaration(node)) {
    return highlightImport(sourceFile, node as ts.ImportDeclaration, options);
  } else if (ts.isExportDeclaration(node)) {
    return highlightExport(sourceFile, node as ts.ExportDeclaration, options);
  } else if (ts.isEnumDeclaration(node)) {
    return highlightEnum(sourceFile, node as ts.EnumDeclaration, options);
  } else if (ts.isVariableDeclaration(node)) {
    return highlightVariable(sourceFile, node as ts.VariableDeclaration, options);
  } else if (ts.isVariableStatement(node)) {
    return highlightVariable(sourceFile, node as ts.VariableStatement, options);
  } else if (ts.isParameter(node)) {
    return highlightParameter(sourceFile, node as ts.ParameterDeclaration, options);
  } else if (ts.isStatement(node)) {
    return highlightStatement(sourceFile, node as ts.Statement, options);
  } else if (ts.isExpression(node)) {
    return highlightExpression(sourceFile, node as ts.Expression, options);
  } else if (ts.isBlock(node)) {
    return highlightBlock(sourceFile, node as ts.Block, options);
  } else {
    // For any other type of node, use generic highlighting
    return highlightNode(sourceFile, node, options);
  }
}
