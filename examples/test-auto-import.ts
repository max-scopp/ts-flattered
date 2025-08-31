import { cls, code, method, param, sourceFile, writeAll } from "../src/index";

// Create a Dog class that will be auto-imported
sourceFile("Dog.ts", [
  cls("Dog", [
    method({
      name: "bark",
      returnType: "void",
      body: code`console.log("Woof!");`,
    }),
  ]),
]);

// Create a Cat class that will be auto-imported
sourceFile("Cat.ts", [
  cls("Cat", [
    method({
      name: "meow",
      returnType: "void",
      body: code`console.log("Meow!");`,
    }),
  ]),
]);

// Create a PetStore that uses Dog and Cat in code blocks
sourceFile("PetStore.ts", [
  cls("PetStore", [
    method({
      name: "createDog",
      params: [param("name", "string")],
      returnType: "Dog",
      body: code`
        const dog = new Dog();
        // Dog.someStaticMethod();
        return dog;
      `,
    }),
    method({
      name: "createCat",
      returnType: "Cat",
      body: code`
        return new Cat();
      `,
    }),
    method({
      name: "makeNoise",
      params: [param("pet", "Dog | Cat")],
      returnType: "void",
      body: code`
        if (pet instanceof Dog) {
          pet.bark();
        } else if (pet instanceof Cat) {
          pet.meow();
        }
      `,
    }),
  ]),
]);

await writeAll({ outputDir: "./out/auto-import-test" });
