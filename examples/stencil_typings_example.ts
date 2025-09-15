/**
 * Example: Generate Stencil component typing file
 * Demonstrates creating complex TypeScript declarations using ts-flattered builders
 */

import ts from "typescript";
import { jsdocComment } from "../src/helpers/trivia";
import {
  $any,
  $ref,
  $string,
  file,
  global,
  interface_,
  module,
  namespace,
  varDecl,
} from "../src/public_api";

// Component definitions
const components = [
  {
    name: "BackgroundComponent",
    tagName: "background-component",
    props: [
      {
        name: "urls",
        type: "any",
        description: "Array of background image URLs",
      },
    ],
  },
  {
    name: "ItemComponent",
    tagName: "item-component",
    props: [
      { name: "author", type: "string", description: "Author of the post" },
      { name: "image", type: "string", description: "Image URL for the item" },
      { name: "postTitle", type: "string", description: "Title of the post" },
      { name: "ups", type: "string", description: "Number of upvotes" },
    ],
  },
];

console.log(
  "=== Generating Stencil Component Typings with Real Builders ===\n",
);

// Create the typing file
const stencilTypings = file("components.d.ts");

// Add Stencil core imports
stencilTypings.addImport({
  namedImports: ["HTMLStencilElement", "JSXBase"],
  moduleSpecifier: "@stencil/core/internal",
});

// Create Components namespace
const componentsNamespace = namespace("Components").$export();

// Add component interfaces to namespace
components.forEach((comp) => {
  const componentInterface = interface_(comp.name).addLeadingComment(
    jsdocComment(`Interface for ${comp.name} component`),
  );

  // Add properties to interface
  comp.props.forEach((prop) => {
    componentInterface.addProperty(
      prop.name,
      prop.type === "any" ? $any() : $string(),
      false, // not optional
      false, // not readonly
    );
  });

  componentsNamespace.addStatement(componentInterface.get());
});

stencilTypings.addStatement(componentsNamespace.get());

// Create global declarations
const globalBlock = global();

// Add HTML element interfaces
components.forEach((comp) => {
  const htmlElementInterface = interface_(`HTML${comp.name}Element`)
    .extends(`Components.${comp.name}`, "HTMLStencilElement")
    .addLeadingComment(jsdocComment(`HTML element interface for ${comp.name}`));

  globalBlock.addStatement(htmlElementInterface.get());

  // Add constructor variable declaration
  const constructorVar = varDecl(
    `HTML${comp.name}Element`,
    $ref(`HTML${comp.name}ElementConstructor`),
  );
  globalBlock.addStatement(constructorVar.get());
});

// Add HTMLElementTagNameMap interface
const tagNameMapInterface = interface_("HTMLElementTagNameMap");
components.forEach((comp) => {
  tagNameMapInterface.addProperty(
    comp.tagName,
    $ref(`HTML${comp.name}Element`),
  );
});
globalBlock.addStatement(tagNameMapInterface.get());

stencilTypings.addStatement(globalBlock.get());

// Create LocalJSX namespace
const localJSXNamespace = namespace("LocalJSX");

// Add component interfaces with optional props
components.forEach((comp) => {
  const localInterface = interface_(comp.name).addLeadingComment(
    jsdocComment(`Local JSX interface for ${comp.name} with optional props`),
  );

  comp.props.forEach((prop) => {
    localInterface.addProperty(
      prop.name,
      prop.type === "any" ? $any() : $string(),
      true, // optional
    );
  });

  localJSXNamespace.addStatement(localInterface.get());
});

// Add IntrinsicElements interface
const intrinsicElementsInterface = interface_("IntrinsicElements");
components.forEach((comp) => {
  intrinsicElementsInterface.addProperty(comp.tagName, $ref(comp.name));
});
localJSXNamespace.addStatement(intrinsicElementsInterface.get());

// Add declare to namespace (we need to modify namespace builder to support declare)
stencilTypings.addStatement(localJSXNamespace.get());

// Export JSX (we'll add this as a simple statement)
const jsxExport = ts.factory.createExportDeclaration(
  undefined, // modifiers
  false, // isTypeOnly
  ts.factory.createNamedExports([
    ts.factory.createExportSpecifier(
      false, // isTypeOnly
      ts.factory.createIdentifier("LocalJSX"),
      ts.factory.createIdentifier("JSX"),
    ),
  ]),
);
stencilTypings.addStatement(jsxExport);

// Create module declaration for @stencil/core
const stencilCoreModule = module('"@stencil/core"');

// Create JSX namespace inside the module
const jsxNamespaceInModule = namespace("JSX").$export();

// Add IntrinsicElements interface to JSX namespace
const moduleIntrinsicElements = interface_("IntrinsicElements");
components.forEach((comp) => {
  // This is complex - we need intersection types which we don't have yet
  // For now, just add the basic type
  moduleIntrinsicElements.addProperty(
    comp.tagName,
    $ref(`LocalJSX.${comp.name}`), // We'd need intersection with JSXBase.HTMLAttributes
  );
});

jsxNamespaceInModule.addStatement(moduleIntrinsicElements.get());
stencilCoreModule.addStatement(jsxNamespaceInModule.get());

stencilTypings.addStatement(stencilCoreModule.get());

// Print the generated TypeScript
console.log("Generated TypeScript:");
console.log("=".repeat(50));
stencilTypings
  .print()
  .then((result) => {
    console.log(result);
  })
  .catch((err) => {
    console.error("Error printing:", err);
  });
