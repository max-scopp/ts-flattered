import { code, param } from "../src";
import { cls } from "../src/api/cls";
import { ctor } from "../src/api/ctor";
import { method } from "../src/api/method";
import { Program } from "../src/api/program";

// Create a new program
const program = new Program();

// Create base entity class
const baseFile = program.createSourceFile("BaseEntity.ts");
const baseEntity = cls({
  name: "BaseEntity",
  isExported: true,
  members: [
    ctor({
      parameters: [
        param({ name: "id", type: "string", scope: "protected" }),
        param({ name: "createdAt", type: "Date", scope: "protected" }),
      ],
      body: code("this.createdAt = new Date();"),
    }),

    method({
      name: "getId",
      returnType: "string",
      body: code("return this.id;"),
    }),

    method({
      name: "getCreatedAt",
      returnType: "Date",
      body: code("return this.createdAt;"),
    }),
  ],
});
baseFile.addStatement(baseEntity);

// Create User class that extends BaseEntity
const userFile = program.createSourceFile("User.ts");
const userClass = cls({
  name: "User",
  isExported: true,
  extends: "BaseEntity",
  members: [
    ctor({
      parameters: [
        param({ name: "id", type: "string" }),
        param({ name: "username", type: "string", scope: "private" }),
        param({ name: "email", type: "string", scope: "private" }),
      ],
      body: code("super(id);"),
    }),

    method({
      name: "getUsername",
      returnType: "string",
      body: code("return this.username;"),
    }),

    method({
      name: "getEmail",
      returnType: "string",
      body: code("return this.email;"),
    }),

    method({
      name: "getProfile",
      returnType: "string",
      body: code(
        "return 'User: ' + this.username + ', Email: ' + this.email + ', ID: ' + this.getId();",
      ),
    }),
  ],
});
userFile.addStatement(userClass);

// Create UserService class that uses User
const serviceFile = program.createSourceFile("UserService.ts");
const userService = cls({
  name: "UserService",
  isExported: true,
  members: [
    method({
      name: "createUser",
      parameters: [
        { name: "username", type: "string" },
        { name: "email", type: "string" },
      ],
      returnType: "User",
      body: code(
        "const id = Math.random().toString(36); return new User(id, username, email);",
      ),
    }),

    method({
      name: "formatUserInfo",
      parameters: [{ name: "user", type: "User" }],
      returnType: "string",
      body: code(
        "return 'Profile: ' + user.getProfile() + ', Created: ' + user.getCreatedAt().toISOString();",
      ),
    }),
  ],
});
serviceFile.addStatement(userService);

await program.writeAll("out/registry-example");
