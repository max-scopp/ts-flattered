import ts from "typescript";
import {
  _arrow,
  _await,
  _block,
  _call,
  _conditional,
  _constVar,
  _exportConstVar,
  _litNum,
  _litStr,
  _objLit,
  _param,
  _propAccess,
  _propAssignment,
  _propChain,
  _ret,
  _template,
  _tkn,
  _type,
  $,
} from "../src/api/statements";

interface Operation {
  id: string;
  method: string;
  path: string;
}

interface PluginConfig {
  httpRequests: {
    asClass: boolean;
    methodNameBuilder: (operation: Operation) => string;
  };
}

interface Plugin {
  config: PluginConfig;
}

/**
 * Examples demonstrating the modern statements API
 */

// Example 1: Simple variable declarations
export const createSimpleVariable = () => {
  return _constVar("myVar", _litStr("Hello World"));
};

// Example 2: Exported constant with object literal (OLD STYLE)
export const createExportedConfig = () => {
  return _exportConstVar(
    "config",
    _objLit({
      properties: [
        _propAssignment("apiUrl", _litStr("https://api.example.com")),
        _propAssignment("timeout", _litNum(5000)),
        _propAssignment("retries", _litNum(3)),
      ],
    }),
  );
};

// Example 2b: Same example with NEW OPINIONATED STYLE
export const createExportedConfigOpinionated = () => {
  return _exportConstVar(
    "config",
    _objLit({
      properties: [
        _propAssignment("apiUrl", _litStr("https://api.example.com")),
        _propAssignment("timeout", _litNum(5000)),
        _propAssignment("retries", _litNum(3)),
      ],
      multiLine: true,
    }),
  );
};

// Example 3: Async arrow function with await
export const createAsyncFunction = () => {
  return _constVar(
    "fetchData",
    _arrow({
      modifiers: [_tkn(ts.SyntaxKind.AsyncKeyword)],
      parameters: [
        _param({
          modifiers: undefined,
          dotDotDotToken: undefined,
          name: "url",
          questionToken: undefined,
          type: _type("string"),
          initializer: undefined,
        }),
      ],
      body: _block(
        _constVar(
          "response",
          _await(_call({ expression: "fetch", args: [$("url")] })),
        ),
        _ret(
          _call({
            expression: _propAccess({
              expression: "response",
              property: "json",
            }),
          }),
        ),
      ),
    }),
  );
};

// Example 4: Template literal usage
export const createTemplateExample = () => {
  return _constVar(
    "message",
    _template("Hello ", $("name"), ", welcome to ", $("appName"), "!"),
  );
};

// Example 5: Conditional with property chain
export const createConditionalWithChain = () => {
  return _constVar(
    "result",
    _conditional({
      condition: _propChain("user", "profile", "isActive"),
      whenTrue: _litStr("Active User"),
      whenFalse: _litStr("Inactive User"),
    }),
  );
};

// Convert the generateResourceCallExpression function
export const generateResourceCallExpression = ({
  operation,
  plugin,
  responseTypeName,
}: {
  operation: Operation;
  plugin: Plugin;
  responseTypeName: string;
}) => {
  const useRequestClasses = plugin.config.httpRequests.asClass;

  if (useRequestClasses) {
    // For class-based request methods, use inject and class hierarchy

    // Build the method access path using inject
    let methodAccess: ts.Expression = _call({
      expression: "inject",
      args: [$("requestClassName")],
    });

    // Navigate through the class hierarchy (simplified)
    methodAccess = _propAccess({
      expression: methodAccess,
      property: "someProperty",
    });

    // Add the final method name
    methodAccess = _propAccess({
      expression: methodAccess,
      property: "requestMethodName",
    });

    return _call({
      expression: "httpResource",
      typeArguments: [_type(responseTypeName)],
      args: [
        _arrow({
          body: _block(
            _constVar(
              "opts",
              _conditional({
                condition: $("options"),
                whenTrue: _call({ expression: "options" }),
                whenFalse: $("undefined"),
              }),
            ),
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
  } else {
    // For function-based request methods
    const requestFunctionName =
      plugin.config.httpRequests.methodNameBuilder(operation);

    return _call({
      expression: "httpResource",
      typeArguments: [_type(responseTypeName)],
      args: [
        _arrow({
          body: _block(
            _constVar(
              "opts",
              _conditional({
                condition: $("options"),
                whenTrue: _call({ expression: "options" }),
                whenFalse: $("undefined"),
              }),
            ),
            _ret(
              _conditional({
                condition: $("opts"),
                whenTrue: _call({ expression: requestFunctionName }),
                whenFalse: $("undefined"),
              }),
            ),
          ),
        }),
      ],
    });
  }
};

// Convert the generateAngularResourceMethod function
export const generateAngularResourceMethod = ({
  operation,
  plugin,
  responseTypeName,
}: {
  operation: Operation;
  plugin: Plugin;
  responseTypeName: string;
}) => {
  // This would use the method declaration helpers from statements.ts
  // For now, showing the basic structure using the new API

  return {
    // Method declaration using new API would be implemented here
    // This is a placeholder showing the conceptual conversion
    methodDeclaration: _block(
      _ret(
        generateResourceCallExpression({
          operation,
          plugin,
          responseTypeName,
        }),
      ),
    ),
  };
};

// Convert the generateAngularResourceFunction
export const generateAngularResourceFunction = ({
  functionName,
  operation,
  plugin,
  responseTypeName,
}: {
  functionName: string;
  operation: Operation;
  plugin: Plugin;
  responseTypeName: string;
}) => {
  // Using the new simplified const variable creation
  return _exportConstVar(
    functionName,
    _arrow({
      body: _block(
        _ret(
          generateResourceCallExpression({
            operation,
            plugin,
            responseTypeName,
          }),
        ),
      ),
    }),
  );
};

// Example of converted conditional expression pattern
export const createConditionalResourceCall = () => {
  return _conditional({
    condition: $("opts"),
    whenTrue: _call({ expression: "requestMethod", args: [$("opts")] }),
    whenFalse: $("undefined"),
  });
};

// Example of converted variable declaration pattern
export const createOptionsVariable = () => {
  return _constVar(
    "opts",
    _conditional({
      condition: $("options"),
      whenTrue: _call({ expression: "options" }),
      whenFalse: $("undefined"),
    }),
  );
};

// Example of converted arrow function pattern
export const createResourceArrowFunction = () => {
  return _arrow({
    body: _block(
      createOptionsVariable(),
      _ret(createConditionalResourceCall()),
    ),
  });
};
