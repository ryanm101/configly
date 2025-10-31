# Getting Started with Schema Config Builder

## 📦 What You Downloaded

You have the complete **Schema Config Builder** TypeScript monorepo - a professional tool that generates visual Blockly editors from JSON Schema.

**File:** `configly.zip` (52 KB)

## 🚀 Quick Start (5 Minutes)

### Step 1: Extract the Zip

```bash
unzip configly.zip
cd configly
```

### Step 2: Install Dependencies

**Option A - Automatic (Recommended):**

```bash
# Mac/Linux
chmod +x setup.sh
./setup.sh

# Windows
setup.bat
```

**Option B - Manual:**

```bash
npm install
cd packages/core && npm install && cd ../..
cd packages/ui && npm install && cd ../..
```

### Step 3: Build the Project

```bash
npm run build
```

This compiles TypeScript to JavaScript and builds the UI.

### Step 4: Start Development Server

```bash
npm run dev
```

Open your browser to: **http://localhost:5173**

## ✅ Verify It Works

1. Click **"Upload Schema"**
2. Select `packages/schemas/src/helm-chart.json`
3. Drag blocks to create a configuration
4. Click **"Generate"** to see YAML output
5. Click **"Download"** to save

## 📁 Project Structure

```
configly/
├── packages/
│   ├── core/          ← TypeScript library
│   ├── ui/            ← React application
│   └── schemas/       ← Example schemas (Helm, Docker)
└── Documentation files
```

## 🛠️ Common Commands

```bash
# Install everything
npm install

# Build all packages
npm run build

# Start dev server
npm run dev

# Clean build artifacts
npm run clean

# Lint code
npm run lint
```

## 📚 Documentation

- **README.md** - Complete documentation
- **BUILD_AND_TEST.md** - Detailed build instructions
- **ARCHITECTURE.md** - Technical architecture
- **PROJECT_STRUCTURE.md** - Directory structure
- **QUICK_REFERENCE.md** - Quick reference guide

## 🐛 Troubleshooting

### "Cannot find module" errors

```bash
npm run clean
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Port 5173 already in use

```bash
# Kill the process
lsof -ti:5173 | xargs kill -9

# Or use different port
npm run dev -- --port 3000
```

### TypeScript errors

```bash
# Check versions
node --version  # Should be 18+
npm --version   # Should be 9+

# Update TypeScript
npm install -D typescript@latest
npm run build
```

## 💡 What's Inside

### Core Library (`packages/core/`)
- **BlockGenerator** - Converts JSON Schema to Blockly blocks
- **ConfigGenerator** - Extracts config from workspace
- **ConfigLoader** - Loads existing configs for editing
- **SchemaValidator** - Validates schemas and configs

### React UI (`packages/ui/`)
- **Upload Schema** - Load any JSON Schema
- **Upload Config** - Edit existing configurations
- **Visual Editor** - Drag-and-drop Blockly interface
- **Real-time Output** - JSON/YAML preview
- **Download** - Save generated configs

### Example Schemas (`packages/schemas/`)
- **helm-chart.json** - Kubernetes Helm Chart values
- **docker-compose.json** - Docker Compose v3.8 file

## 🎯 Next Steps

1. ✅ **Try the examples** - Upload both schemas and create configs
2. ✅ **Read the docs** - Check out README.md and ARCHITECTURE.md
3. ✅ **Create custom schema** - Make your own JSON Schema
4. ✅ **Integrate** - Embed in your application
5. ✅ **Customize** - Modify UI and add features

## 🔗 Key Features

- ✅ **TypeScript** - Full type safety
- ✅ **React 18** - Modern React with hooks
- ✅ **Tailwind CSS** - Utility-first styling
- ✅ **Vite** - Lightning-fast build tool
- ✅ **Monorepo** - Well-organized structure
- ✅ **Reusable** - Core library works anywhere
- ✅ **Config Loading** - Edit existing configs
- ✅ **Validation** - AJV JSON Schema validation

## 📞 Need Help?

1. Check **BUILD_AND_TEST.md** for detailed instructions
2. Read the **ARCHITECTURE.md** for technical details
3. Look at example schemas in `packages/schemas/src/`
4. Check browser console for error messages

## 🎉 Success Criteria

You'll know it's working when:

- ✅ `npm install` completes without errors
- ✅ `npm run build` compiles successfully
- ✅ Dev server starts at http://localhost:5173
- ✅ You can upload schemas
- ✅ Blocks appear in workspace
- ✅ You can generate and download configs

## 🚀 Production Deployment

```bash
# Build for production
npm run build

# Deploy the UI
cd packages/ui/dist
# Upload contents to any static hosting service
```

The `dist/` folder contains the complete built application ready to deploy!

---

**Ready to build amazing configuration tools! 🎨**

For complete documentation, see **README.md** in the project root.
