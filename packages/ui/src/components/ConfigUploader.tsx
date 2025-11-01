import { useCallback, useRef } from 'react';
import { Upload } from 'lucide-react';
import yaml from 'js-yaml';
import type { ConfigObject } from '@configly/core';

interface ConfigUploaderProps {
  onConfigLoad: (config: ConfigObject) => void;
}

export function ConfigUploader({ onConfigLoad }: ConfigUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      try {
        const text = await file.text();

        // Try JSON first
        let config: ConfigObject;
        try {
          config = JSON.parse(text);
        } catch {
          // If not JSON, try YAML
          try {
            const parsed = yaml.load(text);
            if (typeof parsed === 'object' && parsed !== null) {
              config = parsed as ConfigObject;
            } else {
              throw new Error('Invalid YAML: Expected an object');
            }
          } catch (yamlError) {
            throw new Error(
              `Failed to parse file as JSON or YAML: ${
                yamlError instanceof Error ? yamlError.message : String(yamlError)
              }`
            );
          }
        }

        onConfigLoad(config);
      } catch (error) {
        alert(`Failed to load config: ${error instanceof Error ? error.message : String(error)}`);
      }

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [onConfigLoad]
  );

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,.yaml,.yml"
        onChange={handleFileChange}
        className="hidden"
        id="config-upload"
      />
      <label
        htmlFor="config-upload"
        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors cursor-pointer font-medium"
        title="Upload existing config (JSON or YAML)"
      >
        <Upload size={18} />
        Load Config
      </label>
    </>
  );
}
