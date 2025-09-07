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
} from "../src/public_api";
import { $string } from "../src/types";
import { runPerformanceTest } from "./test_utils";

// Example 1: Initial Declaration Style (from example.ts)
function example1() {
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

  return greeter.get();
}

console.log("Performance Report: TSF Declarative Style");
console.log("==========================================");

runPerformanceTest("Initial Declaration Style", example1);
