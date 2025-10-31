import type * as Blockly from 'blockly';
import type { JSONSchema, ConfigObject } from '../types';

/**
 * Loads existing configurations into Blockly workspace
 */
export class ConfigLoader {
  private schema: JSONSchema;
  private workspace: Blockly.Workspace;
  private rootBlockType: string;

  constructor(
    schema: JSONSchema,
    workspace: Blockly.Workspace,
    rootBlockType: string
  ) {
    this.schema = schema;
    this.workspace = workspace;
    this.rootBlockType = rootBlockType;
  }

  /**
   * Load a configuration object into the workspace
   */
  load(config: ConfigObject): void {
    // Clear existing blocks
    this.workspace.clear();

    // Create root block
    const rootBlock = this.workspace.newBlock(this.rootBlockType);
    this.populateBlock(rootBlock, config, this.schema);

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
    schema: JSONSchema
  ): void {
    const properties = schema.properties ?? {};

    for (const [propName, propSchema] of Object.entries(properties)) {
      const upperName = propName.toUpperCase();
      const value = config[propName];

      if (value === undefined || value === null) {
        continue;
      }

      this.setFieldValue(block, upperName, value, propSchema);
    }
  }

  /**
   * Set a field value on a block
   */
  private setFieldValue(
    block: Blockly.Block,
    fieldName: string,
    value: any,
    schema: JSONSchema
  ): void {
    const propType = schema.type;

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
      this.loadArrayValue(block, fieldName, value, schema);
      return;
    }

    // Object type - create nested block
    if (propType === 'object' && typeof value === 'object') {
      this.loadObjectValue(block, fieldName, value, schema);
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
    schema: JSONSchema
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
      // Determine block type from connection check
      const check = input.connection.getCheck();
      const itemBlockType = Array.isArray(check) ? check[0] : check;

      if (!itemBlockType) {
        console.warn(`No block type found for array field: ${fieldName}`);
        continue;
      }

      const itemBlock = this.workspace.newBlock(itemBlockType);

      if (itemSchema.type === 'object' && typeof item === 'object') {
        this.populateBlock(itemBlock, item, itemSchema);
      } else {
        // Primitive value
        try {
          if (itemSchema.type === 'boolean') {
            itemBlock.setFieldValue(item ? 'TRUE' : 'FALSE', 'VALUE');
          } else {
            itemBlock.setFieldValue(String(item), 'VALUE');
          }
        } catch (error) {
          console.warn('Failed to set item value:', error);
        }
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
    schema: JSONSchema
  ): void {
    const input = parentBlock.getInput(fieldName);
    if (!input || !input.connection) {
      return;
    }

    // Determine block type from connection check
    const check = input.connection.getCheck();
    const objectBlockType = Array.isArray(check) ? check[0] : check;

    if (!objectBlockType) {
      console.warn(`No block type found for object field: ${fieldName}`);
      return;
    }

    const objectBlock = this.workspace.newBlock(objectBlockType);
    this.populateBlock(objectBlock, value, schema);

    // Connect to parent
    input.connection.connect(objectBlock.previousConnection!);
  }
}
