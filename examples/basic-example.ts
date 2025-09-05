import { cls, code, ctor, method, param } from "../src";
import { Program } from "../src/api/program";

const program = new Program();
const sourceFile = program.createSourceFile("User.ts");
sourceFile.addStatement(
  cls({
    name: "User",
    isExported: true,
    members: [
      // Constructor
      ctor({
        parameters: [
          param({ name: "id", type: "number", scope: "private" }),
          param({ name: "name", type: "string", scope: "private" }),
          param({ name: "email", type: "string", scope: "private" }),
        ],
        body: code("console.log('User created:', this.name);"),
      }),
      // Getter methods
      method({
        name: "getId",
        returnType: "number",
        body: code("return this.id;"),
      }),
      method({
        name: "getName",
        returnType: "string",
        body: code("return this.name;"),
      }),
      method({
        name: "getEmail",
        returnType: "string",
        body: code("return this.email;"),
      }),
      // Business logic method
      method({
        name: "getDisplayInfo",
        returnType: "string",
        body: code(
          "return this.name + ' (' + this.email + ') - ID: ' + this.id;",
        ),
      }),
    ],
  }),
);

await program.writeAll("out/basic-example");
