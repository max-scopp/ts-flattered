import type ts from "typescript";

/**
 * Generic interface for any builder that can produce a TS AST node
 */
export interface BuildableAST {
  get(): ts.Node | ts.Program;
}

/**
 * Generic helper to create a fluent builder API
 *
 * - BuilderClass: a class implementing BuildableAST
 * - options: constructor options for the builder
 *
 * Returns: a merged object containing both:
 *   1. the latest AST node from get()
 *   2. all builder methods for fluent chaining
 */
export function buildFluentApi<
  TBuilderOptions extends object,
  TBuilder extends BuildableAST,
>(
  BuilderClass: new (options: TBuilderOptions) => TBuilder,
  options: TBuilderOptions,
): TBuilder & ReturnType<TBuilder["get"]> {
  const builder = new BuilderClass(options);

  return new Proxy(builder, {
    get(target, prop, receiver) {
      // Check builder first (fastest path)
      const builderValue = (target as Record<string | symbol, unknown>)[prop];
      if (builderValue !== undefined) {
        // If it's a method, wrap for fluent chaining
        if (typeof builderValue === "function") {
          return (...args: unknown[]) => {
            const result = builderValue.apply(target, args);
            return result === target ? receiver : result;
          };
        }
        return builderValue;
      }

      // Fallback to AST node properties
      const currentNode = target.get();
      return (currentNode as unknown as Record<string | symbol, unknown>)[prop];
    },
  }) as TBuilder & ReturnType<TBuilder["get"]>;
}
