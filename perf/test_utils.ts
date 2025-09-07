import { performance } from "perf_hooks";

export function runPerformanceTest(
  testName: string,
  testFunction: () => void,
  iterations: number = 10000,
) {
  const times: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    testFunction();
    const end = performance.now();
    times.push(end - start);
  }

  const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);

  console.log(`\n=== ${testName} ===`);
  console.log(`Iterations: ${iterations}`);
  console.log(`Average time: ${avgTime.toFixed(4)} ms`);
  console.log(`Min time: ${minTime.toFixed(4)} ms`);
  console.log(`Max time: ${maxTime.toFixed(4)} ms`);

  return { avgTime, minTime, maxTime, times };
}
