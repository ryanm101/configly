import type { JSONSchema } from '../types';

interface ResolveContext {
  readonly pointerStack: Set<string>;
}

export class SchemaResolver {
  private readonly root: JSONSchema;

  constructor(rootSchema: JSONSchema) {
    this.root = rootSchema;
  }

  resolve(schema: JSONSchema, context: ResolveContext = { pointerStack: new Set() }): JSONSchema {
    const clone = this.cloneSchema(schema);

    if (clone.$ref) {
      const pointer = clone.$ref;
      if (context.pointerStack.has(pointer)) {
        throw new Error(`Circular schema reference detected for pointer: ${pointer}`);
      }

      context.pointerStack.add(pointer);

      const referenced = this.resolvePointer(pointer);
      const resolvedRef = this.resolve(referenced, context);

      context.pointerStack.delete(pointer);

      const merged = this.mergeSchemas(resolvedRef, { ...clone, $ref: undefined });
      return this.resolve(merged, context);
    }

    if (clone.allOf?.length) {
      let merged = this.cloneSchema(clone);
      merged.allOf = undefined;

      for (const subschema of clone.allOf) {
        const resolved = this.resolve(subschema, context);
        merged = this.mergeSchemas(merged, resolved);
      }

      return this.resolve(merged, context);
    }

    if (clone.oneOf?.length) {
      clone.oneOf = clone.oneOf.map((option) => this.resolve(option, context));
    }

    if (clone.anyOf?.length) {
      clone.anyOf = clone.anyOf.map((option) => this.resolve(option, context));
    }

    if (clone.properties) {
      const entries = Object.entries(clone.properties).map(([key, value]) => [
        key,
        this.resolve(value, context),
      ] as const);
      clone.properties = Object.fromEntries(entries);
    }

    if (clone.items) {
      if (Array.isArray(clone.items)) {
        clone.items = clone.items.map((item) => this.resolve(item, context));
      } else {
        clone.items = this.resolve(clone.items, context);
      }
    }

    if (typeof clone.additionalProperties === 'object') {
      clone.additionalProperties = this.resolve(clone.additionalProperties, context);
    }

    return clone;
  }

  private resolvePointer(pointer: string): JSONSchema {
    if (!pointer.startsWith('#/')) {
      throw new Error(`Only local JSON pointers are supported. Received: ${pointer}`);
    }

    const segments = pointer
      .slice(2)
      .split('/')
      .map((segment) => segment.replace(/~1/g, '/').replace(/~0/g, '~'));

    let current: any = this.root;

    for (const segment of segments) {
      if (current === undefined || current === null || typeof current !== 'object') {
        throw new Error(`Invalid pointer segment "${segment}" in pointer ${pointer}`);
      }

      current = current[segment];
    }

    if (!current || typeof current !== 'object') {
      throw new Error(`Pointer ${pointer} does not reference a valid schema object`);
    }

    return current as JSONSchema;
  }

  private mergeSchemas(base: JSONSchema, extension: JSONSchema): JSONSchema {
    const merged: JSONSchema = {
      ...base,
      ...extension,
      properties: {
        ...(base.properties ?? {}),
        ...(extension.properties ?? {}),
      },
      definitions: {
        ...(base.definitions ?? {}),
        ...(extension.definitions ?? {}),
      },
    };

    if (base.required || extension.required) {
      const unique = new Set([...(base.required ?? []), ...(extension.required ?? [])]);
      merged.required = Array.from(unique);
    }

    if (base.oneOf || extension.oneOf) {
      merged.oneOf = extension.oneOf ?? base.oneOf;
    }

    if (base.anyOf || extension.anyOf) {
      merged.anyOf = extension.anyOf ?? base.anyOf;
    }

    if (base.allOf || extension.allOf) {
      merged.allOf = extension.allOf ?? base.allOf;
    }

    if (extension.items !== undefined) {
      merged.items = extension.items;
    } else if (base.items !== undefined) {
      merged.items = base.items;
    }

    if (extension.additionalProperties !== undefined) {
      merged.additionalProperties = extension.additionalProperties;
    }

    return merged;
  }

  private cloneSchema(schema: JSONSchema): JSONSchema {
    return JSON.parse(JSON.stringify(schema)) as JSONSchema;
  }
}
