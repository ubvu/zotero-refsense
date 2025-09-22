# CLAUDE.md

## 📌 Project Overview

RefSense is a Zotero 7 plugin that adds an “Extract Metadata” button while you read a PDF. When triggered, it calls either OpenAI GPT or a local Ollama model to analyse the first page (or any selected range) and **extract bibliographic metadata such as title, authors, year, journal, DOI**, and so on. The plugin can **automatically create a new parent item** or enrich an existing one with the extracted details.

---

## 🧩 Key Feature Summary

| Feature | Description |
|---------|-------------|
| 🔘 PDF reader toolbar button | In-context UI button that appears while a PDF is open |
| 📋 Item list context menu | Right-click menu entry for PDFs without a parent item |
| 📄 Page extraction | Use the first page by default, or the current page / a custom range |
| 🔍 Text or image extraction | Falls back to image/OCR when no text is available |
| ⚙️ AI backend options | Switch between OpenAI API and local Ollama (LLaVA) |
| 🤖 AI call | Sends extracted text/images to the AI and receives JSON metadata |
| 🧾 JSON parsing | Maps AI responses to Zotero fields (title, authors, etc.) |
| 📥 Parent item creation | Calls `Zotero.Items.add()` and attaches the PDF |
| 🧠 Preferences UI | Configure AI backend, model, page extraction strategy, etc. |

---

## ⚙️ Configurable Options (`pluginSettings.json`)

```json
{
  "ai_backend": "openai",             // "openai" or "ollama"
  "openai_api_key": "sk-...",
  "openai_model": "gpt-4-turbo",
  "ollama_model": "llava:13b",
  "ollama_host": "http://localhost:11434",
  "default_page_source": "first",     // "first", "current", or "range"
  "page_range": "1-2",

  // OCR server configuration (planned)
  "ocr_enabled": false,                // Enable OCR fallback
  "ocr_server_url": "http://localhost:8080/ocr", // OCR endpoint
  "ocr_api_key": "",                  // Optional OCR API key
  "ocr_timeout": 30000,                // OCR request timeout (ms)
  "ocr_provider": "tesseract"         // "tesseract", "google", "aws", etc.
}
```

---

## ✅ Roadmap & Status

### 🎯 Phase 1: Plugin foundation (High priority) ✅ Complete
- [x] Create Zotero 7 extension manifest (`manifest.json`)
- [x] Configure package settings and repo layout (`package.json`)
- [x] Implement bootstrap & content scripts (`src/bootstrap.js`, `src/content.js`)
- [x] Provide build tooling (`build.js`, XPI packaging)

### 🎯 Phase 2: PDF reader integration (High priority) ✅ Complete
- [x] Floating “Extract Metadata” button in the reader toolbar
- [x] Click handler & keyboard shortcut (Ctrl+Shift+E)
- [x] Ensure PDF access permissions
- [x] Detect the active PDF context
- [x] Auto-insert button only when appropriate

### 🎯 Phase 3: PDF data extraction (High priority) ✅ Complete
- [x] Extract text from the first page (`getText()`)
- [x] Validate and pre-process extracted text
- [x] Support first/current/range page selection
- [❌] Image rendering fallback (blocked by Zotero limitations)

### 🎯 Phase 3.2: OCR integration (High priority) 🚧 Planned
- [ ] Build OCR server configuration UI
- [ ] Investigate PDF-to-image conversion within Zotero constraints
- [ ] Implement OCR API communication module
- [ ] Fallback to OCR when text extraction fails
- [ ] Validate OCR quality & caching strategy

### 🤖 Phase 4: OpenAI API (Medium priority) ✅ Complete
- [x] Implement `OpenAIService` (`ai/openai.js`)
- [x] Secure API key management (Base64 masking)
- [x] Optimise prompt for academic metadata extraction
- [x] Retry with exponential backoff on errors
- [x] Parse and validate JSON responses
- [x] API key validation helper

### 🤖 Phase 5: Ollama local models (Medium priority) ✅ Complete
- [x] Implement `OllamaAPI` (`ai/ollama.js`)
- [x] Reuse text-extraction prompt for local models
- [x] Check server connectivity (`checkConnection`)
- [x] Fetch available model list (`getAvailableModels`)
- [x] Use XMLHttpRequest for Zotero compatibility
- [x] Retry/timeout handling

### 🎯 Phase 6: Metadata processing (High priority) ✅ Complete
- [x] Map AI JSON responses to Zotero fields
- [x] Validate and normalise data
- [x] Handle missing or partial responses
- [x] Convert field types as needed

### 🎯 Phase 7: Automatic parent creation (High priority) ✅ Complete
- [x] Create new parent items with `Zotero.Items.add()`
- [x] Link PDFs to the created parent
- [x] Check for duplicates via DOI/title
- [x] Manage transactions and rollbacks
- [x] Support selective updates when a parent already exists
- [x] Provide a side-by-side metadata comparison dialog

### 🎯 Phase 7.2: Comparison dialog improvements (Medium priority) 🚧 Planned
- [ ] Research Zotero 7 dialog best practices
- [ ] Move from chained prompts to a single dialog
- [ ] Add OCR configuration section
- [ ] Enhance validation and connection testing
- [ ] Group settings into tabs (AI, OCR, general)

### 🎨 Phase 8: Preferences UI (Medium priority) ✅ Complete
- [x] Unify settings management (`config/settings.js`)
- [x] Build Zotero 7 compatible UI (`prefs.xhtml`)
- [x] Toggle between OpenAI and Ollama backends
- [x] Dynamically show backend-specific inputs
- [x] Mask & encode API keys
- [x] Configure page extraction preferences
- [x] Basic connection validation
- [x] CSP-friendly prompt-driven dialog for sandbox cases
- [x] Full integration with the Tools menu

### 🎨 Phase 8.2: Unified settings dialog improvements 🚧 Planned
- [ ] Review standard settings patterns in Zotero 7
- [ ] Replace prompt flow with a consolidated dialog
- [ ] Add OCR configuration section
- [ ] Improve validation and testing feedback
- [ ] Introduce tabbed layout for grouped options

### 🛡️ Phase 9: Error handling (Medium priority)
- [ ] Handle network/API quota errors gracefully
- [ ] Detect unsupported PDF formats
- [ ] Provide user-friendly error messages
- [ ] Add structured logging

### 🎨 Phase 10: UX polish (Low priority)
- [ ] Metadata preview before creation
- [ ] Progress/feedback indicators
- [ ] Success and failure notifications
- [ ] Optional confirmation dialogs

---

## 🔁 Future Enhancements (Ideas)

- [ ] Batch processing of multiple PDFs
- [ ] Compare output quality between OpenAI and Ollama
- [ ] Detect the best page for extraction automatically
- [ ] Improve taxonomy-specific metadata extraction

---

## 🧠 Expected User Flow

**Method 1: from the PDF reader**
1. Open a PDF without a parent item in Zotero
2. Click the RefSense button (or press Ctrl+Shift+E)
3. Extract text → call AI → receive metadata
4. Review preview → confirm → parent item created & linked

**Method 2: from the item list**
1. Select a PDF without a parent item in the library view
2. Right-click → choose “📄 RefSense: Extract Bibliographic Info”
3. Extract text → call AI → receive metadata
4. Confirm → parent item created & linked

---

## ✅ External Dependencies

| Name | Purpose |
|------|---------|
| OpenAI API | High-accuracy GPT-4 Turbo metadata extraction |
| Ollama | Local LLaVA models for private/on-device processing |
| pytesseract (optional) | OCR fallback |
| fitz / PyMuPDF (optional) | PDF-to-image rendering for OCR workflows |

---

## 📁 Current Directory Layout

```
zotero-refsense/
├── manifest.json              ✅ Zotero 7 extension manifest
├── package.json               ✅ npm package definition
├── bootstrap.js               ✅ Main plugin entry point
├── build.js                   ✅ XPI build script
├── README.md                  ✅ Public project documentation
├── CLAUDE.md                  ✅ Internal roadmap (this file)
├── prefs.xhtml                ✅ Preferences UI for Zotero 7
├── prefs.html                 ✅ Standalone preferences prototype
├── ai/                        🤖 AI integration modules
│   ├── openai.js              ✅ OpenAI service wrapper
│   └── ollama.js              ✅ Ollama service wrapper
├── config/                    ⚙️ Shared configuration utilities
│   └── settings.js            ✅ Unified preference manager
├── prefs-script.js            ✅ Preferences window controller
├── prefs.js                   ✅ Default preference values
└── build/                     ✅ Build artefacts (generated)
    └── refsense.xpi           ✅ Installable package for Zotero
```

---

## 📒 Notes

- RefSense currently focuses on text extraction; OCR integration is planned.
- The project targets Zotero 7 and assumes the new reader UI.
- All API calls are optional; local Ollama can be used for offline operation.
- Configuration utilities handle Base64 masking but are not a substitute for secrets management.
