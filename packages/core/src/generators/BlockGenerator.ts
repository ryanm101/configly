import type {
  JSONSchema,
  JSONSchemaType,
  BlockDefinition,
  GeneratorConfig,
  GenerationResult,
  ToolboxConfig,
  ColorScheme,
  BlockArgument,
} from '../types';

/**
 * Default color scheme for blocks
 */
const DEFAULT_COLOR_SCHEME: Required<ColorScheme> = {
  root: 0,
  object: 230,
  string: 160,
  number: 290,
  integer: 290,
  boolean: 210,
  array: 120,
  enum: 65,
};

/**
 * Generates Blockly block definitions from JSON Schema
 */
export class BlockGenerator {
  private schema: JSONSchema;
  private config: Required<GeneratorConfig>;
  private generatedBlocks: Map<string, BlockDefinition>;
  private blockTypeMap: Map<string, string>;

  constructor(schema: JSONSchema, config: Partial<GeneratorConfig> = {}) {
    this.schema = schema;
    this.config = {
      rootBlockName: config.rootBlockName ?? 'config_root',
      colorScheme: { ...DEFAULT_COLOR_SCHEME, ...config.colorScheme },
      maxDepth: config.maxDepth ?? 10,
      blockPrefix: config.blockPrefix ?? '',
      generateArrayBlocks: config.generateArrayBlocks ?? true,
      inlineInputs: config.inlineInputs ?? false,
      customGenerators: config.customGenerators ?? {},
    };
    this.generatedBlocks = new Map();
    this.blockTypeMap = new Map();
  }

  /**
   * Generate all blocks and toolbox from the schema
   */
  generate(): GenerationResult {
    this.generatedBlocks.clear();
    this.blockTypeMap.clear();

    // Generate root block if schema is an object
    if (this.schema.type === 'object' || !this.schema.type) {
      this.generateObjectBlock(this.schema, this.config.rootBlockName, true);
    } else {
      throw new Error('Root schema must be of type "object"');
    }

    const blocks = Array.from(this.generatedBlocks.values());
    const toolbox = this.generateToolbox(blocks);

    return {
      blocks,
      toolbox,
      rootBlockType: this.config.rootBlockName,
      blockTypeMap: new Map(this.blockTypeMap),
    };
  }

  /**
   * Generate an object block
   */
  private generateObjectBlock(
    schema: JSONSchema,
    blockName: string,
    isRoot: boolean = false,
    depth: number = 0
  ): string {
    if (depth > this.config.maxDepth) {
      console.warn(`Max depth exceeded for block: ${blockName}`);
      return blockName;
    }

    if (this.generatedBlocks.has(blockName)) {
      return blockName;
    }

    const properties = schema.properties ?? {};
    const required = schema.required ?? [];
    const title = schema.title ?? this.humanize(blockName);

    const block: BlockDefinition = {
      type: blockName,
      message0: title,
      args0: [],
      colour: isRoot ? this.config.colorScheme.root : this.config.colorScheme.object,
      tooltip: schema.description ?? `Configure ${title}`,
      helpUrl: '',
    };

    // Add connections for non-root blocks
    if (!isRoot) {
      block.previousStatement = this.getBlockType(blockName);
      block.nextStatement = this.getBlockType(blockName);
    }

    let argIndex = 0;

    // Add properties as inputs
    for (const [propName, propSchema] of Object.entries(properties)) {
      const isRequired = required.includes(propName);
      const label = this.humanize(propName) + (isRequired ? ' *' : '');

      // Add spacing and label
      block.message0 += ` %${++argIndex}`;
      block.args0!.push({ type: 'input_dummy' });

      block.message0 += ` ${label}`;

      // Add input based on property type
      const input = this.generatePropertyInput(
        propSchema,
        propName,
        `${blockName}_${propName}`,
        depth
      );

      if (input) {
        block.message0 += ` %${++argIndex}`;
        block.args0!.push(input);
      }
    }

    this.generatedBlocks.set(blockName, block);
    this.blockTypeMap.set(blockName, blockName);

    return blockName;
  }

  /**
   * Generate input for a property
   */
  private generatePropertyInput(
    schema: JSONSchema,
    propName: string,
    fullPath: string,
    depth: number
  ): BlockArgument | null {
    const propType = schema.type;
    const upperName = propName.toUpperCase();

    // Enum (dropdown)
    if (schema.enum) {
      return {
        type: 'field_dropdown',
        name: upperName,
        options: schema.enum.map((val) => [String(val), String(val)]),
      };
    }

    // Handle different types
    switch (propType) {
      case 'string':
        if (schema.format === 'date') {
          return {
            type: 'field_date',
            name: upperName,
            text: (schema.default as string) ?? '',
          };
        }
        return {
          type: 'field_input',
          name: upperName,
          text: (schema.default as string) ?? '',
        };

      case 'number':
      case 'integer':
        return {
          type: 'field_number',
          name: upperName,
          value: (schema.default as number) ?? 0,
          min: schema.minimum,
          max: schema.maximum,
          precision: propType === 'integer' ? 1 : 0.01,
        };

      case 'boolean':
        return {
          type: 'field_checkbox',
          name: upperName,
          checked: (schema.default as boolean) ?? false,
        };

      case 'array': {
        const arrayBlockType = this.generateArrayBlock(schema, fullPath, depth);
        return {
          type: 'input_statement',
          name: upperName,
          check: arrayBlockType,
        };
      }

      case 'object': {
        const objectBlockType = this.generateObjectBlock(
          schema,
          fullPath,
          false,
          depth + 1
        );
        return {
          type: 'input_statement',
          name: upperName,
          check: objectBlockType,
        };
      }

      default:
        return null;
    }
  }

  /**
   * Generate array block and item blocks
   */
  private generateArrayBlock(
    schema: JSONSchema,
    blockName: string,
    depth: number
  ): string {
    const itemSchema = Array.isArray(schema.items)
      ? schema.items[0]
      : schema.items ?? { type: 'string' };

    const itemBlockType = `${blockName}_item`;

    if (itemSchema.type === 'object') {
      this.generateObjectBlock(itemSchema, itemBlockType, false, depth + 1);
    } else {
      this.generateItemBlock(itemSchema, itemBlockType);
    }

    return itemBlockType;
  }

  /**
   * Generate a simple item block for array elements
   */
  private generateItemBlock(schema: JSONSchema, blockName: string): void {
    if (this.generatedBlocks.has(blockName)) {
      return;
    }

    const type = schema.type ?? 'string';
    const title = schema.title ?? 'Item';

    // Get color - type could be a string or array, handle both cases
    let colour: number;
    if (Array.isArray(type)) {
      // If type is an array, use the first type's color or fallback to string
      const firstType = type[0] as JSONSchemaType;
      colour = this.config.colorScheme[firstType] ?? this.config.colorScheme.string ?? 160;
    } else {
      colour = this.config.colorScheme[type] ?? this.config.colorScheme.string ?? 160;
    }

    const block: BlockDefinition = {
      type: blockName,
      message0: `${title} %1`,
      args0: [],
      previousStatement: blockName,
      nextStatement: blockName,
      colour,
      tooltip: schema.description ?? `Add ${title}`,
      helpUrl: '',
    };

    // Add value field based on type
    if (schema.enum) {
      block.args0!.push({
        type: 'field_dropdown',
        name: 'VALUE',
        options: schema.enum.map((val) => [String(val), String(val)]),
      });
    } else if (type === 'string') {
      block.args0!.push({
        type: 'field_input',
        name: 'VALUE',
        text: (schema.default as string) ?? '',
      });
    } else if (type === 'number' || type === 'integer') {
      block.args0!.push({
        type: 'field_number',
        name: 'VALUE',
        value: (schema.default as number) ?? 0,
        min: schema.minimum,
        max: schema.maximum,
      });
    } else if (type === 'boolean') {
      block.args0!.push({
        type: 'field_checkbox',
        name: 'VALUE',
        checked: (schema.default as boolean) ?? false,
      });
    }

    this.generatedBlocks.set(blockName, block);
    this.blockTypeMap.set(blockName, blockName);
  }

  /**
   * Generate toolbox configuration
   */
  private generateToolbox(blocks: BlockDefinition[]): ToolboxConfig {
    const categories = this.categorizeBlocks(blocks);

    return {
      kind: 'categoryToolbox',
      contents: Object.entries(categories)
        .filter(([_, blockTypes]) => blockTypes.length > 0)
        .map(([categoryName, blockTypes]) => ({
          kind: 'category' as const,
          name: categoryName,
          colour: this.getCategoryColor(categoryName),
          contents: blockTypes.map((type) => ({
            kind: 'block' as const,
            type,
          })),
        })),
    };
  }

  /**
   * Categorize blocks by type
   */
  private categorizeBlocks(
    blocks: BlockDefinition[]
  ): Record<string, string[]> {
    const categories: Record<string, string[]> = {
      Configuration: [],
      Objects: [],
      Strings: [],
      Numbers: [],
      Booleans: [],
      Arrays: [],
      Enums: [],
    };

    for (const block of blocks) {
      const type = block.type;

      if (type === this.config.rootBlockName) {
        categories.Configuration.push(type);
      } else if (type.includes('_item')) {
        categories.Arrays.push(type);
      } else if (this.hasEnumField(block)) {
        categories.Enums.push(type);
      } else if (this.hasFieldType(block, 'field_number')) {
        categories.Numbers.push(type);
      } else if (this.hasFieldType(block, 'field_checkbox')) {
        categories.Booleans.push(type);
      } else if (this.hasFieldType(block, 'field_input')) {
        categories.Strings.push(type);
      } else {
        categories.Objects.push(type);
      }
    }

    return categories;
  }

  private hasEnumField(block: BlockDefinition): boolean {
    return (
      block.args0?.some((arg) => arg.type === 'field_dropdown') ?? false
    );
  }

  private hasFieldType(block: BlockDefinition, fieldType: string): boolean {
    return block.args0?.some((arg) => arg.type === fieldType) ?? false;
  }

  private getCategoryColor(categoryName: string): number {
    const colors: Record<string, number> = {
      Configuration: 0,
      Objects: 230,
      Strings: 160,
      Numbers: 290,
      Booleans: 210,
      Arrays: 120,
      Enums: 65,
    };
    return colors[categoryName] ?? 230;
  }

  private getBlockType(blockName: string): string {
    return blockName;
  }

  /**
   * Convert snake_case or camelCase to Human Readable
   */
  private humanize(str: string): string {
    return str
      .replace(/([A-Z])/g, ' $1')
      .replace(/[_-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
}
