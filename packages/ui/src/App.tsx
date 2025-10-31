import { useState, useCallback } from 'react';
import { SchemaUploader } from './components/SchemaUploader';
import { BlocklyEditor } from './components/BlocklyEditor';
import { ConfigOutput } from './components/ConfigOutput';
import { ConfigUploader } from './components/ConfigUploader';
import { useSchemaBuilder } from './hooks/useSchemaBuilder';
import type { JSONSchema, ConfigObject } from '@configly/core';
import { Download, Play, Trash2, FileJson, Info } from 'lucide-react';

function App() {
  const [schema, setSchema] = useState<JSONSchema | null>(null);
  const [config, setConfig] = useState<ConfigObject | null>(null);
  const [outputFormat, setOutputFormat] = useState<'json' | 'yaml'>('yaml');
  const [error, setError] = useState<string | null>(null);

  const {
    builder,
    isReady,
    generateConfig,
    loadConfig,
    clearWorkspace,
  } = useSchemaBuilder(schema);

  const handleSchemaUpload = useCallback((uploadedSchema: JSONSchema) => {
    setSchema(uploadedSchema);
    setConfig(null);
    setError(null);
  }, []);

  const handleConfigUpload = useCallback(
    (uploadedConfig: ConfigObject) => {
      if (!builder) {
        setError('Please upload a schema first');
        return;
      }

      try {
        loadConfig(uploadedConfig);
        setError(null);
      } catch (err) {
        setError(
          `Failed to load config: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    },
    [builder, loadConfig]
  );

  const handleGenerate = useCallback(() => {
    try {
      const generated = generateConfig(outputFormat);
      setConfig(generated);
      setError(null);
    } catch (err) {
      setError(
        `Failed to generate config: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }, [generateConfig, outputFormat]);

  const handleDownload = useCallback(() => {
    if (!config || !builder) return;

    const formatted = builder.formatConfig(config, outputFormat);
    const blob = new Blob([formatted], {
      type: outputFormat === 'json' ? 'application/json' : 'text/yaml',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `config.${outputFormat}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [config, builder, outputFormat]);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">🧩 Schema Config Builder</h1>
          <p className="text-sm opacity-90 mt-1">
            Visual configuration editor from JSON Schema
          </p>
        </div>
      </header>

      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3 flex-wrap">
          <SchemaUploader onSchemaLoad={handleSchemaUpload} />

          {isReady && (
            <>
              <div className="h-8 w-px bg-gray-300" />
              <ConfigUploader onConfigLoad={handleConfigUpload} />

              <div className="flex-1" />

              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-700 font-medium">
                  Output:
                </label>
                <select
                  value={outputFormat}
                  onChange={(e) =>
                    setOutputFormat(e.target.value as 'json' | 'yaml')
                  }
                  className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="json">JSON</option>
                  <option value="yaml">YAML</option>
                </select>
              </div>

              <button
                onClick={handleGenerate}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium"
              >
                <Play size={18} />
                Generate
              </button>

              <button
                onClick={clearWorkspace}
                className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
              >
                <Trash2 size={18} />
                Clear
              </button>

              <button
                onClick={handleDownload}
                disabled={!config}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download size={18} />
                Download
              </button>
            </>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 m-4">
          <div className="flex items-start">
            <Info className="text-red-500 mr-3 flex-shrink-0" size={20} />
            <div>
              <h3 className="text-red-800 font-medium">Error</h3>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {!schema ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md px-4">
              <FileJson className="mx-auto text-gray-400 mb-4" size={64} />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Get Started
              </h2>
              <p className="text-gray-600 mb-6">
                Upload a JSON Schema to automatically generate a visual block
                editor for creating configurations.
              </p>
              <SchemaUploader onSchemaLoad={handleSchemaUpload} size="lg" />
            </div>
          </div>
        ) : (
          <>
            <BlocklyEditor
              builder={builder}
              onWorkspaceChange={handleGenerate}
            />
            <ConfigOutput config={config} format={outputFormat} />
          </>
        )}
      </div>
    </div>
  );
}

export default App;
