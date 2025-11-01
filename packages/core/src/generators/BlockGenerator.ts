import type {
  JSONSchema,
  JSONSchemaType,
  BlockDefinition,
  GeneratorConfig,
  GenerationResult,
  ToolboxConfig,
  ColorScheme,
  BlockArgument,
  BlockVariant,
} from '../types';
import { SchemaResolver } from '../utils/SchemaResolver';

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
  private blockCategories: Map<string, string>;
  private resolver: SchemaResolver;
  private blockSchemaMap: Map<string, JSONSchema>;
  private variants: Map<string, BlockVariant[]>;

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
    this.blockCategories = new Map();
    this.resolver = new SchemaResolver(schema);
    this.blockSchemaMap = new Map();
    this.variants = new Map();
  }

  /**
   * Generate all blocks and toolbox from the schema
   */
  generate(): GenerationResult {
    this.generatedBlocks.clear();
    this.blockTypeMap.clear();
    this.blockCategories.clear();
    this.blockSchemaMap.clear();
    this.variants.clear();

    const resolvedRoot = this.resolver.resolve(this.schema);

    // Generate root block if schema is an object
    if (resolvedRoot.type === 'object' || !resolvedRoot.type) {
      const rootTitle = resolvedRoot.title ?? 'Configuration';
      this.generateObjectBlock(
        resolvedRoot,
        this.config.rootBlockName,
        true,
        0,
        rootTitle,
        'Configuration'
      );
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
      blockSchemaMap: new Map(this.blockSchemaMap),
      variants: new Map(this.variants),
    };
  }

  /**
   * Generate an object block
   */
  private generateObjectBlock(
    schema: JSONSchema,
    blockName: string,
    isRoot: boolean = false,
    depth: number = 0,
    displayName?: string,
    topLevelCategory?: string
  ): string {
    if (depth > this.config.maxDepth) {
      console.warn(`Max depth exceeded for block: ${blockName}`);
      return blockName;
    }

    if (this.generatedBlocks.has(blockName)) {
      return blockName;
    }

    const resolvedSchema = this.resolver.resolve(schema);
    const properties = resolvedSchema.properties ?? {};
    const required = resolvedSchema.required ?? [];
    const title = displayName ?? resolvedSchema.title ?? this.humanize(blockName);

    const block: BlockDefinition = {
      type: blockName,
      message0: title,
      args0: [],
      colour: isRoot ? this.config.colorScheme.root : this.config.colorScheme.object,
      tooltip: resolvedSchema.description ?? `Configure ${title}`,
      helpUrl: '',
    };

    // Add connections for non-root blocks
    if (!isRoot) {
      block.previousStatement = this.getBlockType(blockName);
      block.nextStatement = this.getBlockType(blockName);
    }

    const categoryName = isRoot
      ? 'Configuration'
      : topLevelCategory ?? (depth === 1 ? title : 'Objects');

    this.blockCategories.set(blockName, categoryName);

    let argIndex = 0;

    // Add properties as inputs
    for (const [propName, propSchema] of Object.entries(properties)) {
      const isRequired = required.includes(propName);
      const label = this.humanize(propName) + (isRequired ? ' *' : '');
      const childDisplayName = propSchema.title ?? this.humanize(propName);
      const childTopLevelCategory = isRoot
        ? childDisplayName
        : topLevelCategory ?? childDisplayName;

      // Add spacing and label
      block.message0 += ` %${++argIndex}`;
      block.args0!.push({ type: 'input_dummy' });

      block.message0 += ` ${label}`;

      // Add input based on property type
      const input = this.generatePropertyInput(
        propSchema,
        propName,
        `${blockName}_${propName}`,
        depth,
        childTopLevelCategory
      );

      if (input) {
        block.message0 += ` %${++argIndex}`;
        block.args0!.push(input);
      }
    }

    this.generatedBlocks.set(blockName, block);
    this.blockTypeMap.set(blockName, blockName);
    this.blockSchemaMap.set(blockName, resolvedSchema);

    return blockName;
  }

  /**
   * Generate input for a property
   */
  private generatePropertyInput(
    schema: JSONSchema,
    propName: string,
    fullPath: string,
    depth: number,
    topLevelCategory?: string
  ): BlockArgument | null {
    const resolvedSchema = this.resolver.resolve(schema);
    const propType = resolvedSchema.type;
    const upperName = propName.toUpperCase();
    const displayName = resolvedSchema.title ?? this.humanize(propName);

    if (resolvedSchema.oneOf?.length) {
      return this.generateUnionInput(
        resolvedSchema.oneOf,
        propName,
        fullPath,
        depth,
        topLevelCategory,
        displayName
      );
    }

    if (resolvedSchema.anyOf?.length) {
      return this.generateUnionInput(
        resolvedSchema.anyOf,
        propName,
        fullPath,
        depth,
        topLevelCategory,
        displayName
      );
    }

    // Enum (dropdown)
    if (resolvedSchema.enum) {
      return {
        type: 'field_dropdown',
        name: upperName,
        options: resolvedSchema.enum.map((val) => [String(val), String(val)]),
      };
    }

    // Handle different types
    switch (propType) {
      case 'string':
        if (resolvedSchema.format === 'date') {
          return {
            type: 'field_date',
            name: upperName,
            text: (resolvedSchema.default as string) ?? '',
          };
        }
        return {
          type: 'field_input',
          name: upperName,
          text: (resolvedSchema.default as string) ?? '',
        };

      case 'number':
      case 'integer':
        return {
          type: 'field_number',
          name: upperName,
          value: (resolvedSchema.default as number) ?? 0,
          min: resolvedSchema.minimum,
          max: resolvedSchema.maximum,
          precision: propType === 'integer' ? 1 : 0.01,
        };

      case 'boolean':
        return {
          type: 'field_checkbox',
          name: upperName,
          checked: (resolvedSchema.default as boolean) ?? false,
        };

      case 'array': {
        const arrayBlockType = this.generateArrayBlock(
          resolvedSchema,
          fullPath,
          depth,
          topLevelCategory,
          displayName
        );
        return {
          type: 'input_statement',
          name: upperName,
          check: arrayBlockType,
        };
      }

      case 'object': {
        const objectBlockType = this.generateObjectBlock(
          resolvedSchema,
          fullPath,
          false,
          depth + 1,
          displayName,
          topLevelCategory
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

  private generateUnionInput(
    options: JSONSchema[],
    propName: string,
    fullPath: string,
    depth: number,
    topLevelCategory: string | undefined,
    displayName: string
  ): BlockArgument | null {
    const variantTypes: string[] = [];

    options.forEach((option, index) => {
      const resolvedOption = this.resolver.resolve(option);
      const variantTitle =
        resolvedOption.title ?? `${displayName} Option ${index + 1}`;
      const slug = this.slugify(variantTitle || `${propName}_${index + 1}`);
      const variantBlockType = `${fullPath}_${slug}`;

      this.generateObjectBlock(
        resolvedOption,
        variantBlockType,
        false,
        depth + 1,
        variantTitle,
        topLevelCategory
      );

      this.registerVariant(
        fullPath,
        variantBlockType,
        resolvedOption,
        variantTitle
      );

      variantTypes.push(variantBlockType);
    });

    if (variantTypes.length === 0) {
      return null;
    }

    return {
      type: 'input_statement',
      name: propName.toUpperCase(),
      check: variantTypes,
    };
  }

  /**
   * Generate array block and item blocks
   */
  private generateArrayBlock(
    schema: JSONSchema,
    blockName: string,
    depth: number,
    topLevelCategory?: string,
    displayName?: string
  ): string | string[] {
    const resolvedSchema = this.resolver.resolve(schema);
    const itemSchema = Array.isArray(resolvedSchema.items)
      ? resolvedSchema.items[0]
      : resolvedSchema.items ?? { type: 'string' };

    const inheritCategory = depth > 0;
    const category = inheritCategory ? topLevelCategory : undefined;

    if (itemSchema.oneOf?.length || itemSchema.anyOf?.length) {
      const variants = itemSchema.oneOf ?? itemSchema.anyOf ?? [];
      const variantTypes = variants.map((variant, index) => {
        const resolvedVariant = this.resolver.resolve(variant);
        const variantTitle =
          resolvedVariant.title ??
          displayName ??
          `${this.humanize(blockName)} Option ${index + 1}`;
        const variantBlockType = `${blockName}_${this.slugify(variantTitle)}`;

        this.generateObjectBlock(
          resolvedVariant,
          variantBlockType,
          false,
          depth + 1,
          variantTitle,
          category
        );

        this.registerVariant(
          blockName,
          variantBlockType,
          resolvedVariant,
          variantTitle
        );

        return variantBlockType;
      });

      return variantTypes.length === 1 ? variantTypes[0] : variantTypes;
    }

    // For primitive types, use shared item blocks (e.g., 'string_item', 'number_item')
    // For objects, create specific item blocks (e.g., 'servers_item')
    if (itemSchema.type === 'object') {
      const itemBlockType = `${blockName}_item`;
      const resolvedItem = this.resolver.resolve(itemSchema);
      const itemTitle =
        resolvedItem.title ?? displayName ?? this.humanize(itemBlockType);
      this.generateObjectBlock(
        resolvedItem,
        itemBlockType,
        false,
        depth + 1,
        itemTitle,
        category
      );
      this.blockSchemaMap.set(itemBlockType, resolvedItem);
      return itemBlockType;
    } else {
      // Use shared primitive item blocks
      const primitiveType = itemSchema.type ?? 'string';
      const itemBlockType = `${primitiveType}_item`;
      this.generateItemBlock(itemSchema, itemBlockType, 'Common');
      return itemBlockType;
    }
  }

  /**
   * Generate a simple item block for array elements
   */
  private generateItemBlock(
    schema: JSONSchema,
    blockName: string,
    topLevelCategory?: string
  ): void {
    if (this.generatedBlocks.has(blockName)) {
      return;
    }

    const type = schema.type ?? 'string';
    // For shared primitive item blocks, use simple titles like "String Item", "Number Item"
    const typeString = Array.isArray(type) ? type[0] : type;
    const title = schema.title ?? `${this.humanize(typeString)} Item`;

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

    if (topLevelCategory) {
      this.blockCategories.set(blockName, topLevelCategory);
    }
  }

  private registerVariant(
    path: string,
    blockType: string,
    schema: JSONSchema,
    title: string
  ): void {
    const discriminator = this.extractDiscriminator(schema);
    const variants = this.variants.get(path) ?? [];
    variants.push({ blockType, schema, title, discriminator });
    this.variants.set(path, variants);
  }

  private extractDiscriminator(
    schema: JSONSchema
  ): BlockVariant['discriminator'] | undefined {
    const properties = schema.properties ?? {};

    for (const [key, value] of Object.entries(properties)) {
      if (value && typeof value === 'object') {
        const castValue = value as JSONSchema;
        if (castValue.const !== undefined) {
          return {
            property: key,
            value: castValue.const,
          };
        }
      }
    }

    return undefined;
  }

  private slugify(value: string): string {
    const slug = value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .replace(/_{2,}/g, '_');

    return slug.length > 0 ? slug : 'option';
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
    const categoryMap = new Map<string, string[]>([['Configuration', []]]);

    for (const categoryName of this.blockCategories.values()) {
      if (categoryName !== 'Configuration' && !categoryMap.has(categoryName)) {
        categoryMap.set(categoryName, []);
      }
    }

    const ensureCategory = (name: string) => {
      if (!categoryMap.has(name)) {
        categoryMap.set(name, []);
      }
      return categoryMap.get(name)!;
    };

    for (const block of blocks) {
      const type = block.type;

      if (this.blockCategories.has(type)) {
        ensureCategory(this.blockCategories.get(type)!).push(type);
      } else if (type === this.config.rootBlockName) {
        ensureCategory('Configuration').push(type);
      } else if (type.includes('_item')) {
        ensureCategory('Arrays').push(type);
      } else if (this.hasEnumField(block)) {
        ensureCategory('Enums').push(type);
      } else if (this.hasFieldType(block, 'field_number')) {
        ensureCategory('Numbers').push(type);
      } else if (this.hasFieldType(block, 'field_checkbox')) {
        ensureCategory('Booleans').push(type);
      } else if (this.hasFieldType(block, 'field_input')) {
        ensureCategory('Strings').push(type);
      }
    }

    return Object.fromEntries(categoryMap.entries());
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
    switch (categoryName) {
      case 'Configuration':
        return (
          this.config.colorScheme.root ?? DEFAULT_COLOR_SCHEME.root
        );
      case 'Strings':
        return (
          this.config.colorScheme.string ?? DEFAULT_COLOR_SCHEME.string
        );
      case 'Numbers':
        return (
          this.config.colorScheme.number ?? DEFAULT_COLOR_SCHEME.number
        );
      case 'Booleans':
        return (
          this.config.colorScheme.boolean ?? DEFAULT_COLOR_SCHEME.boolean
        );
      case 'Arrays':
        return (
          this.config.colorScheme.array ?? DEFAULT_COLOR_SCHEME.array
        );
      case 'Enums':
        return (
          this.config.colorScheme.enum ?? DEFAULT_COLOR_SCHEME.enum
        );
      default:
        return (
          this.config.colorScheme.object ?? DEFAULT_COLOR_SCHEME.object
        );
    }
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
