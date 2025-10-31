import type * as Blockly from 'blockly';

/**
 * JSON Schema types (Draft 7)
 */
export interface JSONSchema {
  $schema?: string;
  $id?: string;
  title?: string;
  description?: string;
  type?: JSONSchemaType | JSONSchemaType[];
  properties?: Record<string, JSONSchema>;
  items?: JSONSchema | JSONSchema[];
  required?: string[];
  enum?: (string | number | boolean)[];
  const?: any;
  default?: any;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  format?: string;
  additionalProperties?: boolean | JSONSchema;
  definitions?: Record<string, JSONSchema>;
  $ref?: string;
  oneOf?: JSONSchema[];
  anyOf?: JSONSchema[];
  allOf?: JSONSchema[];
}

export type JSONSchemaType = 
  | 'string' 
  | 'number' 
  | 'integer' 
  | 'boolean' 
  | 'object' 
  | 'array' 
  | 'null';

/**
 * Block definition for Blockly
 */
export interface BlockDefinition {
  type: string;
  message0: string;
  args0?: BlockArgument[];
  previousStatement?: string | boolean;
  nextStatement?: string | boolean;
  inputsInline?: boolean;
  output?: string | null;
  colour?: number;
  tooltip?: string;
  helpUrl?: string;
}

export interface BlockArgument {
  type: 
    | 'input_value'
    | 'input_statement'
    | 'input_dummy'
    | 'field_input'
    | 'field_number'
    | 'field_checkbox'
    | 'field_dropdown'
    | 'field_colour'
    | 'field_date'
    | 'field_variable'
    | 'field_label';
  name?: string;
  text?: string;
  value?: number | string | boolean;
  check?: string | string[];
  align?: 'LEFT' | 'RIGHT' | 'CENTRE';
  options?: [string, string][]; // For dropdowns: [display, value]
  min?: number;
  max?: number;
  precision?: number;
  checked?: boolean;
}

/**
 * Toolbox configuration for Blockly
 */
export interface ToolboxConfig {
  kind: 'categoryToolbox' | 'flyoutToolbox';
  contents: ToolboxCategory[];
}

export interface ToolboxCategory {
  kind: 'category' | 'block' | 'sep' | 'label';
  name?: string;
  colour?: string | number;
  contents?: ToolboxItem[];
  custom?: string;
}

export interface ToolboxItem {
  kind: 'block' | 'label' | 'button' | 'sep';
  type?: string;
  fields?: Record<string, any>;
  inputs?: Record<string, any>;
}

/**
 * Configuration for the schema-to-blocks generator
 */
export interface GeneratorConfig {
  /**
   * Name for the root block
   */
  rootBlockName?: string;

  /**
   * Color scheme for different block types
   */
  colorScheme?: ColorScheme;

  /**
   * Maximum depth for nested structures
   */
  maxDepth?: number;

  /**
   * Prefix for generated block types
   */
  blockPrefix?: string;

  /**
   * Whether to generate array wrapper blocks
   */
  generateArrayBlocks?: boolean;

  /**
   * Whether to inline simple inputs
   */
  inlineInputs?: boolean;

  /**
   * Custom block generator functions
   */
  customGenerators?: Record<string, BlockGenerator>;
}

export interface ColorScheme {
  object?: number;
  string?: number;
  number?: number;
  integer?: number;
  boolean?: number;
  array?: number;
  enum?: number;
  root?: number;
  [key: string]: number | undefined;
}

export type BlockGenerator = (
  schema: JSONSchema,
  blockName: string,
  config: GeneratorConfig
) => BlockDefinition;

/**
 * Result of block generation
 */
export interface GenerationResult {
  /**
   * All generated block definitions
   */
  blocks: BlockDefinition[];

  /**
   * Toolbox configuration
   */
  toolbox: ToolboxConfig;

  /**
   * Root block type name
   */
  rootBlockType: string;

  /**
   * Map of schema paths to block types
   */
  blockTypeMap: Map<string, string>;
}

/**
 * Configuration object generated from blocks
 */
export type ConfigObject = Record<string, any>;

/**
 * Options for config generation from workspace
 */
export interface ConfigGenerationOptions {
  /**
   * Output format
   */
  format?: 'json' | 'yaml';

  /**
   * Whether to include default values
   */
  includeDefaults?: boolean;

  /**
   * Whether to include null values
   */
  includeNulls?: boolean;

  /**
   * Custom value extractors
   */
  customExtractors?: Record<string, ValueExtractor>;
}

export type ValueExtractor = (
  block: Blockly.Block,
  schema: JSONSchema
) => any;

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors?: ValidationError[];
}

export interface ValidationError {
  path: string;
  message: string;
  keyword?: string;
  params?: Record<string, any>;
}

/**
 * Schema upload result
 */
export interface SchemaUploadResult {
  schema: JSONSchema;
  valid: boolean;
  errors?: string[];
}
