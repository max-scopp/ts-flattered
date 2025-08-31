import { Scope } from "ts-morph";
import {
  cls,
  code,
  imp,
  method,
  param,
  sourceFile,
  writeAll,
} from "../src/index";

// Test external imports
sourceFile(
  "AngularComponent.ts",
  [
    cls("MyComponent", [
      method({
        name: "constructor",
        params: [
          param("http", "HttpClient", false, Scope.Private),
          param("router", "Router", false, Scope.Private),
        ],
        body: code`
        // Constructor body
      `,
      }),
      method({
        name: "ngOnInit",
        returnType: "void",
        body: code`
        console.log('Component initialized');
      `,
      }),
    ]),
  ],
  {
    imports: [
      imp("@angular/common/http", ["HttpClient"]),
      imp("@angular/router", ["Router"]),
      imp("@angular/core", ["Component", "OnInit"]),
    ],
  },
);

// Test different import styles
sourceFile(
  "UtilsComponent.ts",
  [
    cls("UtilsComponent", [
      method({
        name: "processData",
        params: [param("data", "any[]")],
        returnType: "Observable<string>",
        body: code`
        return of(JSON.stringify(data));
      `,
      }),
    ]),
  ],
  {
    imports: [
      imp({ moduleSpecifier: "rxjs", namedImports: ["Observable", "of"] }),
      imp({ moduleSpecifier: "lodash", defaultImport: "_" }),
      imp({ moduleSpecifier: "fs", namespaceImport: "fs" }),
    ],
  },
);

await writeAll({ outputDir: "./out/import-test-output" });
