import type * as Blockly from 'blockly';
import { BlockGenerator } from './generators/BlockGenerator';
import { ConfigGenerator } from './generators/ConfigGenerator';
import { SchemaValidator } from './validators/SchemaValidator';
import { ConfigLoader } from './utils/ConfigLoader';
import type {
  JSONSchema,
  GeneratorConfig,
  GenerationResult,
  ConfigObject,
  ConfigGenerationOptions,
  ValidationResult,
  SchemaUploadResult,
} from './types';

/**
 * Main class that orchestrates schema-to-blocks conversion and config generation
 * 
 * @example
 * ```typescript
 * const builder = new SchemaConfigBuilder(schema, workspace);
 * 
 * // Generate blocks
 * builder.generateBlocks();
 * 
 * // Later, generate config
 * const config = builder.generateConfig();
 * 
 * // Load existing config
 * builder.loadConfig(existingConfig);
 * ```
 */
export class SchemaConfigBuilder {
  private schema: JSONSchema;
  private workspace: Blockly.Workspace | null;
  private validator: SchemaValidator;
  private blockGenerator: BlockGenerator | null = null;
  private configGenerator: ConfigGenerator | null = null;
  private configLoader: ConfigLoader | null = null;
  private generationResult: GenerationResult | null = null;

  constructor(
    schema: JSONSchema,
    workspace: Blockly.Workspace | null = null,
    config?: Partial<GeneratorConfig>
  ) {
    this.schema = schema;
    this.workspace = workspace;
    this.validator = new SchemaValidator();

    // Validate schema on construction
    const validationResult = this.validator.validateSchema(schema);
    if (!validationResult.valid) {
      throw new Error(
        `Invalid schema: ${validationResult.errors?.join(', ')}`
      );
    }

    // Initialize generators
    this.blockGenerator = new BlockGenerator(schema, config);
  }

  /**
   * Generate Blockly blocks from the schema
   */
  generateBlocks(): GenerationResult {
    if (!this.blockGenerator) {
      throw new Error('BlockGenerator not initialized');
    }

    this.generationResult = this.blockGenerator.generate();

    // Initialize config generator with the block metadata
    this.configGenerator = new ConfigGenerator(
      this.schema,
      this.generationResult.blockTypeMap,
      this.generationResult.blockSchemaMap,
      this.generationResult.variants
    );

    // Initialize config loader if workspace is available
    if (this.workspace) {
      this.configLoader = new ConfigLoader(
        this.schema,
        this.workspace,
        this.generationResult.rootBlockType,
        this.generationResult.blockSchemaMap,
        this.generationResult.variants
      );
    }

    return this.generationResult;
  }

  /**
   * Register generated blocks with Blockly
   * Must be called after generateBlocks() and before using the blocks
   */
  registerBlocks(Blockly: any): void {
    if (!this.generationResult) {
      throw new Error('Must call generateBlocks() first');
    }

    Blockly.defineBlocksWithJsonArray(this.generationResult.blocks);
  }

  /**
   * Update the workspace toolbox with generated categories
   */
  updateToolbox(): void {
    if (!this.workspace) {
      throw new Error('Workspace not provided');
    }

    if (!this.generationResult) {
      throw new Error('Must call generateBlocks() first');
    }

    // TypeScript doesn't know about updateToolbox, but it exists at runtime
    (this.workspace as any).updateToolbox(this.generationResult.toolbox);
  }

  /**
   * Generate configuration from current workspace
   */
  generateConfig(options?: Partial<ConfigGenerationOptions>): ConfigObject {
    if (!this.workspace) {
      throw new Error('Workspace not provided');
    }

    if (!this.configGenerator || !this.generationResult) {
      throw new Error('Must call generateBlocks() first');
    }

    // Create a new config generator with options if provided
    const generator = options
      ? new ConfigGenerator(
          this.schema,
          this.generationResult.blockTypeMap,
          this.generationResult.blockSchemaMap,
          this.generationResult.variants,
          options
        )
      : this.configGenerator;

    return generator.generate(this.workspace, this.generationResult.rootBlockType);
  }

  /**
   * Format configuration as JSON or YAML string
   */
  formatConfig(
    config: ConfigObject,
    format: 'json' | 'yaml' = 'json'
  ): string {
    if (!this.configGenerator) {
      throw new Error('Must call generateBlocks() first');
    }

    if (format === 'yaml') {
      // Use the YAML formatter from ConfigGenerator
      const generator = new ConfigGenerator(
        this.schema,
        this.generationResult!.blockTypeMap,
        this.generationResult!.blockSchemaMap,
        this.generationResult!.variants,
        { format: 'yaml' }
      );
      return generator.format(config);
    }

    return JSON.stringify(config, null, 2);
  }

  /**
   * Load an existing configuration into the workspace
   */
  loadConfig(config: ConfigObject): void {
    if (!this.workspace) {
      throw new Error('Workspace not provided');
    }

    if (!this.configLoader) {
      throw new Error('Must call generateBlocks() first');
    }

    // Validate config before loading
    const validation = this.validator.validateConfig(config);
    if (!validation.valid) {
      throw new Error(
        `Invalid configuration: ${validation.errors?.map((e) => e.message).join(', ')}`
      );
    }

    this.configLoader.load(config);
  }

  /**
   * Validate a configuration object against the schema
   */
  validateConfig(config: ConfigObject): ValidationResult {
    return this.validator.validateConfig(config);
  }

  /**
   * Parse and validate a schema file
   */
  static async parseSchemaFile(file: File): Promise<SchemaUploadResult> {
    const validator = new SchemaValidator();
    return validator.parseSchemaFile(file);
  }

  /**
   * Parse a configuration file (JSON or YAML)
   */
  static async parseConfigFile(file: File): Promise<ConfigObject> {
    const text = await file.text();
    
    // Try to parse as JSON first
    try {
      return JSON.parse(text);
    } catch {
      // If JSON parsing fails, try YAML
      // Note: In production, you'd want to use a proper YAML parser like js-yaml
      throw new Error('YAML parsing not implemented. Please use JSON files.');
    }
  }

  /**
   * Get the generation result (blocks and toolbox)
   */
  getGenerationResult(): GenerationResult | null {
    return this.generationResult;
  }

  /**
   * Get the schema
   */
  getSchema(): JSONSchema {
    return this.schema;
  }

  /**
   * Update the workspace reference
   */
  setWorkspace(workspace: Blockly.Workspace): void {
    this.workspace = workspace;

    // Re-initialize config loader if we have generation results
    if (this.generationResult) {
      this.configLoader = new ConfigLoader(
        this.schema,
        workspace,
        this.generationResult.rootBlockType,
        this.generationResult.blockSchemaMap,
        this.generationResult.variants
      );
    }
  }

  /**
   * Clear the workspace
   */
  clearWorkspace(): void {
    if (!this.workspace) {
      throw new Error('Workspace not provided');
    }
    this.workspace.clear();
  }
}
