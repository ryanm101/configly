import type * as Blockly from 'blockly';
import type {
  JSONSchema,
  ConfigObject,
  ConfigGenerationOptions,
} from '../types';

/**
 * Generates configuration objects from Blockly workspace
 */
export class ConfigGenerator {
  private schema: JSONSchema;
  private options: Required<ConfigGenerationOptions>;

  constructor(
    schema: JSONSchema,
    _blockTypeMap: Map<string, string>, // Prefix with underscore to indicate intentionally unused
    options: Partial<ConfigGenerationOptions> = {}
  ) {
    this.schema = schema;
    this.options = {
      format: options.format ?? 'json',
      includeDefaults: options.includeDefaults ?? false,
      includeNulls: options.includeNulls ?? false,
      customExtractors: options.customExtractors ?? {},
    };
  }

  /**
   * Generate configuration from workspace
   */
  generate(workspace: Blockly.Workspace, rootBlockType: string): ConfigObject {
    const rootBlocks = workspace.getBlocksByType(rootBlockType, false);

    if (rootBlocks.length === 0) {
      throw new Error('No root configuration block found in workspace');
    }

    if (rootBlocks.length > 1) {
      console.warn('Multiple root blocks found, using first one');
    }

    return this.blockToConfig(rootBlocks[0], this.schema);
  }

  /**
   * Convert a block and its children to a configuration object
   */
  private blockToConfig(block: Blockly.Block, schema: JSONSchema): ConfigObject {
    const config: ConfigObject = {};
    const properties = schema.properties ?? {};

    for (const [propName, propSchema] of Object.entries(properties)) {
      const upperName = propName.toUpperCase();
      const value = this.extractValue(block, upperName, propSchema);

      if (value !== null && value !== undefined) {
        config[propName] = value;
      } else if (this.options.includeDefaults && propSchema.default !== undefined) {
        config[propName] = propSchema.default;
      } else if (this.options.includeNulls) {
        config[propName] = null;
      }
    }

    return config;
  }

  /**
   * Extract value from a block based on schema
   */
  private extractValue(
    block: Blockly.Block,
    fieldName: string,
    schema: JSONSchema
  ): any {
    // Check for custom extractor
    if (this.options.customExtractors[fieldName]) {
      return this.options.customExtractors[fieldName](block, schema);
    }

    const propType = schema.type;

    // Handle different types
    if (schema.enum || propType === 'string') {
      const value = block.getFieldValue(fieldName);
      if (value === null || value === undefined || value === '') {
        return undefined;
      }
      return value;
    }

    if (propType === 'number' || propType === 'integer') {
      const value = block.getFieldValue(fieldName);
      if (value === null || value === undefined || value === '') {
        return undefined;
      }
      return Number(value);
    }

    if (propType === 'boolean') {
      const value = block.getFieldValue(fieldName);
      return value === 'TRUE' || value === true;
    }

    if (propType === 'array') {
      return this.extractArrayValue(block, fieldName, schema);
    }

    if (propType === 'object') {
      return this.extractObjectValue(block, fieldName, schema);
    }

    return undefined;
  }

  /**
   * Extract array value from statement input
   */
  private extractArrayValue(
    block: Blockly.Block,
    fieldName: string,
    schema: JSONSchema
  ): any[] {
    const items: any[] = [];
    let itemBlock = block.getInputTargetBlock(fieldName);

    const itemSchema = Array.isArray(schema.items)
      ? schema.items[0]
      : schema.items ?? { type: 'string' };

    while (itemBlock) {
      if (itemSchema.type === 'object') {
        items.push(this.blockToConfig(itemBlock, itemSchema));
      } else {
        const value = this.extractPrimitiveValue(itemBlock, 'VALUE', itemSchema);
        if (value !== undefined) {
          items.push(value);
        }
      }
      itemBlock = itemBlock.getNextBlock();
    }

    return items;
  }

  /**
   * Extract object value from statement input
   */
  private extractObjectValue(
    block: Blockly.Block,
    fieldName: string,
    schema: JSONSchema
  ): ConfigObject | undefined {
    const nestedBlock = block.getInputTargetBlock(fieldName);
    if (!nestedBlock) {
      return undefined;
    }
    return this.blockToConfig(nestedBlock, schema);
  }

  /**
   * Extract primitive value from a field
   */
  private extractPrimitiveValue(
    block: Blockly.Block,
    fieldName: string,
    schema: JSONSchema
  ): any {
    const value = block.getFieldValue(fieldName);

    if (value === null || value === undefined || value === '') {
      return undefined;
    }

    const type = schema.type;

    if (type === 'number' || type === 'integer') {
      return Number(value);
    }

    if (type === 'boolean') {
      return value === 'TRUE' || value === true;
    }

    return value;
  }

  /**
   * Format the configuration object
   */
  format(config: ConfigObject): string {
    if (this.options.format === 'yaml') {
      return this.toYAML(config);
    }
    return JSON.stringify(config, null, 2);
  }

  /**
   * Simple YAML formatter (for basic cases)
   */
  private toYAML(obj: any, indent: number = 0): string {
    const spacing = '  '.repeat(indent);
    let result = '';

    if (Array.isArray(obj)) {
      for (const item of obj) {
        if (typeof item === 'object' && item !== null) {
          result += `${spacing}-\n${this.toYAML(item, indent + 1)}`;
        } else {
          result += `${spacing}- ${this.formatValue(item)}\n`;
        }
      }
    } else if (typeof obj === 'object' && obj !== null) {
      for (const [key, value] of Object.entries(obj)) {
        if (Array.isArray(value)) {
          result += `${spacing}${key}:\n`;
          result += this.toYAML(value, indent + 1);
        } else if (typeof value === 'object' && value !== null) {
          result += `${spacing}${key}:\n`;
          result += this.toYAML(value, indent + 1);
        } else {
          result += `${spacing}${key}: ${this.formatValue(value)}\n`;
        }
      }
    }

    return result;
  }

  private formatValue(value: any): string {
    if (typeof value === 'string') {
      // Quote if contains special characters
      if (value.includes(':') || value.includes('#') || value.includes('\n')) {
        return `"${value.replace(/"/g, '\\"')}"`;
      }
      return value;
    }
    return String(value);
  }
}
