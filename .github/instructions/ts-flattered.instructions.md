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
3. Maintain **internal state** for modifiers, children, type parameters, etc.
4. Include **fluent modifier methods** (all prefixed with `$`) to mutate internal state.
5. Include **dynamic methods** to add members or children (e.g., `addMember()`, `addTypeParam()`).

**Builder skeleton:**

```ts
import ts from "typescript";
import { BuildableAST } from "../utils/buildFluentApi";
import { $export, $abstract, $readonly } from "./modifier";

class ExampleBuilder<T extends ts.Node> implements BuildableAST {
  #decl?: T;
  #mods: ts.ModifierLike[];
  #children: ts.Node[];
  #name: string;

  constructor({ name, children, mods }: { name: string; children?: ts.Node[]; mods?: ts.ModifierLike[] }) {
    this.#name = name;
    this.#children = children ?? [];
    this.#mods = mods ?? [];
  }

  // === Fluent modifier methods ===
  $export() {
    this.#mods.push($export());
    return this;
  }

  $abstract() {
    this.#mods.push($abstract());
    return this;
  }

  $readonly() {
    this.#mods.push($readonly());
    return this;
  }

  $mod(mod: ts.Modifier) {
    this.#mods.push(mod);
    return this;
  }

  // === Dynamic children/members methods ===
  addChild(node: ts.Node) {
    this.#children.push(node);
    return this;
  }

  // === AST build/update methods ===
  // build() → creates a new node using ts.factory
  build(): T {
    this.#decl = ts.factory.createNode(/* relevant factory call */);
    return this.#decl;
  }

  // update() → updates an existing node using the **appropriate ts.factory update method**
  update(): T {
    if (!this.#decl) throw new Error("Node not built");
    return ts.factory.updateNode(this.#decl, this.#mods, this.#children);
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

* `build()` → always creates a **new AST node** using `ts.factory`.
* `update()` → updates an **already-built node** using the **appropriate `ts.factory.update*` method**.
* Proxy ensures **all builder methods and AST properties** are accessible fluently.

```ts
const myNode = example("MyClass").$export().addChild(propNode);
const node: ts.ClassDeclaration = myNode.build();
```

---

## **6. General Coding Guidelines**

1. Keep **API calls flat** — avoid standalone `param()` or `typeParam()`.
2. Prefer **fluent chaining** over options objects for simple cases.
3. Builder **state and node** are separate internally; public API merges via proxy.
4. Modifier helpers must be **reusable across builders**.
5. Maintain **full TypeScript type safety**:

   * `build()` → correct `ts.factory` type
   * `update()` → appropriate TS update method
   * Public API → builder + node merged

---

## **7. Summary**

* **Builder class** → internal state + fluent methods
* **`build()`** → creates a new node via `ts.factory`
* **`update()`** → modifies an existing node using the correct `ts.factory.update*` method
* **Public API** → `buildFluentApi` merges builder + AST proxy
* **Modifiers** → always `$` prefixed (`$export`, `$abstract`, `$readonly`)
* **Dynamic additions** → `addMember()`, `addChild()`, `addTypeParam()`

> Following this ensures all new APIs are **consistent, fluent, and fully compatible** with TypeScript AST and your DSL.
