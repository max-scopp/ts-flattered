import type { CommentContent, JSDocTag } from "./trivia";
import {
  authorTag,
  blockComment,
  CommentStyle,
  createClassJSDoc,
  createMethodJSDoc,
  createPropertyJSDoc,
  deprecatedTag,
  exampleTag,
  jsdocComment,
  lineComment,
  paramTag,
  returnsTag,
  seeTag,
  sinceTag,
  throwsTag,
} from "./trivia";

/**
 * Common comment presets and utilities
 */

/**
 * Create a TODO comment
 */
export function todoComment(description: string): CommentContent {
  return lineComment(`TODO: ${description}`);
}

/**
 * Create a FIXME comment
 */
export function fixmeComment(description: string): CommentContent {
  return lineComment(`FIXME: ${description}`);
}

/**
 * Create a NOTE comment
 */
export function noteComment(description: string): CommentContent {
  return lineComment(`NOTE: ${description}`);
}

/**
 * Create a WARNING comment
 */
export function warningComment(description: string): CommentContent {
  return lineComment(`WARNING: ${description}`);
}

/**
 * Create a HACK comment
 */
export function hackComment(description: string): CommentContent {
  return lineComment(`HACK: ${description}`);
}

/**
 * Create a standard constructor JSDoc comment
 */
export function constructorJSDoc(
  description: string = "Creates a new instance",
  parameters?: { name: string; type?: string; description?: string }[],
): CommentContent {
  return createMethodJSDoc(description, parameters);
}

/**
 * Create a standard getter JSDoc comment
 */
export function getterJSDoc(
  propertyName: string,
  returnType?: string,
  description?: string,
): CommentContent {
  const desc = description || `Gets the ${propertyName}`;
  return createMethodJSDoc(desc, undefined, desc, returnType);
}

/**
 * Create a standard setter JSDoc comment
 */
export function setterJSDoc(
  propertyName: string,
  parameterType?: string,
  description?: string,
): CommentContent {
  const desc = description || `Sets the ${propertyName}`;
  const parameters = [
    {
      name: "value",
      type: parameterType,
      description: `The new ${propertyName} value`,
    },
  ];
  return createMethodJSDoc(desc, parameters);
}

/**
 * Create a standard interface JSDoc comment
 */
export function interfaceJSDoc(
  description: string,
  options?: {
    examples?: string[];
    since?: string;
    see?: string[];
  },
): CommentContent {
  return createClassJSDoc(description, options);
}

/**
 * Create a standard enum JSDoc comment
 */
export function enumJSDoc(
  description: string,
  options?: {
    examples?: string[];
    since?: string;
  },
): CommentContent {
  return createClassJSDoc(description, options);
}

/**
 * Create a function JSDoc comment with common patterns
 */
export function functionJSDoc(
  description: string,
  parameters?: { name: string; type?: string; description?: string }[],
  returnDescription?: string,
  returnType?: string,
  options?: {
    async?: boolean;
    generator?: boolean;
    examples?: string[];
    throws?: { type?: string; description: string }[];
    since?: string;
    deprecated?: string;
  },
): CommentContent {
  return createMethodJSDoc(
    description,
    parameters,
    returnDescription,
    returnType,
    options,
  );
}

/**
 * Create a type alias JSDoc comment
 */
export function typeAliasJSDoc(
  description: string,
  options?: {
    examples?: string[];
    since?: string;
    see?: string[];
  },
): CommentContent {
  return createClassJSDoc(description, options);
}

/**
 * Create a namespace JSDoc comment
 */
export function namespaceJSDoc(
  description: string,
  options?: {
    examples?: string[];
    since?: string;
  },
): CommentContent {
  return createClassJSDoc(description, options);
}

/**
 * Create a variable JSDoc comment
 */
export function variableJSDoc(
  description: string,
  type?: string,
  options?: {
    constant?: boolean;
    deprecated?: string;
    since?: string;
  },
): CommentContent {
  const tags: JSDocTag[] = [];

  if (type) {
    tags.push({ name: "type", text: `{${type}}` });
  }

  if (options?.constant) {
    tags.push({ name: "constant" });
  }

  if (options?.deprecated) {
    tags.push(deprecatedTag(options.deprecated));
  }

  if (options?.since) {
    tags.push(sinceTag(options.since));
  }

  return jsdocComment(description, tags);
}

/**
 * Create a module/file header comment
 */
export function fileHeaderComment(
  description: string,
  options?: {
    author?: string;
    version?: string;
    since?: string;
    license?: string;
    copyright?: string;
  },
): CommentContent {
  const tags: JSDocTag[] = [];

  if (options?.author) {
    tags.push(authorTag(options.author));
  }

  if (options?.version) {
    tags.push({ name: "version", text: options.version });
  }

  if (options?.since) {
    tags.push(sinceTag(options.since));
  }

  if (options?.license) {
    tags.push({ name: "license", text: options.license });
  }

  if (options?.copyright) {
    tags.push({ name: "copyright", text: options.copyright });
  }

  return jsdocComment(description, tags);
}

/**
 * Create an event JSDoc comment
 */
export function eventJSDoc(
  eventName: string,
  description: string,
  parameters?: { name: string; type?: string; description?: string }[],
): CommentContent {
  const tags: JSDocTag[] = [{ name: "event", text: eventName }];

  if (parameters) {
    parameters.forEach((param) => {
      tags.push(paramTag(param.name, param.description, param.type));
    });
  }

  return jsdocComment(description, tags);
}

/**
 * Create a callback JSDoc comment
 */
export function callbackJSDoc(
  callbackName: string,
  description: string,
  parameters?: { name: string; type?: string; description?: string }[],
  returnDescription?: string,
  returnType?: string,
): CommentContent {
  const tags: JSDocTag[] = [{ name: "callback", text: callbackName }];

  if (parameters) {
    parameters.forEach((param) => {
      tags.push(paramTag(param.name, param.description, param.type));
    });
  }

  if (returnDescription) {
    tags.push(returnsTag(returnDescription, returnType));
  }

  return jsdocComment(description, tags);
}

/**
 * Create an abstract method/class JSDoc comment
 */
export function abstractJSDoc(
  description: string,
  options?: {
    examples?: string[];
    see?: string[];
  },
): CommentContent {
  const tags: JSDocTag[] = [{ name: "abstract" }];

  if (options?.examples) {
    options.examples.forEach((example) => {
      tags.push(exampleTag(example));
    });
  }

  if (options?.see) {
    options.see.forEach((reference) => {
      tags.push(seeTag(reference));
    });
  }

  return jsdocComment(description, tags);
}

/**
 * Create a static method JSDoc comment
 */
export function staticJSDoc(
  description: string,
  parameters?: { name: string; type?: string; description?: string }[],
  returnDescription?: string,
  returnType?: string,
): CommentContent {
  const tags: JSDocTag[] = [{ name: "static" }];

  if (parameters) {
    parameters.forEach((param) => {
      tags.push(paramTag(param.name, param.description, param.type));
    });
  }

  if (returnDescription) {
    tags.push(returnsTag(returnDescription, returnType));
  }

  return jsdocComment(description, tags);
}

/**
 * Create an override method JSDoc comment
 */
export function overrideJSDoc(
  description: string,
  parameters?: { name: string; type?: string; description?: string }[],
  returnDescription?: string,
  returnType?: string,
): CommentContent {
  const tags: JSDocTag[] = [{ name: "override" }];

  if (parameters) {
    parameters.forEach((param) => {
      tags.push(paramTag(param.name, param.description, param.type));
    });
  }

  if (returnDescription) {
    tags.push(returnsTag(returnDescription, returnType));
  }

  return jsdocComment(description, tags);
}

/**
 * Create a readonly property JSDoc comment
 */
export function readonlyJSDoc(
  description: string,
  type?: string,
): CommentContent {
  const tags: JSDocTag[] = [{ name: "readonly" }];

  if (type) {
    tags.push({ name: "type", text: `{${type}}` });
  }

  return jsdocComment(description, tags);
}

/**
 * Create a private member JSDoc comment
 */
export function privateJSDoc(
  description: string,
  type?: string,
): CommentContent {
  const tags: JSDocTag[] = [{ name: "private" }];

  if (type) {
    tags.push({ name: "type", text: `{${type}}` });
  }

  return jsdocComment(description, tags);
}

/**
 * Create a protected member JSDoc comment
 */
export function protectedJSDoc(
  description: string,
  type?: string,
): CommentContent {
  const tags: JSDocTag[] = [{ name: "protected" }];

  if (type) {
    tags.push({ name: "type", text: `{${type}}` });
  }

  return jsdocComment(description, tags);
}
