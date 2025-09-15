import { objLiteral } from "./src/core/object";

// Test the enhanced object literal builder
const complexObj = objLiteral({
  name: "John",
  age: 30,
  active: true,
  metadata: null,
  config: {
    theme: "dark",
    features: ["auth", "notifications"],
    settings: {
      volume: 0.8,
      autoSave: true
    }
  },
  tags: ["user", "premium"]
});

// Test toRecord() - should return plain object without ts.Expression
const record = complexObj.toRecord();
console.log("Record output:", JSON.stringify(record, null, 2));

// Test overloaded constructor with existing object
const newObj = objLiteral(complexObj.get());
console.log("Cloned object has same properties:", newObj.has("name"));

// Test setMany with nested structure
const updated = objLiteral()
  .setMany({
    user: {
      profile: {
        name: "Jane",
        preferences: {
          theme: "light",
          notifications: true
        }
      }
    },
    data: [1, 2, { nested: "value" }]
  });

const updatedRecord = updated.toRecord();
console.log("Updated record:", JSON.stringify(updatedRecord, null, 2));