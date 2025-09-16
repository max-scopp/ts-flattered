# ts-flattered API Reference

## � Trivia Preservation

**All APIs support trivia preservation automatically!** TypeScript AST nodes created with `setParentNodes: true` (which ts-flattered always uses) preserve comments, decorators, and JSDoc automatically.

**Two Patterns for Each Builder:**

1. **Create New** - Build from scratch using string parameters
2. **Adopt Existing** - Pass existing AST nodes to preserve all trivia (comments, decorators, JSDoc)

```typescript
// Create new (no existing trivia)
const newProp = prop("name", $string());

// Adopt existing (preserves ALL trivia)
const updatedProp = prop(existingPropertyNode)
  .$readonly(); // Comments and decorators preserved!
```

## �📖 Quick Index

**🏗️ Core Builders**
- [Classes](#classes) • [Functions](#functions) • [Methods](#methods) • [Properties](#properties) • [Variables](#variables) • [Parameters](#parameters)

**🧩 Declarations**
- [Interfaces](#interfaces) • [Namespaces](#namespaces) • [Globals](#globals) • [Constructors](#constructors)

**📄 Modules**
- [Files](#files) • [Imports](#imports) • [Programs](#programs)

**🎯 Expressions & Statements**
- [Expressions](#expressions) • [Statements](#statements) • [Blocks](#blocks) • [Assignments](#assignments)

**🏷️ Decorators & Modifiers**
- [Decorators](#decorators) • [Modifiers](#modifiers)

**📝 Types & Tokens**
- [Types](#types) • [Tokens](#tokens) • [Objects](#objects)

**💬 Comments & Documentation**
- [Trivia](#trivia) • [Comment Presets](#comment-presets)

---

## Classes

### `klass()`
Create class declarations with fluent chaining.

**Signatures:**
```typescript
// Create new class
klass(name: string, members?: ts.ClassElement[], mods?: ts.ModifierLike[])
// Adopt existing class (preserves trivia)
klass(existingClass: ts.ClassDeclaration)
```

**Chainable (Create New):**
```typescript
klass("User")
  .$export()
  .$abstract()
  .addProp(prop("name", $string()).get())
  .addMethod(method("getName", [], block([])).get())
```

**Declarative (Create New):**
```typescript
const userClass = klass("User", [
  prop("name", $string()).get(),
  method("getName", [], block([])).get()
], [$export(), $abstract()]);
```

**Adopt Existing (Preserves Comments/Decorators):**
```typescript
// Pass existing class declaration to preserve all trivia
const updatedClass = klass(existingClassNode)
  .$export()
  .addProp(prop("newField", $string()).get());
```

---

## Functions

### `func()`
Create function declarations.

**Signatures:**
```typescript
// Create new function
func(name: string, args: ts.ParameterDeclaration[], body: ts.Block, mods?: ts.ModifierLike[])
// Adopt existing function (preserves trivia)
func(existingFunction: ts.FunctionDeclaration)
```

**Chainable (Create New):**
```typescript
func("calculate", [param("x", $number())])
  .$export()
  .$async()
  .body(block([ret($(42))]))
```

**Declarative (Create New):**
```typescript
const calcFunc = func("calculate", 
  [param("x", $number()).get()], 
  block([ret($(42))])
);
```

**Adopt Existing (Preserves Comments/Decorators):**
```typescript
// Pass existing function declaration to preserve all trivia
const updatedFunc = func(existingFunctionNode)
  .$export()
  .$async();
```

### `arrow()`
Create arrow functions.

**Chainable:**
```typescript
arrow([param("x", $number())])
  .$async()
  .body($(42))
```

**Declarative:**
```typescript
const arrowFunc = arrow([param("x", $number()).get()], $(42));
```

---

## Methods

### `method()`
Create class method declarations.

**Signatures:**
```typescript
// Create new method
method(name: string, args: ts.ParameterDeclaration[], body: ts.Block, mods?: ts.ModifierLike[])
// Adopt existing method (preserves trivia)
method(existingMethod: ts.MethodDeclaration)
```

**Chainable (Create New):**
```typescript
method("process", [param("data", $any())], block([]))
  .$public()
  .$async()
  .$static()
```

**Declarative (Create New):**
```typescript
const processMethod = method("process", 
  [param("data", $any()).get()], 
  block([]),
  [$public(), $async(), $static()]
);
```

**Adopt Existing (Preserves Comments/Decorators):**
```typescript
// Pass existing method declaration to preserve all trivia
const updatedMethod = method(existingMethodNode)
  .$public()
  .addDecorator(decorator("Override").get());
```

---

## Properties

### `prop()`
Create class property declarations.

**Signatures:**
```typescript
// Create new property
prop(name: string, type?: ts.TypeNode, optional?: boolean)
// Adopt existing property (preserves trivia)
prop(existingProperty: ts.PropertyDeclaration)
```

**Chainable (Create New):**
```typescript
prop("name", $string(), true)
  .$private()
  .$readonly()
  .addDecorator(decorator("Required").get())
```

**Declarative (Create New):**
```typescript
const nameProp = prop("name", $string(), true);
```

**Adopt Existing (Preserves Comments/Decorators):**
```typescript
// Pass existing property declaration to preserve all trivia
const updatedProp = prop(existingPropertyNode)
  .$readonly()
  .addDecorator(decorator("Validate").get());
```

---

## Variables

### `const_()` • `let_()` • `var_()`
Create variable declarations.

**Chainable:**
```typescript
const_("config", obj({ debug: true }))
  .$export()
  .addComment({ leading: ["Configuration object"] })
```

**Declarative:**
```typescript
const config = const_("config", obj({ debug: true }));
```

---

## Parameters

### `param()`
Create function/method parameters.

**Chainable:**
```typescript
param("options", $ref("Config"), true)
  .$readonly()
  .addDecorator(decorator("Inject").get())
```

**Declarative:**
```typescript
const optionsParam = param("options", $ref("Config"), true, $({}));
```

---

## Interfaces

### `interface_()`
Create interface declarations.

**Chainable:**
```typescript
interface_("ApiResponse")
  .$export()
  .addMember(prop("data", $any()).get())
  .addMember(prop("status", $number()).get())
```

**Declarative:**
```typescript
const apiInterface = interface_("ApiResponse", [
  prop("data", $any()).get(),
  prop("status", $number()).get()
], [$export()]);
```

---

## Namespaces

### `namespace()` • `module()`
Create namespace/module declarations.

**Chainable:**
```typescript
namespace("Utils")
  .$export()
  .addStatement(func("helper", []).get())
```

**Declarative:**
```typescript
const utilsNs = namespace("Utils", [func("helper", []).get()], [$export()]);
```

---

## Globals

### `global()`
Create global declaration blocks.

**Chainable:**
```typescript
global()
  .addStatement(interface_("Window").get())
  .addStatement(varDecl("process", $any()).get())
```

**Declarative:**
```typescript
const globalBlock = global([
  interface_("Window").get(),
  varDecl("process", $any()).get()
]);
```

---

## Constructors

### `ctor()`
Create constructor declarations.

**Chainable:**
```typescript
ctor([param("name", $string())], block([]))
  .$private()
  .addParameter(param("age", $number()).get())
```

**Declarative:**
```typescript
const constructor = ctor([
  param("name", $string()).get(),
  param("age", $number()).get()
], block([]));
```

---

## Files

### `file()` • `fileFromString()` • `fileFromPath()`
Create and manipulate source files.

**Chainable:**
```typescript
file("example.ts")
  .addStatement(klass("Example").get())
  .addImport(imp({ from: "./types", named: ["Type"] }).get())
```

**Declarative:**
```typescript
const sourceFile = file("example.ts", [
  imp({ from: "./types", named: ["Type"] }).get(),
  klass("Example").get()
]);
```

---

## Imports

### `imp()`
Create import declarations.

**Chainable:**
```typescript
imp({ from: "typescript" })
  .setDefaultImport("ts")
  .addNamedImport("Node")
  .addTypeOnlyNamedImport("Type")
```

**Declarative:**
```typescript
const tsImport = imp({ 
  from: "typescript", 
  default: "ts", 
  named: ["Node"],
  typeOnlyNamed: ["Type"]
});
```

---

## Programs

### `program()` • `programFromTs()` • `programFromTsConfig()`
Create TypeScript programs.

**Chainable:**
```typescript
program()
  .addFile(file("index.ts").get())
  .setCompilerOptions({ strict: true })
```

**Declarative:**
```typescript
const tsProgram = program({
  files: ["index.ts"],
  compilerOptions: { strict: true }
});
```

---

## Expressions

### Core Expression Builders
```typescript
// Identifiers and references
id("variable")                    // Variable reference
this_()                          // this keyword
super_()                         // super keyword

// Property access and calls
propAccess(id("obj"), "prop")    // obj.prop
call("func", [id("arg")])        // func(arg)

// Object and array literals
obj({ key: "value" })            // { key: "value" }
newExpr("Class", [id("arg")])    // new Class(arg)
```

---

## Statements

### `if_()` • `while_()` • `for_()`
Create control flow statements.

**Chainable:**
```typescript
if_(call("check", [id("value")]))
  .thenClause(exprStmt(call("process", [])))
  .elseClause(exprStmt(call("fallback", [])))
```

**Declarative:**
```typescript
const ifStmt = if_(
  call("check", [id("value")]),
  exprStmt(call("process", [])),
  exprStmt(call("fallback", []))
);
```

---

## Blocks

### `block()`
Create statement blocks.

```typescript
block([
  const_("result", call("compute", [])).get(),
  if_(propAccess(id("result"), "isValid")).get(),
  ret(id("result"))
])
```

---

## Assignments

### `assign()`
Create assignment expressions.

```typescript
assign(id("target"), $(42))        // target = 42
assign(propAccess(id("obj"), "prop"), $("value"))  // obj.prop = "value"
```

---

## Decorators

### `decorator()` • `fromDecorator()`
Create and manipulate decorators.

**Chainable:**
```typescript
decorator("Component")
  .addArgument({ selector: "app-user" })
  .setProperty("template", "./user.html")
  .updateArgumentObject(0, obj => obj.set("standalone", true))
```

**Declarative:**
```typescript
const componentDecorator = decorator("Component", [{
  selector: "app-user",
  template: "./user.html",
  standalone: true
}]);
```

---

## Modifiers

### Visibility & Access
```typescript
$public()       // public
$private()      // private  
$protected()    // protected
$static()       // static
$readonly()     // readonly
$abstract()     // abstract
$async()        // async
$export()       // export
```

**Usage:**
```typescript
method("getData", [], block([]))
  .$public()
  .$async()
  .$static()
```

---

## Types

### `$any()` • `$string()` • `$number()` • `$boolean()`
Basic type references.

```typescript
$any()           // any
$string()        // string
$number()        // number
$boolean()       // boolean
$ref("Custom")   // Custom type reference
```

### `union()` • `arrayType()`
Complex type constructors.

```typescript
union($string(), $number())        // string | number
arrayType($string())               // string[]
```

### `typeInterface()`
Create type interfaces.

**Chainable:**
```typescript
typeInterface()
  .addProperty("name", $string())
  .addProperty("age", $number(), true)
```

---

## Tokens

### Literals & Keywords
```typescript
$("string")      // String literal
$(42)            // Number literal  
$(true)          // Boolean literal
this_()          // this keyword
super_()         // super keyword
ret(id("value")) // return statement
```

---

## Objects

### `objLiteral()`
Create object literals with fluent API.

**Chainable:**
```typescript
objLiteral({ initial: "value" })
  .set("newProp", "newValue")
  .setMany({ a: 1, b: 2 })
  .remove("initial")
  .has("newProp")  // true
```

---

## Trivia

### Comment Support
All builders support comment methods:

```typescript
func("example", [])
  .addLeadingComment("This is a function")
  .addTrailingComment("End of function")
  .addComments({
    leading: ["/** @deprecated */"],
    trailing: ["// TODO: refactor"]
  })
```

---

## Comment Presets

### Quick Comments
```typescript
todoComment("Fix this later")
fixmeComment("Broken logic here")  
noteComment("Important: check performance")
```

### JSDoc Presets
```typescript
constructorJSDoc("Creates a new User instance", [
  { name: "name", type: "string", description: "User name" }
])

methodJSDoc("Processes data", [
  { name: "input", type: "any", description: "Input data" }
], "Processed result", "any")
```

### Fluent Comment Chaining
```typescript
const userClass = klass("User")
  .$export()
  .addLeadingComment(createClassJSDoc("Represents a user"))
  .addMember(
    prop("name", $string())
      .$private()
      .addLeadingComment(jsdocComment("The user's name"))
  );
```

### Comment Presets
```typescript
// Quick preset comments
method("process", [], block([]))
  .addLeadingComment(todoComment("Add validation"))
  .addTrailingComment(fixmeComment("Handle edge cases"));
```

## 🚀 Usage Examples

### Basic Comments
```typescript
import { lineComment, blockComment, jsdocComment } from "ts-flattered";

// Different comment styles
const line = lineComment("This is a line comment");
const block = blockComment("This is a block comment");  
const jsdoc = jsdocComment("This is a JSDoc comment");
```

### Advanced JSDoc
```typescript
import { createMethodJSDoc, paramTag, returnsTag } from "ts-flattered";

const methodDoc = createMethodJSDoc(
  "Processes user data",
  [
    { name: "userData", type: "UserData", description: "Raw user data" },
    { name: "options", type: "ProcessOptions", description: "Processing options" }
  ],
  "Processed user object",
  "ProcessedUser",
  {
    examples: ["processUserData(data, { validate: true })"],
    throws: [{ type: "ValidationError", description: "When data is invalid" }]
  }
);
```
