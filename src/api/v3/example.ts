import ts from "typescript";
import * as tsf from "./public_api";

const greeter = tsf
  .klass("Greeter", [
    tsf.prop("message", tsf.$string()).$readonly(),
    tsf.ctor(
      [{ name: "message", type: tsf.$string() }],
      tsf.block([tsf.assign("this.message", tsf.this_())]),
    ),
    tsf.method(
      "greet",
      [],
      tsf.block([
        tsf.call("console.log", [tsf.lit("Hello, world!")]),
        tsf.ret(tsf.lit("done")),
      ]),
      [tsf.$mod.async()],
    ),
  ])
  .$export();

// Print result
const sf = ts.factory.createSourceFile(
  [greeter],
  ts.factory.createToken(ts.SyntaxKind.EndOfFileToken),
  ts.NodeFlags.None,
);

const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
console.log(printer.printFile(sf));
