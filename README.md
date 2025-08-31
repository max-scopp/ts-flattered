# ts-flattered

> A optionated, hybrid DSL for generating TypeScript code.

## ✅ Features

* **Hybrid DSL**: structured nodes + arbitrary code blocks
* **Automatic imports**: symbols resolved from registry
* **Local vs global registries**: isolation for experimental or modular code

## 🛠 Core Concepts

### 1. DSL Nodes

| Node                                  | Description                                                      |
| ------------------------------------- | ---------------------------------------------------------------- |
| `sourceFile(name, statements, opts?)` | Creates a file with statements and optional registry             |
| `cls(name, members, decorators?)`     | Creates a class with members and optional decorators             |
| `method(opts)`                        | Creates a method; accepts `name`, `params`, `returnType`, `body` |
| `param(name, type)`                   | Creates a parameter for a method                                 |
| `decorator(name)`                     | Adds a decorator to a class or method                            |
| `code`                                | Template literal escape hatch for arbitrary code                 |

---

### 2. Registry

* Tracks files and exported symbols
* Resolves imports **automatically** from parameter types, return types, or registered symbols
* Supports **global registry** (`registry`) or **local per-file registry**

**API:**

```ts
registry.push(file)          // Add a file
registry.addImport(fileName, importStr) // Explicit import if needed
registry.resolveSymbol(name) // Returns file path or undefined
registry.getFiles()          // List of registered files
```

---

## ⚡ Example: Global Registry

```ts
import { cls, method, param, code, sourceFile, registry } from "./dsl";

// Dog file
const dogFile = sourceFile("Dog.ts", [
  cls("Dog", [
    method({ name: "bark", returnType: "void", body: code`console.log("Woof!")` })
  ])
]);
registry.push(dogFile);

// PetStore file
const petStoreFile = sourceFile("PetStore.ts", [
  cls("PetStore", [
    method({
      name: "getDogs",
      params: [param("opt1", "Dog[]")],
      returnType: "void",
      body: code`for (const dog of opt1) dog.bark();`
    })
  ])
]);
registry.push(petStoreFile);

// Render PetStore
console.log(petStoreFile.render());
```

**Output:**

```ts
import { Dog } from "./Dog";

class PetStore {
getDogs(opt1: Dog[]): void {
for (const dog of opt1) dog.bark();
}
}
```

---

## ⚡ Example: Local Registry

```ts
import { Registry } from "./dsl/registry";

const localRegistry = new Registry();

const dogFile = sourceFile("Dog.ts", [ cls("Dog", [ method({ name: "bark", returnType: "void", body: code`console.log("Woof!")` }) ]) ], { registry: localRegistry });
localRegistry.push(dogFile);

const petStoreFile = sourceFile("PetStore.ts", [ cls("PetStore", [ method({ name: "getDogs", params: [param("opt1","Dog[]")], returnType:"void", body: code`for(const dog of opt1) dog.bark();` }) ]) ], { registry: localRegistry });
localRegistry.push(petStoreFile);

console.log(petStoreFile.render());
```

* Fully **isolated imports**
* Symbols only visible in this registry
* Global registry unaffected

---

## 🎛 Plugin System

* Plugins receive a registry (global or local)
* Can push files, add methods, decorators, or modify existing classes
* Works seamlessly with auto-imports

```ts
export function dogPlugin(registry) {
  const catMethod = method({
    name: "countDogs",
    params: [param("dogs", "Dog[]")],
    returnType: "number",
    body: code`return dogs.length;`
  });

  const file = registry.getFiles().find(f => f.name === "PetStore.ts");
  file.addStatement(cls("PetStore", [catMethod]));
}
```
