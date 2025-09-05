import { code } from "../src";
import { cls } from "../src/api/cls";
import { ctor } from "../src/api/ctor";
import { method } from "../src/api/method";
import { param } from "../src/api/param";
import { Program } from "../src/api/program";

// Create a new program
const program = new Program();

// Create parameters using the new param() API
const idParam = param({
  name: "id",
  type: "number",
  scope: "private",
  isReadonly: true,
});

const nameParam = param({
  name: "name",
  type: "string",
  scope: "private",
});

const emailParam = param({
  name: "email",
  type: "string",
  scope: "private",
  isOptional: true,
});

const optionsParam = param({
  name: "options",
  type: "UserOptions",
  defaultValue: "{}",
  isOptional: true,
});

// Create method parameters
const userIdParam = param({
  name: "userId",
  type: "number",
});

const updateDataParam = param({
  name: "updateData",
  type: "Partial<User>",
});

const callbackParam = param({
  name: "callback",
  type: "(user: User) => void",
  isOptional: true,
});

// Create a User class demonstrating the param() API
const userClass = cls({
  name: "User",
  isExported: true,
  members: [
    // Constructor using param() API
    ctor({
      parameters: [idParam, nameParam, emailParam, optionsParam],
      body: code(`
        this.id = id;
        this.name = name;
        this.email = email || '';
        this.createdAt = new Date();
        console.log('User created:', this.name);
      `),
    }),

    // Method using param() API
    method({
      name: "updateUser",
      parameters: [updateDataParam, callbackParam],
      returnType: "void",
      body: code(`
        Object.assign(this, updateData);
        console.log('User updated:', this.name);

        if (callback) {
          callback(this);
        }
      `),
    }),

    // Static method demonstrating mixed usage
    method({
      name: "findById",
      isStatic: true,
      parameters: [
        userIdParam, // Using param() API
        // Mixed with legacy format
        { name: "includeDeleted", type: "boolean", scope: "public" },
      ],
      returnType: "Promise<User | null>",
      body: code(`
        console.log('Finding user with ID:', userId);
        console.log('Include deleted:', includeDeleted);

        // Simulate database lookup
        return Promise.resolve(null);
      `),
    }),

    // Method with rest parameters
    method({
      name: "addTags",
      parameters: [
        param({
          name: "tags",
          type: "string[]",
          isRestParameter: true,
        }),
      ],
      returnType: "void",
      body: code(`
        console.log('Adding tags:', tags);
        this.tags = [...(this.tags || []), ...tags];
      `),
    }),
  ],
});

// Create source file and add the class
const sourceFile = program.createSourceFile("User.ts");
sourceFile.addStatement(userClass);

await program.writeAll("out/param-api-example");
