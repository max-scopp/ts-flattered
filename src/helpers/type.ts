
import ts from "typescript";
import { expr } from "../core/expr";

export function computeTypeAsString(
  checker: ts.TypeChecker,
  node: ts.TypeNode | ts.Expression | undefined,
  sourceFile: ts.SourceFile,
): string {
  if (!node) return "unknown";

  let type: ts.Type | undefined;

  try {
    if (ts.isTypeNode(node)) {
      type = checker.getTypeFromTypeNode(node);
    } else if (ts.isExpression(node)) {
      type = checker.getTypeAtLocation(node);

      // explicitly widen boolean, string, number literals
      if (type.flags & ts.TypeFlags.BooleanLiteral) {
        type = checker.getBaseTypeOfLiteralType(type); // false -> boolean
      } else if (type.flags & ts.TypeFlags.StringLiteral) {
        type = checker.getBaseTypeOfLiteralType(type); // "foo" -> string
      } else if (type.flags & ts.TypeFlags.NumberLiteral) {
        type = checker.getBaseTypeOfLiteralType(type); // 123 -> number
      }
    }
  } catch {}

  if (type) {
    return checker.typeToString(type);
  }

  return node.getText(sourceFile);
}


export function getTypeAsString(
  checker: ts.TypeChecker,
  node: ts.TypeNode,
): string {
  const type = checker.getTypeFromTypeNode(node);
  return checker.typeToString(type);
}

export interface SimpleTypeResult {
  /** The simplified type category */
  type: 'string' | 'number' | 'boolean' | 'function' | 'array' | 'object' | null;
  /** Whether the type includes null */
  nullable: boolean;
  /** Whether the type includes undefined */
  undefinable: boolean;
  /** Whether the type includes void */
  voidable: boolean;
  /** Original type string for debugging */
  originalType: string;
}

export function computeSimpleType(
  checker: ts.TypeChecker,
  node: ts.TypeNode | ts.Expression | undefined
): SimpleTypeResult {
  const result: SimpleTypeResult = {
    type: null,
    nullable: false,
    undefinable: false,
    voidable: false,
    originalType: 'unknown'
  };

  if (!node) return result;

  // Handle array types at the TypeNode level
  if (ts.isTypeNode(node) && ts.isArrayTypeNode(node)) {
    return {
      type: 'array',
      nullable: false,
      undefinable: false,
      voidable: false,
      originalType: node.getText() || 'array'
    };
  }

  // For union types, analyze the first type in the source order
  if (ts.isTypeNode(node) && ts.isUnionTypeNode(node)) {
    if (node.types.length > 0) {
      const firstType = node.types[0];
      const firstResult = computeSimpleType(checker, firstType);

      // Check for nullable/undefinable flags in the union
      const hasNull = node.types.some(t =>
        ts.isLiteralTypeNode(t) && t.literal.kind === ts.SyntaxKind.NullKeyword
      );
      const hasUndefined = node.types.some(t =>
        t.kind === ts.SyntaxKind.UndefinedKeyword
      );
      const hasVoid = node.types.some(t =>
        t.kind === ts.SyntaxKind.VoidKeyword
      );

      return {
        ...firstResult,
        nullable: firstResult.nullable || hasNull,
        undefinable: firstResult.undefinable || hasUndefined,
        voidable: firstResult.voidable || hasVoid
      };
    }
  }

  let type: ts.Type | undefined;

  // Handle type references to check for array type aliases
  if (ts.isTypeNode(node) && ts.isTypeReferenceNode(node) && ts.isIdentifier(node.typeName)) {
    try {
      const symbol = checker.getSymbolAtLocation(node.typeName);
      if (symbol?.declarations) {
        for (const declaration of symbol.declarations) {
          if (ts.isTypeAliasDeclaration(declaration) && declaration.type) {
            // Check if the aliased type is an array at the AST level
            if (ts.isArrayTypeNode(declaration.type)) {
              return {
                type: 'array',
                nullable: false,
                undefinable: false,
                voidable: false,
                originalType: declaration.type.getText() || 'array'
              };
            }

            // Check if the aliased type is a generic Array<T>
            if (ts.isTypeReferenceNode(declaration.type)) {
              const typeName = declaration.type.typeName;
              if (ts.isIdentifier(typeName) && typeName.text === 'Array') {
                return {
                  type: 'array',
                  nullable: false,
                  undefinable: false,
                  voidable: false,
                  originalType: declaration.type.getText() || 'Array'
                };
              }
            }
          }
        }
      }
    } catch (error) {
      // If symbol resolution fails, continue with other type analysis
      // This prevents crashes when TypeScript can't resolve symbols
    }
  }

  try {
    if (ts.isTypeNode(node)) {
      type = checker.getTypeFromTypeNode(node);
    } else if (ts.isExpression(node)) {
      type = checker.getTypeAtLocation(node);
    }
  } catch {
    return result;
  }

  if (!type) return result;

  result.originalType = checker.typeToString(type);

  // If the type resolved to 'any', try to analyze the original TypeNode structure
  if (type.flags & ts.TypeFlags.Any && ts.isTypeNode(node)) {
    const structuralAnalysis = analyzeTypeNodeStructure(checker, node);
    if (structuralAnalysis) {
      return {
        ...result,
        ...structuralAnalysis
      };
    }
  }

  // Recursively resolve the type to its most fundamental form
  const resolvedType = resolveTypeRecursively(checker, type);
  if (resolvedType) {
    const analysis = analyzeResolvedType(resolvedType);
    return {
      ...result,
      ...analysis
    };
  }

  return result;
}

/**
 * Analyze the structure of a TypeNode when type resolution fails
 * This is particularly useful for complex generic types that resolve to 'any'
 */
function analyzeTypeNodeStructure(checker: ts.TypeChecker, node: ts.TypeNode): Pick<SimpleTypeResult, 'type' | 'nullable' | 'undefinable' | 'voidable'> | null {
  // Handle array types
  if (ts.isArrayTypeNode(node)) {
    return { type: 'array', nullable: false, undefinable: false, voidable: false };
  }

  if (ts.isTypeReferenceNode(node)) {
    // Look up the original type alias declaration
    const typeName = node.typeName;
    if (ts.isIdentifier(typeName)) {
      try {
        const symbol = checker.getSymbolAtLocation(typeName);
        if (symbol?.declarations) {
        for (const declaration of symbol.declarations) {
          if (ts.isTypeAliasDeclaration(declaration) && declaration.type) {
            // For generic type aliases, we need to consider the type arguments
            if (declaration.typeParameters && node.typeArguments) {
              // Special handling for LiteralUnion<T, U> pattern
              if (declaration.typeParameters.length >= 2 && node.typeArguments.length >= 2) {
                // Check if this follows the LiteralUnion pattern by examining the structure
                if (ts.isUnionTypeNode(declaration.type)) {
                  // LiteralUnion typically has the pattern: T | (U & Record<never, never>)
                  const secondTypeArg = node.typeArguments[1];
                  if (secondTypeArg) {
                    const secondTypeArgType = checker.getTypeFromTypeNode(secondTypeArg);

                    // If the second type argument is string, this should be a string type
                    if (secondTypeArgType.flags & ts.TypeFlags.String) {
                      return { type: 'string', nullable: false, undefinable: false, voidable: false };
                    }
                  }
                }
              }

              // For other generic types, try to analyze the first type argument
              const firstTypeArg = node.typeArguments[0];
              if (firstTypeArg) {
                const firstArgAnalysis = analyzeTypeNodeStructure(checker, firstTypeArg);
                if (firstArgAnalysis) {
                  return firstArgAnalysis;
                }
              }
            }

            // Recursively analyze the aliased type structure
            return analyzeTypeNodeStructure(checker, declaration.type);
          }
        }
      }
      } catch (error) {
        // If symbol resolution fails, continue with other analysis
      }
    }

    // For generic types, try to analyze the type arguments
    if (node.typeArguments) {
      // Check if any type argument suggests this should be a string
      for (const typeArg of node.typeArguments) {
        const argAnalysis = analyzeTypeNodeStructure(checker, typeArg);
        if (argAnalysis?.type === 'string') {
          return { type: 'string', nullable: false, undefinable: false, voidable: false };
        }
      }
    }
  }

  if (ts.isUnionTypeNode(node)) {
    const memberAnalyses = node.types.map(t => analyzeTypeNodeStructure(checker, t)).filter(Boolean);

    // Check for nullable/undefinable types
    const nullable = node.types.some(t =>
      ts.isLiteralTypeNode(t) && t.literal.kind === ts.SyntaxKind.NullKeyword
    );
    const undefinable = node.types.some(t =>
      t.kind === ts.SyntaxKind.UndefinedKeyword
    );

    // Filter out null/undefined types
    const nonNullableAnalyses = memberAnalyses.filter(a => a?.type !== null);

    if (nonNullableAnalyses.length === 1) {
      const first = nonNullableAnalyses[0];
      if (first) {
        return {
          ...first,
          nullable: nullable || first.nullable,
          undefinable: undefinable || first.undefinable
        };
      }
    }

    // If all non-nullable types are strings, return string
    if (nonNullableAnalyses.length > 0 && nonNullableAnalyses.every(a => a?.type === 'string')) {
      return { type: 'string', nullable, undefinable, voidable: false };
    }
  }

  if (ts.isIntersectionTypeNode(node)) {
    // For intersection types, try to find the most specific type
    for (const intersectedType of node.types) {
      const analysis = analyzeTypeNodeStructure(checker, intersectedType);
      if (analysis && analysis.type !== 'object') {
        return analysis;
      }
    }
    return { type: 'object', nullable: false, undefinable: false, voidable: false };
  }

  if (ts.isLiteralTypeNode(node)) {
    if (node.literal.kind === ts.SyntaxKind.StringLiteral ||
        node.literal.kind === ts.SyntaxKind.NoSubstitutionTemplateLiteral) {
      return { type: 'string', nullable: false, undefinable: false, voidable: false };
    }
    if (node.literal.kind === ts.SyntaxKind.NumericLiteral) {
      return { type: 'number', nullable: false, undefinable: false, voidable: false };
    }
    if (node.literal.kind === ts.SyntaxKind.TrueKeyword ||
        node.literal.kind === ts.SyntaxKind.FalseKeyword) {
      return { type: 'boolean', nullable: false, undefinable: false, voidable: false };
    }
  }

  // Handle basic type keywords
  switch (node.kind) {
    case ts.SyntaxKind.StringKeyword:
      return { type: 'string', nullable: false, undefinable: false, voidable: false };
    case ts.SyntaxKind.NumberKeyword:
      return { type: 'number', nullable: false, undefinable: false, voidable: false };
    case ts.SyntaxKind.BooleanKeyword:
      return { type: 'boolean', nullable: false, undefinable: false, voidable: false };
  }

  return null;
}

/**
 * Recursively resolve a type to its most fundamental form, handling:
 * - Type aliases
 * - Union types
 * - Complex generic types
 */
function resolveTypeRecursively(checker: ts.TypeChecker, type: ts.Type): {
  type: 'string' | 'number' | 'boolean' | 'function' | 'array' | 'object' | null;
  nullable: boolean;
  undefinable: boolean;
  voidable: boolean;
} | null {
  const visited = new Set<ts.Type>();

  function resolve(currentType: ts.Type): {
    type: 'string' | 'number' | 'boolean' | 'function' | 'array' | 'object' | null;
    nullable: boolean;
    undefinable: boolean;
    voidable: boolean;
  } | null {
    // Prevent infinite recursion
    if (visited.has(currentType)) {
      return { type: 'object', nullable: false, undefinable: false, voidable: false };
    }
    visited.add(currentType);

    // Handle union types
    if (currentType.flags & ts.TypeFlags.Union) {
      const unionType = currentType as ts.UnionType;

      const nullable = unionType.types.some(t => t.flags & ts.TypeFlags.Null);
      const undefinable = unionType.types.some(t => t.flags & ts.TypeFlags.Undefined);
      const voidable = unionType.types.some(t => t.flags & ts.TypeFlags.Void);

      // Filter out null, undefined, void
      const nonNullableTypes = unionType.types.filter(t =>
        !(t.flags & (ts.TypeFlags.Undefined | ts.TypeFlags.Null | ts.TypeFlags.Void))
      );

      if (nonNullableTypes.length === 0) {
        return { type: null, nullable, undefinable, voidable };
      }

      if (nonNullableTypes.length === 1) {
        // Single non-nullable type - recurse into it
        const firstType = nonNullableTypes[0];
        if (firstType) {
          const resolved = resolve(firstType);
          if (resolved) {
            return {
              ...resolved,
              nullable: nullable || resolved.nullable,
              undefinable: undefinable || resolved.undefinable,
              voidable: voidable || resolved.voidable
            };
          }
        }
      } else {
        // Multiple non-nullable types - use the FIRST type for constructor inference
        const firstType = nonNullableTypes[0];
        if (firstType) {
          const resolved = resolve(firstType);
          if (resolved) {
            return {
              ...resolved,
              nullable: nullable || resolved.nullable,
              undefinable: undefinable || resolved.undefinable,
              voidable: voidable || resolved.voidable
            };
          }
        }

        // Fallback to object if we can't resolve the first type
        return { type: 'object', nullable, undefinable, voidable };
      }
    }

    // Handle type aliases and references
    if (currentType.symbol?.declarations) {
      for (const declaration of currentType.symbol.declarations) {
        if (ts.isTypeAliasDeclaration(declaration) && declaration.type) {
          // Check if the aliased type is an array at the AST level
          if (ts.isArrayTypeNode(declaration.type)) {
            return { type: 'array', nullable: false, undefinable: false, voidable: false };
          }

          // Check if the aliased type is a generic Array<T>
          if (ts.isTypeReferenceNode(declaration.type)) {
            const typeName = declaration.type.typeName;
            if (ts.isIdentifier(typeName) && typeName.text === 'Array') {
              return { type: 'array', nullable: false, undefinable: false, voidable: false };
            }
          }

          // Recursively resolve the aliased type
          try {
            const aliasedType = checker.getTypeFromTypeNode(declaration.type);
            if (aliasedType && aliasedType !== currentType) {
              const resolved = resolve(aliasedType);
              if (resolved) return resolved;
            }
          } catch {
            // Continue to other analysis methods
          }
        }
      }
    }

    // Handle generic types and type references
    if (currentType.flags & ts.TypeFlags.Object) {
      const objectType = currentType as ts.ObjectType;

      // Check if this is a generic type instantiation
      if (objectType.objectFlags & ts.ObjectFlags.Reference) {
        const typeReference = objectType as ts.TypeReference;

        // Try to resolve the target type
        if (typeReference.target?.symbol) {
          const targetSymbol = typeReference.target.symbol;

          // Look for the original type alias declaration
          if (targetSymbol.declarations) {
            for (const declaration of targetSymbol.declarations) {
              if (ts.isTypeAliasDeclaration(declaration)) {
                // Analyze generic type aliases by their structure
                if (declaration.type && typeReference.typeArguments) {
                  // For generic type aliases with multiple type arguments,
                  // check if any argument suggests the result should be a string type
                  if (typeReference.typeArguments.length >= 2) {
                    const secondArgType = typeReference.typeArguments[1];

                    // If one of the later arguments is string, this might be a string-extending pattern
                    if (secondArgType && secondArgType.flags & ts.TypeFlags.String) {
                      // Check if the alias type is a union that includes the first argument
                      if (ts.isUnionTypeNode(declaration.type)) {
                        return { type: 'string', nullable: false, undefinable: false, voidable: false };
                      }
                    }
                  }

                  // General approach: analyze all type arguments
                  for (const typeArg of typeReference.typeArguments) {
                    if (typeArg.flags & (ts.TypeFlags.String | ts.TypeFlags.StringLiteral)) {
                      return { type: 'string', nullable: false, undefinable: false, voidable: false };
                    }
                    // Recursively check the type argument
                    const resolved = resolve(typeArg);
                    if (resolved?.type === 'string') {
                      return { type: 'string', nullable: false, undefinable: false, voidable: false };
                    }
                  }
                }

                // General generic type resolution
                try {
                  const aliasedType = checker.getTypeFromTypeNode(declaration.type);
                  if (aliasedType && aliasedType !== currentType) {
                    const resolved = resolve(aliasedType);
                    if (resolved) return resolved;
                  }
                } catch {
                  // Continue to other analysis methods
                }
              }
            }
          }
        }
      }
    }

    // Handle 'any' type by attempting to trace back to original declaration
    if (currentType.flags & ts.TypeFlags.Any) {
      // When TypeScript resolves a type to 'any', it usually means there's a complex
      // generic or intersection type that it can't properly resolve. In these cases,
      // we fall back to a reasonable default.
      return { type: 'object', nullable: false, undefinable: false, voidable: false };
    }

    // Handle intersection types
    if (currentType.flags & ts.TypeFlags.Intersection) {
      const intersectionType = currentType as ts.IntersectionType;
      // For intersections, try to find the most specific type
      for (const intersectedType of intersectionType.types) {
        const resolved = resolve(intersectedType);
        if (resolved && resolved.type !== 'object') {
          return resolved;
        }
      }
      // Default to object for complex intersections
      return { type: 'object', nullable: false, undefinable: false, voidable: false };
    }

    // Direct type analysis
    return analyzeDirectType(checker, currentType);
  }

  return resolve(type);
}

/**
 * Analyze a type directly without recursion
 */
function analyzeDirectType(checker: ts.TypeChecker, type: ts.Type): {
  type: 'string' | 'number' | 'boolean' | 'function' | 'array' | 'object' | null;
  nullable: boolean;
  undefinable: boolean;
  voidable: boolean;
} {
  const nullable = !!(type.flags & ts.TypeFlags.Null);
  const undefinable = !!(type.flags & ts.TypeFlags.Undefined);
  const voidable = !!(type.flags & ts.TypeFlags.Void);

  let resultType: 'string' | 'number' | 'boolean' | 'function' | 'array' | 'object' | null = null;

  if (isStringLikeType(type)) {
    resultType = 'string';
  } else if (isNumberLikeType(type)) {
    resultType = 'number';
  } else if (isBooleanLikeType(type)) {
    resultType = 'boolean';
  } else if (isFunctionLikeType(type)) {
    resultType = 'function';
  } else if (isArrayLikeType(checker, type)) {
    resultType = 'array';
  } else if (type.flags & ts.TypeFlags.Object) {
    resultType = 'object';
  }

  return { type: resultType, nullable, undefinable, voidable };
}

/**
 * Check if a type is string-like (string, string literal, template literal, etc.)
 */
function isStringLikeType(type: ts.Type): boolean {
  return !!(type.flags & (
    ts.TypeFlags.String |
    ts.TypeFlags.StringLiteral |
    ts.TypeFlags.TemplateLiteral
  ));
}

/**
 * Check if a type is number-like (number, number literal, enum, etc.)
 */
function isNumberLikeType(type: ts.Type): boolean {
  return !!(type.flags & (
    ts.TypeFlags.Number |
    ts.TypeFlags.NumberLiteral |
    ts.TypeFlags.Enum |
    ts.TypeFlags.EnumLiteral
  ));
}

/**
 * Check if a type is boolean-like (boolean, boolean literal)
 */
function isBooleanLikeType(type: ts.Type): boolean {
  return !!(type.flags & (
    ts.TypeFlags.Boolean |
    ts.TypeFlags.BooleanLiteral
  ));
}

/**
 * Check if a type is function-like (has call signatures)
 */
function isFunctionLikeType(type: ts.Type): boolean {
  return type.getCallSignatures().length > 0;
}

/**
 * Check if a type is array-like (array, tuple, readonly array)
 */
function isArrayLikeType(checker: ts.TypeChecker, type: ts.Type): boolean {
  return checker.isArrayType(type) || (checker.isTupleType?.(type) ?? false);
}

/**
 * Analyze a resolved type and return the final result
 */
function analyzeResolvedType(resolved: {
  type: 'string' | 'number' | 'boolean' | 'function' | 'array' | 'object' | null;
  nullable: boolean;
  undefinable: boolean;
  voidable: boolean;
}): Pick<SimpleTypeResult, 'type' | 'nullable' | 'undefinable' | 'voidable'> {
  return {
    type: resolved.type,
    nullable: resolved.nullable,
    undefinable: resolved.undefinable,
    voidable: resolved.voidable
  };
}

export function computeConstructorType(
  checker: ts.TypeChecker,
  node: ts.TypeNode | ts.Expression | undefined
): ts.Expression | null {
  const simpleType = computeSimpleType(checker, node);

  // Return null for types that don't exist at runtime
  if (!simpleType.type) return null;

  switch (simpleType.type) {
    case 'string':
      return expr("String");
    case 'number':
      return expr("Number");
    case 'boolean':
      return expr("Boolean");
    case 'function':
      return expr("Function");
    case 'array':
      return expr("Array");
    case 'object':
      return expr("Object");
    default:
      return null;
  }
}
