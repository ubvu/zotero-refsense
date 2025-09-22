// RefSense default preferences (Zotero 7 compatible)

// AI backend preferences
pref("extensions.refsense.aiBackend", "openai");

// OpenAI preferences
pref("extensions.refsense.openaiModel", "gpt-4-turbo");
pref("extensions.refsense.openaiApiKey", "");

// Ollama preferences
pref("extensions.refsense.ollamaModel", "llama3.2:latest");
pref("extensions.refsense.ollamaHost", "http://localhost:11434");

// PDF extraction preferences
pref("extensions.refsense.defaultPageSource", "first");
pref("extensions.refsense.pageRange", "1-2");

// Other preferences
pref("extensions.refsense.enableLogging", true);
pref("extensions.refsense.maxRetries", 3);
pref("extensions.refsense.requestTimeout", 30000);
