import { SourceFileRegistry } from "./src/modules/registry";
import ts from "typescript";
import path from "path";

console.log("=== STANDALONE AST IMPORT REWRITER TEST ===");

// Create a proper TypeScript source file from scratch
function createProperSourceFile(fileName: string, content: string): ts.SourceFile {
  return ts.createSourceFile(
    fileName,
    content,
    ts.ScriptTarget.Latest,
    true // setParentNodes
  );
}

// Create proper source files with actual TypeScript code
const componentContent = `
import { helper } from "../utils/helper";
import { ComponentProps } from "./types";

export const MyComponent = () => <div>Hello</div>;
`;

const helperContent = `
import { CommonType } from "../types/common";

export const helper = () => {};
`;

const componentSourceFile = createProperSourceFile("MyComponent.tsx", componentContent);
const helperSourceFile = createProperSourceFile("helper.tsx", helperContent);

// Create a simple wrapper that satisfies the SourceFile interface
class SimpleSourceFileWrapper {
  constructor(private sourceFile: ts.SourceFile) {}

  getFileName(): string {
    return this.sourceFile.fileName;
  }

  getStatements(): readonly ts.Statement[] {
    return this.sourceFile.statements;
  }

  getFullText(): string {
    return this.sourceFile.getFullText();
  }

  // Implement updateImports to work with the registry
  updateImports(updateFn: (importDecl: ts.ImportDeclaration) => ts.ImportDeclaration): void {
    const updatedStatements = this.sourceFile.statements.map(statement => {
      if (ts.isImportDeclaration(statement)) {
        return updateFn(statement);
      }
      return statement;
    });

    // Update the source file
    this.sourceFile = ts.factory.updateSourceFile(
      this.sourceFile,
      updatedStatements as ts.Statement[],
      this.sourceFile.isDeclarationFile,
      this.sourceFile.referencedFiles,
      this.sourceFile.typeReferenceDirectives,
      this.sourceFile.hasNoDefaultLib,
      this.sourceFile.libReferenceDirectives
    );
  }

  print(): string {
    const printer = ts.createPrinter({
      newLine: ts.NewLineKind.LineFeed,
      removeComments: false,
    });
    return printer.printFile(this.sourceFile);
  }
}

// Test the registry with proper source files
const registry = new SourceFileRegistry();

const componentWrapper = new SimpleSourceFileWrapper(componentSourceFile);
const helperWrapper = new SimpleSourceFileWrapper(helperSourceFile);

registry.registerFile("src/components/MyComponent.tsx", componentWrapper as any);
registry.registerFile("src/components/utils/helper.tsx", helperWrapper as any);

console.log("\n=== BEFORE REWRITE ===");
registry.debugState();

console.log("\n=== CONTENT BEFORE ===");
console.log("MyComponent.tsx:");
console.log(componentWrapper.getFullText());
console.log("\nhelper.tsx:");
console.log(helperWrapper.getFullText());

// Perform import rewriting
console.log("\n=== PERFORMING REWRITE ===");
registry.rewriteAllRelativeImports("src/components", "src/out");

console.log("\n=== AFTER REWRITE ===");
registry.debugState();

// Test writing files
console.log("\n=== WRITING FILES ===");
const files = registry.writeAllFiles();

files.forEach((content, filePath) => {
  console.log(`\n--- ${filePath} ---`);
  console.log(content);
});
