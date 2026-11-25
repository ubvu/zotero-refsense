# RefSense - AI Metadata Extractor for Zotero

A powerful Zotero 7 plugin that extracts bibliographic metadata from PDF files using AI (OpenAI GPT or local Ollama models) and intelligently manages parent items.

## ✨ Features

### 🔘 **PDF Reader Integration**
- **Floating Button**: "📄 RefSense" button automatically appears in PDF reader
- **Keyboard Shortcut**: Ctrl+Shift+E for quick access
- **Auto-Detection**: Automatically detects PDF reader windows

### 📋 **Item List Context Menu**
- **Smart Menu**: Right-click context menu for PDFs without parent items
- **Contextual Display**: "📄 RefSense: Extract Bibliographic Info" menu appears only for applicable PDFs
- **Multi-Selection**: Supports selecting from multiple PDFs when multiple items are chosen
- **Unified Workflow**: Same extraction process as PDF reader integration

### 🤖 **AI-Powered Extraction**
- **OpenAI GPT-4 Turbo**: High-precision metadata extraction
- **Local Ollama Models**: Privacy-focused local processing
- **Smart Prompting**: Optimized prompts for academic paper analysis
- **Robust Error Handling**: Retry logic with exponential backoff

### 📄 **Advanced PDF Processing**
- **Multi-Method Text Extraction**: 6 different extraction methods for maximum compatibility
- **Quality Validation**: Binary filtering and academic content scoring
- **Flexible Page Selection**: First page, current page, or custom range
- **Fallback System**: Comprehensive text extraction with quality verification

### 🧠 **Intelligent Parent Item Management**
- **Smart Button Display**: RefSense button only appears for PDFs without parent items
- **Duplicate Detection**: Checks for existing parent items using DOI and title matching
- **Smart Update Options**: 3-choice dialog (Update/Create New/Cancel) when parent exists
- **Field-by-Field Comparison**: Visual side-by-side metadata comparison with color coding
- **Selective Updates**: Choose which fields to update with radio buttons
- **Batch Operations**: "Select All Existing" or "Select All New" options
- **Fallback System**: Native dialog support when DOM access fails

### 📥 **Seamless Zotero Integration**
- **Automatic Parent Creation**: Generate Zotero items with extracted metadata
- **PDF Linking**: Establish proper parent-child relationships
- **Transaction Management**: Database integrity with rollback support
- **Field Mapping**: Complete mapping to Zotero fields (title, authors, year, journal, DOI, etc.)

### ⚙️ **Comprehensive Settings**
- **CSP-Compatible Settings**: Prompt-based configuration system that works with Zotero's security policies
- **Dynamic UI**: Backend-specific settings sections that show/hide based on selection
- **API Key Management**: Secure Base64 encoding, masking, and preservation of existing values
- **Connection Testing**: Validate API connectivity and model availability
- **Model Selection**: Choose from available AI models with automatic detection
- **Step-by-Step Configuration**: User-friendly guided setup process

## 🚀 Quick Start

### Installation

1. Download the latest `.xpi` file from the releases page
2. In Zotero 7, go to **Tools → Add-ons**
3. Click the gear icon and select **"Install Add-on From File"**
4. Select the downloaded `.xpi` file
5. Restart Zotero

### Configuration

1. Go to **Tools → Add-ons → RefSense → Options** (or **Tools → RefSense Settings**)
2. The settings dialog will guide you through configuration:
   - Choose your AI backend (OpenAI or Ollama)
   - Enter API keys (securely masked and encoded)
   - Select models from available options
   - Configure page extraction preferences
3. Each setting includes validation and helpful prompts
4. Test connection to ensure everything works

### Basic Usage

**Method 1: PDF Reader**
1. **Open a PDF** in Zotero's PDF reader (must be a PDF without existing parent item)
2. **Look for the RefSense button** (📄) in the top-right corner, or press **Ctrl+Shift+E**
3. **Click the button** - AI processing will start automatically
4. **Wait for extraction** - the plugin uses 6 different methods to extract text and validate quality
5. **Review metadata** - a preview dialog shows the extracted bibliographic information
6. **Confirm creation** - a new parent item will be created and linked to your PDF

**Method 2: Item List Context Menu**
1. **Right-click a PDF** in Zotero's item list (must be a PDF without existing parent item)
2. **Select "📄 RefSense: Extract Bibliographic Info"** from the context menu
3. **Choose PDF** if multiple PDFs are selected (selection dialog appears)
4. **Wait for extraction** - same AI processing as PDF reader method
5. **Review and confirm** - create parent item without opening the PDF

**Note**: RefSense options only appear for PDFs that don't already have parent items, keeping your interface clean and focused.

## 🔧 Advanced Features

### Field-by-Field Metadata Comparison

When a PDF already has a parent item (rare cases where button appears), RefSense shows a detailed comparison dialog:

```
┌─────────────────────────────────────────────────────────┐
│ Metadata comparison selection                           │
│                                                         │
│ ┌─────────┬─────────────────┬─────────────────────────┐ │
│ │ Field   │ Existing Value  │ New Extracted Value     │ │
│ ├─────────┼─────────────────┼─────────────────────────┤ │
│ │ Title   │ ○ Old Title     │ ● New Extracted Title   │ │
│ │ Authors │ ○ John Doe      │ ● Jane Smith, Bob Lee   │ │
│ │ Year    │ ○ 2023          │ ● 2024                  │ │
│ │ Journal │ ○ (empty)       │ ● Nature Science        │ │
│ └─────────┴─────────────────┴─────────────────────────┘ │
│                                                         │
│ [Select All Existing] [Select All New]                  │
│                           [Apply Selected] [Cancel]     │
└─────────────────────────────────────────────────────────┘
```

### Supported AI Models

**OpenAI**:
- GPT-4 Turbo (recommended)
- GPT-4
- GPT-3.5 Turbo

**Ollama** (local):
- LLaVA models
- Llama models with vision capabilities
- Custom local models

## 🛠️ Development

### Containerized Build (no local Node required)

If you don’t want Node.js or npm on your machine, build inside a container.

- Requirements: Docker or Podman installed
- Output: `build/refsense-YYYYMMDD.HHMM.xpi`

Using Make (recommended):

```bash
# With Docker
make build-xpi

# With Podman
CONTAINER=podman make build-xpi
```

This uses a local directory `.node_modules/` (bind-mounted) so `node_modules/` does not clutter your repo and avoids Docker Desktop volume permission issues on WSL.

Manual commands (alternative):

```bash
# Docker (bind-mount a local .node_modules directory)
mkdir -p .node_modules
docker run --rm \
  -u $(id -u):$(id -g) \
  -v "$PWD":/workspace \
  -v "$PWD/.node_modules":/workspace/node_modules \
  -w /workspace \
  node:18-bullseye sh -c "npm ci && npm run build"

# Podman
mkdir -p .node_modules
podman run --rm \
  -u $(id -u):$(id -g) \
  -v "$PWD":/workspace \
  -v "$PWD/.node_modules":/workspace/node_modules \
  -w /workspace \
  docker.io/library/node:18-bullseye sh -c "npm ci && npm run build"
```

Optional: build and use a local image

```bash
# Build local image
make docker-image

# Build .xpi using the local image
make build-xpi-image
```

Troubleshooting (WSL + Docker Desktop)
- If you see EACCES errors for `/workspace/node_modules`, ensure `.node_modules/` exists and is writable in your WSL filesystem (not a Windows mount). The Makefile’s `prepare` step handles this.
- If Docker is not detected in WSL, enable WSL integration in Docker Desktop settings or use `CONTAINER=podman` with Podman installed in WSL.

### Prerequisites

- Node.js 16+
- npm or yarn

### Setup

```bash
# Clone the repository
git clone https://github.com/ubvu/zotero-refsense.git
cd zotero-refsense

# Install dependencies (local build only)
npm install

# Build the plugin (local build only)
npm run build

# Development build with watching
npm run dev
```

### Project Structure

```
zotero-refsense/
├── manifest.json              # Zotero 7 Extension manifest
├── package.json              # npm package configuration
├── bootstrap.js              # Main plugin file
├── build.js                  # XPI build script
├── ai/                       # AI communication modules
│   ├── openai.js            # OpenAI API integration
│   └── ollama.js            # Ollama API integration
├── config/                   # Configuration system
│   ├── settings.js          # Settings management
│   └── prefs.xhtml          # Settings UI
├── build/                    # Build output
│   └── refsense.xpi         # Installable XPI package
└── CLAUDE.md                 # Development documentation
```

## 📋 Configuration Options

### AI Backend Settings

```json
{
  "ai_backend": "openai",               // "openai" or "ollama"
  "openai_api_key": "sk-...",          // OpenAI API key
  "openai_model": "gpt-4-turbo",       // OpenAI model
  "ollama_model": "llava:13b",         // Ollama model
  "ollama_host": "http://localhost:11434", // Ollama server
  "default_page_source": "first",      // "first", "current", "range"
  "page_range": "1–2"                  // Page range for extraction
}
```

### Page Extraction Options

- **First Page**: Extract from the first page (default, recommended for papers)
- **Current Page**: Extract from currently viewed page
- **Page Range**: Extract from specified page range (e.g., "1-3")

## 🔍 How It Works

1. **Smart UI Logic**: Only displays RefSense options (button/menu) for PDFs without existing parent items
2. **Dual Access Methods**: 
   - PDF Reader floating button with keyboard shortcut
   - Item list context menu for direct PDF processing without opening
3. **PDF Text Extraction**: Uses 6 different methods including Zotero's Fulltext API, cache files, and database queries
4. **Quality Validation**: Filters binary content and scores academic relevance to ensure good text quality
5. **AI Processing**: Sends optimized prompts to chosen AI backend (OpenAI GPT-4 or local Ollama)
6. **Metadata Parsing**: Converts AI JSON response to Zotero fields with validation and error handling
7. **Parent Creation**: Creates new parent items and establishes proper PDF relationships
8. **Database Integration**: Uses Zotero's transaction system for data integrity with rollback support

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

- **Issues**: Use the GitHub issue tracker
- **Documentation**: See CLAUDE.md for detailed development info
- **Discussions**: GitHub Discussions for questions and ideas

## 🔒 Privacy & Security

- **OpenAI**: Only sends PDF text content (first page typically contains public bibliographic info)
- **Ollama**: Completely local processing, no data transmitted externally
- **API Keys**: Stored locally with Base64 encoding
- **No Tracking**: No usage analytics or data collection

## 🎯 Status & Roadmap

### ✅ **Current Status: Production Ready**
RefSense is a **complete, fully functional plugin** with all core features implemented:
- End-to-end PDF → AI → Parent item workflow
- Robust error handling and fallback systems
- CSP-compatible settings system
- Smart UI that adapts to PDF status
- Production-ready stability and performance

### 🔮 **Future Enhancements (Optional)**
- [ ] Additional error handling and user experience improvements
- [ ] Batch processing for multiple PDFs
- [ ] Advanced duplicate detection across entire library
- [ ] Custom field mapping options
- [ ] Integration with additional AI providers
- [ ] Multi-language interface support

---

**RefSense** - Making academic research more efficient with AI-powered metadata extraction.
