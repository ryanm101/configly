import { useCallback, useRef } from 'react';
import { Upload } from 'lucide-react';
import type { JSONSchema } from '@configly/core';

interface SchemaUploaderProps {
  onSchemaLoad: (schema: JSONSchema) => void;
  size?: 'sm' | 'md' | 'lg';
}

export function SchemaUploader({ onSchemaLoad, size = 'md' }: SchemaUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const schema = JSON.parse(text);
        onSchemaLoad(schema);
      } catch (error) {
        alert(`Failed to load schema: ${error instanceof Error ? error.message : String(error)}`);
      }

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [onSchemaLoad]
  );

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        className="hidden"
        id="schema-upload"
      />
      <label
        htmlFor="schema-upload"
        className={`flex items-center gap-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors cursor-pointer font-medium ${sizeClasses[size]}`}
      >
        <Upload size={size === 'lg' ? 24 : 18} />
        Upload Schema
      </label>
    </>
  );
}
