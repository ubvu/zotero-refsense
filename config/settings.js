/**
 * RefSense unified settings manager
 * Settings system compatible with Zotero 7
 */

class SettingsManager {
    constructor() {
        this.prefBranch = 'extensions.refsense.';
        this.defaultSettings = {
            // AI backend settings
            aiBackend: 'openai', // 'openai' | 'ollama'
            
            // OpenAI settings
            openaiModel: 'gpt-4-turbo',
            openaiApiKey: '', // Stored as Base64
            
            // Ollama settings
            ollamaModel: 'llama3.2:latest',
            ollamaHost: 'http://localhost:11434',
            
            // PDF extraction settings
            defaultPageSource: 'first', // 'first' | 'current' | 'range'
            pageRange: '1-2',
            
            // Other settings
            enableLogging: true,
            maxRetries: 3,
            requestTimeout: 30000 // 30 seconds
        };
    }

    /**
     * Retrieve a setting value
     * @param {string} key - Setting key
     * @param {*} defaultValue - Default value
     * @returns {*} Retrieved value
     */
    get(key, defaultValue = null) {
        try {
            const fullKey = this.prefBranch + key;
            const prefs = Components.classes["@mozilla.org/preferences-service;1"]
                .getService(Components.interfaces.nsIPrefBranch);

            // Check whether the key exists
            if (!prefs.prefHasUserValue(fullKey)) {
                return defaultValue !== null ? defaultValue : this.defaultSettings[key];
            }

            // Use the appropriate getter based on type
            const prefType = prefs.getPrefType(fullKey);
            switch (prefType) {
                case prefs.PREF_STRING:
                    return prefs.getCharPref(fullKey);
                case prefs.PREF_INT:
                    return prefs.getIntPref(fullKey);
                case prefs.PREF_BOOL:
                    return prefs.getBoolPref(fullKey);
                default:
                    return defaultValue !== null ? defaultValue : this.defaultSettings[key];
            }
        } catch (error) {
            console.error(`Failed to read setting (${key}):`, error);
            return defaultValue !== null ? defaultValue : this.defaultSettings[key];
        }
    }

    /**
     * Store a setting value
     * @param {string} key - Setting key
     * @param {*} value - Value to store
     */
    set(key, value) {
        try {
            const fullKey = this.prefBranch + key;
            const prefs = Components.classes["@mozilla.org/preferences-service;1"]
                .getService(Components.interfaces.nsIPrefBranch);

            // Use the appropriate setter based on type
            if (typeof value === 'string') {
                prefs.setCharPref(fullKey, value);
            } else if (typeof value === 'number') {
                prefs.setIntPref(fullKey, value);
            } else if (typeof value === 'boolean') {
                prefs.setBoolPref(fullKey, value);
            } else {
                // Store complex objects as JSON strings
                prefs.setCharPref(fullKey, JSON.stringify(value));
            }
        } catch (error) {
            console.error(`Failed to save setting (${key}):`, error);
            throw error;
        }
    }

    /**
     * Retrieve all settings
     * @returns {Object} Settings object
     */
    getAll() {
        const settings = {};
        for (const key in this.defaultSettings) {
            settings[key] = this.get(key);
        }
        return settings;
    }

    /**
     * Store multiple settings at once
     * @param {Object} settings - Settings object
     */
    setAll(settings) {
        for (const [key, value] of Object.entries(settings)) {
            if (this.defaultSettings.hasOwnProperty(key)) {
                this.set(key, value);
            }
        }
    }

    /**
     * Securely store the OpenAI API key
     * @param {string} apiKey - API key
     */
    setOpenAIKey(apiKey) {
        if (!apiKey || typeof apiKey !== 'string') {
            throw new Error('Invalid API key');
        }

        // Basic API key format validation
        if (!apiKey.startsWith('sk-') || apiKey.length < 40) {
            throw new Error('OpenAI API key format is invalid');
        }

        try {
            // Store with simple encoding (not full security but basic protection)
            const encodedKey = btoa(apiKey);
            this.set('openaiApiKey', encodedKey);
        } catch (error) {
            console.error('Failed to store API key:', error);
            throw new Error('Failed to store the API key');
        }
    }

    /**
     * Retrieve the OpenAI API key
     * @returns {string|null} Decoded API key
     */
    getOpenAIKey() {
        try {
            const encodedKey = this.get('openaiApiKey');
            if (!encodedKey) {
                return null;
            }
            return atob(encodedKey);
        } catch (error) {
            console.error('Failed to decode API key:', error);
            return null;
        }
    }

    /**
     * Check whether an API key exists
     * @returns {boolean} API key presence
     */
    hasOpenAIKey() {
        const key = this.getOpenAIKey();
        return key && key.length > 0;
    }

    /**
     * Reset settings
     */
    reset() {
        try {
            const prefs = Components.classes["@mozilla.org/preferences-service;1"]
                .getService(Components.interfaces.nsIPrefBranch);

            // Remove all plugin-specific settings
            const keys = prefs.getChildList(this.prefBranch, {});
            for (const key of keys) {
                if (prefs.prefHasUserValue(key)) {
                    prefs.clearUserPref(key);
                }
            }
        } catch (error) {
            console.error('Failed to reset settings:', error);
        }
    }

    /**
     * Validate settings
     * @returns {Object} Validation result
     */
    validate() {
        const results = {
            valid: true,
            errors: [],
            warnings: []
        };

        const settings = this.getAll();

        // Validate AI backend
        if (!['openai', 'ollama'].includes(settings.aiBackend)) {
            results.valid = false;
            results.errors.push('Invalid AI backend');
        }

        // Validate OpenAI settings
        if (settings.aiBackend === 'openai') {
            if (!this.hasOpenAIKey()) {
                results.valid = false;
                results.errors.push('OpenAI API key is not configured');
            }

            if (!settings.openaiModel) {
                results.warnings.push('OpenAI model is not configured');
            }
        }

        // Validate Ollama settings
        if (settings.aiBackend === 'ollama') {
            if (!settings.ollamaHost) {
                results.valid = false;
                results.errors.push('Ollama host is not configured');
            }

            if (!settings.ollamaModel) {
                results.warnings.push('Ollama model is not configured');
            }
        }

        // Validate page extraction option
        if (!['first', 'current', 'range'].includes(settings.defaultPageSource)) {
            results.warnings.push('Invalid page extraction option');
        }

        return results;
    }

    /**
     * Export settings (excluding API key)
     * @returns {Object} Exportable settings
     */
    export() {
        const settings = this.getAll();
        // Exclude the API key for security reasons
        delete settings.openaiApiKey;
        return settings;
    }

    /**
     * Import settings (excluding API key)
     * @param {Object} settings - Settings to import
     */
    import(settings) {
        // Ignore API key-related settings
        const safeSettings = { ...settings };
        delete safeSettings.openaiApiKey;
        
        this.setAll(safeSettings);
    }
}

// Export for global access in the Zotero environment
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SettingsManager;
} else if (typeof window !== 'undefined') {
    window.SettingsManager = SettingsManager;
}
