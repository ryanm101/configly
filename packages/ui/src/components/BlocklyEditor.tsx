import { useEffect, useRef } from 'react';
import * as Blockly from 'blockly';
import type { SchemaConfigBuilder } from '@configly/core';

interface BlocklyEditorProps {
  builder: SchemaConfigBuilder | null;
  onWorkspaceChange?: () => void;
}

export function BlocklyEditor({ builder, onWorkspaceChange }: BlocklyEditorProps) {
  const blocklyDivRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null);

  useEffect(() => {
    if (!blocklyDivRef.current || !builder) return;

    // Initialize Blockly workspace
    const workspace = Blockly.inject(blocklyDivRef.current, {
      toolbox: {
        kind: 'categoryToolbox',
        contents: [],
      },
      grid: {
        spacing: 20,
        length: 3,
        colour: '#ccc',
        snap: true,
      },
      zoom: {
        controls: true,
        wheel: true,
        startScale: 0.9,
        maxScale: 3,
        minScale: 0.3,
        scaleSpeed: 1.2,
      },
      trashcan: true,
      move: {
        scrollbars: true,
        drag: true,
        wheel: true,
      },
    });

    workspaceRef.current = workspace;

    // Generate and register blocks
    try {
      builder.setWorkspace(workspace);
      builder.generateBlocks();
      builder.registerBlocks(Blockly);
      builder.updateToolbox();
    } catch (error) {
      console.error('Failed to generate blocks:', error);
    }

    // Add change listener
    if (onWorkspaceChange) {
      workspace.addChangeListener((event) => {
        // Only trigger on meaningful changes
        if (
          event.type === Blockly.Events.BLOCK_CREATE ||
          event.type === Blockly.Events.BLOCK_DELETE ||
          event.type === Blockly.Events.BLOCK_CHANGE ||
          event.type === Blockly.Events.BLOCK_MOVE
        ) {
          onWorkspaceChange();
        }
      });
    }

    // Fix scrollbar metrics when toolbox is opened/closed
    workspace.addChangeListener((event) => {
      if (event.type === Blockly.Events.TOOLBOX_ITEM_SELECT) {
        // Force scrollbar metrics recalculation after toolbox interaction
        setTimeout(() => {
          workspace.resize();
        }, 0);
      }
    });

    // Cleanup
    return () => {
      workspace.dispose();
    };
  }, [builder, onWorkspaceChange]);

  return (
    <div className="flex-1 bg-white" ref={blocklyDivRef} />
  );
}
