import { cls, code, imp, method, sourceFile, writeAll } from "./src/index";

// Test external module resolution
sourceFile(
  "NodeModulesTest.ts",
  [
    cls("NodeModulesTest", [
      method({
        name: "testSignale",
        returnType: "void",
        body: code`
        const logger = new Signale();
        logger.info('Testing node modules resolution');
      `,
      }),
    ]),
  ],
  {
    imports: [imp("signale", ["Signale"])],
  },
);

await writeAll({ outputDir: "./node-modules-test" });
