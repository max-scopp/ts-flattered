import { file, fileFromString } from "../src/modules/file";
import { SourceFileRegistry } from "../src/modules/registry";

/**
 * Example demonstrating the import tracking and rewriting system
 */
async function demonstrateImportRewriting() {
  // Create a registry to track files and dependencies
  const registry = new SourceFileRegistry();

  // Example 1: Create a Button component with imports
  const buttonContent = `
import React from 'react';
import { BaseProps } from '../../types/common';
import { theme } from '../theme/colors';
import './Button.css';

export interface ButtonProps extends BaseProps {
  variant?: 'primary' | 'secondary';
  size?: 'small' | 'medium' | 'large';
}

export const Button: React.FC<ButtonProps> = ({ variant = 'primary', size = 'medium', ...props }) => {
  return (
    <button
      className={\`btn btn-\${variant} btn-\${size}\`}
      style={{ backgroundColor: theme.primary }}
      {...props}
    />
  );
};
`;

  // Create the Button component file with auto-registration
  const buttonFile = file({
    fileName: "src/components/Button.tsx",
    content: buttonContent,
    registry,
    autoRegister: true,
  });

  console.log("Original Button.tsx created and registered");

  // Example 2: Create a helper utility file
  const utilsContent = `
export const formatText = (text: string): string => {
  return text.trim().toLowerCase();
};

export const validateEmail = (email: string): boolean => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};
`;

  const utilsFile = fileFromString(
    "src/utils/helpers.ts",
    utilsContent,
    undefined, // use default script target
    registry,
    true // auto-register
  );

  console.log("Utils file created and registered");

  // Example 3: View import dependencies
  const buttonDeps = registry.getImportDependencies("src/components/Button.tsx");
  console.log("Button dependencies:", buttonDeps.map(dep => ({
    module: dep.moduleSpecifier,
    isRelative: dep.isRelative,
    resolvedPath: dep.resolvedPath
  })));

  // Example 4: Move the Button component to a different location
  console.log("\n--- Moving Button.tsx from src/components to src/out/components ---");

  // Rewrite relative imports when moving the file
  buttonFile.rewriteRelativeImports("src/components", "src/out/components");

  // Print the updated content to see the rewritten imports
  const updatedButtonContent = await buttonFile.print();
  console.log("Updated Button.tsx content with rewritten imports:");
  console.log(updatedButtonContent);

  // Example 5: Add new imports to an existing file
  console.log("\n--- Adding new imports to Button.tsx ---");

  buttonFile.addOrUpdateImport({
    moduleSpecifier: "lodash",
    namedImports: ["debounce", "throttle"]
  });

  buttonFile.addOrUpdateImport({
    moduleSpecifier: "react",
    namedImports: ["useCallback"], // This will be merged with existing React import
  });

  const updatedWithNewImports = await buttonFile.print();
  console.log("Button.tsx with added imports:");
  console.log(updatedWithNewImports);

  // Example 6: Remove specific named imports
  console.log("\n--- Removing specific imports ---");

  buttonFile.removeNamedImports("lodash", ["throttle"]); // Remove only throttle, keep debounce

  const afterRemoval = await buttonFile.print();
  console.log("Button.tsx after removing throttle import:");
  console.log(afterRemoval);

  // Example 7: Batch rewrite all files when moving entire directory structure
  console.log("\n--- Batch rewriting all files when moving src to dist ---");

  // Create another file that imports Button
  const appContent = `
import React from 'react';
import { Button } from './components/Button';
import { formatText } from './utils/helpers';

export const App: React.FC = () => {
  return (
    <div>
      <h1>{formatText('My Application')}</h1>
      <Button variant="primary">Click me</Button>
    </div>
  );
};
`;

  const appFile = file({
    fileName: "src/App.tsx",
    content: appContent,
    registry,
    autoRegister: true,
  });

  // Now move the entire src directory to dist
  registry.rewriteAllRelativeImports("src", "dist");

  console.log("All files moved from src to dist. Updated App.tsx:");
  const updatedAppContent = await appFile.print();
  console.log(updatedAppContent);

  // Example 8: Check which files import from a specific file
  const importingFiles = registry.getFilesThatImport("dist/components/Button.tsx");
  console.log("Files that import Button.tsx:", importingFiles);

  // Example 9: Working with external dependencies
  registry.registerExternalDependency({
    moduleSpecifier: "@mui/material",
    namedExports: ["Button", "TextField", "Typography"],
    typeOnlyExports: ["ButtonProps"]
  });

  const muiDep = registry.getExternalDependency("@mui/material");
  console.log("MUI dependency info:", muiDep);

  return {
    registry,
    buttonFile,
    utilsFile,
    appFile
  };
}

// Run the demonstration
demonstrateImportRewriting().then((result) => {
  console.log("Import rewriting demonstration completed successfully!");
}).catch((error) => {
  console.error("Error during demonstration:", error);
});

export { demonstrateImportRewriting };
