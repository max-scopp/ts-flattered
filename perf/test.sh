#!/bin/bash

echo "Running TSF Declarative tests..."
bun run perf/tsf_declarative_test.ts

echo "Running TSF Chainable tests..."
bun run perf/tsf_chainable_test.ts

echo "Running Factory tests..."
bun run perf/factory_test.ts

echo "Running TSMorph tests..."
bun run perf/tsmorph_test.ts
