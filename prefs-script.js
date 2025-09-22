// RefSense settings UI controller
const RefSensePrefs = {
    originalSettings: {},
    hasChanges: false,

    init() {
        console.log('🚀 RefSensePrefs initialization started');
        this.bindEvents();
        this.requestSettings(); // request settings
    },

    async requestSettings() {
        console.log('📤 Sending settings request');
        
        // Use WebExtension runtime message (for sandboxed environments)
        if (typeof browser !== 'undefined' && browser.runtime && browser.runtime.sendMessage) {
            console.log('🎯 Using browser.runtime.sendMessage');
            try {
                const response = await browser.runtime.sendMessage({ type: 'refsense-get-settings' });
                console.log('✅ Received runtime response:', response);
                
                if (response.success && response.settings) {
                    this.applySettings(response.settings);
                    return;
                }
            } catch (error) {
                console.error('❌ browser.runtime.sendMessage failed:', error);
            }
        }
        
        // Try using Zotero.Prefs API directly (fallback)
        console.log('🔍 Checking Zotero object:', typeof Zotero);
        if (typeof Zotero !== 'undefined' && Zotero.Prefs) {
            console.log('🎯 Loading directly via Zotero.Prefs');
            try {
                const settings = {
                    aiBackend: Zotero.Prefs.get('extensions.refsense.aiBackend', 'openai'),
                    openaiModel: Zotero.Prefs.get('extensions.refsense.openaiModel', 'gpt-4-turbo'),
                    openaiApiKey: Zotero.Prefs.get('extensions.refsense.openaiApiKey', ''),
                    ollamaModel: Zotero.Prefs.get('extensions.refsense.ollamaModel', 'llama3.2:latest'),
                    ollamaHost: Zotero.Prefs.get('extensions.refsense.ollamaHost', 'http://localhost:11434'),
                    pageSource: Zotero.Prefs.get('extensions.refsense.pageSource', 'first'),
                    pageRange: Zotero.Prefs.get('extensions.refsense.pageRange', '1-2')
                };
                console.log('✅ Settings loaded successfully:', settings);
                this.applySettings(settings);
                return;
            } catch (error) {
                console.error('❌ Failed to load via Zotero.Prefs:', error);
            }
        }
        
        // window.postMessage fallback
        console.log('⚠️ Fallback to window.postMessage');
        window.postMessage({ type: 'refsense-get-settings' }, '*');
    },

    applySettings(settings) {
        document.getElementById('ai-backend').value = settings.aiBackend || 'openai';
        document.getElementById('openai-model').value = settings.openaiModel || 'gpt-4-turbo';
        document.getElementById('ollama-model').value = settings.ollamaModel || 'llama3.2:latest';
        document.getElementById('ollama-host').value = settings.ollamaHost || 'http://localhost:11434';
        document.getElementById('page-source').value = settings.pageSource || 'first';
        document.getElementById('page-range').value = settings.pageRange || '1-2';

        const encodedKey = settings.openaiApiKey || '';
        if (encodedKey) {
            try {
                document.getElementById('openai-api-key').value = atob(encodedKey);
            } catch (e) {
                console.error('Failed to decode API key:', e);
            }
        }

        this.storeOriginalSettings();
        this.updateUIVisibility();
        this.updateButtonStates();
    },

    storeOriginalSettings() {
        this.originalSettings = {
            aiBackend: document.getElementById('ai-backend').value,
            openaiModel: document.getElementById('openai-model').value,
            openaiApiKey: document.getElementById('openai-api-key').value,
            ollamaModel: document.getElementById('ollama-model').value,
            ollamaHost: document.getElementById('ollama-host').value,
            pageSource: document.getElementById('page-source').value,
            pageRange: document.getElementById('page-range').value
        };
    },

    bindEvents() {
        console.log('🔗 Starting event binding');
        
        // Check save button
        const saveButton = document.getElementById('save-button');
        console.log('💾 Save button lookup:', saveButton ? 'found' : 'missing');
        
        document.getElementById('ai-backend').addEventListener('change', () => {
            this.updateUIVisibility();
            this.markChanged();
        });

        document.getElementById('page-source').addEventListener('change', () => {
            this.updateUIVisibility();
            this.markChanged();
        });

        const inputs = ['openai-model', 'openai-api-key', 'ollama-model', 'ollama-host', 'page-range'];
        inputs.forEach(id => {
            const el = document.getElementById(id);
            el?.addEventListener('input', () => this.markChanged());
            el?.addEventListener('change', () => this.markChanged());
        });

        document.getElementById('test-openai').addEventListener('click', () => this.testOpenAI());
        document.getElementById('test-ollama').addEventListener('click', () => this.testOllama());

        if (saveButton) {
            saveButton.addEventListener('click', () => {
                console.log('🖱️ Save button click event triggered');
                this.saveSettings();
            });
        }
        
        document.getElementById('cancel-button').addEventListener('click', () => this.cancelChanges());
        document.getElementById('reset-button').addEventListener('click', () => this.resetToDefaults());
        
        console.log('✅ Event binding complete');
    },

    updateUIVisibility() {
        const backend = document.getElementById('ai-backend').value;
        const pageSource = document.getElementById('page-source').value;

        document.getElementById('openai-section').classList.toggle('hidden', backend !== 'openai');
        document.getElementById('ollama-section').classList.toggle('hidden', backend !== 'ollama');

        document.getElementById('page-range').disabled = pageSource !== 'range';
    },

    markChanged() {
        this.hasChanges = true;
        this.updateButtonStates();
    },

    updateButtonStates() {
        document.getElementById('save-button').disabled = !this.hasChanges;
        document.getElementById('cancel-button').disabled = !this.hasChanges;
    },

    async saveSettings() {
        console.log('💾 Save button clicked');
        
        const apiKey = document.getElementById('openai-api-key').value.trim();
        const encodedKey = apiKey ? btoa(apiKey) : '';

        const settings = {
            aiBackend: document.getElementById('ai-backend').value,
            openaiModel: document.getElementById('openai-model').value,
            openaiApiKey: encodedKey,
            ollamaModel: document.getElementById('ollama-model').value,
            ollamaHost: document.getElementById('ollama-host').value,
            pageSource: document.getElementById('page-source').value,
            pageRange: document.getElementById('page-range').value
        };

        console.log('📤 Sending settings:', settings);
        
        // Use WebExtension runtime message (for sandboxed environments)
        if (typeof browser !== 'undefined' && browser.runtime && browser.runtime.sendMessage) {
            console.log('🎯 Saving via browser.runtime.sendMessage');
            try {
                const response = await browser.runtime.sendMessage({ 
                    type: 'refsense-save-settings', 
                    settings 
                });
                console.log('✅ Received runtime save response:', response);
                
                if (response.success) {
                    this.hasChanges = false;
                    this.updateButtonStates();
                    this.showMessage('Settings have been saved.', 'success');
                    return;
                } else {
                    this.showMessage('Failed to save settings: ' + response.error, 'error');
                    return;
                }
            } catch (error) {
                console.error('❌ browser.runtime.sendMessage save failed:', error);
                this.showMessage('Failed to save settings: ' + error.message, 'error');
            }
        }
        
        // Try using Zotero.Prefs API directly (fallback)
        if (typeof Zotero !== 'undefined' && Zotero.Prefs) {
            console.log('🎯 Saving directly with Zotero.Prefs');
            try {
                Object.keys(settings).forEach(key => {
                    const prefKey = `extensions.refsense.${key}`;
                    Zotero.Prefs.set(prefKey, settings[key]);
                    console.log(`✅ Saved: ${prefKey} = ${settings[key]}`);
                });
                
                this.hasChanges = false;
                this.updateButtonStates();
                this.showMessage('Settings have been saved.', 'success');
                return;
            } catch (error) {
                console.error('❌ Failed to save via Zotero.Prefs:', error);
            }
        }
        
        // window.postMessage fallback
        console.log('⚠️ Fallback to window.postMessage');
        window.postMessage({ type: 'refsense-save-settings', settings }, '*');
    },

    cancelChanges() {
        for (const [key, value] of Object.entries(this.originalSettings)) {
            const el = document.getElementById(key.replace(/([A-Z])/g, '-$1').toLowerCase());
            if (el) el.value = value;
        }
        this.updateUIVisibility();
        this.hasChanges = false;
        this.updateButtonStates();
        this.showMessage('Changes have been canceled.', 'info');
    },

    resetToDefaults() {
        if (!confirm('Restore all settings to their default values?')) return;

        document.getElementById('ai-backend').value = 'openai';
        document.getElementById('openai-model').value = 'gpt-4-turbo';
        document.getElementById('openai-api-key').value = '';
        document.getElementById('ollama-model').value = 'llama3.2:latest';
        document.getElementById('ollama-host').value = 'http://localhost:11434';
        document.getElementById('page-source').value = 'first';
        document.getElementById('page-range').value = '1-2';

        this.updateUIVisibility();
        this.markChanged();
        this.showMessage('Restored to default values.', 'info');
    },

    testOpenAI() {
        const apiKey = document.getElementById('openai-api-key').value.trim();
        if (!apiKey) return this.showMessage('Please enter the OpenAI API key.', 'error');
        if (!apiKey.startsWith('sk-')) return this.showMessage('The API key must start with sk-.', 'error');
        this.showMessage('API key format is valid.', 'success');
    },

    testOllama() {
        const host = document.getElementById('ollama-host').value.trim();
        if (!host) return this.showMessage('Please enter the Ollama host.', 'error');
        if (!host.startsWith('http://') && !host.startsWith('https://')) return this.showMessage('The host must start with http:// or https://.', 'error');
        this.showMessage('Ollama host format is valid.', 'success');
    },

    showMessage(msg, type = 'info') {
        alert(`[${type.toUpperCase()}] ${msg}`);
    }
};

// Message listener
window.addEventListener('message', (event) => {
    console.log('📩 Message received:', event.data);
    
    if (event.data.type === 'refsense-settings-response') {
        console.log('⚙️ Received settings response');
        RefSensePrefs.applySettings(event.data.settings);
    }
    if (event.data.type === 'refsense-save-response') {
        console.log('💾 Received save response:', event.data.success);
        if (event.data.success) {
            RefSensePrefs.hasChanges = false;
            RefSensePrefs.updateButtonStates();
            RefSensePrefs.showMessage('Settings have been saved.', 'success');
        } else {
            RefSensePrefs.showMessage('Failed to save settings', 'error');
        }
    }
});

document.addEventListener('DOMContentLoaded', () => {
    RefSensePrefs.init();
});
