import { Scope } from "ts-morph";
import { cls, code, method, param, sourceFile, writeAll } from "../src/index";

// Test parameters with different flags
sourceFile("ParameterTest.ts", [
  cls("ParameterTest", [
    method({
      name: "constructor",
      params: [
        param("name", "string", true, Scope.Private),
        param("age", "number", false, Scope.Public),
        param("email", "string", false, Scope.Protected),
        param("id", "string", true),
      ],
      body: code`
        // Constructor body
      `,
    }),
    method({
      name: "processData",
      params: [
        param("data", "any[]"),
        param("options", "unknown"),
        param("...args", "string[]"),
      ],
      returnType: "void",
      body: code`
        console.log(data, options, args);
      `,
    }),
    method({
      name: "combineValues",
      params: [
        param("first", "string"),
        param("second", "number"),
        param("...others", "any[]"),
      ],
      returnType: "string",
      body: code`
        return [first, second, ...others].join(' ');
      `,
    }),
  ]),
]);

await writeAll({ outputDir: "./out/param-test-output" });
