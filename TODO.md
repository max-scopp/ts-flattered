# ts-flattered TODO - Missing TypeScript Language Features

## 📊 **Current Coverage Assessment**

**✅ Currently Covered (~40%)**:
- Classes, interfaces, functions, methods
- Basic types, variables, imports
- Properties, parameters, decorators
- Basic control flow (if, while, for)
- Comments and trivia

**❌ Missing (~60%)**:
- Advanced type system features
- Modern expression syntax
- Complete control flow statements
- Advanced class features
- Module system edge cases

---

## 🚨 **High Priority** (Core language features)

### **1. Enums**
```typescript
// Target API
enum("Status", [
  member("PENDING"),
  member("ACTIVE", 1),
  member("INACTIVE")
]).$export()

// Or declarative
const status = enum("Status", ["PENDING", "ACTIVE", "INACTIVE"], [$export()]);
```

### **2. Type Aliases**
```typescript
// Target API
typeAlias("User", objectType([
  prop("name", $string()),
  prop("age", $number())
])).$export()

// Or declarative
const userType = typeAlias("User", $ref("{ name: string; age: number }"));
```

### **3. Switch/Case Statements**
```typescript
// Target API
switch_(id("value"))
  .case($("pending"), block([ret($("waiting"))]))
  .case($("active"), block([ret($("running"))]))
  .default(block([ret($("unknown"))]))
```

### **4. Try/Catch/Finally**
```typescript
// Target API
try_(block([
  const_("result", call("riskyOperation", [])).get()
]))
.catch_("error", block([
  call("console.error", [id("error")])
]))
.finally_(block([
  call("cleanup", [])
]))
```

### **5. Template Literals**
```typescript
// Target API
template(`Hello ${expr(id("name"))}!`)
template("Welcome ", expr(id("user")), " to our app!")
```

### **6. Conditional (Ternary) Operator**
```typescript
// Target API
conditional(
  call("isValid", [id("input")]),
  $("valid"),
  $("invalid")
)
```

---

## 🔥 **Medium Priority** (Developer experience)

### **7. Getters/Setters**
```typescript
// Target API
getter("value", $string(), block([ret(propAccess(this_(), "_value"))]))
setter("value", param("v", $string()), block([
  assign(propAccess(this_(), "_value"), id("v"))
]))
```

### **8. Spread Syntax**
```typescript
// Target API
spread(id("array"))  // ...array
spread(id("object")) // ...object

// In arrays/objects
arrayLiteral([$(1), $(2), spread(id("rest"))])
objectLiteral({ a: $(1), ...spread(id("rest")) })
```

### **9. Destructuring**
```typescript
// Target API
destructureArray(["a", "b", rest("remaining")], id("array"))
destructureObject({ a: "newA", b: "newB", rest: "remaining" }, id("obj"))
```

### **10. Intersection Types**
```typescript
// Target API
intersection($ref("User"), $ref("Permissions"))  // User & Permissions
```

### **11. Optional Chaining & Nullish Coalescing**
```typescript
// Target API
optionalChain(id("obj"), "prop", "method", call([])) // obj?.prop?.method?.()
nullishCoalescing(id("value"), $("default"))        // value ?? "default"
```

---

## 📝 **Low Priority** (Advanced features)

### **12. Advanced Types**
- [ ] Conditional Types (`T extends U ? X : Y`)
- [ ] Mapped Types (`{ [K in keyof T]: U }`)
- [ ] Index Access Types (`T[K]`)
- [ ] Tuple Types (`[string, number]`)
- [ ] Rest Types (`[string, ...number[]]`)

### **13. Class Features**
- [ ] Index Signatures (`[key: string]: any`)
- [ ] Call Signatures (`(arg: string): number`)
- [ ] Private Fields (`#private`)
- [ ] Static Blocks (`static { }`)

### **14. Control Flow Additions**
- [ ] Throw Statements (`throw new Error("message")`)
- [ ] Break/Continue (`break`, `continue`)
- [ ] Labeled Statements

### **15. Expression Types**
- [ ] Typeof/Instanceof (`typeof x`, `x instanceof Y`)
- [ ] Await Expressions (`await promise`)
- [ ] Yield Expressions (`yield value`)
- [ ] Delete Expressions (`delete obj.prop`)

### **16. Module System**
- [ ] Export Assignments (`export = value`)
- [ ] Export Star (`export * from "module"`)
- [ ] Dynamic Imports (`import("module")`)
- [ ] Import Assertions (`import json from "./file.json" assert { type: "json" }`)

### **17. Advanced Declarations**
- [ ] Function Overloads (multiple function signatures)
- [ ] Ambient Declarations (`declare const`, `declare module`)
- [ ] Module Augmentation (`declare module "lib" { }`)

### **18. Modern Operators**
- [ ] Logical Assignment (`??=`, `||=`, `&&=`)
- [ ] Exponentiation (`a ** b`)

### **19. Modern ES Features**
- [ ] BigInt Literals (`123n`)
- [ ] Import Meta (`import.meta`)

---

## 🛠️ **Implementation Strategy**

### **Phase 1: Core Language (High Priority)**
Focus on enums, type aliases, switch/case, try/catch, template literals, and conditional operators. These are essential for real-world TypeScript applications.

### **Phase 2: Modern Syntax (Medium Priority)**
Add getters/setters, spread/destructuring, intersection types, and optional chaining. These improve developer experience significantly.

### **Phase 3: Advanced Features (Low Priority)**
Implement advanced type system features and edge cases. These are for comprehensive coverage but less commonly used.

---

## 📋 **Current Status**

- ✅ **Completed**: Basic declarations, expressions, statements, modules
- 🔄 **In Progress**: None currently
- 📋 **Next Up**: Enums, Type Aliases, Switch/Case statements

---

## 🎯 **Success Metrics**

**Target Coverage Goals:**
- **Phase 1**: 60% TypeScript language coverage
- **Phase 2**: 80% TypeScript language coverage  
- **Phase 3**: 95% TypeScript language coverage

**Quality Metrics:**
- All builders follow established patterns (BuildableAST interface)
- Fluent and declarative APIs for each feature
- Comprehensive test coverage
- Performance benchmarks maintained
- Documentation with examples

---

## 🤝 **Contribution Guidelines**

When implementing new features:

1. **Follow the pattern** established in `/.github/instructions/ts-flattered.instructions.md`
2. **Create builder class** implementing `BuildableAST`
3. **Support both APIs**: chainable and declarative
4. **Add to public API** exports
5. **Update API.md** with examples
6. **Write tests** and benchmarks
7. **Maintain performance** standards

Each new feature should feel native to the existing ts-flattered ecosystem while providing the same level of type safety and fluent experience.
