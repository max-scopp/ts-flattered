/* eslint-disable @typescript-eslint/no-explicit-any */
import ts, {
  type ArrayBindingElement,
  type AssertsKeyword,
  type AsteriskToken,
  type AwaitKeyword,
  type BinaryOperator,
  type BinaryOperatorToken,
  type BindingElement,
  type BindingName,
  type Block,
  type CaseBlock,
  type CaseOrDefaultClause,
  type CatchClause,
  type ClassElement,
  type ColonToken,
  type ConciseBody,
  type DotDotDotToken,
  type EndOfFileToken,
  type EntityName,
  type EnumMember,
  type EqualsGreaterThanToken,
  type ExclamationToken,
  type ExportSpecifier,
  type Expression,
  type FalseLiteral,
  type ForInitializer,
  type HeritageClause,
  type Identifier,
  type ImportAttribute,
  type ImportAttributeName,
  type ImportAttributes,
  type ImportClause,
  type ImportPhaseModifierSyntaxKind,
  type ImportSpecifier,
  type KeywordSyntaxKind,
  type KeywordToken,
  type KeywordTypeNode,
  type KeywordTypeSyntaxKind,
  type LiteralTypeNode,
  type MemberName,
  type MetaProperty,
  type MinusToken,
  type Modifier,
  type ModifierLike,
  type ModifierSyntaxKind,
  type ModifierToken,
  type ModuleBody,
  type ModuleExportName,
  type ModuleName,
  type ModuleReference,
  type NamedExportBindings,
  type NamedImportBindings,
  type NamedTupleMember,
  type NodeFlags,
  type NullLiteral,
  type ObjectLiteralElementLike,
  type ParameterDeclaration,
  type PlusToken,
  type PostfixUnaryOperator,
  type PrefixUnaryOperator,
  type PropertyName,
  type PseudoBigInt,
  type PunctuationSyntaxKind,
  type PunctuationToken,
  type QuestionToken,
  type ReadonlyKeyword,
  type Statement,
  type SuperExpression,
  type SyntaxKind,
  type TemplateHead,
  type TemplateLiteral,
  type TemplateLiteralTypeSpan,
  type TemplateMiddle,
  type TemplateSpan,
  type TemplateTail,
  type ThisExpression,
  type ThisTypeNode,
  type Token,
  type TokenFlags,
  type TrueLiteral,
  type TypeElement,
  type TypeNode,
  type TypeParameterDeclaration,
  type VariableDeclaration,
  type VariableDeclarationList,
} from "typescript";

export const _globalConf = {
  isSingleQuote: false,
  blocksMultiLine: true,
  arrayMultiLine: true,
  objectMultiLine: true,
};

export function _var({
  modifiers,
  declarationList,
}: {
  modifiers: readonly ModifierLike[] | undefined;
  declarationList: VariableDeclarationList | readonly VariableDeclaration[];
}) {
  return ts.factory.createVariableStatement(modifiers, declarationList);
}

export function _ret(expression?: ts.Expression) {
  return ts.factory.createReturnStatement(expression);
}

export function _tkn(token: SyntaxKind.SuperKeyword): SuperExpression;
export function _tkn(token: SyntaxKind.ThisKeyword): ThisExpression;
export function _tkn(token: SyntaxKind.NullKeyword): NullLiteral;
export function _tkn(token: SyntaxKind.TrueKeyword): TrueLiteral;
export function _tkn(token: SyntaxKind.FalseKeyword): FalseLiteral;
export function _tkn(token: SyntaxKind.EndOfFileToken): EndOfFileToken;
export function _tkn(token: SyntaxKind.Unknown): Token<SyntaxKind.Unknown>;
export function _tkn<TKind extends PunctuationSyntaxKind>(
  token: TKind,
): PunctuationToken<TKind>;
export function _tkn<TKind extends KeywordTypeSyntaxKind>(
  token: TKind,
): KeywordTypeNode<TKind>;
export function _tkn<TKind extends ModifierSyntaxKind>(
  token: TKind,
): ModifierToken<TKind>;
export function _tkn<TKind extends KeywordSyntaxKind>(
  token: TKind,
): KeywordToken<TKind>;
export function _tkn(kind: SyntaxKind): Token<SyntaxKind> {
  return ts.factory.createToken(
    kind as PunctuationSyntaxKind,
  ) as Token<SyntaxKind>;
}

export function _condExpr({
  condition,
  $then,
  $else,
}: {
  condition: ts.Expression;
  $then: ts.Expression;
  $else?: ts.Expression;
}) {
  return ts.factory.createConditionalExpression(
    condition,
    _tkn(ts.SyntaxKind.QuestionToken),
    $then,
    _tkn(ts.SyntaxKind.ColonToken),
    $else ?? ts.factory.createVoidZero(),
  );
}

export const _varDecls = (
  ...decls: {
    name: string | BindingName;
    exclamationToken?: ExclamationToken;
    type?: TypeNode;
    initializer?: Expression;
  }[]
) =>
  decls.map(({ name, exclamationToken, type, initializer }) =>
    ts.factory.createVariableDeclaration(
      name,
      exclamationToken,
      type,
      initializer,
    ),
  );

export const _block = (...statements: readonly ts.Statement[]) =>
  ts.factory.createBlock(statements, _globalConf.blocksMultiLine);

export const _litNum = (
  value: string | number,
  numericLiteralFlags?: TokenFlags,
) => ts.factory.createNumericLiteral(value.toString(), numericLiteralFlags);

export const _litBigInt = (value: string | PseudoBigInt) =>
  ts.factory.createBigIntLiteral(value.toString());

export const _litStr = (text: string, isSingleQuote?: boolean) =>
  ts.factory.createStringLiteral(
    text,
    isSingleQuote ?? _globalConf.isSingleQuote,
  );

export const _litRegExp = (text: string | RegExp) =>
  ts.factory.createRegularExpressionLiteral(text.toString());

export const _if = ({
  condition,
  $then,
  $else,
}: {
  condition: ts.Expression;
  $then: ts.Statement;
  $else?: ts.Statement;
}) =>
  ts.factory.createIfStatement(
    condition,
    ts.factory.createBlock([$then]),
    $else ? ts.factory.createBlock([$else]) : undefined,
  );

export const _true = () => _tkn(ts.SyntaxKind.TrueKeyword);
export const _false = () => _tkn(ts.SyntaxKind.FalseKeyword);
export const _null = () => _tkn(ts.SyntaxKind.NullKeyword);

// =============================================================================
// COMPREHENSIVE FACTORY FUNCTIONS
// =============================================================================

// Literals
export const $ = (text: string) => ts.factory.createIdentifier(text);
export const _tempVar = (
  recordTempVariable?: (node: Identifier) => void,
  reservedInNestedScopes?: boolean,
) => ts.factory.createTempVariable(recordTempVariable, reservedInNestedScopes);
export const _loopVar = (reservedInNestedScopes?: boolean) =>
  ts.factory.createLoopVariable(reservedInNestedScopes);
export const _uniqueName = (
  text: string,
  flags?: ts.GeneratedIdentifierFlags,
) => ts.factory.createUniqueName(text, flags);
export const _privateId = (text: string) =>
  ts.factory.createPrivateIdentifier(text);
export const _uniquePrivateName = (text?: string) =>
  ts.factory.createUniquePrivateName(text);

// Simple tokens and expressions
export const _super = () => ts.factory.createSuper();
export const _this = () => ts.factory.createThis();

// Modifier helpers
export const _modifiersFromFlags = (flags: ts.ModifierFlags) =>
  ts.factory.createModifiersFromModifierFlags(flags);

// Names and property names
export const _qualifiedName = (left: EntityName, right: string | Identifier) =>
  ts.factory.createQualifiedName(left, right);
export const _computedPropName = (expression: Expression) =>
  ts.factory.createComputedPropertyName(expression);

// Type parameters and parameters
export const _typeParam = ({
  modifiers,
  name,
  constraint,
  defaultType,
}: {
  modifiers?: readonly Modifier[];
  name: string | Identifier;
  constraint?: TypeNode;
  defaultType?: TypeNode;
}) =>
  ts.factory.createTypeParameterDeclaration(
    modifiers,
    name,
    constraint,
    defaultType,
  );

export const _param = ({
  modifiers,
  dotDotDotToken,
  name,
  questionToken,
  type,
  initializer,
}: {
  modifiers?: readonly ModifierLike[];
  dotDotDotToken?: DotDotDotToken;
  name: string | BindingName;
  questionToken?: QuestionToken;
  type?: TypeNode;
  initializer?: Expression;
}) =>
  ts.factory.createParameterDeclaration(
    modifiers,
    dotDotDotToken,
    name,
    questionToken,
    type,
    initializer,
  );

export const _decorator = (expression: Expression) =>
  ts.factory.createDecorator(expression);

// Class and interface members
export const _propSig = ({
  modifiers,
  name,
  questionToken,
  type,
}: {
  modifiers?: readonly Modifier[];
  name: PropertyName | string;
  questionToken?: QuestionToken;
  type?: TypeNode;
}) => ts.factory.createPropertySignature(modifiers, name, questionToken, type);

export const _propDecl = ({
  modifiers,
  name,
  questionOrExclamationToken,
  type,
  initializer,
}: {
  modifiers?: readonly ModifierLike[];
  name: string | PropertyName;
  questionOrExclamationToken?: QuestionToken | ExclamationToken;
  type?: TypeNode;
  initializer?: Expression;
}) =>
  ts.factory.createPropertyDeclaration(
    modifiers,
    name,
    questionOrExclamationToken,
    type,
    initializer,
  );

export const _methodSig = ({
  modifiers,
  name,
  questionToken,
  typeParameters,
  parameters,
  type,
}: {
  modifiers?: readonly Modifier[];
  name: string | PropertyName;
  questionToken?: QuestionToken;
  typeParameters?: readonly TypeParameterDeclaration[];
  parameters: readonly ParameterDeclaration[];
  type?: TypeNode;
}) =>
  ts.factory.createMethodSignature(
    modifiers,
    name,
    questionToken,
    typeParameters,
    parameters,
    type,
  );

export const _methodDecl = ({
  modifiers,
  asteriskToken,
  name,
  questionToken,
  typeParameters,
  parameters,
  type,
  body,
}: {
  modifiers?: readonly ModifierLike[];
  asteriskToken?: AsteriskToken;
  name: string | PropertyName;
  questionToken?: QuestionToken;
  typeParameters?: readonly TypeParameterDeclaration[];
  parameters: readonly ParameterDeclaration[];
  type?: TypeNode;
  body?: Block;
}) =>
  ts.factory.createMethodDeclaration(
    modifiers,
    asteriskToken,
    name,
    questionToken,
    typeParameters,
    parameters,
    type,
    body,
  );

export const _ctor = ({
  modifiers,
  parameters,
  body,
}: {
  modifiers?: readonly ModifierLike[];
  parameters: readonly ParameterDeclaration[];
  body?: Block;
}) => ts.factory.createConstructorDeclaration(modifiers, parameters, body);

export const _getter = ({
  modifiers,
  name,
  parameters,
  type,
  body,
}: {
  modifiers?: readonly ModifierLike[];
  name: string | PropertyName;
  parameters: readonly ParameterDeclaration[];
  type?: TypeNode;
  body?: Block;
}) =>
  ts.factory.createGetAccessorDeclaration(
    modifiers,
    name,
    parameters,
    type,
    body,
  );

export const _setter = ({
  modifiers,
  name,
  parameters,
  body,
}: {
  modifiers?: readonly ModifierLike[];
  name: string | PropertyName;
  parameters: readonly ParameterDeclaration[];
  body?: Block;
}) =>
  ts.factory.createSetAccessorDeclaration(modifiers, name, parameters, body);

export const _callSig = (
  typeParameters?: readonly TypeParameterDeclaration[],
  parameters: readonly ParameterDeclaration[] = [],
  type?: TypeNode,
) => ts.factory.createCallSignature(typeParameters, parameters, type);

export const _ctorSig = (
  typeParameters?: readonly TypeParameterDeclaration[],
  parameters: readonly ParameterDeclaration[] = [],
  type?: TypeNode,
) => ts.factory.createConstructSignature(typeParameters, parameters, type);

export const _indexSig = ({
  modifiers,
  parameters,
  type,
}: {
  modifiers?: readonly ModifierLike[];
  parameters: readonly ParameterDeclaration[];
  type: TypeNode;
}) => ts.factory.createIndexSignature(modifiers, parameters, type);

export const _classStaticBlock = (body: Block) =>
  ts.factory.createClassStaticBlockDeclaration(body);

// Type nodes
export const _typePredicate = ({
  assertsModifier,
  parameterName,
  type,
}: {
  assertsModifier?: AssertsKeyword;
  parameterName: Identifier | ThisTypeNode | string;
  type?: TypeNode;
}) => ts.factory.createTypePredicateNode(assertsModifier, parameterName, type);

export const _typeRef = (
  typeName: string | EntityName,
  typeArguments?: readonly TypeNode[],
) => ts.factory.createTypeReferenceNode(typeName, typeArguments);

export const _fnType = (
  parameters: readonly ParameterDeclaration[],
  type: TypeNode,
  typeParameters?: readonly TypeParameterDeclaration[],
) => ts.factory.createFunctionTypeNode(typeParameters, parameters, type);

export const _ctorType = ({
  modifiers,
  typeParameters,
  parameters,
  type,
}: {
  modifiers?: readonly Modifier[];
  typeParameters?: readonly TypeParameterDeclaration[];
  parameters: readonly ParameterDeclaration[];
  type: TypeNode;
}) =>
  ts.factory.createConstructorTypeNode(
    modifiers,
    typeParameters,
    parameters,
    type,
  );

export const _typeQuery = (
  exprName: EntityName,
  typeArguments?: readonly TypeNode[],
) => ts.factory.createTypeQueryNode(exprName, typeArguments);

export const _typeLiteral = (members?: readonly TypeElement[]) =>
  ts.factory.createTypeLiteralNode(members);

export const _arrayType = (elementType: TypeNode) =>
  ts.factory.createArrayTypeNode(elementType);

export const _tupleType = (
  elements: readonly (TypeNode | NamedTupleMember)[],
) => ts.factory.createTupleTypeNode(elements);

export const _namedTupleMember = ({
  dotDotDotToken,
  name,
  questionToken,
  type,
}: {
  dotDotDotToken?: DotDotDotToken;
  name: Identifier;
  questionToken?: QuestionToken;
  type: TypeNode;
}) =>
  ts.factory.createNamedTupleMember(dotDotDotToken, name, questionToken, type);

export const _optionalType = (type: TypeNode) =>
  ts.factory.createOptionalTypeNode(type);
export const _restType = (type: TypeNode) =>
  ts.factory.createRestTypeNode(type);
export const _unionType = (types: readonly TypeNode[]) =>
  ts.factory.createUnionTypeNode(types);
export const _intersectionType = (types: readonly TypeNode[]) =>
  ts.factory.createIntersectionTypeNode(types);

export const _conditionalType = ({
  checkType,
  extendsType,
  trueType,
  falseType,
}: {
  checkType: TypeNode;
  extendsType: TypeNode;
  trueType: TypeNode;
  falseType: TypeNode;
}) =>
  ts.factory.createConditionalTypeNode(
    checkType,
    extendsType,
    trueType,
    falseType,
  );

export const _inferType = (typeParameter: TypeParameterDeclaration) =>
  ts.factory.createInferTypeNode(typeParameter);

export const _importType = ({
  argument,
  attributes,
  qualifier,
  typeArguments,
  isTypeOf,
}: {
  argument: TypeNode;
  attributes?: ImportAttributes;
  qualifier?: EntityName;
  typeArguments?: readonly TypeNode[];
  isTypeOf?: boolean;
}) =>
  ts.factory.createImportTypeNode(
    argument,
    attributes,
    qualifier,
    typeArguments,
    isTypeOf,
  );

export const _parenType = (type: TypeNode) =>
  ts.factory.createParenthesizedType(type);
export const _thisType = () => ts.factory.createThisTypeNode();

export const _typeOperator = (
  operator:
    | SyntaxKind.KeyOfKeyword
    | SyntaxKind.UniqueKeyword
    | SyntaxKind.ReadonlyKeyword,
  type: TypeNode,
) => ts.factory.createTypeOperatorNode(operator, type);

export const _indexedAccessType = (objectType: TypeNode, indexType: TypeNode) =>
  ts.factory.createIndexedAccessTypeNode(objectType, indexType);

export const _mappedType = ({
  readonlyToken,
  typeParameter,
  nameType,
  questionToken,
  type,
  members,
}: {
  readonlyToken?: ReadonlyKeyword | PlusToken | MinusToken;
  typeParameter: TypeParameterDeclaration;
  nameType?: TypeNode;
  questionToken?: QuestionToken | PlusToken | MinusToken;
  type?: TypeNode;
  members?: ts.NodeArray<TypeElement>;
}) =>
  ts.factory.createMappedTypeNode(
    readonlyToken,
    typeParameter,
    nameType,
    questionToken,
    type,
    members,
  );

export const _literalType = (literal: LiteralTypeNode["literal"]) =>
  ts.factory.createLiteralTypeNode(literal);

export const _templateLiteralType = (
  head: TemplateHead,
  templateSpans: readonly TemplateLiteralTypeSpan[],
) => ts.factory.createTemplateLiteralType(head, templateSpans);

export const _templateLiteralTypeSpan = (
  type: TypeNode,
  literal: TemplateMiddle | TemplateTail,
) => ts.factory.createTemplateLiteralTypeSpan(type, literal);

// Binding patterns
export const _objBindingPattern = (elements: readonly BindingElement[]) =>
  ts.factory.createObjectBindingPattern(elements);

export const _arrayBindingPattern = (
  elements: readonly ArrayBindingElement[],
) => ts.factory.createArrayBindingPattern(elements);

export const _bindingElement = ({
  dotDotDotToken,
  propertyName,
  name,
  initializer,
}: {
  dotDotDotToken?: DotDotDotToken;
  propertyName?: string | PropertyName;
  name: string | BindingName;
  initializer?: Expression;
}) =>
  ts.factory.createBindingElement(
    dotDotDotToken,
    propertyName,
    name,
    initializer,
  );

// Expressions
export const _arrayLit = ({
  elements = [],
  multiLine = _globalConf.arrayMultiLine,
}: {
  elements?: readonly Expression[];
  multiLine?: boolean;
} = {}) => ts.factory.createArrayLiteralExpression(elements, multiLine);

export const _objLit = ({
  properties = [],
  multiLine = _globalConf.objectMultiLine,
}: {
  properties?: ObjectLiteralElementLike[];
  multiLine?: boolean;
} = {}) => ts.factory.createObjectLiteralExpression(properties, multiLine);

export const _propAssignment = (
  key: string | PropertyName,
  value: Expression,
) => ts.factory.createPropertyAssignment(key, value);

export const _propAccess = ({
  expression,
  property,
  optional = false,
}: {
  expression: string | Expression;
  property: string | MemberName;
  optional?: boolean;
}) =>
  optional
    ? ts.factory.createPropertyAccessChain(
        typeof expression === "string" ? $(expression) : expression,
        _tkn(ts.SyntaxKind.QuestionDotToken),
        property,
      )
    : ts.factory.createPropertyAccessExpression(
        typeof expression === "string" ? $(expression) : expression,
        property,
      );

export const _elemAccess = ({
  expression,
  index,
  optional = false,
}: {
  expression: string | Expression;
  index: number | string | Expression;
  optional?: boolean;
}) => {
  const indexExpr =
    typeof index === "number"
      ? _litNum(index)
      : typeof index === "string"
        ? _litStr(index)
        : index;

  return optional
    ? ts.factory.createElementAccessChain(
        typeof expression === "string" ? $(expression) : expression,
        _tkn(ts.SyntaxKind.QuestionDotToken),
        indexExpr,
      )
    : ts.factory.createElementAccessExpression(
        typeof expression === "string" ? $(expression) : expression,
        indexExpr,
      );
};

export const _call = ({
  expression,
  typeArguments,
  args,
}: {
  expression: string | Expression;
  typeArguments?: readonly TypeNode[];
  args?: readonly Expression[];
}) =>
  ts.factory.createCallExpression(
    typeof expression === "string" ? $(expression) : expression,
    typeArguments,
    args,
  );

export const _callChain = ({
  expression,
  optional = false,
  typeArguments,
  args,
}: {
  expression: string | Expression;
  optional?: boolean;
  typeArguments?: readonly TypeNode[];
  args?: readonly Expression[];
}) =>
  ts.factory.createCallChain(
    typeof expression === "string" ? $(expression) : expression,
    optional ? _tkn(ts.SyntaxKind.QuestionDotToken) : undefined,
    typeArguments,
    args,
  );

export const _new = ({
  expression,
  typeArguments,
  args,
}: {
  expression: string | Expression;
  typeArguments?: readonly TypeNode[];
  args?: readonly Expression[];
}) =>
  ts.factory.createNewExpression(
    typeof expression === "string" ? $(expression) : expression,
    typeArguments,
    args,
  );

export const _taggedTemplate = (
  tag: Expression,
  typeArguments: readonly TypeNode[] | undefined,
  template: TemplateLiteral,
) => ts.factory.createTaggedTemplateExpression(tag, typeArguments, template);

export const _typeAssertion = (type: TypeNode, expression: Expression) =>
  ts.factory.createTypeAssertion(type, expression);

export const _paren = (expression: Expression) =>
  ts.factory.createParenthesizedExpression(expression);

export const _fnExpr = ({
  modifiers,
  asteriskToken,
  name,
  typeParameters,
  parameters,
  type,
  body,
}: {
  modifiers?: readonly Modifier[];
  asteriskToken?: AsteriskToken;
  name?: string | Identifier;
  typeParameters?: readonly TypeParameterDeclaration[];
  parameters?: readonly ParameterDeclaration[];
  type?: TypeNode;
  body: Block;
}) =>
  ts.factory.createFunctionExpression(
    modifiers,
    asteriskToken,
    name,
    typeParameters,
    parameters,
    type,
    body,
  );

export const _arrow = ({
  modifiers,
  typeParameters,
  parameters,
  type,
  equalsGreaterThanToken,
  body,
}: {
  modifiers?: readonly Modifier[];
  typeParameters?: readonly TypeParameterDeclaration[];
  parameters?: readonly ParameterDeclaration[];
  type?: TypeNode;
  equalsGreaterThanToken?: EqualsGreaterThanToken;
  body: ConciseBody;
}) =>
  ts.factory.createArrowFunction(
    modifiers,
    typeParameters,
    parameters ?? [],
    type,
    equalsGreaterThanToken,
    body,
  );

export const _delete = (expression: Expression) =>
  ts.factory.createDeleteExpression(expression);
export const _typeof = (expression: Expression) =>
  ts.factory.createTypeOfExpression(expression);
export const _void = (expression: Expression) =>
  ts.factory.createVoidExpression(expression);
export const _await = (expression: string | Expression) =>
  ts.factory.createAwaitExpression(
    typeof expression === "string" ? $(expression) : expression,
  );

export const _prefixUnary = (
  operator: PrefixUnaryOperator,
  operand: Expression,
) => ts.factory.createPrefixUnaryExpression(operator, operand);

export const _postfixUnary = (
  operand: Expression,
  operator: PostfixUnaryOperator,
) => ts.factory.createPostfixUnaryExpression(operand, operator);

export const _binary = (
  left: Expression,
  operator: BinaryOperator | BinaryOperatorToken,
  right: Expression,
) => ts.factory.createBinaryExpression(left, operator, right);

export const _conditional = ({
  condition,
  questionToken,
  whenTrue,
  colonToken,
  whenFalse,
}: {
  condition: string | Expression;
  questionToken?: QuestionToken;
  whenTrue: Expression;
  colonToken?: ColonToken;
  whenFalse: Expression;
}) =>
  ts.factory.createConditionalExpression(
    typeof condition === "string" ? $(condition) : condition,
    questionToken,
    whenTrue,
    colonToken,
    whenFalse,
  );

export const _templateExpr = (
  head: TemplateHead,
  templateSpans: readonly TemplateSpan[],
) => ts.factory.createTemplateExpression(head, templateSpans);

export const _templateHead = (
  text: string,
  rawText?: string,
  templateFlags?: TokenFlags,
) => ts.factory.createTemplateHead(text, rawText, templateFlags);

export const _templateMiddle = (
  text: string,
  rawText?: string,
  templateFlags?: TokenFlags,
) => ts.factory.createTemplateMiddle(text, rawText, templateFlags);

export const _templateTail = (
  text: string,
  rawText?: string,
  templateFlags?: TokenFlags,
) => ts.factory.createTemplateTail(text, rawText, templateFlags);

export const _noSubstitutionTemplateLit = (text: string, rawText?: string) =>
  ts.factory.createNoSubstitutionTemplateLiteral(text, rawText);

export const _yield = (
  asteriskToken: AsteriskToken | undefined,
  expression: Expression | undefined,
) => {
  if (asteriskToken && expression) {
    return ts.factory.createYieldExpression(asteriskToken, expression);
  } else {
    return ts.factory.createYieldExpression(undefined, expression);
  }
};

export const _spread = (expression: Expression) =>
  ts.factory.createSpreadElement(expression);

export const _classExpr = ({
  modifiers,
  name,
  typeParameters,
  heritageClauses,
  members,
}: {
  modifiers?: readonly ModifierLike[];
  name?: string | Identifier;
  typeParameters?: readonly TypeParameterDeclaration[];
  heritageClauses?: readonly HeritageClause[];
  members: readonly ClassElement[];
}) =>
  ts.factory.createClassExpression(
    modifiers,
    name,
    typeParameters,
    heritageClauses,
    members,
  );

export const _omitted = () => ts.factory.createOmittedExpression();

export const _exprWithTypeArgs = (
  expression: Expression,
  typeArguments?: readonly TypeNode[],
) => ts.factory.createExpressionWithTypeArguments(expression, typeArguments);

export const _as = (expression: Expression, type: TypeNode) =>
  ts.factory.createAsExpression(expression, type);
export const _nonNull = (expression: Expression) =>
  ts.factory.createNonNullExpression(expression);
export const _nonNullChain = (expression: Expression) =>
  ts.factory.createNonNullChain(expression);

export const _metaProp = (
  keywordToken: MetaProperty["keywordToken"],
  name: Identifier,
) => ts.factory.createMetaProperty(keywordToken, name);

export const _satisfies = (expression: Expression, type: TypeNode) =>
  ts.factory.createSatisfiesExpression(expression, type);

export const _templateSpan = (
  expression: Expression,
  literal: TemplateMiddle | TemplateTail,
) => ts.factory.createTemplateSpan(expression, literal);

// Statements
export const _semicolonClassElement = () =>
  ts.factory.createSemicolonClassElement();
export const _emptyStmt = () => ts.factory.createEmptyStatement();
export const _exprStmt = (expression: Expression) =>
  ts.factory.createExpressionStatement(expression);

export const _ifStmt = (
  expression: string | Expression,
  thenStatement: Statement,
  elseStatement?: Statement,
) =>
  ts.factory.createIfStatement(
    typeof expression === "string" ? $(expression) : expression,
    thenStatement,
    elseStatement,
  );

export const _doStmt = (statement: Statement, expression: Expression) =>
  ts.factory.createDoStatement(statement, expression);

export const _whileStmt = (expression: Expression, statement: Statement) =>
  ts.factory.createWhileStatement(expression, statement);

export const _forStmt = (
  initializer: ForInitializer | undefined,
  condition: Expression | undefined,
  incrementor: Expression | undefined,
  statement: Statement,
) =>
  ts.factory.createForStatement(initializer, condition, incrementor, statement);

export const _forInStmt = (
  initializer: ForInitializer,
  expression: Expression,
  statement: Statement,
) => ts.factory.createForInStatement(initializer, expression, statement);

export const _forOfStmt = (
  awaitModifier: AwaitKeyword | undefined,
  initializer: ForInitializer,
  expression: Expression,
  statement: Statement,
) =>
  ts.factory.createForOfStatement(
    awaitModifier,
    initializer,
    expression,
    statement,
  );

export const _continue = (label?: string | Identifier) =>
  ts.factory.createContinueStatement(label);
export const _break = (label?: string | Identifier) =>
  ts.factory.createBreakStatement(label);
export const _with = (expression: Expression, statement: Statement) =>
  ts.factory.createWithStatement(expression, statement);

export const _switch = (expression: Expression, caseBlock: CaseBlock) =>
  ts.factory.createSwitchStatement(expression, caseBlock);

export const _labeled = (label: string | Identifier, statement: Statement) =>
  ts.factory.createLabeledStatement(label, statement);

export const _throw = (expression: Expression) =>
  ts.factory.createThrowStatement(expression);

export const _try = (
  tryBlock: Block,
  catchClause?: CatchClause,
  finallyBlock?: Block,
) => ts.factory.createTryStatement(tryBlock, catchClause, finallyBlock);

export const _debugger = () => ts.factory.createDebuggerStatement();

export const _varDecl = (
  name: string | BindingName,
  exclamationToken?: ExclamationToken,
  type?: TypeNode,
  initializer?: Expression,
) =>
  ts.factory.createVariableDeclaration(
    name,
    exclamationToken,
    type,
    initializer,
  );

export const _varDeclList = (
  declarations: readonly VariableDeclaration[],
  flags?: NodeFlags,
) => ts.factory.createVariableDeclarationList(declarations, flags);

// Declarations
export const _fnDecl = ({
  modifiers,
  asteriskToken,
  name,
  typeParameters,
  parameters,
  type,
  body,
}: {
  modifiers?: readonly ModifierLike[];
  asteriskToken?: AsteriskToken;
  name?: string | Identifier;
  typeParameters?: readonly TypeParameterDeclaration[];
  parameters: readonly ParameterDeclaration[];
  type?: TypeNode;
  body?: Block;
}) =>
  ts.factory.createFunctionDeclaration(
    modifiers,
    asteriskToken,
    name,
    typeParameters,
    parameters,
    type,
    body,
  );

export const _classDecl = ({
  modifiers,
  name,
  typeParameters,
  heritageClauses,
  members,
}: {
  modifiers?: readonly ModifierLike[];
  name?: string | Identifier;
  typeParameters?: readonly TypeParameterDeclaration[];
  heritageClauses?: readonly HeritageClause[];
  members: readonly ClassElement[];
}) =>
  ts.factory.createClassDeclaration(
    modifiers,
    name,
    typeParameters,
    heritageClauses,
    members,
  );

export const _interfaceDecl = ({
  modifiers,
  name,
  typeParameters,
  heritageClauses,
  members,
}: {
  modifiers?: readonly ModifierLike[];
  name: string | Identifier;
  typeParameters?: readonly TypeParameterDeclaration[];
  heritageClauses?: readonly HeritageClause[];
  members: readonly TypeElement[];
}) =>
  ts.factory.createInterfaceDeclaration(
    modifiers,
    name,
    typeParameters,
    heritageClauses,
    members,
  );

export const _typeAliasDecl = ({
  modifiers,
  name,
  typeParameters,
  type,
}: {
  modifiers?: readonly ModifierLike[];
  name: string | Identifier;
  typeParameters?: readonly TypeParameterDeclaration[];
  type: TypeNode;
}) =>
  ts.factory.createTypeAliasDeclaration(modifiers, name, typeParameters, type);

export const _enumDecl = ({
  modifiers,
  name,
  members,
}: {
  modifiers?: readonly ModifierLike[];
  name: string | Identifier;
  members: readonly EnumMember[];
}) => ts.factory.createEnumDeclaration(modifiers, name, members);

export const _moduleDecl = ({
  modifiers,
  name,
  body,
  flags,
}: {
  modifiers?: readonly ModifierLike[];
  name: ModuleName;
  body?: ModuleBody;
  flags?: NodeFlags;
}) => ts.factory.createModuleDeclaration(modifiers, name, body, flags);

export const _moduleBlock = (statements: readonly Statement[]) =>
  ts.factory.createModuleBlock(statements);

export const _caseBlock = (clauses: readonly CaseOrDefaultClause[]) =>
  ts.factory.createCaseBlock(clauses);

export const _namespaceExportDecl = (name: string | Identifier) =>
  ts.factory.createNamespaceExportDeclaration(name);

// Import/Export declarations
export const _importEqualsDecl = ({
  modifiers,
  isTypeOnly,
  name,
  moduleReference,
}: {
  modifiers?: readonly ModifierLike[];
  isTypeOnly: boolean;
  name: string | Identifier;
  moduleReference: ModuleReference;
}) =>
  ts.factory.createImportEqualsDeclaration(
    modifiers,
    isTypeOnly,
    name,
    moduleReference,
  );

export const _importDecl = ({
  modifiers,
  importClause,
  moduleSpecifier,
  attributes,
}: {
  modifiers?: readonly ModifierLike[];
  importClause?: ImportClause;
  moduleSpecifier: Expression;
  attributes?: ImportAttributes;
}) =>
  ts.factory.createImportDeclaration(
    modifiers,
    importClause,
    moduleSpecifier,
    attributes,
  );

export const _importClause = ({
  phaseModifier,
  name,
  namedBindings,
}: {
  phaseModifier?: ImportPhaseModifierSyntaxKind;
  name?: Identifier;
  namedBindings?: NamedImportBindings;
}) => ts.factory.createImportClause(phaseModifier, name, namedBindings);

export const _importAttribs = (
  elements: ts.NodeArray<ImportAttribute>,
  multiLine?: boolean,
) => ts.factory.createImportAttributes(elements, multiLine);

export const _importAttrib = (name: ImportAttributeName, value: Expression) =>
  ts.factory.createImportAttribute(name, value);

export const _namespaceImport = (name: Identifier) =>
  ts.factory.createNamespaceImport(name);
export const _namespaceExport = (name: ModuleExportName) =>
  ts.factory.createNamespaceExport(name);

export const _namedImports = (elements: readonly ImportSpecifier[]) =>
  ts.factory.createNamedImports(elements);

export const _importSpec = (
  isTypeOnly: boolean,
  propertyName: ModuleExportName | undefined,
  name: Identifier,
) => ts.factory.createImportSpecifier(isTypeOnly, propertyName, name);

export const _exportAssignment = ({
  modifiers,
  isExportEquals,
  expression,
}: {
  modifiers?: readonly ModifierLike[];
  isExportEquals?: boolean;
  expression: Expression;
}) => ts.factory.createExportAssignment(modifiers, isExportEquals, expression);

export const _exportDecl = ({
  modifiers,
  isTypeOnly,
  exportClause,
  moduleSpecifier,
  attributes,
}: {
  modifiers?: readonly ModifierLike[];
  isTypeOnly: boolean;
  exportClause?: NamedExportBindings;
  moduleSpecifier?: Expression;
  attributes?: ImportAttributes;
}) =>
  ts.factory.createExportDeclaration(
    modifiers,
    isTypeOnly,
    exportClause,
    moduleSpecifier,
    attributes,
  );

export const _namedExports = (elements: readonly ExportSpecifier[]) =>
  ts.factory.createNamedExports(elements);

export const _exportSpec = (
  isTypeOnly: boolean,
  propertyName: string | ModuleExportName | undefined,
  name: string | ModuleExportName,
) => ts.factory.createExportSpecifier(isTypeOnly, propertyName, name);

export const _externalModuleRef = (expression: Expression) =>
  ts.factory.createExternalModuleReference(expression);

export const _constVar = (
  name: string | BindingName,
  initializer: Expression,
  modifiers?: readonly ModifierLike[],
) =>
  _var({
    modifiers,
    declarationList: ts.factory.createVariableDeclarationList(
      [
        ts.factory.createVariableDeclaration(
          name,
          undefined,
          undefined,
          initializer,
        ),
      ],
      ts.NodeFlags.Const,
    ),
  });

export const _exportConstVar = (
  name: string | BindingName,
  initializer: Expression,
) => _constVar(name, initializer, [_tkn(ts.SyntaxKind.ExportKeyword)]);

/**
 * Create an object literal with key-value pairs
 * @param properties - object with string keys and expression values
 * @param multiLine - whether to format multiline
 */
export const _objLiteral = (
  properties: Record<string, Expression> = {},
  multiLine?: boolean,
) =>
  _objLit({
    properties: Object.entries(properties).map(([key, value]) =>
      ts.factory.createPropertyAssignment(key, value),
    ),
    multiLine,
  });

/**
 * Create an array literal from expressions
 * @param elements - array of expressions
 * @param multiLine - whether to format multiline
 */
export const _arrayLiteral = (
  elements: readonly Expression[] = [],
  multiLine?: boolean,
) => _arrayLit({ elements, multiLine });

/**
 * Create a property access chain (obj.prop1.prop2)
 * @param object - base object expression or string
 * @param properties - array of property names to chain
 */
export const _propChain = (
  object: string | Expression,
  ...properties: string[]
) =>
  properties.reduce<Expression>(
    (expr, prop) => _propAccess({ expression: expr, property: prop }),
    typeof object === "string" ? $(object) : object,
  );

/**
 * Create a type reference with optional type arguments
 * @param typeName - type name
 * @param typeArgs - optional type arguments
 */
export const _type = (
  typeName: string | EntityName,
  typeArgs?: readonly TypeNode[],
) => _typeRef(typeName, typeArgs);

/**
 * Create a template literal expression
 * @param parts - alternating strings and expressions
 */
export const _template = (...parts: (string | Expression)[]) => {
  if (parts.length === 1 && typeof parts[0] === "string") {
    return _noSubstitutionTemplateLit(parts[0]);
  }

  const head = typeof parts[0] === "string" ? parts[0] : "";
  const spans: TemplateSpan[] = [];

  for (let i = 1; i < parts.length; i += 2) {
    const expr = parts[i] as Expression;
    const text = (parts[i + 1] as string) || "";
    spans.push(
      ts.factory.createTemplateSpan(
        expr,
        i === parts.length - 2 ? _templateTail(text) : _templateMiddle(text),
      ),
    );
  }

  return _templateExpr(_templateHead(head), spans);
};
