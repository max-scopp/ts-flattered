import ts from "typescript";
import { Program } from "../src/api/program";
import {
  _arrayLit,
  _binary,
  _block,
  _call,
  _classDecl,
  _constVar,
  _ctor,
  _elemAccess,
  _exportConstVar,
  _exprStmt,
  _false,
  _forOfStmt,
  _forStmt,
  _if,
  _ifStmt,
  _litNum,
  _litStr,
  _methodDecl,
  _new,
  _objLit,
  _param,
  _postfixUnary,
  _prefixUnary,
  _propAccess,
  _propAssignment,
  _propDecl,
  _ret,
  _spread,
  _tkn,
  _true,
  _typeof,
  _typeRef,
  _var,
  _varDecl,
  _varDeclList,
  $,
} from "../src/api/statements";

// // Method with string body (simple)
// const mett = method({
//   name: "setupProcessor",
//   scope: "private",
//   returnType: "void",
//   body: "this.isReady = true;",
// });

// console.log(print(mett as any));

// Create a new program
const program = new Program();

// Create a complex class showing different body types
const advancedClass = _classDecl({
  modifiers: [_tkn(ts.SyntaxKind.ExportKeyword)],
  name: "DataProcessor",
  members: [
    _propDecl({
      modifiers: [_tkn(ts.SyntaxKind.PrivateKeyword)],
      name: "isReady",
      type: _typeRef("boolean"),
      initializer: _false(),
    }),

    _propDecl({
      modifiers: [_tkn(ts.SyntaxKind.PrivateKeyword)],
      name: "config",
      type: _typeRef("any"),
    }),

    _propDecl({
      modifiers: [_tkn(ts.SyntaxKind.PrivateKeyword)],
      name: "debug",
      type: _typeRef("boolean"),
    }),

    _ctor({
      parameters: [
        _param({
          modifiers: [_tkn(ts.SyntaxKind.PrivateKeyword)],
          name: "config",
          type: _typeRef("any"),
        }),
        _param({
          modifiers: [_tkn(ts.SyntaxKind.PrivateKeyword)],
          name: "debug",
          type: _typeRef("boolean"),
        }),
      ],
      body: _block(
        _exprStmt($("this.debug = debug || false")),
        _exprStmt($("this.setupProcessor()")),
        _ifStmt(
          _propAccess({ expression: "this", property: "debug" }),
          _exprStmt(
            _call({
              expression: _propAccess({
                expression: "console",
                property: "log",
              }),
              args: [_litStr("DataProcessor initialized")],
            }),
          ),
        ),
      ),
    }),

    _methodDecl({
      modifiers: [_tkn(ts.SyntaxKind.PrivateKeyword)],
      name: "setupProcessor",
      parameters: [],
      type: _typeRef("void"),
      body: _block(_exprStmt($("this.isReady = true"))),
    }),

    _methodDecl({
      name: "processData",
      parameters: [
        _param({
          name: "input",
          type: _typeRef("any", [_typeRef("[]")]),
        }),
      ],
      type: _typeRef("any", [_typeRef("[]")]),
      body: _block(
        _var({
          modifiers: [],
          declarationList: _varDeclList([
            _varDecl(
              "results",
              undefined,
              undefined,
              _arrayLit({ elements: [] }),
            ),
          ]),
        }),
        _forStmt(
          _varDeclList([_varDecl("i", undefined, undefined, _litNum(0))]),
          _binary(
            $("i"),
            _tkn(ts.SyntaxKind.LessThanToken),
            _propAccess({ expression: "input", property: "length" }),
          ),
          _postfixUnary($("i"), ts.SyntaxKind.PlusPlusToken),
          _block(
            _constVar("item", _elemAccess({ expression: "input", index: "i" })),
            _ifStmt(
              _call({
                expression: _propAccess({
                  expression: "this",
                  property: "validateItem",
                }),
                args: [$("item")],
              }),
              _block(
                _constVar(
                  "processed",
                  _call({
                    expression: _propAccess({
                      expression: "this",
                      property: "transformItem",
                    }),
                    args: [$("item")],
                  }),
                ),
                _exprStmt(
                  _call({
                    expression: _propAccess({
                      expression: "results",
                      property: "push",
                    }),
                    args: [$("processed")],
                  }),
                ),
              ),
              _ifStmt(
                _propAccess({ expression: "this", property: "debug" }),
                _exprStmt(
                  _call({
                    expression: _propAccess({
                      expression: "console",
                      property: "warn",
                    }),
                    args: [_litStr("Invalid item skipped:"), $("item")],
                  }),
                ),
              ),
            ),
          ),
        ),
        _ret($("results")),
      ),
    }),

    _methodDecl({
      modifiers: [_tkn(ts.SyntaxKind.PrivateKeyword)],
      name: "validateItem",
      parameters: [
        _param({
          name: "item",
          type: _typeRef("any"),
        }),
      ],
      type: _typeRef("boolean"),
      body: _block(
        _ifStmt(
          _binary(
            $("item"),
            _tkn(ts.SyntaxKind.BarBarToken),
            _binary(
              _typeof($("item")),
              _tkn(ts.SyntaxKind.ExclamationEqualsEqualsToken),
              _litStr("object"),
            ),
          ),
          _ret(_false()),
        ),
        _constVar(
          "required",
          _arrayLit({
            elements: [_litStr("id"), _litStr("type"), _litStr("data")],
          }),
        ),
        _forOfStmt(
          undefined,
          _varDeclList([_varDecl("field")]),
          $("required"),
          _block(
            _ifStmt(
              _prefixUnary(
                ts.SyntaxKind.ExclamationToken,
                _binary($("field"), _tkn(ts.SyntaxKind.InKeyword), $("item")),
              ),
              _block(
                _ifStmt(
                  _propAccess({ expression: "this", property: "debug" }),
                  _exprStmt(
                    _call({
                      expression: _propAccess({
                        expression: "console",
                        property: "error",
                      }),
                      args: [_litStr("Missing required field:"), $("field")],
                    }),
                  ),
                ),
                _ret(_false()),
              ),
            ),
          ),
        ),
        _ret(_true()),
      ),
    }),

    _methodDecl({
      modifiers: [_tkn(ts.SyntaxKind.PrivateKeyword)],
      name: "transformItem",
      parameters: [
        _param({
          name: "item",
          type: _typeRef("any"),
        }),
      ],
      type: _typeRef("any"),
      body: _block(
        _constVar(
          "transformed",
          _objLit({
            properties: [
              _propAssignment("processed", _true()),
              _propAssignment(
                "timestamp",
                _call({
                  expression: _propAccess({
                    expression: _new({
                      expression: "Date",
                      args: [],
                    }),
                    property: "toISOString",
                  }),
                  args: [],
                }),
              ),
              _propAssignment(
                "hash",
                _call({
                  expression: _propAccess({
                    expression: "this",
                    property: "generateHash",
                  }),
                  args: [$("item")],
                }),
              ),
            ],
          }),
        ),
        _ifStmt(
          _propAccess({
            expression: _propAccess({ expression: "this", property: "config" }),
            property: "enrichData",
          }),
          _exprStmt(
            _binary(
              _propAccess({ expression: "transformed", property: "metadata" }),
              _tkn(ts.SyntaxKind.EqualsToken),
              _call({
                expression: _propAccess({
                  expression: "this",
                  property: "enrichMetadata",
                }),
                args: [$("item")],
              }),
            ),
          ),
        ),
        _ifStmt(
          _propAccess({ expression: "this", property: "debug" }),
          _exprStmt(
            _call({
              expression: _propAccess({
                expression: "console",
                property: "log",
              }),
              args: [
                _litStr("Transformed item:"),
                _propAccess({ expression: "transformed", property: "id" }),
              ],
            }),
          ),
        ),
        _ret($("transformed")),
      ),
    }),

    _methodDecl({
      modifiers: [_tkn(ts.SyntaxKind.PrivateKeyword)],
      name: "generateHash",
      parameters: [
        _param({
          name: "data",
          type: _typeRef("any"),
        }),
      ],
      type: _typeRef("string"),
      body: _block(
        _ret(
          _call({
            expression: _propAccess({
              expression: _call({
                expression: _propAccess({
                  expression: _propAccess({
                    expression: "Math",
                    property: "random",
                  }),
                  property: "toString",
                }),
                args: [_litNum(36)],
              }),
              property: "substring",
            }),
            args: [_litNum(2), _litNum(15)],
          }),
        ),
      ),
    }),

    _methodDecl({
      modifiers: [_tkn(ts.SyntaxKind.PrivateKeyword)],
      name: "enrichMetadata",
      parameters: [
        _param({
          name: "item",
          type: _typeRef("any"),
        }),
      ],
      type: _typeRef("any"),
      body: _block(
        _ret(
          _objLit({
            properties: [
              _propAssignment("source", _litStr("processor")),
              _propAssignment("version", _litStr("1.0")),
              _propAssignment(
                "category",
                _binary(
                  _propAccess({ expression: "item", property: "type" }),
                  _tkn(ts.SyntaxKind.BarBarToken),
                  _litStr("unknown"),
                ),
              ),
            ],
          }),
        ),
      ),
    }),

    _methodDecl({
      name: "getStats",
      parameters: [],
      type: _typeRef("any"),
      body: _block(
        _ret(
          _objLit({
            properties: [
              _propAssignment(
                "isReady",
                _propAccess({ expression: "this", property: "isReady" }),
              ),
              _propAssignment(
                "debugMode",
                _propAccess({ expression: "this", property: "debug" }),
              ),
              _propAssignment(
                "configHash",
                _call({
                  expression: _propAccess({
                    expression: "this",
                    property: "generateHash",
                  }),
                  args: [
                    _propAccess({ expression: "this", property: "config" }),
                  ],
                }),
              ),
              _propAssignment(
                "lastRun",
                _call({
                  expression: _propAccess({
                    expression: _new({
                      expression: "Date",
                      args: [],
                    }),
                    property: "toISOString",
                  }),
                  args: [],
                }),
              ),
            ],
          }),
        ),
      ),
    }),

    _methodDecl({
      name: "reset",
      parameters: [],
      type: _typeRef("void"),
      body: _block(
        _exprStmt($("this.isReady = false")),
        _exprStmt(
          _call({
            expression: _propAccess({
              expression: "this",
              property: "setupProcessor",
            }),
            args: [],
          }),
        ),
      ),
    }),
  ],
});

// Create the source file
const sourceFile = program.createSourceFile("DataProcessor.ts");
sourceFile.addStatement(advancedClass);

await program.writeAll("out/advanced-example");
