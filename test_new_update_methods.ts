import ts from "typescript";
import { klass, method, prop } from "./dist/index.js";

// Test the new update methods
function testNewUpdateMethods() {
  // Create a class with properties and methods
  const myClass = klass("TestClass")
    .addMember(
      prop(
        "userName",
        ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
      )
        .$private()
        .get(),
    )
    .addMember(
      method("getUser", [], ts.factory.createBlock([])).$public().get(),
    );

  console.log("Original class:");
  console.log(
    ts
      .createPrinter()
      .printNode(
        ts.EmitHint.Unspecified,
        myClass.get(),
        ts.createSourceFile("", "", ts.ScriptTarget.Latest),
      ),
  );

  // Update property by name
  myClass.updatePropertyByName("userName", (propBuilder: any) => {
    return propBuilder.$public().$readonly();
  });

  console.log("\nAfter updating property:");
  console.log(
    ts
      .createPrinter()
      .printNode(
        ts.EmitHint.Unspecified,
        myClass.get(),
        ts.createSourceFile("", "", ts.ScriptTarget.Latest),
      ),
  );

  // Update method by name
  myClass.updateMethodByName("getUser", (methodBuilderInstance: any) => {
    return methodBuilderInstance.$static();
  });

  console.log("\nAfter updating method:");
  console.log(
    ts
      .createPrinter()
      .printNode(
        ts.EmitHint.Unspecified,
        myClass.get(),
        ts.createSourceFile("", "", ts.ScriptTarget.Latest),
      ),
  );
}

testNewUpdateMethods();
