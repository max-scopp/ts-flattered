import ts from "typescript";
import {
  $,
  assign,
  block,
  call,
  ctor,
  klass,
  method,
  param,
  prop,
  ret,
  this_,
} from "./public_api";
import { $string } from "./types";

const greeter = klass("Greeter", [
  prop("message", $string()).$readonly(),
  ctor(
    [param("message", $string()).$readonly()],
    block([assign("this.message", this_())]),
  ),
  method(
    "greet",
    [],
    block([call("console.log", [$("Hello, world!")]), ret($("done"))]),
  ).$async(),
]).$export();

// Print result
const sf = ts.factory.createSourceFile(
  [greeter],
  ts.factory.createToken(ts.SyntaxKind.EndOfFileToken),
  ts.NodeFlags.None,
);

const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
console.log(printer.printFile(sf));
