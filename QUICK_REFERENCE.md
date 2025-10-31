# Quick Reference Guide

## 🚀 5-Minute Quick Start

```bash
cd configly
npm install
npm run build
npm run dev
# Open http://localhost:5173
```

## 📦 Package Overview

| Package | Purpose | Entry Point |
|---------|---------|-------------|
| `@configly/core` | Library for any app | `packages/core/src/index.ts` |
| `@configly/ui` | React application | `packages/ui/src/App.tsx` |
| `@configly/schemas` | Example schemas | `packages/schemas/src/*.json` |

## 🔑 Core API Cheat Sheet

### Initialize Builder
```typescript
import { SchemaConfigBuilder } from '@configly/core';

const builder = new SchemaConfigBuilder(schema, workspace);
```

### Generate Blocks
```typescript
const result = builder.generateBlocks();
builder.registerBlocks(Blockly);
builder.updateToolbox();
```

### Generate Config
```typescript
const config = builder.generateConfig();
const yaml = builder.formatConfig(config, 'yaml');
```

### Load Config
```typescript
builder.loadConfig(existingConfig);
```

### Validate
```typescript
const result = builder.validateConfig(config);
if (!result.valid) {
  console.error(result.errors);
}
```

## 🎨 React Hooks

```typescript
import { useSchemaBuilder } from '@configly/ui';

const { builder, isReady, generateConfig, loadConfig } = useSchemaBuilder(schema);
```

## 📝 Common Tasks

### Create Custom Schema
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "My Config",
  "type": "object",
  "properties": {
    "name": { "type": "string" },
    "age": { "type": "integer", "minimum": 0 }
  },
  "required": ["name"]
}
```

### Customize Block Colors
```typescript
const builder = new SchemaConfigBuilder(schema, workspace, {
  colorScheme: {
    string: 160,
    number: 290,
    boolean: 210
  }
});
```

### Handle Errors
```typescript
try {
  const config = builder.generateConfig();
} catch (error) {
  console.error('Generation failed:', error);
}
```

## 📂 File Locations

| What | Where |
|------|-------|
| Core library source | `packages/core/src/` |
| React components | `packages/ui/src/components/` |
| Example schemas | `packages/schemas/src/` |
| Documentation | `README.md`, `ARCHITECTURE.md` |
| TypeScript types | `packages/core/src/types/` |

## 🛠️ Build Commands

```bash
# Install
npm install

# Build all
npm run build

# Build core only
npm run build --workspace=@configly/core

# Dev mode
npm run dev

# Test
npm test

# Lint
npm run lint

# Clean
npm run clean
```

## 🌐 Integration Patterns

### Pattern 1: Standalone App
```bash
cd packages/ui
npm run build
# Deploy dist/ to static hosting
```

### Pattern 2: Embed in React
```tsx
import { useSchemaBuilder } from './hooks/useSchemaBuilder';

function MyComponent() {
  const { builder, generateConfig } = useSchemaBuilder(schema);
  // Use in your UI
}
```

### Pattern 3: Core Library Only
```typescript
import { SchemaConfigBuilder } from '@configly/core';

const builder = new SchemaConfigBuilder(schema, workspace);
// Full control
```

## 🔍 Troubleshooting

| Issue | Solution |
|-------|----------|
| Blocks don't appear | Check schema is valid, type is "object" |
| Config is empty | Ensure blocks are connected |
| Load config fails | Validate config against schema first |
| Build errors | Run `npm install` and check Node version (18+) |

## 📚 Learning Path

1. **Beginner**: Read README.md, try examples
2. **Intermediate**: Build custom schema, integrate in app
3. **Advanced**: Read ARCHITECTURE.md, extend library

## 🎯 Common Use Cases

### DevOps Tools
- Kubernetes manifests
- Docker configs
- CI/CD pipelines
- Terraform variables

### Application Config
- Feature flags
- User settings
- API endpoints
- Database connections

### Data Management
- Form definitions
- Workflow configs
- Report templates
- Data transformations

## 📞 Getting Help

- **Documentation**: `README.md`, `ARCHITECTURE.md`
- **Examples**: `packages/schemas/src/`
- **Types**: `packages/core/src/types/`
- **Source**: Browse the code!

## ✨ Pro Tips

1. **Use TypeScript** - Full type safety
2. **Validate early** - Check schemas before use
3. **Start simple** - Test with small schemas first
4. **Pre-generate** - For static schemas, generate at build time
5. **Document well** - Use schema descriptions for tooltips

## 🎓 Example Workflows

### Workflow 1: Create New Config
1. Upload schema
2. Drag blocks
3. Generate config
4. Download

### Workflow 2: Edit Existing
1. Upload schema
2. Upload config
3. Edit blocks
4. Re-export

### Workflow 3: Template Based
1. Upload schema
2. Load template config
3. Customize
4. Save as new

## 🔗 Quick Links

- **Main README**: [README.md](./README.md)
- **Architecture**: [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Core Source**: [packages/core/src/](./packages/core/src/)
- **UI Source**: [packages/ui/src/](./packages/ui/src/)
- **Schemas**: [packages/schemas/src/](./packages/schemas/src/)

---

**Keep this guide handy for quick reference! 📌**
