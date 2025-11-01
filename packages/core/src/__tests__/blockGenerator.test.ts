import { BlockGenerator } from '../generators/BlockGenerator';
import type { JSONSchema } from '../types';

const workloadSchema: JSONSchema = {
  type: 'object',
  properties: {
    workloads: {
      type: 'array',
      items: {
        $ref: '#/definitions/Workload',
      },
    },
  },
  definitions: {
    Workload: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        codeManagement: {
          $ref: '#/definitions/WorkloadCodeManagementConfig',
        },
        incidents: {
          $ref: '#/definitions/WorkloadTicketConfig',
        },
      },
      required: ['id', 'codeManagement', 'incidents'],
    },
    WorkloadCodeManagementConfig: {
      type: 'object',
      properties: {
        type: { type: 'string' },
        serverId: { type: 'string' },
      },
      required: ['type', 'serverId'],
    },
    BaseWorkloadTicketConfig: {
      type: 'object',
      properties: {
        type: { type: 'string' },
        serverId: { type: 'string' },
      },
      required: ['type'],
    },
    WorkloadTicketConfigAzure: {
      allOf: [
        { $ref: '#/definitions/BaseWorkloadTicketConfig' },
        {
          type: 'object',
          properties: {
            type: { const: 'azure' },
            projectName: { type: 'string' },
          },
          required: ['type', 'projectName'],
        },
      ],
    },
    WorkloadTicketConfigJira: {
      allOf: [
        { $ref: '#/definitions/BaseWorkloadTicketConfig' },
        {
          type: 'object',
          properties: {
            type: { const: 'jira' },
            projectName: { type: 'string' },
          },
          required: ['type', 'projectName'],
        },
      ],
    },
    WorkloadTicketConfig: {
      oneOf: [
        { $ref: '#/definitions/WorkloadTicketConfigAzure' },
        { $ref: '#/definitions/WorkloadTicketConfigJira' },
      ],
    },
  },
};

describe('BlockGenerator schema handling', () => {
  it('resolves references and organizes toolbox categories for workload schemas', () => {
    const generator = new BlockGenerator(workloadSchema, {});
    const result = generator.generate();

    const categoryNames = result.toolbox.contents
      .filter((entry) => entry.kind === 'category')
      .map((entry) => entry.name);

    expect(categoryNames).toEqual(
      expect.arrayContaining(['Code Management', 'Incidents'])
    );

    const variants = result.variants.get(
      'config_root_workloads_item_incidents'
    );

    expect(variants).toBeDefined();
    expect(variants).toHaveLength(2);

    const azureVariant = variants!.find(
      (variant) => variant.discriminator?.value === 'azure'
    );

    expect(azureVariant).toBeDefined();
    expect(azureVariant?.schema.required).toEqual(
      expect.arrayContaining(['type', 'projectName'])
    );

    const azureSchema = result.blockSchemaMap.get(azureVariant!.blockType);
    expect(azureSchema?.properties?.projectName?.type).toBe('string');
  });
});
