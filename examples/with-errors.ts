import {
  cls,
  code,
  createProject,
  method,
  param,
  sourceFile,
  writeAll,
} from "../src/index";

const tsconfigProject = createProject({
  strict: true,
});

// Create files - they will be auto-registered with the default registry
sourceFile("Dog.ts", [
  cls("Dog", [
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
      body: code`for (const dog of opt1) dog.bark();`,
    }),
  ]),
]);

sourceFile("index.ts", [], {
  barrel: true, // Include all files
});

// You could also create more specific barrel files:
// const modelsBarrel = sourceFile("models/index.ts", [], {
//   barrel: {
//     pathMatcher: /^models\//,  // Only files in models folder
//   }
// });

// const specificBarrel = sourceFile("api.ts", [], {
//   barrel: {
//     pathMatcher: /Service\.ts$/,  // Only files ending with Service.ts
//     symbols: ["ApiService", "UserService"]  // Only export these symbols
//   }
// });

// Write all files with custom project
await writeAll({
  outputDir: "out/with-errors/",
  project: tsconfigProject,
});
