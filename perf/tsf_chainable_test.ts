import { $, $string, assign, block, call, ctor, klass, method, param, prop, ret, this_ } from "../src";
import { runPerformanceTest } from "./test_utils";

// Example 2: Chainable Style
function example2() {
  const greeter = klass("Greeter")
    .$export()
    .addMember(prop("message", $string()).$readonly())
    .addMember(
      ctor(
        [param("message", $string()).$readonly()],
        block([assign("this.message", this_())]),
      ),
    )
    .addMember(
      method(
        "greet",
        [],
        block([call("console.log", [$("Hello, world!")]), ret($("done"))]),
      ).$async(),
    );

  return greeter.get();
}

console.log("Performance Report: TSF Chainable Style");
console.log("========================================");

runPerformanceTest("Chainable Style", example2);
