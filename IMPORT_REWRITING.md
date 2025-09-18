# Import Tracking and Rewriting System

This document describes the enhanced import tracking and rewriting capabilities added to the ts-flattered library.

## Overview

The system provides:
- **Automatic import dependency tracking** via `SourceFileRegistry`
- **Relative import rewriting** when moving files to different locations
- **Import management** (add, update, remove imports)
- **Auto-registration** of files with registry integration

## Core Components

### SourceFileRegistry

The registry tracks all source files and their import dependencies, enabling:
- Dependency analysis
- Batch import rewriting when moving directory structures
- External dependency management

```typescript
import { SourceFileRegistry } from "./src/modules/registry";

const registry = new SourceFileRegistry();
```

### FileBuilder Extensions

The `FileBuilder` class now includes methods for import management:

#### `rewriteRelativeImports(fromDir: string, toDir: string)`
Rewrites relative imports when moving a file from one directory to another.

```typescript
const myFile = file("src/components/Button.tsx", content, { registry, autoRegister: true });

// Move from src/components to src/out/components
myFile.rewriteRelativeImports("src/components", "src/out/components");
```

#### `addOrUpdateImport(options: ImportOptions, position?)`
Adds a new import or merges with existing import from the same module.

```typescript
myFile.addOrUpdateImport({
  moduleSpecifier: "react",
  namedImports: ["useCallback", "useMemo"]
});
```

#### `removeImport(moduleSpecifier: string)`
Removes all imports from a specific module.

```typescript
myFile.removeImport("lodash");
```

#### `removeNamedImports(moduleSpecifier: string, namedImports: string[])`
Removes specific named imports from a module.

```typescript
myFile.removeNamedImports("react", ["useState"]); // Keep other React imports
```

## File Creation with Registry Integration

### Enhanced `file()` Function

```typescript
// With registry auto-registration
const myFile = file({
  fileName: "src/components/Button.tsx",
  content: buttonContent,
  registry,
  autoRegister: true
});

// Legacy syntax with registry options
const myFile2 = file("src/App.tsx", content, {
  registry,
  autoRegister: true,
  scriptTarget: ts.ScriptTarget.ES2020
});
```

### Enhanced Helper Functions

```typescript
// fileFromString with registry
const sourceFile = fileFromString(
  "src/utils/helpers.ts",
  content,
  ts.ScriptTarget.Latest,
  registry,
  true // autoRegister
);

// fileFromPath with registry
const sourceFile2 = fileFromPath(
  "./src/components/Button.tsx",
  ts.ScriptTarget.Latest,
  registry,
  true // autoRegister
);

// fileFromSourceFile with registry
const sourceFile3 = fileFromSourceFile(
  existingTsSourceFile,
  registry,
  true // autoRegister
);
```

## Registry Operations

### Import Dependency Analysis

```typescript
// Get import dependencies for a file
const deps = registry.getImportDependencies("src/components/Button.tsx");

// Find files that import from a specific file
const importingFiles = registry.getFilesThatImport("src/utils/helpers.ts");
```

### Batch Operations

```typescript
// Rewrite all relative imports when moving entire directory structure
registry.rewriteAllRelativeImports("src", "dist");
```

### External Dependencies

```typescript
// Register external dependencies
registry.registerExternalDependency({
  moduleSpecifier: "@mui/material",
  namedExports: ["Button", "TextField"],
  typeOnlyExports: ["ButtonProps"]
});

// Query external dependencies
const muiDep = registry.getExternalDependency("@mui/material");
const buttonExport = registry.findExternalDependencyByExport("Button");
```

## Example Use Cases

### Moving a Component to Different Directory

```typescript
const registry = new SourceFileRegistry();

// Create component with imports
const buttonFile = file({
  fileName: "src/components/Button.tsx",
  content: `
import React from 'react';
import { BaseProps } from '../../types/common';
import { theme } from '../theme/colors';
  `,
  registry,
  autoRegister: true
});

// Move to new location with automatic import rewriting
buttonFile.rewriteRelativeImports("src/components", "src/out/components");

// Imports are now:
// import { BaseProps } from '../../../types/common';
// import { theme } from '../../theme/colors';
```

### Managing Imports Dynamically

```typescript
// Add new imports (merges with existing)
buttonFile.addOrUpdateImport({
  moduleSpecifier: "react",
  namedImports: ["useCallback"] // Merges with existing React import
});

// Add completely new import
buttonFile.addOrUpdateImport({
  moduleSpecifier: "lodash",
  namedImports: ["debounce", "throttle"]
});

// Remove specific imports
buttonFile.removeNamedImports("lodash", ["throttle"]); // Keep debounce
```

### Batch Directory Migration

```typescript
// Register multiple files
const appFile = file({ fileName: "src/App.tsx", content: appContent, registry, autoRegister: true });
const buttonFile = file({ fileName: "src/components/Button.tsx", content: buttonContent, registry, autoRegister: true });
const utilsFile = file({ fileName: "src/utils/helpers.ts", content: utilsContent, registry, autoRegister: true });

// Move entire src to dist - all relative imports automatically updated
registry.rewriteAllRelativeImports("src", "dist");
```

## Path Utilities

The system includes utility functions for path manipulation:

```typescript
import { 
  resolveRelativeImport, 
  rewriteImportPath, 
  isRelativeImport,
  calculateNewImportPath 
} from "./src/modules/pathUtils";

// Calculate new import path when moving files
const newPath = calculateNewImportPath(
  "../../utils/helpers", 
  "src/components/Button.tsx", 
  "dist/components/Button.tsx"
);
```

## Integration Notes

- Files are automatically registered with the registry when `autoRegister: true`
- The registry tracks both file locations and import dependencies
- Relative imports are resolved and rewritten using proper path calculation
- External dependencies can be registered for better import management
- The system maintains backward compatibility with existing APIs

## Example

See `examples/import_rewriting_example.ts` for a complete demonstration of all features.
