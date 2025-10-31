# Schema Config Builder

A TypeScript/React library and application that automatically generates visual Blockly editors from JSON Schema, enabling non-technical users to create validated configurations through drag-and-drop interfaces.

## 🎯 Overview

This project transforms JSON Schemas into interactive visual editors, eliminating the need for manual configuration file editing. Perfect for DevOps tools, application settings, CI/CD pipelines, and any scenario requiring structured configuration.

## 📦 Packages

This is a monorepo containing three packages:

### `@configly/core`

Core TypeScript library for generating Blockly blocks from JSON Schema.

**Features:**
- Schema-to-blocks generation
- Config-to-blocks loading (edit existing configs)
- Blocks-to-config extraction
- Schema validation with AJV
- TypeScript types for extensibility
- Zero React dependencies (can be used with any framework)

**Installation:**
```bash
npm install @configly/core blockly
```

**Basic Usage:**
```typescript
import * as Blockly from 'blockly';
import { SchemaConfigBuilder } from '@configly/core';

// Your JSON Schema
const schema = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    age: { type: 'number' }
  }
};

// Create workspace
const workspace = Blockly.inject('blocklyDiv', { /* config */ });

// Initialize builder
const builder = new SchemaConfigBuilder(schema, workspace);

// Generate blocks
const result = builder.generateBlocks();

// Register with Blockly
builder.registerBlocks(Blockly);
builder.updateToolbox();

// Later, generate config from workspace
const config = builder.generateConfig();
console.log(config); // { name: "...", age: 123 }

// Load existing config into workspace
builder.loadConfig(existingConfig);
```

### `@configly/ui`

React application providing a complete UI for schema-based configuration building.

**Features:**
- Schema upload interface
- Config upload/edit capability
- Real-time visual editor
- JSON/YAML output
- Download generated configs
- Error handling and validation
- Responsive design with Tailwind CSS

**Run Development Server:**
```bash
cd packages/ui
npm run dev
```

### `@configly/schemas`

Example schemas for common DevOps use cases:

- **helm-chart.json** - Kubernetes Helm Chart values
- **docker-compose.json** - Docker Compose configuration

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm 9+
- Modern web browser

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/configly
cd configly

# Install dependencies
npm install

# Build all packages
npm run build

# Start development server
npm run dev
```

### Using Example Schemas

1. Start the dev server: `npm run dev`
2. Open http://localhost:5173
3. Click "Upload Schema"
4. Select `packages/schemas/src/helm-chart.json` or `docker-compose.json`
5. Drag blocks to create your configuration
6. Click "Generate" to see output
7. Click "Download" to save

## 🏗️ Architecture

```
User uploads JSON Schema
         ↓
BlockGenerator parses schema
         ↓
Generates Blockly block definitions
         ↓
User drags blocks in workspace
         ↓
ConfigGenerator extracts values
         ↓
Output as JSON/YAML
```

### Core Components

1. **BlockGenerator**
   - Parses JSON Schema
   - Creates Blockly block definitions
   - Generates toolbox categories
   - Handles nested objects/arrays

2. **ConfigGenerator**
   - Reads Blockly workspace
   - Extracts block values
   - Validates against schema
   - Formats as JSON/YAML

3. **SchemaValidator**
   - Validates uploaded schemas
   - Validates generated configs
   - Uses AJV for JSON Schema validation

4. **ConfigLoader**
   - Loads existing configs into workspace
   - Populates blocks from data
   - Enables editing workflows

## 📚 Documentation

### Creating Custom Schemas

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "My Configuration",
  "type": "object",
  "properties": {
    "setting": {
      "type": "string",
      "description": "A configuration setting"
    }
  },
  "required": ["setting"]
}
```

### Supported Schema Features

✅ **Types:**
- `string` - Text input
- `number`/`integer` - Number input with min/max
- `boolean` - Checkbox
- `enum` - Dropdown selection
- `object` - Nested configuration
- `array` - Lists of items

✅ **Validation:**
- `required` - Required fields
- `minimum`/`maximum` - Number bounds
- `minLength`/`maxLength` - String length
- `pattern` - Regex validation
- `default` - Default values

✅ **Metadata:**
- `title` - Display names
- `description` - Help tooltips
- `$id` - Schema identification

### Advanced Usage

#### Custom Block Colors

```typescript
const builder = new SchemaConfigBuilder(schema, workspace, {
  colorScheme: {
    object: 230,
    string: 160,
    number: 290,
    boolean: 210,
    array: 120
  }
});
```

#### Custom Value Extractors

```typescript
const config = builder.generateConfig({
  customExtractors: {
    SPECIAL_FIELD: (block, schema) => {
      // Custom extraction logic
      return block.getFieldValue('SPECIAL_FIELD').toUpperCase();
    }
  }
});
```

#### Loading Configs

```typescript
// Load existing config for editing
try {
  builder.loadConfig({
    name: "Existing Config",
    version: "1.0.0"
  });
} catch (error) {
  console.error("Invalid config:", error);
}
```

## 🎨 UI Customization

The React UI is built with Tailwind CSS and can be customized by modifying:

- `packages/ui/tailwind.config.js` - Theme colors, fonts
- `packages/ui/src/App.tsx` - Layout and structure
- `packages/ui/src/components/` - Individual components

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests for specific package
npm test --workspace=@configly/core
```

## 📦 Building for Production

```bash
# Build all packages
npm run build

# Build specific package
npm run build --workspace=@configly/core

# Build and preview UI
cd packages/ui
npm run build
npm run preview
```

## 🔌 Embedding in Your App

### Option 1: Use the Core Library

```typescript
import { SchemaConfigBuilder } from '@configly/core';

// Initialize in your app
const builder = new SchemaConfigBuilder(schema, workspace);
builder.generateBlocks();
builder.registerBlocks(Blockly);
```

### Option 2: Embed the React Component

```tsx
import { SchemaEditor } from '@configly/ui';

function MyApp() {
  return (
    <SchemaEditor
      schema={mySchema}
      onConfigChange={(config) => console.log(config)}
    />
  );
}
```

### Option 3: Build-Time Generation

Generate blocks at build time for static schemas:

```typescript
// prebuild.ts
import { BlockGenerator } from '@configly/core';
import * as fs from 'fs';

const schema = JSON.parse(fs.readFileSync('schema.json', 'utf-8'));
const generator = new BlockGenerator(schema);
const result = generator.generate();

fs.writeFileSync('generated-blocks.json', JSON.stringify(result.blocks));
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- [Google Blockly](https://developers.google.com/blockly) - Visual programming framework
- [AJV](https://ajv.js.org/) - JSON Schema validator
- [React](https://react.dev/) - UI library
- [Vite](https://vitejs.dev/) - Build tool

## 🐛 Known Limitations

- `$ref` references not yet supported (planned)
- `oneOf`/`anyOf`/`allOf` not yet supported (planned)
- Circular references not supported
- Maximum nesting depth of 10 levels

## 🗺️ Roadmap

- [ ] Support for `$ref` schema references
- [ ] Support for `oneOf`/`anyOf`/`allOf`
- [ ] Custom block templates
- [ ] Block search/filter
- [ ] Undo/redo functionality
- [ ] Workspace state persistence
- [ ] OpenAPI schema support
- [ ] GraphQL schema support
- [ ] Export to TypeScript types
- [ ] CLI tool for schema validation
- [ ] VS Code extension

## 📞 Support

- 📖 [Documentation](./docs)
- 🐛 [Issue Tracker](https://github.com/your-org/configly/issues)
- 💬 [Discussions](https://github.com/your-org/configly/discussions)

## ⭐ Star History

If you find this project useful, please consider giving it a star on GitHub!

---

**Made with ❤️ by the Schema Config Builder team**
