import type { ConfigObject } from '@configly/core';

interface ConfigOutputProps {
  config: ConfigObject | null;
  format: 'json' | 'yaml';
}

export function ConfigOutput({ config, format }: ConfigOutputProps) {
  if (!config) {
    return (
      <div className="w-96 bg-gray-900 text-gray-300 p-6 flex items-center justify-center border-l border-gray-700">
        <div className="text-center">
          <p className="text-sm">Click "Generate" to see output...</p>
        </div>
      </div>
    );
  }

  const formatted =
    format === 'json'
      ? JSON.stringify(config, null, 2)
      : formatYAML(config);

  return (
    <div className="w-96 bg-gray-900 text-gray-300 flex flex-col border-l border-gray-700">
      <div className="bg-gray-800 px-4 py-2 border-b border-gray-700">
        <h3 className="font-semibold text-white">Output</h3>
      </div>
      <div className="flex-1 overflow-auto p-4">
        <pre className="text-sm font-mono whitespace-pre-wrap break-words">
          {formatted}
        </pre>
      </div>
    </div>
  );
}

function formatYAML(obj: any, indent = 0): string {
  const spacing = '  '.repeat(indent);
  let result = '';

  if (Array.isArray(obj)) {
    for (const item of obj) {
      if (typeof item === 'object' && item !== null) {
        result += `${spacing}-\n${formatYAML(item, indent + 1)}`;
      } else {
        result += `${spacing}- ${formatValue(item)}\n`;
      }
    }
  } else if (typeof obj === 'object' && obj !== null) {
    for (const [key, value] of Object.entries(obj)) {
      if (Array.isArray(value)) {
        result += `${spacing}${key}:\n`;
        result += formatYAML(value, indent + 1);
      } else if (typeof value === 'object' && value !== null) {
        result += `${spacing}${key}:\n`;
        result += formatYAML(value, indent + 1);
      } else {
        result += `${spacing}${key}: ${formatValue(value)}\n`;
      }
    }
  }

  return result;
}

function formatValue(value: any): string {
  if (typeof value === 'string') {
    if (value.includes(':') || value.includes('#') || value.includes('\n')) {
      return `"${value.replace(/"/g, '\\"')}"`;
    }
    return value;
  }
  return String(value);
}
