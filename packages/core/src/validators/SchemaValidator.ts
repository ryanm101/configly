import Ajv, { type ValidateFunction } from 'ajv';
import type {
  JSONSchema,
  ValidationResult,
  ValidationError,
  SchemaUploadResult,
} from '../types';

/**
 * Validates JSON Schemas and configuration objects
 */
export class SchemaValidator {
  private ajv: Ajv;
  private schemaValidator: ValidateFunction | null = null;

  constructor() {
    this.ajv = new Ajv({
      allErrors: true,
      verbose: true,
      strict: false,
    });
  }

  /**
   * Validate that a schema is a valid JSON Schema
   */
  validateSchema(schema: any): SchemaUploadResult {
    try {
      // Basic checks
      if (typeof schema !== 'object' || schema === null) {
        return {
          schema: {} as JSONSchema,
          valid: false,
          errors: ['Schema must be an object'],
        };
      }

      // Check if it's a valid JSON Schema by trying to compile it
      try {
        this.ajv.compile(schema);
      } catch (error) {
        return {
          schema: schema as JSONSchema,
          valid: false,
          errors: [
            `Invalid JSON Schema: ${
              error instanceof Error ? error.message : String(error)
            }`,
          ],
        };
      }

      // Additional checks for compatibility
      const errors: string[] = [];

      if (!schema.type && !schema.properties && !schema.items) {
        errors.push('Schema must have a type, properties, or items');
      }

      if (schema.type === 'object' && !schema.properties) {
        errors.push('Object type schemas must have properties defined');
      }

      if (errors.length > 0) {
        return {
          schema: schema as JSONSchema,
          valid: false,
          errors,
        };
      }

      this.schemaValidator = this.ajv.compile(schema);

      return {
        schema: schema as JSONSchema,
        valid: true,
      };
    } catch (error) {
      return {
        schema: {} as JSONSchema,
        valid: false,
        errors: [
          `Validation error: ${
            error instanceof Error ? error.message : String(error)
          }`,
        ],
      };
    }
  }

  /**
   * Validate a configuration object against the loaded schema
   */
  validateConfig(config: any): ValidationResult {
    if (!this.schemaValidator) {
      return {
        valid: false,
        errors: [
          {
            path: '',
            message: 'No schema loaded. Call validateSchema first.',
          },
        ],
      };
    }

    const valid = this.schemaValidator(config);

    if (valid) {
      return { valid: true };
    }

    const errors: ValidationError[] = (this.schemaValidator.errors ?? []).map(
      (error) => ({
        path: error.instancePath || error.schemaPath || '',
        message: error.message ?? 'Validation error',
        keyword: error.keyword,
        params: error.params,
      })
    );

    return {
      valid: false,
      errors,
    };
  }

  /**
   * Parse and validate an uploaded schema file
   */
  async parseSchemaFile(file: File): Promise<SchemaUploadResult> {
    try {
      const text = await file.text();
      const schema = JSON.parse(text);
      return this.validateSchema(schema);
    } catch (error) {
      return {
        schema: {} as JSONSchema,
        valid: false,
        errors: [
          `Failed to parse schema file: ${
            error instanceof Error ? error.message : String(error)
          }`,
        ],
      };
    }
  }

  /**
   * Check if a configuration can be loaded into the workspace
   */
  canLoadConfig(config: any, schema: JSONSchema): ValidationResult {
    // First validate against schema
    const result = this.validateConfig(config);
    if (!result.valid) {
      return result;
    }

    // Additional checks for workspace compatibility
    const errors: ValidationError[] = [];

    // Check that required fields are present
    if (schema.required) {
      for (const field of schema.required) {
        if (!(field in config)) {
          errors.push({
            path: field,
            message: `Required field "${field}" is missing`,
          });
        }
      }
    }

    if (errors.length > 0) {
      return {
        valid: false,
        errors,
      };
    }

    return { valid: true };
  }
}
