import type * as Blockly from 'blockly';
import type { JSONSchema, ConfigObject, BlockVariant } from '../types';

/**
 * Loads existing configurations into Blockly workspace
 */
export class ConfigLoader {
  private schema: JSONSchema;
  private workspace: Blockly.Workspace;
  private rootBlockType: string;
  private blockSchemaMap: Map<string, JSONSchema>;
  private variants: Map<string, BlockVariant[]>;

  constructor(
    schema: JSONSchema,
    workspace: Blockly.Workspace,
    rootBlockType: string,
    blockSchemaMap: Map<string, JSONSchema>,
    variants: Map<string, BlockVariant[]>
  ) {
    this.schema = schema;
    this.workspace = workspace;
    this.rootBlockType = rootBlockType;
    this.blockSchemaMap = blockSchemaMap;
    this.variants = variants;
  }

  /**
   * Load a configuration object into the workspace
   */
  load(config: ConfigObject): void {
    // Clear existing blocks
    this.workspace.clear();

    // Create root block
    const rootBlock = this.workspace.newBlock(this.rootBlockType);
    this.populateBlock(rootBlock, config, this.schema, this.rootBlockType);

    // Initialize and render all blocks
    // TypeScript doesn't know about these methods, but they exist at runtime
    (rootBlock as any).initSvg();
    (rootBlock as any).render();

    // Initialize any child blocks
    const allBlocks = this.workspace.getAllBlocks(false);
    for (const block of allBlocks) {
      if (block !== rootBlock) {
        (block as any).initSvg();
        (block as any).render();
      }
    }

    // Center on the workspace
    // TypeScript doesn't know about scrollCenter, but it exists at runtime
    (this.workspace as any).scrollCenter();
  }

  /**
   * Populate a block with configuration data
   */
  private populateBlock(
    block: Blockly.Block,
    config: ConfigObject,
    schema: JSONSchema,
    path: string
  ): void {
    const effectiveSchema = this.blockSchemaMap.get(block.type) ?? schema;
    const properties = effectiveSchema.properties ?? {};

    for (const [propName, propSchema] of Object.entries(properties)) {
      const upperName = propName.toUpperCase();
      const value = config[propName];

      if (value === undefined || value === null) {
        continue;
      }

      const childPath = `${path}_${propName}`;
      this.setFieldValue(block, upperName, value, propSchema, childPath);
    }
  }

  /**
   * Set a field value on a block
   */
  private setFieldValue(
    block: Blockly.Block,
    fieldName: string,
    value: any,
    schema: JSONSchema,
    path: string
  ): void {
    const propType = schema.type;

    if (schema.oneOf?.length || schema.anyOf?.length) {
      this.loadUnionValue(block, fieldName, value, path);
      return;
    }

    // Primitive types - set directly
    if (
      schema.enum ||
      propType === 'string' ||
      propType === 'number' ||
      propType === 'integer' ||
      propType === 'boolean'
    ) {
      try {
        if (propType === 'boolean') {
          block.setFieldValue(value ? 'TRUE' : 'FALSE', fieldName);
        } else {
          block.setFieldValue(String(value), fieldName);
        }
      } catch (error) {
        console.warn(`Failed to set field ${fieldName}:`, error);
      }
      return;
    }

    // Array type - create item blocks
    if (propType === 'array' && Array.isArray(value)) {
      this.loadArrayValue(block, fieldName, value, schema, path);
      return;
    }

    // Object type - create nested block
    if (propType === 'object' && typeof value === 'object') {
      this.loadObjectValue(block, fieldName, value, schema, path);
      return;
    }
  }

  /**
   * Load array values as connected blocks
   */
  private loadArrayValue(
    parentBlock: Blockly.Block,
    fieldName: string,
    items: any[],
    schema: JSONSchema,
    path: string
  ): void {
    if (items.length === 0) {
      return;
    }

    const itemSchema = Array.isArray(schema.items)
      ? schema.items[0]
      : schema.items ?? { type: 'string' };

    const input = parentBlock.getInput(fieldName);
    if (!input || !input.connection) {
      return;
    }

    let previousBlock: Blockly.Block | null = null;

    for (const item of items) {
      const variant = this.selectVariant(path, item);
      const check = input.connection.getCheck();
      const defaultBlockType = Array.isArray(check) ? check[0] : check;
      const itemBlockType = variant?.blockType ?? defaultBlockType;

      if (!itemBlockType) {
        console.warn(`No block type found for array field: ${fieldName}`);
        continue;
      }

      const itemBlock = this.workspace.newBlock(itemBlockType);
      const effectiveSchema =
        variant?.schema ?? this.blockSchemaMap.get(itemBlockType) ?? itemSchema;

      if (effectiveSchema.type === 'object' && typeof item === 'object') {
        this.populateBlock(itemBlock, item, effectiveSchema, itemBlock.type);
      } else {
        this.setPrimitiveValue(itemBlock, 'VALUE', item, effectiveSchema);
      }

      // Connect blocks
      if (previousBlock === null) {
        // First item - connect to parent
        input.connection.connect(itemBlock.previousConnection!);
      } else {
        // Subsequent items - connect to previous item
        previousBlock.nextConnection?.connect(itemBlock.previousConnection!);
      }

      previousBlock = itemBlock;
    }
  }

  /**
   * Load object value as nested block
   */
  private loadObjectValue(
    parentBlock: Blockly.Block,
    fieldName: string,
    value: ConfigObject,
    schema: JSONSchema,
    path: string
  ): void {
    const input = parentBlock.getInput(fieldName);
    if (!input || !input.connection) {
      return;
    }

    const variant = this.selectVariant(path, value);
    const check = input.connection.getCheck();
    const defaultBlockType = Array.isArray(check) ? check[0] : check;
    const objectBlockType = variant?.blockType ?? defaultBlockType;

    if (!objectBlockType) {
      console.warn(`No block type found for object field: ${fieldName}`);
      return;
    }

    const objectBlock = this.workspace.newBlock(objectBlockType);
    const effectiveSchema =
      variant?.schema ?? this.blockSchemaMap.get(objectBlockType) ?? schema;

    this.populateBlock(objectBlock, value, effectiveSchema, objectBlock.type);

    // Connect to parent
    input.connection.connect(objectBlock.previousConnection!);
  }

  private loadUnionValue(
    block: Blockly.Block,
    fieldName: string,
    value: any,
    path: string
  ): void {
    if (typeof value === 'object' && value !== null) {
      this.loadObjectValue(block, fieldName, value, { type: 'object' }, path);
      return;
    }

    const input = block.getInput(fieldName);
    if (!input || !input.connection) {
      return;
    }

    const variant = this.selectVariant(path, value);
    const check = input.connection.getCheck();
    const defaultBlockType = Array.isArray(check) ? check[0] : check;
    const blockType = variant?.blockType ?? defaultBlockType;

    if (!blockType) {
      console.warn(`No block type found for union field: ${fieldName}`);
      return;
    }

    const variantBlock = this.workspace.newBlock(blockType);
    const schema = variant?.schema ?? this.blockSchemaMap.get(blockType);
    this.setPrimitiveValue(variantBlock, 'VALUE', value, schema ?? {});
    input.connection.connect(variantBlock.previousConnection!);
  }

  private setPrimitiveValue(
    block: Blockly.Block,
    fieldName: string,
    value: any,
    schema: JSONSchema
  ): void {
    try {
      if (schema.type === 'boolean') {
        block.setFieldValue(value ? 'TRUE' : 'FALSE', fieldName);
      } else {
        block.setFieldValue(String(value), fieldName);
      }
    } catch (error) {
      console.warn('Failed to set primitive value:', error);
    }
  }

  private selectVariant(path: string, value: any): BlockVariant | undefined {
    const candidates = this.variants.get(path);
    if (!candidates || candidates.length === 0) {
      return undefined;
    }

    if (value && typeof value === 'object') {
      for (const candidate of candidates) {
        if (
          candidate.discriminator &&
          value[candidate.discriminator.property] === candidate.discriminator.value
        ) {
          return candidate;
        }
      }
    }

    return candidates[0];
  }
}
