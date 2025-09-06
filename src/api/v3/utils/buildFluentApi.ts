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
      // First check if it's a builder method/property
      const builderValue = Reflect.get(target, prop, receiver);

      // If it's a method on the builder, wrap it to ensure fluent chaining returns the proxy
      if (typeof builderValue === "function") {
        return (...args: unknown[]) => {
          const result = builderValue.apply(target, args);
          // If the method returns the builder (for fluent chaining), return the proxy instead
          if (result === target) {
            return receiver;
          }
          return result;
        };
      }

      // If it's a builder property, return it
      if (builderValue !== undefined) {
        return builderValue;
      }

      // Fallback to AST node properties only if not found on builder
      const currentNode = target.get();
      if (prop in currentNode) {
        return (currentNode as unknown as Record<string | symbol, unknown>)[
          prop
        ];
      }

      return builderValue;
    },
  });

  return proxy as TBuilder & ReturnType<TBuilder["get"]>;
}
