# Architecture Documentation

## Overview

Schema Config Builder is designed as a modular, reusable system with clear separation of concerns between the core library, UI layer, and schema definitions.

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     User Interface                       │
│                    (@configly/ui)          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Schema     │  │   Blockly    │  │   Config     │ │
│  │   Uploader   │  │   Editor     │  │   Output     │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
                         ↕
┌─────────────────────────────────────────────────────────┐
│                    Core Library                          │
│             (@configly/core)               │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │         SchemaConfigBuilder                      │  │
│  │  (Main orchestration class)                      │  │
│  └──────────────────────────────────────────────────┘  │
│           ↓            ↓            ↓                   │
│  ┌───────────┐  ┌──────────┐  ┌────────────┐          │
│  │  Block    │  │ Config   │  │  Schema    │          │
│  │ Generator │  │Generator │  │ Validator  │          │
│  └───────────┘  └──────────┘  └────────────┘          │
│           ↓            ↓                                │
│  ┌───────────────────────────────────────┐             │
│  │         Config Loader                 │             │
│  └───────────────────────────────────────┘             │
└─────────────────────────────────────────────────────────┘
                         ↕
┌─────────────────────────────────────────────────────────┐
│                    Schema Repository                     │
│             (@configly/schemas)            │
│                                                          │
│  • helm-chart.json      (Kubernetes Helm)               │
│  • docker-compose.json  (Docker Compose)                │
│  • [user schemas]       (Custom schemas)                │
└─────────────────────────────────────────────────────────┘
```

## Component Responsibilities

### Core Library Components

#### 1. SchemaConfigBuilder
**Purpose:** Main API that orchestrates all operations

**Responsibilities:**
- Initialize and manage component lifecycle
- Coordinate between generators and validators
- Provide simple API for embedding applications
- Handle workspace management

**Key Methods:**
```typescript
generateBlocks()      // Create Blockly blocks from schema
registerBlocks()      // Register blocks with Blockly
updateToolbox()       // Update Blockly toolbox
generateConfig()      // Extract config from workspace
loadConfig()          // Load config into workspace
validateConfig()      // Validate config against schema
```

#### 2. BlockGenerator
**Purpose:** Convert JSON Schema to Blockly block definitions

**Responsibilities:**
- Parse JSON Schema recursively
- Generate block definitions for each schema element
- Create toolbox categories
- Apply color schemes
- Handle nested structures

**Algorithm:**
```
1. Start with root schema (must be object type)
2. For each property:
   a. Determine type (string, number, boolean, enum, object, array)
   b. Generate appropriate block definition
   c. If nested (object/array), recurse
3. Categorize blocks by type
4. Generate toolbox configuration
5. Return block definitions and toolbox
```

#### 3. ConfigGenerator
**Purpose:** Extract configuration from Blockly workspace

**Responsibilities:**
- Read blocks from workspace
- Extract field values
- Handle nested objects and arrays
- Format as JSON or YAML
- Apply validation

**Algorithm:**
```
1. Find root block in workspace
2. For each property in schema:
   a. Read field value from block
   b. If primitive: extract and convert type
   c. If array: iterate statement blocks
   d. If object: recurse into nested block
3. Build configuration object
4. Format as requested (JSON/YAML)
```

#### 4. SchemaValidator
**Purpose:** Validate schemas and configurations

**Responsibilities:**
- Validate uploaded JSON Schemas
- Validate generated configs against schema
- Provide detailed error messages
- Use AJV for standard JSON Schema validation

#### 5. ConfigLoader
**Purpose:** Load existing configurations into workspace

**Responsibilities:**
- Parse configuration objects
- Create and populate blocks
- Connect blocks correctly
- Handle arrays and nested objects
- Enable edit workflows

**Algorithm:**
```
1. Clear workspace
2. Create root block
3. For each property in config:
   a. If primitive: set field value
   b. If array: create item blocks and connect
   c. If object: create nested block and recurse
4. Initialize and render all blocks
```

### UI Components

#### React Component Structure

```
App (Main container)
├── SchemaUploader (File upload for schemas)
├── ConfigUploader (File upload for configs)
├── Toolbar (Actions and settings)
├── BlocklyEditor (Blockly workspace wrapper)
│   └── useSchemaBuilder hook
└── ConfigOutput (Display generated config)
```

## Data Flow

### 1. Schema Upload Flow

```
User selects file
      ↓
SchemaUploader reads file
      ↓
Parse JSON
      ↓
SchemaValidator validates
      ↓
SchemaConfigBuilder initialized
      ↓
BlockGenerator generates blocks
      ↓
Blocks registered with Blockly
      ↓
Toolbox updated
      ↓
User can drag blocks
```

### 2. Config Generation Flow

```
User drags blocks in workspace
      ↓
User clicks Generate
      ↓
ConfigGenerator reads workspace
      ↓
Extract values from blocks
      ↓
Build configuration object
      ↓
Validate against schema
      ↓
Format as JSON/YAML
      ↓
Display in output panel
```

### 3. Config Loading Flow

```
User uploads config file
      ↓
Parse JSON/YAML
      ↓
Validate against schema
      ↓
ConfigLoader clears workspace
      ↓
Create root block
      ↓
Populate blocks from config
      ↓
Connect blocks
      ↓
Render workspace
      ↓
User can edit
```

## Key Design Decisions

### 1. Monorepo Structure
**Why:** Enables code sharing, consistent versioning, and easier development while allowing independent deployment of packages.

### 2. TypeScript Throughout
**Why:** Type safety prevents runtime errors, enables better IDE support, and makes the library more maintainable.

### 3. Core Library Framework-Agnostic
**Why:** Can be used with React, Vue, Angular, or vanilla JS. Maximum reusability.

### 4. Build-Time vs Runtime Generation
**Decision:** Runtime generation by default
**Why:** More flexible for dynamic schemas, but can be pre-generated for performance if schema is static.

### 5. Workspace Management
**Decision:** Workspace owned by application, passed to library
**Why:** Gives applications control over Blockly configuration while library handles block logic.

## Extension Points

### 1. Custom Block Generators
```typescript
const builder = new SchemaConfigBuilder(schema, workspace, {
  customGenerators: {
    'date': (schema, blockName) => {
      // Custom date block logic
    }
  }
});
```

### 2. Custom Value Extractors
```typescript
const config = builder.generateConfig({
  customExtractors: {
    'DATE_FIELD': (block, schema) => {
      return new Date(block.getFieldValue('DATE_FIELD'));
    }
  }
});
```

### 3. Custom Color Schemes
```typescript
const builder = new SchemaConfigBuilder(schema, workspace, {
  colorScheme: {
    object: 230,
    string: 160,
    // ...
  }
});
```

## Performance Considerations

### Block Generation
- Generated blocks are cached
- Large schemas (100+ properties) may take 1-2 seconds
- Pre-generation recommended for static schemas

### Workspace Rendering
- Blockly handles rendering efficiently
- Large workspaces (100+ blocks) may be slow
- Consider pagination for very large configs

### Config Generation
- Fast for typical configs (<1ms)
- Slows with deeply nested structures (10+ levels)
- Validation adds ~10-50ms depending on complexity

## Security Considerations

### Schema Upload
- Validate schema structure before processing
- Limit schema size (recommend <1MB)
- Sanitize all user inputs

### Config Upload
- Validate against schema before loading
- Don't execute any code from configs
- Sanitize values before rendering

### Output Generation
- Config output is safe (no code execution)
- YAML output uses simple formatter (no dynamic evaluation)
- For production, use trusted YAML library (js-yaml)

## Testing Strategy

### Unit Tests
- Each generator and validator separately
- Mock Blockly workspace for testing
- Test edge cases (empty schemas, deeply nested)

### Integration Tests
- Full schema-to-config-to-schema round trips
- Test with real example schemas
- Validate UI component integration

### E2E Tests
- Upload schemas and generate configs
- Load configs and edit
- Download generated configs

## Deployment Options

### 1. Standalone Web App
Host the React UI as a static site:
```bash
npm run build
# Deploy dist/ folder to any static host
```

### 2. Embedded Component
Use as a React component in your app:
```typescript
import { SchemaEditor } from '@configly/ui';
```

### 3. Library Only
Use core library in your own UI:
```typescript
import { SchemaConfigBuilder } from '@configly/core';
```

### 4. CLI Tool (Future)
Generate configs from command line:
```bash
configly generate config.json --schema=schema.json
```

## Scalability

### Horizontal Scaling
- Pure client-side: no backend needed
- Can be served from CDN
- Each user session is independent

### Large Schemas
- Supports schemas with 1000+ properties
- May need UI pagination for usability
- Consider breaking into multiple schemas

### Large Configs
- Handles configs with 10,000+ lines
- Blockly workspace may slow down
- Consider splitting into multiple configs

## Future Architecture Changes

### Planned Improvements
1. **Web Workers** - Generate blocks in background
2. **Virtual Scrolling** - Handle large toolboxes
3. **Lazy Loading** - Load block definitions on demand
4. **Caching** - Cache generated blocks in localStorage
5. **Server Mode** - Optional backend for team collaboration

### Extension Ideas
1. **Plugin System** - Community contributed block types
2. **Theme Support** - Custom Blockly themes
3. **Collaboration** - Real-time multi-user editing
4. **Version Control** - Track config changes over time
5. **Templates** - Predefined config templates

## Troubleshooting

### Common Issues

**Blocks don't appear**
- Check schema is valid JSON Schema
- Verify schema type is "object"
- Check browser console for errors

**Config generation fails**
- Ensure all required blocks are present
- Check for disconnected blocks
- Validate block connections

**Loading config fails**
- Validate config against schema first
- Check all required fields present
- Verify data types match schema

**Performance issues**
- Reduce schema depth if possible
- Consider pre-generating blocks
- Use pagination for large configs

## Contact & Support

For architecture questions or suggestions:
- Open an issue on GitHub
- Join discussions
- Contribute improvements

---

**Last Updated:** 2024
**Version:** 1.0.0
