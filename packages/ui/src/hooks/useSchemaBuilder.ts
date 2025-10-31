import { useEffect, useState, useRef, useCallback } from 'react';
import * as Blockly from 'blockly';
import { SchemaConfigBuilder } from '@configly/core';
import type { JSONSchema, ConfigObject } from '@configly/core';

export function useSchemaBuilder(schema: JSONSchema | null) {
  const [builder, setBuilder] = useState<SchemaConfigBuilder | null>(null);
  const [isReady, setIsReady] = useState(false);
  const workspaceRef = useRef<Blockly.Workspace | null>(null);

  useEffect(() => {
    if (!schema) {
      setBuilder(null);
      setIsReady(false);
      return;
    }

    try {
      const newBuilder = new SchemaConfigBuilder(schema);
      setBuilder(newBuilder);
    } catch (error) {
      console.error('Failed to create builder:', error);
      setBuilder(null);
    }
  }, [schema]);

  const setWorkspace = useCallback(
    (workspace: Blockly.Workspace) => {
      workspaceRef.current = workspace;
      if (builder) {
        builder.setWorkspace(workspace);
        try {
          builder.generateBlocks();
          builder.registerBlocks(Blockly);
          builder.updateToolbox();
          setIsReady(true);
        } catch (error) {
          console.error('Failed to generate blocks:', error);
          setIsReady(false);
        }
      }
    },
    [builder]
  );

  const generateConfig = useCallback(
    (format: 'json' | 'yaml' = 'json'): ConfigObject => {
      if (!builder) throw new Error('Builder not initialized');
      return builder.generateConfig({ format });
    },
    [builder]
  );

  const loadConfig = useCallback(
    (config: ConfigObject) => {
      if (!builder) throw new Error('Builder not initialized');
      builder.loadConfig(config);
    },
    [builder]
  );

  const clearWorkspace = useCallback(() => {
    if (!builder) return;
    builder.clearWorkspace();
  }, [builder]);

  return {
    builder,
    isReady,
    setWorkspace,
    generateConfig,
    loadConfig,
    clearWorkspace,
  };
}
