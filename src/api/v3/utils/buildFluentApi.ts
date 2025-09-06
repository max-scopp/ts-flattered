import type ts from "typescript";

/**
 * Generic interface for any builder that can produce a TS AST node
 */
export interface BuildableAST {
  build(): ts.Node;
  update(): ts.Node;
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
): TBuilder & ReturnType<TBuilder["build"]> {
  const builder = new BuilderClass(options);

  // Proxy that always rebuilds AST on access
  const proxy = new Proxy(builder, {
    get(target, prop, receiver) {
      const node = target.update();
      // Prioritize AST node properties, fallback to builder methods
      if (prop in node) return (node as any)[prop];
      return Reflect.get(target, prop, receiver);
    },
  }) as TBuilder & ReturnType<TBuilder["update"]>;

  return proxy;
}
