import ts from "typescript";
import {
  _arrayType,
  _arrow,
  _binary,
  _block,
  _call,
  _callChain,
  _classDecl,
  _classExpr,
  _condExpr,
  _conditional,
  _ctor,
  _decorator,
  _elemAccess,
  _enumDecl,
  _exportAssignment,
  _exprStmt,
  _false,
  _fnDecl,
  _fnType,
  _if,
  _ifStmt,
  _importClause,
  _importDecl,
  _importSpec,
  _interfaceDecl,
  _literalType,
  _litStr,
  _methodDecl,
  _modifiersFromFlags,
  _moduleBlock,
  _moduleDecl,
  _namedImports,
  _new,
  _null,
  _objLit,
  _param,
  _propAccess,
  _propAssignment,
  _propDecl,
  _qualifiedName,
  _ret,
  _spread,
  _tkn,
  _true,
  _typeAliasDecl,
  _typeLiteral,
  _typeParam,
  _typeRef,
  _unionType,
  _var,
  _varDecl,
  _varDeclList,
  _varDecls,
  $,
} from "../src/api/statements";

// Helper function to create a variable statement
const createVariableStatement = (
  name: string,
  initializer: ts.Expression,
): ts.VariableStatement =>
  _var({
    modifiers: undefined,
    declarationList: _varDeclList(
      [_varDecl(name, undefined, undefined, initializer)],
      ts.NodeFlags.Const,
    ),
  });

// Type definitions (simplified for this example)
interface GeneratedFile {
  add(node: ts.Node): void;
  import(options: { module: string; name?: string; asType?: boolean }): {
    name: string;
  };
  relativePathToFile(options: { context: any; id: string }): string;
}

interface IR {
  OperationObject: any;
}

interface AngularCommonPlugin {
  Instance: {
    config: {
      httpResources: {
        asClass: boolean;
        classNameBuilder: (operation: any) => string;
        methodNameBuilder: (operation: any) => string;
      };
      httpRequests: {
        asClass: boolean;
        classNameBuilder: (operation: any) => string;
        methodNameBuilder: (operation: any) => string;
      };
    };
    context: {
      file: (options: {
        id: string;
      }) => { getName: (options: any) => string } | undefined;
    };
    forEach: (
      type: string,
      callback: (options: { operation: any }) => void,
    ) => void;
    getPlugin: (name: string) => any;
    createFile: (options: { id: string; path: string }) => GeneratedFile;
    name: string;
    output: string;
  };
  Handler: (options: { plugin: AngularCommonPlugin["Instance"] }) => void;
}

const REQUEST_APIS_SUFFIX = "-requests";
const RESOURCE_APIS_SUFFIX = "-resources";

const generateResourceCallExpression = ({
  file,
  operation,
  plugin,
  responseTypeName,
}: {
  file: GeneratedFile;
  operation: any;
  plugin: AngularCommonPlugin["Instance"];
  responseTypeName: string;
}) => {
  const sdkPlugin = plugin.getPlugin("@hey-api/sdk");

  // Check if httpRequest is configured to use classes
  const useRequestClasses = plugin.config.httpRequests.asClass;

  if (useRequestClasses) {
    // For class-based request methods, use inject and class hierarchy
    const classes = operationClasses({
      context: plugin.context,
      operation,
      plugin: sdkPlugin,
    });

    const firstEntry = Array.from(classes.values())[0];
    if (firstEntry) {
      // Import the root class from HTTP requests
      const rootClassName = firstEntry.path[0];
      const requestClassName = buildName({
        config: {
          case: "preserve",
          name: plugin.config.httpRequests.classNameBuilder,
        },
        name: rootClassName,
      });

      // Build the method access path using inject
      let methodAccess: ts.Expression = _call({
        expression: $("inject"),
        args: [_litStr(requestClassName)],
      });

      // Navigate through the class hierarchy
      for (let i = 1; i < firstEntry.path.length; i++) {
        const className = firstEntry.path[i];
        if (className) {
          methodAccess = _propAccess({
            expression: methodAccess,
            property: stringCase({
              case: "camelCase",
              value: className,
            }),
          });
        }
      }

      // Add the final method name with "Request" suffix
      const requestMethodName =
        plugin.config.httpRequests.methodNameBuilder(operation);
      methodAccess = _propAccess({
        expression: methodAccess,
        property: requestMethodName,
      });

      return _call({
        expression: $("httpResource"),
        typeArguments: [_typeRef(responseTypeName)],
        args: [
          _arrow({
            parameters: [],
            body: _block(
              _var({
                modifiers: undefined,
                declarationList: _varDeclList([
                  _varDecl(
                    "opts",
                    undefined,
                    undefined,
                    _conditional({
                      condition: $("options"),
                      whenTrue: _call({
                        expression: $("options"),
                        args: [],
                      }),
                      whenFalse: $("undefined"),
                    }),
                  ),
                ]),
              }),
              _ret(
                _conditional({
                  condition: $("opts"),
                  whenTrue: _call({
                    expression: methodAccess,
                    args: [$("opts")],
                  }),
                  whenFalse: $("undefined"),
                }),
              ),
            ),
          }),
        ],
      });
    }
  } else {
    // For function-based request methods, import and call the function directly
    const requestFunctionName =
      plugin.config.httpRequests.methodNameBuilder(operation);

    const requestImport = file.import({
      module: file.relativePathToFile({
        context: plugin.context,
        id: `${plugin.name}${REQUEST_APIS_SUFFIX}`,
      }),
      name: requestFunctionName,
    });

    return _call({
      expression: $("httpResource"),
      typeArguments: [_typeRef(responseTypeName)],
      args: [
        _arrow({
          parameters: [],
          body: _block(
            _var({
              modifiers: undefined,
              declarationList: _varDeclList([
                _varDecl(
                  "opts",
                  undefined,
                  undefined,
                  _conditional({
                    condition: $("options"),
                    whenTrue: _call({
                      expression: $("options"),
                      args: [],
                    }),
                    whenFalse: $("undefined"),
                  }),
                ),
              ]),
            }),
            _ret(
              _conditional({
                condition: $("opts"),
                whenTrue: _call({
                  expression: requestImport.name,
                  args: [$("opts")],
                }),
                whenFalse: $("undefined"),
              }),
            ),
          ),
        }),
      ],
    });
  }

  // Fallback return (should not reach here)
  return _call({
    expression: $("httpResource"),
    typeArguments: [_typeRef(responseTypeName)],
    args: [
      _arrow({
        parameters: [],
        body: _block(_ret($("undefined"))),
      }),
    ],
  });
};

// Helper functions (simplified versions)
const operationClasses = (options: any) => {
  // Simplified implementation - in real code this would be more complex
  return new Map([["default", { path: ["DefaultClass"] }]]);
};

const buildName = (options: any) => {
  // Simplified implementation
  return options.name;
};

const stringCase = (options: any) => {
  // Simplified implementation
  return options.value;
};

const createOperationComment = (options: any) => {
  // Simplified implementation
  return `// Operation: ${options.operation}`;
};

const isOperationOptionsRequired = (options: any) => {
  // Simplified implementation
  return false;
};

const generateAngularResourceMethod = ({
  file,
  isRequiredOptions,
  methodName,
  operation,
  plugin,
}: {
  file: GeneratedFile;
  isRequiredOptions: boolean;
  methodName: string;
  operation: any;
  plugin: AngularCommonPlugin["Instance"];
}) => {
  // Import operation data type
  const pluginTypeScript = plugin.getPlugin("@hey-api/typescript");
  const fileTypeScript = plugin.context.file({ id: "types" });
  const dataType = file.import({
    asType: true,
    module: file.relativePathToFile({ context: plugin.context, id: "types" }),
    name: fileTypeScript?.getName({ operation, type: "data" }) || "unknown",
  });

  // Import operation response type
  const responseType = file.import({
    asType: true,
    module: file.relativePathToFile({ context: plugin.context, id: "types" }),
    name: fileTypeScript?.getName({ operation, type: "response" }) || "unknown",
  });

  return _methodDecl({
    modifiers: _modifiersFromFlags(ts.ModifierFlags.Public) || [],
    name: methodName,
    parameters: [
      _param({
        name: "options",
        type: _unionType([
          _fnType(
            [],
            _typeRef("Options", [
              _typeRef(dataType.name || "unknown"),
              _typeRef("ThrowOnError"),
            ]),
          ),
          _typeRef("undefined"),
        ]),
        questionToken: isRequiredOptions
          ? undefined
          : _tkn(ts.SyntaxKind.QuestionToken),
      }),
    ],
    type: undefined,
    body: _block(
      _ret(
        generateResourceCallExpression({
          file,
          operation,
          plugin,
          responseTypeName: responseType.name || "unknown",
        }),
      ),
    ),
  });
};

const generateAngularResourceFunction = ({
  file,
  functionName,
  isRequiredOptions,
  operation,
  plugin,
}: {
  file: GeneratedFile;
  functionName: string;
  isRequiredOptions: boolean;
  operation: any;
  plugin: AngularCommonPlugin["Instance"];
}) => {
  const pluginTypeScript = plugin.getPlugin("@hey-api/typescript");
  const fileTypeScript = plugin.context.file({ id: "types" });
  const dataType = file.import({
    asType: true,
    module: file.relativePathToFile({ context: plugin.context, id: "types" }),
    name: fileTypeScript?.getName({ operation, type: "data" }) || "unknown",
  });

  // Import operation response type
  const responseType = file.import({
    asType: true,
    module: file.relativePathToFile({ context: plugin.context, id: "types" }),
    name: fileTypeScript?.getName({ operation, type: "response" }) || "unknown",
  });

  return _fnDecl({
    modifiers: _modifiersFromFlags(ts.ModifierFlags.Export) || [],
    name: functionName,
    parameters: [
      _param({
        name: "options",
        type: _unionType([
          _fnType(
            [],
            _typeRef("Options", [
              _typeRef(dataType.name || "unknown"),
              _typeRef("ThrowOnError"),
            ]),
          ),
          _typeRef("undefined"),
        ]),
        questionToken: isRequiredOptions
          ? undefined
          : _tkn(ts.SyntaxKind.QuestionToken),
      }),
    ],
    type: undefined,
    body: _block(
      _ret(
        generateResourceCallExpression({
          file,
          operation,
          plugin,
          responseTypeName: responseType.name || "unknown",
        }),
      ),
    ),
  });
};

const generateAngularFunctionServices = ({
  file,
  plugin,
}: {
  file: GeneratedFile;
  plugin: AngularCommonPlugin["Instance"];
}) => {
  plugin.forEach("operation", ({ operation }) => {
    const isRequiredOptions = isOperationOptionsRequired({
      context: plugin.context,
      operation,
    });

    const node = generateAngularResourceFunction({
      file,
      functionName: plugin.config.httpResources.methodNameBuilder(operation),
      isRequiredOptions,
      operation,
      plugin,
    });

    file.add(node);
  });
};

const generateAngularClassServices = ({
  file,
  plugin,
}: {
  file: GeneratedFile;
  plugin: AngularCommonPlugin["Instance"];
}) => {
  const serviceClasses = new Map<string, any>();
  const generatedClasses = new Set<string>();

  const sdkPlugin = plugin.getPlugin("@hey-api/sdk");

  // Iterate through operations to build class structure
  plugin.forEach("operation", ({ operation }) => {
    const isRequiredOptions = isOperationOptionsRequired({
      context: plugin.context,
      operation,
    });

    const classes = operationClasses({
      context: plugin.context,
      operation,
      plugin: sdkPlugin,
    });

    for (const entry of classes.values()) {
      entry.path.forEach((currentClassName: string, index: number) => {
        if (!serviceClasses.has(currentClassName)) {
          serviceClasses.set(currentClassName, {
            className: currentClassName,
            classes: new Set<string>(),
            methods: new Set<string>(),
            nodes: [],
            root: !index,
          });
        }

        const parentClassName = entry.path[index - 1];
        if (parentClassName && parentClassName !== currentClassName) {
          const parentClass = serviceClasses.get(parentClassName);
          parentClass.classes.add(currentClassName);
          serviceClasses.set(parentClassName, parentClass);
        }

        const isLast = entry.path.length === index + 1;
        if (!isLast) {
          return;
        }

        const currentClass = serviceClasses.get(currentClassName);

        // Generate the resource method name
        const resourceMethodName =
          plugin.config.httpResources.methodNameBuilder(operation);

        // Avoid duplicate methods
        if (currentClass.methods.has(resourceMethodName)) {
          return;
        }

        // Generate Angular resource method
        const methodNode = generateAngularResourceMethod({
          file,
          isRequiredOptions,
          methodName: resourceMethodName,
          operation,
          plugin,
        });

        if (!currentClass.nodes.length) {
          currentClass.nodes.push(methodNode);
        } else {
          // Add newline between methods
          currentClass.nodes.push(methodNode);
        }

        currentClass.methods.add(resourceMethodName);
        serviceClasses.set(currentClassName, currentClass);
      });
    }
  });

  // Generate classes
  const generateClass = (currentClass: any) => {
    if (generatedClasses.has(currentClass.className)) {
      return;
    }

    // Handle child classes
    if (currentClass.classes.size) {
      for (const childClassName of currentClass.classes) {
        const childClass = serviceClasses.get(childClassName);
        generateClass(childClass);

        currentClass.nodes.push(
          _propDecl({
            modifiers: [],
            name: stringCase({
              case: "camelCase",
              value: childClass.className,
            }),
            type: _typeRef(
              buildName({
                config: {
                  case: "preserve",
                  name: plugin.config.httpResources.classNameBuilder,
                },
                name: childClass.className,
              }),
            ),
            initializer: _new({
              expression: buildName({
                config: {
                  case: "preserve",
                  name: plugin.config.httpResources.classNameBuilder,
                },
                name: childClass.className,
              }),
              args: [],
            }),
          }),
        );
      }
    }

    const decorators = currentClass.root
      ? [
          _decorator(
            _call({
              expression: $("Injectable"),
              args: [
                _objLit({
                  properties: [_propAssignment("providedIn", _litStr("root"))],
                }),
              ],
            }),
          ),
        ]
      : [];

    const node = ts.factory.createClassDeclaration(
      decorators,
      currentClass.root
        ? _modifiersFromFlags(ts.ModifierFlags.Export) || []
        : [],
      buildName({
        config: {
          case: "preserve",
          name: plugin.config.httpResources.classNameBuilder,
        },
        name: currentClass.className,
      }),
      undefined, // typeParameters
      undefined, // heritageClauses
      currentClass.nodes,
    );

    file.add(node);
    generatedClasses.add(currentClass.className);
  };

  for (const serviceClass of serviceClasses.values()) {
    generateClass(serviceClass);
  }
};

export const createHttpResources: AngularCommonPlugin["Handler"] = ({
  plugin,
}) => {
  const file = plugin.createFile({
    id: `${plugin.name}${RESOURCE_APIS_SUFFIX}`,
    path: `${plugin.output}${RESOURCE_APIS_SUFFIX}`,
  });

  if (plugin.config.httpResources.asClass) {
    file.import({
      module: "@angular/core",
      name: "Injectable",
    });
  }

  if (plugin.config.httpRequests.asClass) {
    file.import({
      module: "@angular/core",
      name: "inject",
    });
  }

  file.import({
    module: "@angular/common/http",
    name: "httpResource",
  });

  file.import({
    module: file.relativePathToFile({
      context: plugin.context,
      id: "sdk",
    }),
    name: "Options",
  });

  if (plugin.config.httpResources.asClass) {
    generateAngularClassServices({ file, plugin });
  } else {
    generateAngularFunctionServices({ file, plugin });
  }
};
