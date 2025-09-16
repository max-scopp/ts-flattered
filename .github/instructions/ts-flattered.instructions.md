---
applyTo: '**'
---

# **`tsf` API Builder Instruction File**

This guide explains how to create **new fluent AST builders** in `tsf`, following the standardized pattern for fluent chaining, modifiers, and AST node building.

---

## **1. Choose Node Type**

Decide which TypeScript AST node your API should produce:

| API        | TS Node Type                |
| ---------- | --------------------------- |
| `klass()`  | `ts.ClassDeclaration`       |
| `func()`   | `ts.FunctionDeclaration`    |
| `method()` | `ts.MethodDeclaration`      |
| `ctor()`   | `ts.ConstructorDeclaration` |
| `prop()`   | `ts.PropertyDeclaration`    |

All builders **must return TS nodes fully compatible with `ts.factory`**.

---

## **2. Builder Class Structure**

1. Create a `Builder` class implementing `BuildableAST`.
2. Constructor should accept a **single options object** for essential properties (e.g., name, members, modifiers, type params, heritage).
3. Maintain **internal AST node** using `#decl` field that gets updated directly.
4. Include **fluent modifier methods** (all prefixed with `$`) that update the AST node using `ts.factory.update*` methods.
5. Include **dynamic methods** to add members or children that also update the AST node directly.

**Builder skeleton:**

```ts
import ts from "typescript";
import { BuildableAST } from "../utils/buildFluentApi";
import { $export, $abstract, $readonly } from "./modifier";

class ExampleBuilder implements BuildableAST {
  #decl: ts.ClassDeclaration; // Store the actual AST node

  constructor({ name, children, mods }: { name: string; children?: ts.ClassElement[]; mods?: ts.ModifierLike[] }) {
    // Create the initial AST node in constructor
    this.#decl = ts.factory.createClassDeclaration(
      mods,
      ts.factory.createIdentifier(name),
      undefined, // typeParameters
      undefined, // heritageClauses
      children ?? [],
    );
  }

  // === Fluent modifier methods ===
  $export() {
    // Update the AST node directly using ts.factory.update* methods
    this.#decl = ts.factory.updateClassDeclaration(
      this.#decl,
      [...(this.#decl.modifiers || []), $export()],
      this.#decl.name,
      this.#decl.typeParameters,
      this.#decl.heritageClauses,
      this.#decl.members,
    );
    return this;
  }

  $abstract() {
    this.#decl = ts.factory.updateClassDeclaration(
      this.#decl,
      [...(this.#decl.modifiers || []), $abstract()],
      this.#decl.name,
      this.#decl.typeParameters,
      this.#decl.heritageClauses,
      this.#decl.members,
    );
    return this;
  }

  $readonly() {
    this.#decl = ts.factory.updateClassDeclaration(
      this.#decl,
      [...(this.#decl.modifiers || []), $readonly()],
      this.#decl.name,
      this.#decl.typeParameters,
      this.#decl.heritageClauses,
      this.#decl.members,
    );
    return this;
  }

  $mod(mod: ts.Modifier) {
    this.#decl = ts.factory.updateClassDeclaration(
      this.#decl,
      [...(this.#decl.modifiers || []), mod],
      this.#decl.name,
      this.#decl.typeParameters,
      this.#decl.heritageClauses,
      this.#decl.members,
    );
    return this;
  }

  // === Dynamic children/members methods ===
  addMember(node: ts.ClassElement) {
    this.#decl = ts.factory.updateClassDeclaration(
      this.#decl,
      this.#decl.modifiers,
      this.#decl.name,
      this.#decl.typeParameters,
      this.#decl.heritageClauses,
      [...this.#decl.members, node],
    );
    return this;
  }

  // === AST access method ===
  get(): ts.ClassDeclaration {
    return this.#decl;
  }
}
```

---

## **3. Public API**

* Wrap the builder using `buildFluentApi`.
* Keep the **API signature simple** for static building.
* Returned object merges **builder methods** + **AST node properties**.

```ts
import { buildFluentApi } from "../utils/buildFluentApi";

export const example = (name: string, children: ts.Node[] = [], mods?: ts.ModifierLike[]) =>
  buildFluentApi(ExampleBuilder, { name, children, mods });
```

---

## **4. Fluent Modifier Pattern**

* All modifiers **start with `$`**:

  ```ts
  $export(), $abstract(), $readonly(), $mod()
  ```
* Modifiers **mutate internal state** and **return `this`** for chaining:

  ```ts
  example("MyNode").$export().$abstract().addChild(someChild);
  ```

---

## **5. Dynamic AST Building**

* Constructor creates the **initial AST node** using `ts.factory.create*`.
* Fluent methods **update the AST node directly** using the **appropriate `ts.factory.update*` method**.
* `get()` method returns the **current AST node** (no building required).
* Proxy ensures **all builder methods and AST properties** are accessible fluently.

```ts
const myNode = example("MyClass").$export().addMember(propNode);
const node: ts.ClassDeclaration = myNode.get(); // Returns updated AST node
```

---

## **6. CRITICAL: Trivia Preservation Requirements**

**⚠️ MUST VERIFY: All new APIs must consider trivia (comments, decorators, JSDoc) preservation to avoid losing important code metadata.**

**Note: TypeScript automatically preserves trivia when `setParentNodes` is set to `true` in `ts.createSourceFile`, which is always done in this codebase.**

### **Builder Constructor Patterns**

All builder constructors **MUST** support both creation modes:

1. **Create new node**: For building from scratch
2. **Adopt existing node**: For preserving trivia when updating existing code

**Required constructor pattern:**

```ts
constructor({
  name,
  type,
  optional,
}: {
  name: string;
  type?: ts.TypeNode;
  optional?: boolean;
});
constructor(from: ts.PropertyDeclaration);
constructor(
  optionsOrFrom: 
    | { name: string; type?: ts.TypeNode; optional?: boolean }
    | ts.PropertyDeclaration
) {
  if ('name' in optionsOrFrom) {
    // Create new node
    this.#decl = ts.factory.createPropertyDeclaration(
      undefined, // modifiers
      optionsOrFrom.name,
      optionsOrFrom.optional
        ? ts.factory.createToken(ts.SyntaxKind.QuestionToken)
        : undefined,
      optionsOrFrom.type,
      undefined, // initializer
    );
  } else {
    // Adopt from existing node - preserves ALL trivia
    this.#decl = optionsOrFrom;
  }
}
```

### **Public API Function Patterns**

Public functions **MUST** support both creation and adoption through overloading:

```ts
export const prop = (
  nameOrProperty: string | ts.PropertyDeclaration, 
  type?: ts.TypeNode, 
  optional?: boolean
) => {
  if (typeof nameOrProperty === 'string') {
    return buildFluentApi(PropBuilder, { name: nameOrProperty, type, optional });
  } else {
    // Adopt existing node to preserve trivia
    return buildFluentApi(PropBuilder, { from: nameOrProperty });
  }
};
```

**Alternative overloaded signatures (recommended):**
```ts
export function prop(name: string, type?: ts.TypeNode, optional?: boolean): ReturnType<typeof buildFluentApi>;
export function prop(existingProperty: ts.PropertyDeclaration): ReturnType<typeof buildFluentApi>;
export function prop(
  nameOrProperty: string | ts.PropertyDeclaration, 
  type?: ts.TypeNode, 
  optional?: boolean
) {
  if (typeof nameOrProperty === 'string') {
    return buildFluentApi(PropBuilder, { name: nameOrProperty, type, optional });
  } else {
    return buildFluentApi(PropBuilder, nameOrProperty);
  }
}
```

### **Update Method Requirements**

When implementing `update*ByFilter` methods in parent builders (like `updatePropertiesByFilter`):

**❌ WRONG - Loses trivia:**
```ts
const propertyBuilder = prop(
  foundProperty.name.text,
  foundProperty.type,
  !!foundProperty.questionToken
);
```

**✅ CORRECT - Preserves trivia:**
```ts
const propertyBuilder = prop(foundProperty); // Pass entire node
```

### **Testing Requirements**

Every new builder **MUST** include tests that verify:

1. ✅ JSDoc comments are preserved
2. ✅ Decorators are preserved  
3. ✅ Inline comments are preserved
4. ✅ Leading/trailing trivia is preserved
5. ✅ `print()` method output contains all original trivia

**Test pattern:**
```ts
const original = `
  /**
   * JSDoc comment
   */
  @Decorator({ option: true })
  property: string; // inline comment
`;

const builder = prop(existingPropertyNode);
const updated = builder.someUpdate();
const result = updated.get().getFullText();

// MUST contain all original trivia
assert(result.includes("JSDoc comment"));
assert(result.includes("@Decorator"));
assert(result.includes("inline comment"));
```

---

## **7. General Coding Guidelines**

1. Keep **API calls flat** — avoid standalone `param()` or `typeParam()`.
2. Prefer **fluent chaining** over options objects for simple cases.
3. Builder **state and node** are separate internally; public API merges via proxy.
4. Modifier helpers must be **reusable across builders**.
5. Maintain **full TypeScript type safety**:

   * `build()` → correct `ts.factory` type
   * `update()` → appropriate TS update method
   * Public API → builder + node merged

---

## **8. Summary**

* **Builder class** → maintains internal AST node (`#decl`) + fluent methods
* **Constructor** → creates initial AST node via `ts.factory.create*` OR adopts existing node for trivia preservation
* **Fluent methods** → update AST node directly using `ts.factory.update*` methods
* **`get()`** → returns the current AST node (no building step required)
* **Public API** → `buildFluentApi` merges builder + AST proxy + supports both creation modes
* **Modifiers** → always `$` prefixed (`$export`, `$abstract`, `$readonly`)
* **Dynamic additions** → `addMember()`, `addChild()`, `addTypeParam()` update AST directly
* **⚠️ TRIVIA PRESERVATION** → All builders MUST support adopting existing nodes to preserve comments/decorators

> Following this ensures all new APIs are **consistent, fluent, trivia-preserving, and fully compatible** with TypeScript AST and your DSL.
