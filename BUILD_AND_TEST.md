# Build and Test Guide

## 🚀 Quick Start (5 Minutes)

```bash
# 1. Navigate to project
cd configly

# 2. Install dependencies (this will take 2-3 minutes)
npm install

# 3. Build all packages
npm run build

# 4. Start the development server
npm run dev

# 5. Open your browser to http://localhost:5173
```

That's it! You should see the application running.

---

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js 18+** (check with `node --version`)
- **npm 9+** (check with `npm --version`)
- **Modern browser** (Chrome, Firefox, Safari, Edge)

### Installing Node.js (if needed)

**macOS/Linux:**
```bash
# Using nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
```

**Windows:**
Download from [nodejs.org](https://nodejs.org/)

---

## 🔨 Detailed Build Instructions

### Step 1: Install Dependencies

```bash
cd configly
npm install
```

**What this does:**
- Installs dependencies for all three packages (core, ui, schemas)
- Sets up the monorepo workspace
- Links local packages together

**Expected output:**
```
added 500+ packages in 2-3 minutes
```

**Troubleshooting:**
- If you get permission errors, don't use `sudo`. Fix npm permissions instead.
- If install fails, delete `node_modules` and try again
- Check Node.js version is 18+

### Step 2: Build All Packages

```bash
npm run build
```

**What this does:**
- Compiles TypeScript to JavaScript
- Generates type declaration files (.d.ts)
- Builds the UI with Vite

**Expected output:**
```
> @configly/core@1.0.0 build
> tsc

> @configly/ui@1.0.0 build
> tsc && vite build

vite v5.0.8 building for production...
✓ 150 modules transformed.
dist/index.html                   0.50 kB │ gzip: 0.31 kB
dist/assets/index-abc123.js     250.00 kB │ gzip: 75.00 kB
✓ built in 3.5s
```

**Troubleshooting:**
- If TypeScript errors occur, check that all dependencies are installed
- If Vite build fails, try `npm install` again

### Step 3: Start Development Server

```bash
npm run dev
```

**What this does:**
- Starts Vite dev server on http://localhost:5173
- Enables hot module replacement (HMR)
- Watches for file changes

**Expected output:**
```
  VITE v5.0.8  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

**Troubleshooting:**
- If port 5173 is in use, Vite will use next available port
- Check firewall if you can't access the site

---

## 🧪 Testing the Application

### Manual Testing

#### Test 1: Upload and Generate Config (Helm Chart)

1. Open http://localhost:5173
2. Click **"📁 Upload JSON Schema"**
3. Navigate to `packages/schemas/src/helm-chart.json`
4. Click **Open**

**Expected:** 
- Status shows "✓ Loaded: Helm Chart Values"
- Blockly workspace appears with toolbox categories
- Toolbox shows: Configuration, Objects, Strings, Numbers, Booleans, Arrays

5. Drag **"Helm Chart Values"** block from Configuration category to workspace
6. Fill in some values:
   - Replica Count: 3
   - Repository: nginx
   - Pull Policy: IfNotPresent
   - Tag: 1.21

7. Expand **Image** section (click the connector)
8. Drag **"Container Image"** block and connect it

9. Click **"▶️ Generate"**

**Expected:**
- Right panel shows YAML output
- Output includes your values:
```yaml
replicaCount: 3
image:
  repository: nginx
  pullPolicy: IfNotPresent
  tag: '1.21'
```

10. Change Output dropdown to **"JSON"**

**Expected:**
- Output changes to JSON format
```json
{
  "replicaCount": 3,
  "image": {
    "repository": "nginx",
    "pullPolicy": "IfNotPresent",
    "tag": "1.21"
  }
}
```

11. Click **"💾 Download"**

**Expected:**
- File downloads as `config.json` or `config.yaml`
- File contains your configuration

✅ **Test 1 Passed!**

#### Test 2: Upload and Generate Config (Docker Compose)

1. Click **"🗑️ Clear"** to clear workspace
2. Click **"📁 Upload JSON Schema"**
3. Select `packages/schemas/src/docker-compose.json`

**Expected:**
- New toolbox with Docker Compose blocks
- Configuration category shows "Docker Compose Configuration"

4. Drag **"Docker Compose Configuration"** to workspace
5. Set Version: 3.8
6. Add a service:
   - Drag **"Service"** block to Services section
   - Name: web
   - Image: nginx:latest
   - Restart: unless-stopped

7. Add port mapping:
   - Drag **"Item"** block to Ports section
   - Published: 80
   - Target: 80
   - Protocol: tcp

8. Click **"▶️ Generate"**

**Expected:**
```yaml
version: '3.8'
services:
  - name: web
    image: nginx:latest
    restart: unless-stopped
    ports:
      - published: 80
        target: 80
        protocol: tcp
```

✅ **Test 2 Passed!**

#### Test 3: Load Existing Config

1. Keep Docker Compose schema loaded
2. Create a test config file `test-config.json`:
```json
{
  "version": "3.8",
  "services": [
    {
      "name": "database",
      "image": "postgres:14",
      "restart": "always",
      "environment": [
        {
          "key": "POSTGRES_PASSWORD",
          "value": "secret"
        }
      ]
    }
  ]
}
```

3. Click **"📁 Upload Config"**
4. Select your `test-config.json`

**Expected:**
- Workspace clears and repopulates
- Shows "Docker Compose Configuration" block
- Has one service named "database"
- Service has postgres:14 image
- Environment variable is populated

5. Edit the config:
   - Change image to `postgres:15`
   - Add another environment variable

6. Click **"▶️ Generate"**

**Expected:**
- Output shows updated values
- New environment variable appears

✅ **Test 3 Passed!**

#### Test 4: Error Handling

1. Try uploading an invalid schema:
   - Create `invalid.json` with `{"invalid": "schema"}`
   - Try to upload it

**Expected:**
- Error message appears: "Invalid schema: Schema must have a type, properties, or items"

2. Try uploading invalid config:
   - With Helm schema loaded
   - Create `invalid-config.json` with `{"unknown": "field"}`
   - Try to upload it

**Expected:**
- Error message appears about validation failure

✅ **Test 4 Passed!**

---

## 🔬 Automated Testing

Currently, the project structure supports testing but test files need to be added. Here's how to set up and run tests:

### Setting Up Jest (for Core Library)

```bash
cd packages/core

# Install Jest and related packages
npm install --save-dev jest ts-jest @types/jest

# Create jest.config.js
cat > jest.config.js << 'EOF'
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts'
  ]
};
EOF
```

### Example Test File

Create `packages/core/src/generators/__tests__/BlockGenerator.test.ts`:

```typescript
import { BlockGenerator } from '../BlockGenerator';
import type { JSONSchema } from '../../types';

describe('BlockGenerator', () => {
  it('should generate blocks from simple schema', () => {
    const schema: JSONSchema = {
      type: 'object',
      properties: {
        name: { type: 'string' },
        age: { type: 'number' }
      }
    };

    const generator = new BlockGenerator(schema);
    const result = generator.generate();

    expect(result.blocks.length).toBeGreaterThan(0);
    expect(result.rootBlockType).toBe('config_root');
  });

  it('should handle nested objects', () => {
    const schema: JSONSchema = {
      type: 'object',
      properties: {
        user: {
          type: 'object',
          properties: {
            name: { type: 'string' }
          }
        }
      }
    };

    const generator = new BlockGenerator(schema);
    const result = generator.generate();

    // Should generate root block + nested object block
    expect(result.blocks.length).toBeGreaterThanOrEqual(2);
  });

  it('should generate toolbox with categories', () => {
    const schema: JSONSchema = {
      type: 'object',
      properties: {
        text: { type: 'string' },
        count: { type: 'number' },
        enabled: { type: 'boolean' }
      }
    };

    const generator = new BlockGenerator(schema);
    const result = generator.generate();

    expect(result.toolbox.kind).toBe('categoryToolbox');
    expect(result.toolbox.contents.length).toBeGreaterThan(0);
  });
});
```

### Run Tests

```bash
# Run all tests
npm test

# Run tests for core package only
npm test --workspace=@configly/core

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm test -- --watch
```

---

## 🏗️ Building for Production

### Build for Deployment

```bash
# Clean previous builds
npm run clean

# Build all packages
npm run build

# Preview production build
cd packages/ui
npm run preview
```

**What gets built:**
- `packages/core/dist/` - Compiled TypeScript library
- `packages/ui/dist/` - Optimized React app bundle

### Deploy to Static Hosting

The UI can be deployed to any static hosting service:

#### Option 1: Netlify

```bash
cd packages/ui
npm run build

# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist
```

#### Option 2: Vercel

```bash
cd packages/ui
npm run build

# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

#### Option 3: GitHub Pages

```bash
cd packages/ui
npm run build

# Copy dist/ contents to gh-pages branch
# Or use gh-pages package
npm install -g gh-pages
gh-pages -d dist
```

#### Option 4: AWS S3

```bash
cd packages/ui
npm run build

# Upload to S3
aws s3 sync dist/ s3://your-bucket-name --acl public-read
```

---

## 🐛 Common Issues and Solutions

### Issue 1: "Cannot find module"

**Symptoms:** Import errors when running the app

**Solution:**
```bash
# Clean and reinstall
npm run clean
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Issue 2: TypeScript Compilation Errors

**Symptoms:** Errors during `npm run build`

**Solution:**
```bash
# Check TypeScript version
npx tsc --version

# Should be 5.3+
# If not, update:
npm install -D typescript@latest

# Rebuild
npm run build
```

### Issue 3: Vite Dev Server Won't Start

**Symptoms:** Port already in use

**Solution:**
```bash
# Kill process on port 5173
# macOS/Linux:
lsof -ti:5173 | xargs kill -9

# Windows:
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Or use different port
npm run dev -- --port 3000
```

### Issue 4: Blockly Blocks Not Appearing

**Symptoms:** Empty workspace after schema upload

**Solution:**
1. Open browser DevTools (F12)
2. Check Console for errors
3. Verify schema is valid JSON Schema
4. Check schema has `type: "object"` and `properties`

**Debug in console:**
```javascript
// Check if blocks were generated
console.log('Blocks:', Blockly.getDefinition('config_root'));
```

### Issue 5: Build Fails with Memory Error

**Symptoms:** "JavaScript heap out of memory"

**Solution:**
```bash
# Increase Node memory
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build
```

---

## ✅ Verification Checklist

Use this checklist to verify everything works:

### Build Verification
- [ ] `npm install` completes without errors
- [ ] `npm run build` compiles successfully
- [ ] No TypeScript errors
- [ ] `packages/core/dist/` contains compiled files
- [ ] `packages/ui/dist/` contains built app

### Functionality Verification
- [ ] Dev server starts on http://localhost:5173
- [ ] Can upload Helm schema
- [ ] Can upload Docker Compose schema
- [ ] Can drag blocks to workspace
- [ ] Can generate JSON output
- [ ] Can generate YAML output
- [ ] Can download config files
- [ ] Can upload and edit existing configs
- [ ] Can clear workspace
- [ ] Error messages appear for invalid inputs

### Browser Compatibility
- [ ] Works in Chrome
- [ ] Works in Firefox
- [ ] Works in Safari
- [ ] Works in Edge

---

## 📊 Performance Benchmarks

Expected performance on modern hardware:

| Operation | Time | Notes |
|-----------|------|-------|
| Install dependencies | 2-3 min | First time only |
| Build all packages | 5-10 sec | TypeScript + Vite |
| Start dev server | 1-2 sec | Vite is fast! |
| Generate blocks | <100ms | Most schemas |
| Generate config | <10ms | Typical workspace |
| Load config | <50ms | Including rendering |

---

## 🎓 Learning Path

### Day 1: Get It Running
1. ✅ Install dependencies
2. ✅ Build project
3. ✅ Start dev server
4. ✅ Try both example schemas
5. ✅ Generate and download configs

### Day 2: Understand the Code
1. ✅ Read README.md
2. ✅ Read ARCHITECTURE.md
3. ✅ Browse core library code
4. ✅ Try modifying UI components

### Day 3: Extend and Customize
1. ✅ Create custom schema
2. ✅ Test with your own data
3. ✅ Modify color schemes
4. ✅ Add custom field types

---

## 🚀 Next Steps

After successful build and test:

1. **Deploy** - Choose a hosting platform and deploy
2. **Customize** - Modify UI to match your brand
3. **Integrate** - Embed in your application
4. **Extend** - Add custom block generators
5. **Share** - Let others use your schemas

---

## 📞 Getting Help

If you encounter issues:

1. **Check this guide** - Most common issues are covered
2. **Check browser console** - Look for error messages
3. **Check terminal output** - Build errors appear here
4. **Read the docs** - README.md and ARCHITECTURE.md
5. **Debug** - Use browser DevTools

---

## ✨ Success Criteria

You'll know everything works when:

✅ All commands run without errors
✅ Dev server starts successfully
✅ You can upload both example schemas
✅ Blocks appear in the workspace
✅ You can generate and download configs
✅ You can load and edit existing configs

**Happy building! 🎉**
