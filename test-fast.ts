import { Scope } from "ts-morph";
import {
  cls,
  code,
  createProject,
  method,
  param,
  registry,
  sourceFile,
  writeAll,
} from "./src/index";

const tsconfigProject = createProject({
  strict: true,
});

registry.registerSymbol("Signale", "signale", {
  importType: "named",
});

// Create files - they will be auto-registered with the default registry
sourceFile("Dog.ts", [
  cls("Dog", [
    method({
      name: "constructor",
      params: [param("name", "string", false, Scope.Protected)],
    }),
    method({
      name: "bark",
      returnType: "void",
      body: code`console.log("Woof!");`,
    }),
    method({
      name: "getName",
      returnType: "string",
      body: code`return this.name;`,
    }),
    method({
      name: "setName",
      params: [param("name", "string")],
      returnType: "void",
      body: code`this.name = name;`,
    }),
  ]),
]);

sourceFile("PetStore.ts", [
  cls("PetStore", [
    method({
      name: "getDogs",
      params: [param("opt1", "Dog[]")],
      returnType: "void",
      body: code`
        for (const dog of opt1) {
          dog.bark();
          new Signale().fav("Dog " + dog.getName() + " barked");
        }
      `,
    }),
  ]),
]);

sourceFile("index.ts", [], {
  barrel: true, // Include all files
});

// Write all files with diagnostics disabled for speed
await writeAll({
  outputDir: "out/fast/",
  project: tsconfigProject,
  skipDiagnostics: true,
});
