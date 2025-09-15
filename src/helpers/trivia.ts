import ts from "typescript";

/**
 * Enum for different comment styles
 */
export enum CommentStyle {
  /** Single-line comment: // comment */
  Line = "line",
  /** Multi-line comment: /\* comment *\/ */
  Block = "block",
  /** JSDoc comment: /\*\* comment *\/ */
  JSDoc = "jsdoc",
}

/**
 * Interface for JSDoc tag
 */
export interface JSDocTag {
  /** Tag name (e.g., "param", "returns", "example") */
  name: string;
  /** Tag text content */
  text?: string;
  /** For @param tags, the parameter name */
  parameterName?: string;
  /** For @param tags, the parameter type */
  parameterType?: string;
}

/**
 * Interface for comment content
 */
export interface CommentContent {
  /** Main comment text */
  text: string;
  /** Comment style */
  style: CommentStyle;
  /** JSDoc tags (only used for JSDoc style) */
  tags?: JSDocTag[];
}

/**
 * Interface for trivia options
 */
export interface TriviaOptions {
  /** Leading comments (before the node) */
  leading?: CommentContent[];
  /** Trailing comments (after the node) */
  trailing?: CommentContent[];
}

/**
 * Create a JSDoc tag
 */
export function createJSDocTag(
  name: string,
  text?: string,
  parameterName?: string,
  parameterType?: string,
): JSDocTag {
  return {
    name,
    text,
    parameterName,
    parameterType,
  };
}

/**
 * Create comment content
 */
export function createComment(
  text: string,
  style: CommentStyle = CommentStyle.Line,
  tags?: JSDocTag[],
): CommentContent {
  return {
    text,
    style,
    tags,
  };
}

/**
 * Create a single-line comment
 */
export function lineComment(text: string): CommentContent {
  return createComment(text, CommentStyle.Line);
}

/**
 * Create a block comment
 */
export function blockComment(text: string): CommentContent {
  return createComment(text, CommentStyle.Block);
}

/**
 * Create a JSDoc comment
 */
export function jsdocComment(text: string, tags?: JSDocTag[]): CommentContent {
  return createComment(text, CommentStyle.JSDoc, tags);
}

/**
 * Convert comment content to string representation for synthetic comments
 * Note: TypeScript's addSyntheticLeadingComment/addSyntheticTrailingComment APIs
 * expect just the comment content without delimiters
 */
export function commentToString(comment: CommentContent): string {
  switch (comment.style) {
    case CommentStyle.Line:
      return comment.text
        .split("\n")
        .map((line) => ` ${line}`)
        .join("\n");

    case CommentStyle.Block:
      return ` ${comment.text} `;

    case CommentStyle.JSDoc: {
      const lines = [`*`];

      // Add main text
      if (comment.text.trim()) {
        comment.text.split("\n").forEach((line) => {
          lines.push(` * ${line}`);
        });
      }

      // Add JSDoc tags
      if (comment.tags && comment.tags.length > 0) {
        if (comment.text.trim()) {
          lines.push(" *");
        }

        comment.tags.forEach((tag) => {
          if (tag.name === "param" && tag.parameterName) {
            const typeInfo = tag.parameterType ? `{${tag.parameterType}} ` : "";
            const description = tag.text ? ` ${tag.text}` : "";
            lines.push(` * @${tag.name} ${typeInfo}${tag.parameterName}${description}`);
          } else {
            const tagText = tag.text ? ` ${tag.text}` : "";
            lines.push(` * @${tag.name}${tagText}`);
          }
        });
      }

      lines.push(" ");
      return lines.join("\n");
    }

    default:
      return comment.text;
  }
}

/**
 * Add synthetic leading comment to a TypeScript node
 */
export function addLeadingComment<T extends ts.Node>(
  node: T,
  comment: CommentContent,
): T {
  const commentText = commentToString(comment);

  // Determine comment kind based on style
  let kind: ts.SyntaxKind;
  switch (comment.style) {
    case CommentStyle.Line:
      kind = ts.SyntaxKind.SingleLineCommentTrivia;
      break;
    case CommentStyle.Block:
    case CommentStyle.JSDoc:
      kind = ts.SyntaxKind.MultiLineCommentTrivia;
      break;
    default:
      kind = ts.SyntaxKind.SingleLineCommentTrivia;
  }

  // Add synthetic leading comment
  return ts.addSyntheticLeadingComment(
    node,
    kind,
    commentText,
    comment.style === CommentStyle.JSDoc || commentText.includes("\n"),
  );
}

/**
 * Add synthetic trailing comment to a TypeScript node
 */
export function addTrailingComment<T extends ts.Node>(
  node: T,
  comment: CommentContent,
): T {
  const commentText = commentToString(comment);

  // Determine comment kind based on style
  let kind: ts.SyntaxKind;
  switch (comment.style) {
    case CommentStyle.Line:
      kind = ts.SyntaxKind.SingleLineCommentTrivia;
      break;
    case CommentStyle.Block:
    case CommentStyle.JSDoc:
      kind = ts.SyntaxKind.MultiLineCommentTrivia;
      break;
    default:
      kind = ts.SyntaxKind.SingleLineCommentTrivia;
  }

  // Add synthetic trailing comment
  return ts.addSyntheticTrailingComment(
    node,
    kind,
    commentText,
    comment.style === CommentStyle.JSDoc || commentText.includes("\n"),
  );
}

/**
 * Add multiple comments to a node
 */
export function addComments<T extends ts.Node>(
  node: T,
  options: TriviaOptions,
): T {
  let result = node;

  // Add leading comments
  if (options.leading) {
    for (const comment of options.leading) {
      result = addLeadingComment(result, comment);
    }
  }

  // Add trailing comments
  if (options.trailing) {
    for (const comment of options.trailing) {
      result = addTrailingComment(result, comment);
    }
  }

  return result;
}

/**
 * Helper function to create a parameter JSDoc tag
 */
export function paramTag(
  parameterName: string,
  description?: string,
  parameterType?: string,
): JSDocTag {
  return createJSDocTag("param", description, parameterName, parameterType);
}

/**
 * Helper function to create a returns JSDoc tag
 */
export function returnsTag(description: string, returnType?: string): JSDocTag {
  const text = returnType ? `{${returnType}} ${description}` : description;
  return createJSDocTag("returns", text);
}

/**
 * Helper function to create an example JSDoc tag
 */
export function exampleTag(example: string): JSDocTag {
  return createJSDocTag("example", example);
}

/**
 * Helper function to create a deprecated JSDoc tag
 */
export function deprecatedTag(reason?: string): JSDocTag {
  return createJSDocTag("deprecated", reason);
}

/**
 * Helper function to create a since JSDoc tag
 */
export function sinceTag(version: string): JSDocTag {
  return createJSDocTag("since", version);
}

/**
 * Helper function to create an author JSDoc tag
 */
export function authorTag(name: string): JSDocTag {
  return createJSDocTag("author", name);
}

/**
 * Helper function to create a see JSDoc tag
 */
export function seeTag(reference: string): JSDocTag {
  return createJSDocTag("see", reference);
}

/**
 * Helper function to create a throws JSDoc tag
 */
export function throwsTag(description: string, exceptionType?: string): JSDocTag {
  const text = exceptionType ? `{${exceptionType}} ${description}` : description;
  return createJSDocTag("throws", text);
}

/**
 * Utility to create a comprehensive JSDoc comment for a method
 */
export function createMethodJSDoc(
  description: string,
  parameters?: { name: string; type?: string; description?: string }[],
  returnDescription?: string,
  returnType?: string,
  options?: {
    examples?: string[];
    deprecated?: string;
    since?: string;
    author?: string;
    throws?: { type?: string; description: string }[];
  },
): CommentContent {
  const tags: JSDocTag[] = [];

  // Add parameter tags
  if (parameters) {
    parameters.forEach((param) => {
      tags.push(paramTag(param.name, param.description, param.type));
    });
  }

  // Add return tag
  if (returnDescription) {
    tags.push(returnsTag(returnDescription, returnType));
  }

  // Add optional tags
  if (options) {
    if (options.examples) {
      options.examples.forEach((example) => {
        tags.push(exampleTag(example));
      });
    }

    if (options.deprecated) {
      tags.push(deprecatedTag(options.deprecated));
    }

    if (options.since) {
      tags.push(sinceTag(options.since));
    }

    if (options.author) {
      tags.push(authorTag(options.author));
    }

    if (options.throws) {
      options.throws.forEach((throwInfo) => {
        tags.push(throwsTag(throwInfo.description, throwInfo.type));
      });
    }
  }

  return jsdocComment(description, tags);
}

/**
 * Utility to create a comprehensive JSDoc comment for a class
 */
export function createClassJSDoc(
  description: string,
  options?: {
    examples?: string[];
    deprecated?: string;
    since?: string;
    author?: string;
    see?: string[];
  },
): CommentContent {
  const tags: JSDocTag[] = [];

  if (options) {
    if (options.examples) {
      options.examples.forEach((example) => {
        tags.push(exampleTag(example));
      });
    }

    if (options.deprecated) {
      tags.push(deprecatedTag(options.deprecated));
    }

    if (options.since) {
      tags.push(sinceTag(options.since));
    }

    if (options.author) {
      tags.push(authorTag(options.author));
    }

    if (options.see) {
      options.see.forEach((reference) => {
        tags.push(seeTag(reference));
      });
    }
  }

  return jsdocComment(description, tags);
}

/**
 * Utility to create a JSDoc comment for a property
 */
export function createPropertyJSDoc(
  description: string,
  options?: {
    type?: string;
    deprecated?: string;
    since?: string;
    see?: string[];
  },
): CommentContent {
  const tags: JSDocTag[] = [];

  if (options) {
    if (options.type) {
      tags.push(createJSDocTag("type", `{${options.type}}`));
    }

    if (options.deprecated) {
      tags.push(deprecatedTag(options.deprecated));
    }

    if (options.since) {
      tags.push(sinceTag(options.since));
    }

    if (options.see) {
      options.see.forEach((reference) => {
        tags.push(seeTag(reference));
      });
    }
  }

  return jsdocComment(description, tags);
}
