import type ts from "typescript";

/**
 * Generic interface for any builder that can produce a TS AST node
 */
export interface BuildableAST {
  get(): ts.Node;
}

/**
 * Generic helper to create a fluent builder API
 *
 * - BuilderClass: a class implementing BuildableAST
 * - options: constructor options for the builder
 *
 * Returns: a merged object containing both:
 *   1. the latest AST node from build()
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

  // Proxy that gets the current AST node on each access
  const proxy = new Proxy(builder, {
    get(target, prop, receiver) {
      // Get the current node from the builder
      const currentNode = target.get();

      // Prioritize AST node properties, fallback to builder methods
      if (prop in currentNode) {
        return (currentNode as unknown as Record<string | symbol, unknown>)[
          prop
        ];
      }

      const value = Reflect.get(target, prop, receiver);

      // If it's a method, wrap it to ensure fluent chaining returns the proxy
      if (typeof value === "function") {
        return (...args: unknown[]) => {
          const result = value.apply(target, args);
          // If the method returns the builder (for fluent chaining), return the proxy instead
          if (result === target) {
            return receiver;
          }
          return result;
        };
      }

      return value;
    },
  });

  return proxy as TBuilder & ReturnType<TBuilder["get"]>;
}
