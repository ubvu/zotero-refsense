/**
 * RefSense - AI Metadata Extractor for Zotero 7
 * Bootstrap file for plugin initialization
 */

if (typeof Zotero === 'undefined') {
    var Zotero;
}

var RefSense = RefSense || {};

// Make RefSense globally accessible for menu commands
if (typeof window !== 'undefined') {
    window.RefSense = RefSense;
}
if (typeof globalThis !== 'undefined') {
    globalThis.RefSense = RefSense;
}

// Plugin initialization
RefSense.Plugin = {
    id: 'refsense@zotero-plugin',
    version: '1.0.0',
    rootURI: '',
    initialized: false,
    
    // Plugin startup
    startup() {
        if (this.initialized) return;
        
        try {
            this.log('RefSense plugin starting up...');
            
            // Ensure Zotero is available
            if (typeof Zotero === 'undefined') {
                this.log('Zotero not yet available, retrying...');
                setTimeout(() => this.startup(), 1000);
                return;
            }
            
            // Show immediate confirmation
            this.showStartupNotification();
            
            // Load configuration
            this.loadConfig();
            
            // Register custom preferences menu (Zotero 7 way)
            this.registerCustomPreferences();
            
            // Additional registration for global access
            this.setupGlobalAccess();
            
            // Initialize UI components with multiple retries
            this.initUIWithRetry();
            
            this.initialized = true;
            this.log('RefSense plugin started successfully');
            
        } catch (error) {
            this.handleError(error, 'startup');
        }
    },
    
    // Show startup notification
    showStartupNotification() {
        // Notification disabled for better user experience
        // Plugin functionality is indicated by the button in PDF reader
        this.log('RefSense plugin loaded successfully');
    },
    
    // Register custom preferences menu (direct access approach)
    registerCustomPreferences() {
        try {
            this.log('Setting up custom preferences menu');
            
            // Register observer to detect preference changes
            if (Zotero.Prefs && typeof Zotero.Prefs.registerObserver === 'function') {
                const prefBranch = 'extensions.refsense.';
                Zotero.Prefs.registerObserver(prefBranch, () => {
                    this.log('RefSense settings have changed');
                    this.loadConfig();
                }, false);
                this.log('✅ Preferences observer registered');
            }
            
            // Add settings menu to the Tools menu
            this.addToolsMenuItem();
            
            this.log('✅ Custom preferences setup completed');
            return true;
            
        } catch (error) {
            this.log('❌ Failed to setup custom preferences:', error.message);
            this.log('Error stack:', error.stack);
            return false;
        }
    },
    
    // Add the RefSense settings menu to Tools
    addToolsMenuItem() {
        try {
            this.log('🔍 Attempting to add Tools menu item...');
            
            const window = Zotero.getMainWindow();
            if (!window || !window.document) {
                this.log('❌ Main window not available for menu setup');
                return;
            }
            this.log('✅ Main window found');
            
            const menubar = window.document.getElementById('main-menubar');
            if (!menubar) {
                this.log('❌ Main menubar not found');
                return;
            }
            this.log('✅ Main menubar found');
            
            const toolsMenu = window.document.getElementById('menu_ToolsPopup');
            if (!toolsMenu) {
                this.log('❌ Tools menu not found, trying alternative selectors...');
                
                // Try alternative selectors
                const alternatives = [
                    'toolsPopup',
                    'menu_Tools', 
                    'tools-menu',
                    'toolsmenu'
                ];
                
                for (const alt of alternatives) {
                    const altMenu = window.document.getElementById(alt);
                    if (altMenu) {
                        this.log(`✅ Found alternative tools menu: ${alt}`);
                        return this.addMenuToElement(altMenu);
                    }
                }
                
                this.log('❌ No tools menu found with any selector');
                return;
            }
            this.log('✅ Tools menu found');
            
            return this.addMenuToElement(toolsMenu);
            
        } catch (error) {
            this.log('❌ Failed to add Tools menu item:', error.message);
            this.log('Error stack:', error.stack);
        }
    },
    
    // Add menu item to the provided menu element
    addMenuToElement(menuElement) {
        try {
            // Check whether a menu item already exists
            const existingItem = menuElement.querySelector('#refsense-settings-menuitem');
            if (existingItem) {
                this.log('⚠️ RefSense menu item already exists, removing old one');
                existingItem.remove();
            }
            
            // Create the RefSense settings menu item
            const menuItem = menuElement.ownerDocument.createXULElement('menuitem');
            menuItem.id = 'refsense-settings-menuitem';
            menuItem.setAttribute('label', 'RefSense Settings...');
            menuItem.addEventListener('command', () => {
                this.openSettingsDialog();
            });
            
            // Optionally add a separator
            const separator = menuElement.ownerDocument.createXULElement('menuseparator');
            separator.id = 'refsense-separator';
            
            // Append to the Tools menu
            menuElement.appendChild(separator);
            menuElement.appendChild(menuItem);
            
            this.log('✅ RefSense menu item successfully added to Tools menu');
            return true;
            
        } catch (error) {
            this.log('❌ Failed to add menu to element:', error.message);
            return false;
        }
    },
    
    // Open the settings dialog
    openSettingsDialog() {
        try {
            this.log('Opening RefSense settings dialog');
            
            const window = Zotero.getMainWindow();
            if (!window) {
                this.log('Main window not available');
                return;
            }
            
            // Open the HTML-based settings dialog
            this.openCustomSettingsDialog();
            
        } catch (error) {
            this.log('❌ Failed to open settings dialog:', error.message);
        }
    },
    
    // Simplified unified settings dialog
    openCustomSettingsDialog() {
        try {
            const window = Zotero.getMainWindow();
            
            // Load the current settings
            this.loadConfig();
            
            // Present all settings through a single form
            this.showUnifiedSettingsPrompt();
            
        } catch (error) {
            this.log('❌ Failed to open settings dialog:', error.message);
            const window = Zotero.getMainWindow();
            if (window) {
                window.alert('Unable to open settings: ' + error.message);
            }
        }
    },
    
    // Unified settings prompt
    showUnifiedSettingsPrompt() {
        const window = Zotero.getMainWindow();
        if (!window) return;
        
        // Display current setting values
        const currentApiKey = this.config.openaiApiKey ? 
            (this.config.openaiApiKey.length > 10 ? '****' + this.config.openaiApiKey.slice(-4) : '[Configured]') : '[None]';
        
        const currentSettings = `Current RefSense settings:\n\n• AI backend: ${this.config.aiBackend}\n• OpenAI API key: ${currentApiKey}\n• OpenAI model: ${this.config.openaiModel}\n• Ollama host: ${this.config.ollama_host}\n• Ollama model: ${this.config.ollama_model}\n• Page source: ${this.config.defaultPageSource}\n• Page range: ${this.config.pageRange}\n\nWould you like to change these settings?`;

        if (!window.confirm(currentSettings)) return;
        
        // 1. Select AI backend
        const backends = ['openai', 'ollama'];
        let backendChoice = window.prompt(
            `Select the AI backend:\n1. OpenAI (GPT)\n2. Ollama (Local)\n\nCurrent: ${this.config.aiBackend}\nEnter a number (1-2):`,
            this.config.aiBackend === 'openai' ? '1' : '2'
        );
        
        if (backendChoice === null) return; // Cancelled
        backendChoice = backendChoice.trim();
        if (!['1', '2'].includes(backendChoice)) {
            window.alert('Invalid choice.');
            return;
        }
        
        const selectedBackend = backends[parseInt(backendChoice) - 1];
        
        // 2. Configure backend-specific options
        let newSettings = { aiBackend: selectedBackend };
        
        if (selectedBackend === 'openai') {
            // OpenAI settings
            const apiKey = window.prompt(
                `Enter the OpenAI API key (must start with sk-):\nCurrent: ${currentApiKey}\n\n(Leave blank to keep the existing key)`,
                ''
            );
            
            if (apiKey === null) return; // Cancelled
            
            if (apiKey.trim()) {
                if (!apiKey.startsWith('sk-')) {
                    window.alert('The API key must start with sk-.');
                    return;
                }
                newSettings.openaiApiKey = btoa(apiKey.trim());
            } else {
                newSettings.openaiApiKey = this.config.openaiApiKey; // keep existing value
            }
            
            const models = ['gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'];
            const modelChoice = window.prompt(
                `Select the OpenAI model:\n1. GPT-4 Turbo (recommended)\n2. GPT-4\n3. GPT-3.5 Turbo\n\nCurrent: ${this.config.openaiModel}\nEnter a number (1-3):`,
                models.indexOf(this.config.openaiModel) + 1 || '1'
            );
            
            if (modelChoice === null) return;
            const modelIndex = parseInt(modelChoice.trim()) - 1;
            if (modelIndex < 0 || modelIndex >= models.length) {
                window.alert('Invalid model selection.');
                return;
            }
            newSettings.openaiModel = models[modelIndex];
            
        } else {
            // Ollama settings
            const ollamaHost = window.prompt(
                `Enter the Ollama host URL:\nCurrent: ${this.config.ollama_host}`,
                this.config.ollama_host
            );
            
            if (ollamaHost === null) return;
            newSettings.ollamaHost = ollamaHost.trim() || 'http://localhost:11434';
            
            const ollamaModel = window.prompt(
                `Enter the Ollama model name:\nCurrent: ${this.config.ollama_model}`,
                this.config.ollama_model
            );
            
            if (ollamaModel === null) return;
            newSettings.ollamaModel = ollamaModel.trim() || 'llama3.2:latest';
        }
        
        // 3. Page extraction settings
        const pageSources = ['first', 'current', 'range'];
        const pageChoice = window.prompt(
            `Choose the PDF page extraction mode:\n1. First page (recommended)\n2. Current page\n3. Page range\n\nCurrent: ${this.config.defaultPageSource}\nEnter a number (1-3):`,
            pageSources.indexOf(this.config.defaultPageSource) + 1 || '1'
        );
        
        if (pageChoice === null) return;
        const pageIndex = parseInt(pageChoice.trim()) - 1;
        if (pageIndex < 0 || pageIndex >= pageSources.length) {
            window.alert('Invalid page option.');
            return;
        }
        newSettings.defaultPageSource = pageSources[pageIndex];
        
        if (newSettings.defaultPageSource === 'range') {
            const pageRange = window.prompt(
                `Enter the page range (e.g., 1-2):\nCurrent: ${this.config.pageRange}`,
                this.config.pageRange
            );
            
            if (pageRange === null) return;
            newSettings.pageRange = pageRange.trim() || '1-2';
        } else {
            newSettings.pageRange = this.config.pageRange; // keep existing value
        }
        
        // 4. Save settings
        this.saveSettingsFromDialog(newSettings);
        window.alert('✅ Settings have been saved!');
    },
    
    // Save settings from the dialog
    saveSettingsFromDialog(settings) {
        try {
            this.log('💾 Saving settings from dialog...');
            
            // Persist each setting
            Object.keys(settings).forEach(key => {
                let prefKey;
                let value = settings[key];
                
                // Key mapping
                if (key === 'ollamaHost') {
                    prefKey = 'extensions.refsense.ollamaHost';
                } else if (key === 'ollamaModel') {
                    prefKey = 'extensions.refsense.ollamaModel';
                } else if (key === 'defaultPageSource') {
                    prefKey = 'extensions.refsense.defaultPageSource';
                } else {
                    prefKey = `extensions.refsense.${key}`;
                }
                
                Zotero.Prefs.set(prefKey, value);
                this.log(`✅ Saved: ${prefKey} = ${value}`);
            });
            
            // Reload settings
            this.loadConfig();
            
            this.log('✅ Dialog settings saved successfully');
            
            // Success notification
            const window = Zotero.getMainWindow();
            if (window) {
                window.alert('RefSense settings have been saved.');
            }
            
        } catch (error) {
            this.log('❌ Dialog settings save failed:', error.message);
        }
    },
    
    // Simple settings dialog (Zotero 7 compatible)
    showSimpleSettingsDialog() {
        try {
            const window = Zotero.getMainWindow();
            
            // Retrieve current settings (using this.config)
            this.log('🔍 Starting settings load...');
            
            // Load the latest settings first
            this.loadConfig();
            
            const currentSettings = {
                aiBackend: this.config.aiBackend,
                openaiApiKey: this.config.openaiApiKey,
                openaiModel: this.config.openaiModel,
                ollamaHost: this.config.ollama_host,
                ollamaModel: this.config.ollama_model,
                pageSource: this.config.defaultPageSource
            };
            
            // Log each setting individually
            this.log('📋 Loaded settings:');
            this.log(`  - aiBackend: "${currentSettings.aiBackend}"`);
            this.log(`  - openaiApiKey: "${currentSettings.openaiApiKey ? '[Configured]' : '[None]'}"`);
            this.log(`  - openaiModel: "${currentSettings.openaiModel}"`);
            this.log(`  - ollamaHost: "${currentSettings.ollamaHost}"`);
            this.log(`  - ollamaModel: "${currentSettings.ollamaModel}"`);
            this.log(`  - pageSource: "${currentSettings.pageSource}"`);
            
            // Decode API key if present
            let apiKeyDisplay = '[None]';
            if (currentSettings.openaiApiKey) {
                try {
                    const decodedKey = atob(currentSettings.openaiApiKey);
                    apiKeyDisplay = `${decodedKey.substring(0, 8)}...`;
                } catch (e) {
                    apiKeyDisplay = '[Encoding error]';
                }
            }
            
            // Build message showing the current settings
            let settingsText = `Current RefSense settings:\n\n• AI backend: ${currentSettings.aiBackend}\n• OpenAI API key: ${apiKeyDisplay}\n• OpenAI model: ${currentSettings.openaiModel}\n• Ollama host: ${currentSettings.ollamaHost}\n• Ollama model: ${currentSettings.ollamaModel}\n• Page source: ${currentSettings.pageSource}\n\nWould you like to update these settings?`;
            
            // Zotero 7 compatible confirm dialog
            const result = window.confirm(settingsText);
            
            if (result) {
                // Open detailed settings dialog
                this.showDetailedSettingsDialog(currentSettings);
            }
            
        } catch (error) {
            this.log('❌ Failed to show simple settings dialog:', error.message);
        }
    },
    
    // Detailed settings dialog (Zotero 7 compatible)
    showDetailedSettingsDialog(currentSettings) {
        try {
            const window = Zotero.getMainWindow();
            
            // Select the AI backend
            const backendChoice = window.confirm('Choose the AI backend:\n\nOK = OpenAI\nCancel = Ollama');
            const selectedBackend = backendChoice ? 'openai' : 'ollama';
            
            this.log(`🔧 Selected backend: ${selectedBackend}`);
            
            if (selectedBackend === 'openai') {
                // OpenAI settings
                const apiKey = window.prompt('Enter the OpenAI API key:', '');
                
                if (apiKey && apiKey.trim()) {
                    // Encode the API key before saving
                    const encodedKey = btoa(apiKey.trim());
                    
                    this.log('💾 Saving OpenAI settings...');
                    Zotero.Prefs.set('extensions.refsense.aiBackend', 'openai');
                    Zotero.Prefs.set('extensions.refsense.openaiApiKey', encodedKey);
                    
                    // Confirm saved values
                    const savedBackend = Zotero.Prefs.get('extensions.refsense.aiBackend');
                    const savedKey = Zotero.Prefs.get('extensions.refsense.openaiApiKey');
                    this.log(`✅ Verified save - aiBackend: "${savedBackend}", API key length: ${savedKey.length}`);
                    
                    this.log('OpenAI settings have been saved');
                    window.alert('OpenAI settings have been saved.');
                }
            } else {
                // Ollama settings
                const host = window.prompt('Enter the Ollama host URL:', currentSettings.ollamaHost);
                
                if (host && host.trim()) {
                    this.log('💾 Saving Ollama settings...');
                    Zotero.Prefs.set('extensions.refsense.aiBackend', 'ollama');
                    Zotero.Prefs.set('extensions.refsense.ollamaHost', host.trim());
                    
                    // Confirm saved values
                    const savedBackend = Zotero.Prefs.get('extensions.refsense.aiBackend');
                    const savedHost = Zotero.Prefs.get('extensions.refsense.ollamaHost');
                    this.log(`✅ Verified save - aiBackend: "${savedBackend}", ollamaHost: "${savedHost}"`);
                    
                    this.log('Ollama settings have been saved');
                    window.alert('Ollama settings have been saved.');
                }
            }

            // Reload settings (3-second delay to ensure persistence)
            setTimeout(() => {
                this.log('🔄 Starting delayed settings reload...');
                this.loadConfig();
                this.log('🔄 Delayed settings reload complete');
            }, 3000);
            
        } catch (error) {
            this.log('❌ Failed to show detailed settings dialog:', error.message);
        }
    },
    
    
    // Direct message listener setup (registered on the Zotero main window)
    setupDirectMessageListener() {
        try {
            // Register a message listener on the Zotero main UI window
            const ZoteroPane = Zotero.getMainWindow();
            
            if (ZoteroPane && ZoteroPane.addEventListener) {
                ZoteroPane.addEventListener("message", (event) => {
                    if (!event.data || !event.data.type) return;
                    
                    this.log('[RefSense bootstrap] Received message:', event.data.type);
                    
                    const { type, settings } = event.data;
                    
                    if (type === "refsense-get-settings") {
                        this.log('Processing get-settings request from main window');
                        
                        // Read settings (using the unified setting keys)
                        const result = {
                            aiBackend: Zotero.Prefs.get("extensions.refsense.aiBackend", "openai"),
                            openaiModel: Zotero.Prefs.get("extensions.refsense.openaiModel", "gpt-4-turbo"),
                            openaiApiKey: Zotero.Prefs.get("extensions.refsense.openaiApiKey", ""),
                            ollamaHost: Zotero.Prefs.get("extensions.refsense.ollamaHost", "http://localhost:11434"),
                            ollamaModel: Zotero.Prefs.get("extensions.refsense.ollamaModel", "llama3.2:latest"),
                            defaultPageSource: Zotero.Prefs.get("extensions.refsense.defaultPageSource", "first"),
                            pageRange: Zotero.Prefs.get("extensions.refsense.pageRange", "1-2")
                        };
                        
                        this.log('Sending settings:', result);
                        
                        if (event.source) {
                            event.source.postMessage({
                                type: "refsense-settings-response",
                                settings: result
                            }, event.origin || "*");
                            this.log('✅ Settings response sent to preferences window');
                        }
                    }
                    
                    if (type === "refsense-save-settings") {
                        this.log('Processing save-settings request from main window');
                        
                        if (settings) {
                            try {
                                // Persist the provided settings
                                Object.keys(settings).forEach(key => {
                                    const prefKey = `extensions.refsense.${key}`;
                                    Zotero.Prefs.set(prefKey, settings[key]);
                                    this.log(`Saved: ${prefKey} = ${settings[key]}`);
                                });
                                
                                // Refresh settings
                                this.loadConfig();
                                
                                if (event.source) {
                                    event.source.postMessage({
                                        type: "refsense-save-response",
                                        success: true
                                    }, event.origin || "*");
                                    this.log('✅ Save success response sent to preferences window');
                                }
                            } catch (saveError) {
                                this.log('❌ Error saving settings:', saveError.message);
                                if (event.source) {
                                    event.source.postMessage({
                                        type: "refsense-save-error",
                                        error: saveError.message
                                    }, event.origin || "*");
                                }
                            }
                        }
                    }
                    
                    if (type === "refsense-test-connection") {
                        this.log('Processing test-connection request from main window');
                        this.handleConnectionTest(event);
                    }
                });
                
                this.log('✅ Direct message listener registered on Zotero main window');
            } else {
                this.log('❌ Could not access Zotero main window');
            }
            
        } catch (error) {
            this.log('❌ Error setting up direct message listener:', error.message);
        }
    },
    
    // Handle connection tests
    handleConnectionTest(event) {
        const { backend, config } = event.data;
        
        if (backend === 'ollama') {
            this.testOllamaConnection(config.host).then(result => {
                if (event.source) {
                    event.source.postMessage({
                        type: 'refsense-test-response',
                        success: result.success,
                        message: result.message
                    }, event.origin || "*");
                    this.log('Ollama test response sent');
                }
            });
        } else if (backend === 'openai') {
            const isValid = config.apiKey && config.apiKey.startsWith('sk-') && config.apiKey.length > 40;
            if (event.source) {
                event.source.postMessage({
                    type: 'refsense-test-response',
                    success: isValid,
                    message: isValid ? 'OpenAI API key format is valid!' : 'OpenAI API key format is invalid.'
                }, event.origin || "*");
                this.log('OpenAI test response sent');
            }
        }
    },
    
    // Direct message handler (main window)
    handleDirectMessage(event) {
        // Same logic as setupDirectMessageListener
        const { type, settings } = event.data || {};
        
        if (type === "refsense-get-settings") {
            const result = {
                ai_backend: Zotero.Prefs.get("extensions.refsense.ai_backend", "ollama"),
                openai_model: Zotero.Prefs.get("extensions.refsense.openai_model", "gpt-4-turbo"),
                openai_api_key: Zotero.Prefs.get("extensions.refsense.openai_api_key", ""),
                ollama_host: Zotero.Prefs.get("extensions.refsense.ollama_host", "http://localhost:11434"),
                ollama_model: Zotero.Prefs.get("extensions.refsense.ollama_model", "llama3.2:latest"),
                default_page_source: Zotero.Prefs.get("extensions.refsense.default_page_source", "first"),
                page_range: Zotero.Prefs.get("extensions.refsense.page_range", "1-2")
            };
            
            if (event.source) {
                event.source.postMessage({
                    type: "refsense-settings-response",
                    settings: result
                }, event.origin || "*");
            }
        }
        
        if (type === "refsense-save-settings" && settings) {
            try {
                Object.keys(settings).forEach(key => {
                    const prefKey = `extensions.refsense.${key}`;
                    Zotero.Prefs.set(prefKey, settings[key]);
                });
                this.loadConfig();
                
                if (event.source) {
                    event.source.postMessage({
                        type: "refsense-save-response",
                        success: true
                    }, event.origin || "*");
                }
            } catch (error) {
                if (event.source) {
                    event.source.postMessage({
                        type: "refsense-save-error",
                        error: error.message
                    }, event.origin || "*");
                }
            }
        }
    },
    
    // Register message listeners on the main window
    setupMainWindowMessageListener(win) {
        try {
            // Remove existing listener
            if (win._refSenseMainMessageListener) {
                win.removeEventListener('message', win._refSenseMainMessageListener);
            }
            
            // Register new message listener
            win._refSenseMainMessageListener = (event) => {
                this.log('Main window received message:', event.data?.type);
                this.handlePostMessage(event);
            };
            
            win.addEventListener('message', win._refSenseMainMessageListener);
            this.log('Main window message listener added');
            
        } catch (error) {
            this.log('Error setting up main window listener:', error.message);
        }
    },
    
    // Register message listeners on non-main windows
    setupWindowMessageListener(win) {
        try {
            // Remove existing listener
            if (win._refSenseWindowMessageListener) {
                win.removeEventListener('message', win._refSenseWindowMessageListener);
            }
            
            // Register new message listener
            win._refSenseWindowMessageListener = (event) => {
                this.log('Window received message:', event.data?.type);
                this.handlePostMessage(event);
            };
            
            win.addEventListener('message', win._refSenseWindowMessageListener);
            this.log('Window message listener added');
            
        } catch (error) {
            this.log('Error setting up window listener:', error.message);
        }
    },
    
    // Handle postMessage events
    handlePostMessage(event) {
        try {
            // Security: validate messages
            if (!event.data || !event.data.type || !event.data.type.startsWith('refsense-')) {
                return;
            }
            
            this.log('Processing postMessage:', event.data.type);
            
            switch (event.data.type) {
                case 'refsense-get-settings':
                    this.log('Handling get-settings request');
                    const settings = this.getSettingsForPreferences();
                    if (settings.success && event.source) {
                        event.source.postMessage({
                            type: 'refsense-settings-response',
                            settings: settings.settings
                        }, event.origin || '*');
                        this.log('Settings response sent');
                    }
                    break;
                    
                case 'refsense-save-settings':
                    this.log('Handling save-settings request');
                    const saveResult = this.saveSettingsFromPreferences(event.data.settings);
                    if (event.source) {
                        if (saveResult.success) {
                            event.source.postMessage({
                                type: 'refsense-save-response',
                                success: true
                            }, event.origin || '*');
                            this.log('Save success response sent');
                        } else {
                            event.source.postMessage({
                                type: 'refsense-save-error',
                                error: saveResult.error
                            }, event.origin || '*');
                            this.log('Save error response sent');
                        }
                    }
                    break;
                    
                case 'refsense-test-connection':
                    this.log('Handling test-connection request');
                    this.testConnectionFromPreferences(event.data.backend, event.data.config, event.source, event.origin);
                    break;
            }
            
        } catch (error) {
            this.log('❌ Error handling postMessage:', error.message);
        }
    },
    
    // Configure global access
    setupGlobalAccess() {
        try {
            this.log('Setting up global access for preferences');
            
            // Register directly on the Zotero object
            if (typeof Zotero !== 'undefined') {
                Zotero.RefSense = this;
                this.log('✅ Zotero.RefSense registered');
            }
            
            // Register on the global object (multiple access points)
            if (typeof globalThis !== 'undefined') {
                globalThis.RefSense = RefSense;
                globalThis.RefSensePlugin = this;
                this.log('✅ globalThis.RefSense registered');
            }
            
            if (typeof window !== 'undefined') {
                window.RefSense = RefSense;
                window.RefSensePlugin = this;
                this.log('✅ window.RefSense registered');
            }
            
            // Also register on the main window
            try {
                const mainWindow = Zotero.getMainWindow();
                if (mainWindow) {
                    mainWindow.RefSense = RefSense;
                    mainWindow.RefSensePlugin = this;
                    this.log('✅ mainWindow.RefSense registered');
                }
            } catch (error) {
                this.log('Main window access failed:', error.message);
            }
            
        } catch (error) {
            this.log('❌ Failed to setup global access:', error.message);
        }
    },
    
    // Add message listeners to all windows
    addMessageListenerToAllWindows() {
        try {
            const windowMediator = Components.classes["@mozilla.org/appshell/window-mediator;1"]
                                           .getService(Components.interfaces.nsIWindowMediator);
            const windows = windowMediator.getEnumerator(null);
            
            while (windows.hasMoreElements()) {
                const win = windows.getNext();
                if (win && win.addEventListener) {
                    this.addMessageListenerToWindow(win);
                }
            }
        } catch (error) {
            this.log('Error adding listeners to existing windows:', error.message);
        }
    },
    
    // Add message listener to a specific window
    addMessageListenerToWindow(win) {
        try {
            // Remove existing listener if present
            if (win._refSenseMessageListener) {
                win.removeEventListener('message', win._refSenseMessageListener);
            }
            
            // Add the new listener
            win._refSenseMessageListener = (event) => {
                this.handlePreferencesMessage(event);
            };
            
            win.addEventListener('message', win._refSenseMessageListener);
            this.log('Message listener added to window:', win.location?.href || 'unknown');
            
        } catch (error) {
            this.log('Error adding listener to window:', error.message);
        }
    },
    
    // Implement nsIWindowWatcher interface
    observe(subject, topic, data) {
        if (topic === 'domwindowopened') {
            try {
                // Add listener when a new window opens
                const win = subject;
                if (win && win.addEventListener) {
                    win.addEventListener('load', () => {
                        this.addMessageListenerToWindow(win);
                    });
                }
            } catch (error) {
                this.log('Error in observe:', error.message);
            }
        }
    },
    
    // Handle direct message calls
    handleDirectMessage(data) {
        try {
            this.log('Direct message received:', data.type);
            
            switch (data.type) {
                case 'refsense-get-settings':
                    return this.getSettingsForPreferences();
                    
                case 'refsense-save-settings':
                    return this.saveSettingsFromPreferences(data.settings);
                    
                case 'refsense-test-connection':
                    return this.testConnectionFromPreferences(data.backend, data.config);
            }
            
        } catch (error) {
            this.log('❌ Error handling direct message:', error.message);
            return { error: error.message };
        }
    },
    
    // Handle messages from preferences window
    handlePreferencesMessage(event) {
        try {
            // Security: validate incoming messages
            if (!event.data || !event.data.type || !event.data.type.startsWith('refsense-')) {
                return;
            }
            
            // Security: verify origin (chrome://zotero or moz-extension://)
            if (!event.origin.startsWith('chrome://') && !event.origin.startsWith('moz-extension://')) {
                this.log('❌ Message from disallowed origin:', event.origin);
                return;
            }
            
            this.log('Received preferences message:', event.data.type);
            
            switch (event.data.type) {
                case 'refsense-get-settings':
                    this.sendSettingsToPreferences(event.source);
                    break;
                    
                case 'refsense-save-settings':
                    this.saveSettingsFromPreferences(event.data.settings, event.source);
                    break;
                    
                case 'refsense-test-connection':
                    this.testConnectionFromPreferences(event.data.backend, event.data.config, event.source);
                    break;
            }
            
        } catch (error) {
            this.log('❌ Error handling preferences message:', error.message);
        }
    },
    
    // Get settings for preferences (direct call)
    getSettingsForPreferences() {
        try {
            const settings = {
                ai_backend: Zotero.Prefs.get('extensions.refsense.ai_backend', 'ollama'),
                openai_api_key: Zotero.Prefs.get('extensions.refsense.openai_api_key', ''),
                openai_model: Zotero.Prefs.get('extensions.refsense.openai_model', 'gpt-4-turbo'),
                ollama_host: Zotero.Prefs.get('extensions.refsense.ollama_host', 'http://localhost:11434'),
                ollama_model: Zotero.Prefs.get('extensions.refsense.ollama_model', 'llama3.2:latest'),
                default_page_source: Zotero.Prefs.get('extensions.refsense.default_page_source', 'first'),
                page_range: Zotero.Prefs.get('extensions.refsense.page_range', '1-2')
            };
            
            this.log('Settings retrieved for preferences');
            return { success: true, settings: settings };
            
        } catch (error) {
            this.log('❌ Error getting settings:', error.message);
            return { success: false, error: error.message };
        }
    },
    
    // Send current settings to preferences window (postMessage)
    sendSettingsToPreferences(source) {
        try {
            const result = this.getSettingsForPreferences();
            
            if (result.success) {
                source.postMessage({
                    type: 'refsense-settings-response',
                    settings: result.settings
                }, '*');
                this.log('Settings sent to preferences window');
            } else {
                source.postMessage({
                    type: 'refsense-settings-error',
                    error: result.error
                }, '*');
            }
            
        } catch (error) {
            this.log('❌ Error sending settings:', error.message);
            source.postMessage({
                type: 'refsense-settings-error',
                error: error.message
            }, '*');
        }
    },
    
    // Save settings (direct call)
    saveSettingsFromPreferences(settings, source = null) {
        try {
            // Save all settings
            Object.keys(settings).forEach(key => {
                const prefKey = `extensions.refsense.${key}`;
                Zotero.Prefs.set(prefKey, settings[key]);
            });
            
            // Reload config
            this.loadConfig();
            
            this.log('Settings saved from preferences window');
            
            if (source) {
                source.postMessage({
                    type: 'refsense-save-response',
                    success: true
                }, '*');
            }
            
            return { success: true };
            
        } catch (error) {
            this.log('❌ Error saving settings:', error.message);
            
            if (source) {
                source.postMessage({
                    type: 'refsense-save-error',
                    error: error.message
                }, '*');
            }
            
            return { success: false, error: error.message };
        }
    },
    
    // Test connection from preferences window
    testConnectionFromPreferences(backend, config, source, origin = '*') {
        try {
            this.log(`Testing ${backend} connection`);
            
            if (backend === 'ollama') {
                // Test Ollama connection
                this.testOllamaConnection(config.host).then(result => {
                    if (source) {
                        source.postMessage({
                            type: 'refsense-test-response',
                            success: result.success,
                            message: result.message
                        }, origin);
                        this.log('Test response sent for Ollama');
                    }
                });
            } else {
                // OpenAI test (simple validation)
                const isValid = config.apiKey && config.apiKey.startsWith('sk-') && config.apiKey.length > 40;
                if (source) {
                    source.postMessage({
                        type: 'refsense-test-response',
                        success: isValid,
                        message: isValid ? 'OpenAI API key format is valid!' : 'OpenAI API key format is invalid.'
                    }, origin);
                    this.log('Test response sent for OpenAI');
                }
            }
            
        } catch (error) {
            this.log('❌ Error testing connection:', error.message);
            if (source) {
                source.postMessage({
                    type: 'refsense-test-error',
                    error: error.message
                }, origin);
            }
        }
    },
    
    // Test Ollama connection
    async testOllamaConnection(host) {
        return new Promise((resolve) => {
            try {
                const xhr = new XMLHttpRequest();
                xhr.open('GET', `${host}/api/tags`, true);
                xhr.timeout = 5000;
                
                xhr.onreadystatechange = () => {
                    if (xhr.readyState === 4) {
                        if (xhr.status === 200) {
                            try {
                                const data = JSON.parse(xhr.responseText);
                                const modelCount = data.models ? data.models.length : 0;
                                resolve({
                                    success: true,
                                    message: `Ollama connection successful! Installed models: ${modelCount}`
                                });
                            } catch (parseError) {
                                resolve({
                                    success: true,
                                    message: 'Ollama connection successful!'
                                });
                            }
                        } else {
                            resolve({
                                success: false,
                                message: `Ollama server response error: ${xhr.status}`
                            });
                        }
                    }
                };
                
                xhr.onerror = () => resolve({
                    success: false,
                    message: 'Ollama connection failed: network error'
                });
                
                xhr.ontimeout = () => resolve({
                    success: false,
                    message: 'Ollama connection failed: timeout'
                });
                
                xhr.send();
                
            } catch (error) {
                resolve({
                    success: false,
                    message: `Ollama connection failed: ${error.message}`
                });
            }
        });
    },
    
    
    // Plugin shutdown
    shutdown() {
        this.log('RefSense plugin shutting down...');
        
        // Clean up message listeners
        try {
    // Clean up listener on the main window
            const mainWindow = Zotero.getMainWindow();
            if (mainWindow && mainWindow._refSenseMainMessageListener) {
                mainWindow.removeEventListener('message', mainWindow._refSenseMainMessageListener);
                delete mainWindow._refSenseMainMessageListener;
            }
            
    // Clean up listener on the current window
            if (typeof window !== 'undefined' && window._refSenseWindowMessageListener) {
                window.removeEventListener('message', window._refSenseWindowMessageListener);
                delete window._refSenseWindowMessageListener;
            }
            
    // Clean up legacy approach
            const windowWatcher = Components.classes["@mozilla.org/embedcomp/window-watcher;1"]
                                           .getService(Components.interfaces.nsIWindowWatcher);
            windowWatcher.unregisterNotification(this);
            
            // Remove listeners from all windows
            const windowMediator = Components.classes["@mozilla.org/appshell/window-mediator;1"]
                                           .getService(Components.interfaces.nsIWindowMediator);
            const windows = windowMediator.getEnumerator(null);
            
            while (windows.hasMoreElements()) {
                const win = windows.getNext();
                if (win && win._refSenseMessageListener) {
                    win.removeEventListener('message', win._refSenseMessageListener);
                    delete win._refSenseMessageListener;
                }
            }
        } catch (error) {
            this.log('Error during message listener cleanup:', error.message);
        }
        
        // Clean up resources
        this.cleanup();
        
        this.log('RefSense plugin shut down');
    },
    
    // Load plugin configuration
    // Load configuration from Zotero preferences (updated for integrated settings)
    loadConfig() {
        try {
            this.log('📥 loadConfig() invoked');
            
            // Check the stored values first
            const rawBackend = Zotero.Prefs.get('extensions.refsense.aiBackend');
            const rawOllamaHost = Zotero.Prefs.get('extensions.refsense.ollamaHost');
            
            this.log(`📥 Raw values: aiBackend="${rawBackend}", ollamaHost="${rawOllamaHost}"`);
            
            this.config = {
                // AI backend settings
                aiBackend: rawBackend || 'openai',
                
                // OpenAI settings
                openaiModel: Zotero.Prefs.get('extensions.refsense.openaiModel') || 'gpt-4-turbo',
                openaiApiKey: Zotero.Prefs.get('extensions.refsense.openaiApiKey') || '',
                
                // Ollama settings
                ollama_model: Zotero.Prefs.get('extensions.refsense.ollamaModel') || 'llama3.2:latest',
                ollama_host: Zotero.Prefs.get('extensions.refsense.ollamaHost') || 'http://localhost:11434',
                
                // PDF extraction settings
                defaultPageSource: Zotero.Prefs.get('extensions.refsense.defaultPageSource') || 'first',
                pageRange: Zotero.Prefs.get('extensions.refsense.pageRange') || '1-2',
                
                // Other settings
                enableLogging: Zotero.Prefs.get('extensions.refsense.enableLogging') !== false,
                maxRetries: Zotero.Prefs.get('extensions.refsense.maxRetries') || 3,
                requestTimeout: Zotero.Prefs.get('extensions.refsense.requestTimeout') || 30000
            };
            
            // Decode API key (stored as Base64)
            if (this.config.openaiApiKey) {
                try {
                    this.config.openaiApiKey = atob(this.config.openaiApiKey);
                } catch (error) {
                    this.log('API key decoding failed, using raw value');
                }
            }
            
            this.log('Configuration loaded:', {
                ...this.config,
                openaiApiKey: this.config.openaiApiKey ? '[HIDDEN]' : '[NOT SET]'
            });
            
        } catch (error) {
            this.log('Error loading configuration:', error.message);
            // Fallback to defaults
            this.config = {
                aiBackend: 'openai',
                openaiModel: 'gpt-4-turbo',
                openaiApiKey: '',
                ollama_model: 'llama3.2:latest',
                ollama_host: 'http://localhost:11434',
                defaultPageSource: 'first',
                pageRange: '1-2',
                enableLogging: true,
                maxRetries: 3,
                requestTimeout: 30000
            };
        }
    },
    
    // Initialize UI components with retry logic
    initUIWithRetry(attempt = 1, maxAttempts = 10) {
        this.log(`UI initialization attempt ${attempt}/${maxAttempts}`);
        
        try {
            this.initUI();
            this.log('UI initialization completed');
        } catch (error) {
            this.handleError(error, `initUI attempt ${attempt}`);
            
            if (attempt < maxAttempts) {
                const delay = Math.min(1000 * attempt, 10000); // Max 10 seconds
                this.log(`Retrying UI initialization in ${delay}ms...`);
                setTimeout(() => {
                    this.initUIWithRetry(attempt + 1, maxAttempts);
                }, delay);
            } else {
                this.log('UI initialization failed after maximum attempts');
            }
        }
    },

    // Initialize UI components
    initUI() {
        // Add menu items to PDF reader
        this.addPDFReaderButtons();
        
        // Add context menu to item list
        this.addItemListContextMenu();
    },
    
    // Add buttons to PDF reader toolbar
    addPDFReaderButtons() {
        this.log('Adding PDF reader button...');
        
        // Wait for Zotero to be fully loaded
        if (!Zotero.Reader) {
            this.log('Zotero.Reader not available, retrying...');
            setTimeout(() => this.addPDFReaderButtons(), 1000);
            return;
        }
        
        this.log('Zotero.Reader available, setting up hooks...');
        
        try {
            // Method 1: Use Zotero Notifier system for tab events (PDF readers are opened in tabs)
            if (Zotero.Notifier) {
                this.log('Setting up Zotero Notifier for tab events...');
                
                const notifierID = Zotero.Notifier.registerObserver({
                    notify: (event, type, ids, extraData) => {
                        this.log('Notifier event:', event, 'type:', type, 'ids:', ids);
                        
                        // Monitor for tab-related events (PDF readers open in tabs)
                        if (event === 'add' && type === 'tab') {
                            this.log('Tab added event detected for IDs:', ids);
                            for (let id of ids) {
                                // Check if this tab contains a reader
                                setTimeout(() => {
                                    this.checkTabForReader(id, extraData);
                                }, 1000);
                            }
                        }
                        
                        // Also monitor select events to catch when a reader tab is selected
                        if (event === 'select' && type === 'tab') {
                            this.log('Tab selected event detected for IDs:', ids);
                            for (let id of ids) {
                                setTimeout(() => {
                                    this.checkTabForReader(id, extraData);
                                }, 500);
                            }
                        }
                    }
                }, ['tab']);
                
                this.notifierID = notifierID;
                this.log('Notifier registered with ID:', notifierID);
            }
            
            // Method 2: Check available Zotero.Reader methods and properties
            this.log('Available Zotero.Reader properties:', Object.getOwnPropertyNames(Zotero.Reader));
            if (Zotero.Reader._readers) {
                this.log('Zotero.Reader._readers exists, type:', typeof Zotero.Reader._readers);
            }
            
            // Method 3: Monitor for new readers using periodic check
            this.readerMonitorInterval = setInterval(() => {
                try {
                    let readers = [];
                    
                    if (Zotero.Reader && Zotero.Reader._readers) {
                        if (typeof Zotero.Reader._readers.values === 'function') {
                            readers = Array.from(Zotero.Reader._readers.values());
                        } else if (Array.isArray(Zotero.Reader._readers)) {
                            readers = Zotero.Reader._readers;
                        } else {
                            // Try to access as object
                            readers = Object.values(Zotero.Reader._readers);
                        }
                    }
                    
                    for (let reader of readers) {
                        if (reader && reader.itemID && !reader._refsenseButtonAdded) {
                            this.log('Found new reader via monitoring:', reader.itemID);
                            this.setupReaderToolbar(reader);
                        }
                    }
                } catch (error) {
                    // Silently continue monitoring
                }
            }, 3000);
            
            this.log('Reader monitoring started');
            this.log('PDF reader button integration setup completed');
            
        } catch (error) {
            this.handleError(error, 'addPDFReaderButtons');
        }
    },
    
    // Check if a tab contains a reader and set it up
    async checkTabForReader(tabID, extraData) {
        try {
            this.log('Checking tab for reader:', tabID, 'extraData:', extraData);
            
            // Check if this tab is a reader tab
            if (extraData && extraData[tabID]) {
                const tabData = extraData[tabID];
                this.log('Tab data:', tabData);
                
                if (tabData.type === 'reader' && tabData.itemID) {
                    const itemID = tabData.itemID;
                    this.log('Found reader tab for item:', itemID);
                    
                    // Get the reader instance
                    setTimeout(() => {
                        this.setupReaderForItem(itemID);
                    }, 1000);
                } else {
                    this.log('Tab is not a reader or missing itemID:', tabData);
                }
            } else {
                // Fallback: try to get reader directly from current readers
                this.log('No extraData available, checking current readers...');
                setTimeout(() => {
                    this.setupCurrentReaders();
                }, 1000);
            }
        } catch (error) {
            this.handleError(error, 'checkTabForReader');
        }
    },
    
    // Setup all current readers
    setupCurrentReaders() {
        try {
            this.log('Setting up all current readers...');
            
            if (Zotero.Reader && Zotero.Reader._readers) {
                let readers = [];
                
                if (typeof Zotero.Reader._readers.values === 'function') {
                    readers = Array.from(Zotero.Reader._readers.values());
                } else if (Array.isArray(Zotero.Reader._readers)) {
                    readers = Zotero.Reader._readers;
                } else {
                    readers = Object.values(Zotero.Reader._readers);
                }
                
                this.log('Found readers:', readers.length);
                
                for (let reader of readers) {
                    if (reader && reader.itemID && !reader._refsenseButtonAdded) {
                        this.log('Setting up reader:', reader.itemID);
                        this.setupReaderToolbar(reader);
                    }
                }
            }
        } catch (error) {
            this.handleError(error, 'setupCurrentReaders');
        }
    },
    
    // Setup reader for a specific item ID
    async setupReaderForItem(itemID) {
        try {
            this.log('Setting up reader for item ID:', itemID);
            
            // Get the reader instance
            if (Zotero.Reader && Zotero.Reader._readers) {
                let readers = [];
                
                if (typeof Zotero.Reader._readers.values === 'function') {
                    readers = Array.from(Zotero.Reader._readers.values());
                } else {
                    readers = Object.values(Zotero.Reader._readers);
                }
                
                const reader = readers.find(r => r && r.itemID == itemID);
                if (reader) {
                    this.log('Found reader instance for item:', itemID);
                    this.setupReaderToolbar(reader);
                } else {
                    this.log('No reader instance found for item:', itemID);
                }
            }
        } catch (error) {
            this.handleError(error, 'setupReaderForItem');
        }
    },
    
    // Setup toolbar for a specific reader
    setupReaderToolbar(reader) {
        try {
            this.log('Setting up toolbar for reader:', reader.itemID);
            
            // Check if button already exists
            if (reader._refsenseButtonAdded) {
                this.log('Button already exists for this reader');
                return;
            }
            
            // Try multiple approaches for adding toolbar button
            this.addReaderToolbarButton(reader);
            this.addReaderMenuItem(reader);
            
        } catch (error) {
            this.handleError(error, 'setupReaderToolbar');
        }
    },
    
    // Add toolbar button to PDF reader
    addReaderToolbarButton(reader) {
        try {
            this.log('Adding toolbar button to reader:', reader.itemID);
            
            // Wait for reader window to be fully loaded
            setTimeout(() => {
                this.insertToolbarButton(reader);
            }, 2000);
            
        } catch (error) {
            this.handleError(error, 'addReaderToolbarButton');
        }
    },
    
    // Insert the actual toolbar button
    insertToolbarButton(reader) {
        try {
            this.log('Starting button insertion for reader:', reader.itemID);
            
            // Wait for reader to be fully initialized and use a simpler approach
            const tryInsertButton = () => {
                try {
                    // Use a much simpler approach - just add to any available window/iframe
                    let targetDoc = null;
                    let targetWindow = null;
                    
                    // Try to find the PDF viewer iframe or window
                    if (reader._iframeWindow && reader._iframeWindow.document) {
                        targetWindow = reader._iframeWindow;
                        targetDoc = reader._iframeWindow.document;
                        this.log('Using iframe window/document');
                    } else if (reader._window && reader._window.document && reader._window !== globalThis) {
                        targetWindow = reader._window;
                        targetDoc = reader._window.document;
                        this.log('Using reader window/document');
                    } else {
                        this.log('Cannot find suitable document, skipping button insertion');
                        return;
                    }
                    
                    // Simple DOM ready check
                    if (!targetDoc || !targetDoc.body || targetDoc.readyState === 'loading') {
                        this.log('Document not ready, retrying...');
                        setTimeout(tryInsertButton, 1000);
                        return;
                    }
                    
                    this.log('Document ready, inserting floating button');
                    this.insertSimpleFloatingButton(targetDoc, targetWindow, reader);
                    
                } catch (error) {
                    this.log('Error in tryInsertButton:', error.message);
                }
            };
            
            // Start trying to insert button with delays
            setTimeout(tryInsertButton, 1000);
            
        } catch (error) {
            this.handleError(error, 'insertToolbarButton');
        }
    },
    
    // Insert a simple floating button that always works
    insertSimpleFloatingButton(doc, win, reader) {
        try {
            this.log('Inserting simple floating button');
            
            // Check if button already exists
            if (doc.querySelector('#refsense-simple-btn')) {
                this.log('Simple RefSense button already exists');
                return;
            }
            
            // Check if PDF already has a parent item
            if (this.hasParentItem(reader)) {
                this.log('PDF already has parent item - not showing RefSense button');
                return;
            }
            
            // Create floating button with minimal dependencies
            const btn = doc.createElement('div');
            btn.id = 'refsense-simple-btn';
            btn.textContent = '📄 RefSense';
            btn.title = 'Extract Metadata (Ctrl+Shift+E)';
            
            // Simple but effective styling
            btn.style.cssText = `
                position: fixed !important;
                top: 15px !important;
                right: 15px !important;
                background: #4CAF50 !important;
                color: white !important;
                padding: 8px 12px !important;
                border-radius: 20px !important;
                cursor: pointer !important;
                font-family: Arial, sans-serif !important;
                font-size: 12px !important;
                font-weight: bold !important;
                z-index: 999999 !important;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3) !important;
                border: none !important;
                user-select: none !important;
                transition: all 0.2s ease !important;
            `;
            
            // Add hover effect
            btn.onmouseenter = () => {
                btn.style.background = '#45a049 !important';
                btn.style.transform = 'scale(1.05)';
            };
            btn.onmouseleave = () => {
                btn.style.background = '#4CAF50 !important';
                btn.style.transform = 'scale(1)';
            };
            
            // Add click handler
            btn.onclick = (event) => {
                event.preventDefault();
                event.stopPropagation();
                this.log('Simple RefSense button clicked!');
                this.handleExtractMetadata(reader);
            };
            
            // Insert into document
            doc.body.appendChild(btn);
            this.log('Simple floating button inserted successfully');
            reader._refsenseButtonAdded = true;
            
        } catch (error) {
            this.handleError(error, 'insertSimpleFloatingButton');
        }
    },

    // Check if PDF attachment already has a parent item
    hasParentItem(reader) {
        try {
            if (!reader || !reader.itemID) {
                this.log('No reader or itemID available for parent check');
                return false;
            }

            // Get the PDF attachment item
            const pdfItem = Zotero.Items.get(reader.itemID);
            if (!pdfItem) {
                this.log('Could not find PDF item with ID:', reader.itemID);
                return false;
            }

            // Check if it has a parent item
            const hasParent = pdfItem.parentItemID && pdfItem.parentItemID > 0;
            
            this.log(`PDF item ${reader.itemID} parent check:`, {
                itemID: reader.itemID,
                parentItemID: pdfItem.parentItemID,
                hasParent: hasParent
            });

            return hasParent;
            
        } catch (error) {
            this.log('Error checking parent item:', error.message);
            // If error occurs, show button to be safe
            return false;
        }
    },
    
    // Simplified toolbar search (keeping for future use)
    searchForToolbar(doc) {
        try {
            this.log('Searching for PDF toolbar in document');
            
            // This function is kept for future improvements
            return null;
        } catch (error) {
            this.handleError(error, 'searchForToolbar');
            return null;
        }
    },
    
    // Add menu item to reader (safer approach)
    addReaderMenuItem(reader) {
        try {
            this.log('Adding menu item to reader:', reader.itemID);
            
            // Mark as added
            reader._refsenseButtonAdded = true;
            
            // Try multiple approaches for keyboard shortcut
            this.addKeyboardShortcuts(reader);
            
            // Also try to add to Zotero's main menu
            this.addToZoteroMenu(reader);
            
        } catch (error) {
            this.handleError(error, 'addReaderMenuItem');
        }
    },
    
    // Add keyboard shortcuts with multiple targets
    addKeyboardShortcuts(reader) {
        const handleKeydown = (event) => {
            if (event.ctrlKey && event.shiftKey && event.key === 'E') {
                event.preventDefault();
                event.stopPropagation();
                this.log('Keyboard shortcut triggered!');
                this.handleExtractMetadata(reader);
                return false;
            }
        };
        
        try {
            // Add to main Zotero window (use Zotero's window reference)
            try {
                if (typeof Zotero !== 'undefined' && Zotero.getMainWindow) {
                    const mainWindow = Zotero.getMainWindow();
                    if (mainWindow && mainWindow.document) {
                        mainWindow.document.addEventListener('keydown', handleKeydown, true);
                        this.log('Keyboard shortcut added to main window via Zotero.getMainWindow()');
                    }
                } else if (typeof Components !== 'undefined') {
                    // Fallback using Components
                    const wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
                                        .getService(Components.interfaces.nsIWindowMediator);
                    const mainWindow = wm.getMostRecentWindow("navigator:browser") || 
                                     wm.getMostRecentWindow("zotero:main");
                    if (mainWindow && mainWindow.document) {
                        mainWindow.document.addEventListener('keydown', handleKeydown, true);
                        this.log('Keyboard shortcut added to main window via Components');
                    }
                } else {
                    this.log('No method available to access main window');
                }
            } catch (winError) {
                this.log('Could not access main window:', winError.message);
            }
            
            // Add to reader window
            if (reader._window && reader._window.document) {
                reader._window.document.addEventListener('keydown', handleKeydown, true);
                this.log('Keyboard shortcut added to reader window');
            }
            
            // Add to reader iframe if exists
            if (reader._iframeWindow && reader._iframeWindow.document) {
                reader._iframeWindow.document.addEventListener('keydown', handleKeydown, true);
                this.log('Keyboard shortcut added to reader iframe');
            }
            
        } catch (error) {
            this.handleError(error, 'addKeyboardShortcuts');
        }
    },
    
    // Add to Zotero's menu system
    addToZoteroMenu(reader) {
        try {
            this.log('RefSense activated for reader:', reader.itemID);
            
            // No popup notification - the floating button provides visual indication
            // that RefSense is active for this PDF
            
        } catch (error) {
            this.handleError(error, 'addToZoteroMenu');
        }
    },
    
    // Handle metadata extraction
    async handleExtractMetadata(reader) {
        this.log('Extract metadata button clicked for reader:', reader.itemID);
        
        try {
            // Get PDF item
            const item = await Zotero.Items.getAsync(reader.itemID);
            if (!item) {
                throw new Error('Could not find PDF item');
            }
            
            this.log('PDF item found:', item.getField('title') || 'Untitled');
            
            // Show processing message on buttons (skip for context menu calls)
            let targetDoc = null;
            let simpleBtn = null;
            let originalSimpleText = '';
            
            if (!reader._isContextMenu) {
                if (reader._iframeWindow && reader._iframeWindow.document) {
                    targetDoc = reader._iframeWindow.document;
                } else if (reader._window && reader._window.document) {
                    targetDoc = reader._window.document;
                }
                
                if (targetDoc) {
                    simpleBtn = targetDoc.querySelector('#refsense-simple-btn');
                    if (simpleBtn) {
                        originalSimpleText = simpleBtn.textContent;
                        simpleBtn.textContent = '⏳ Processing...';
                        simpleBtn.style.opacity = '0.7';
                        simpleBtn.style.pointerEvents = 'none';
                    }
                }
            } else {
                this.log('Context menu call detected - skipping button UI updates');
            }
            
            try {
                // Get PDF context information
                const pdfContext = await this.getPDFContext(reader, item);
                
                // Extract PDF content and process with AI
                const extractionResult = await this.extractPDFContent(reader, pdfContext);
                
                if (extractionResult.success) {
                    this.log('✅ PDF content extraction and AI processing completed successfully');
                } else {
                    this.log('❌ PDF content extraction or AI processing failed:', extractionResult.error);
                    
                    // Show error message
                    this.showMessage(
                        'PDF processing failed',
                        extractionResult.error || 'An unknown error occurred.',
                        'error'
                    );
                }
                
            } finally {
                // Restore buttons (skip for context menu calls)
                if (!reader._isContextMenu) {
                    setTimeout(() => {
                        if (simpleBtn) {
                            simpleBtn.textContent = originalSimpleText;
                            simpleBtn.style.opacity = '1';
                            simpleBtn.style.pointerEvents = 'auto';
                        }
                    }, 1000);
                }
            }
            
        } catch (error) {
            this.handleError(error, 'handleExtractMetadata');
            
            // Show error to user
            if (reader._isContextMenu) {
                // For context menu calls, show error differently
                this.showError('RefSense error', `An error occurred during processing: ${error.message}`);
            } else if (reader._window) {
                reader._window.alert(`RefSense Error: ${error.message}`);
            }
            
            // Restore buttons on error (skip for context menu calls)
            if (!reader._isContextMenu) {
                let targetDoc = null;
                if (reader._iframeWindow && reader._iframeWindow.document) {
                    targetDoc = reader._iframeWindow.document;
                } else if (reader._window && reader._window.document) {
                    targetDoc = reader._window.document;
                }
                
                if (targetDoc) {
                    const simpleBtn = targetDoc.querySelector('#refsense-simple-btn');
                    if (simpleBtn) {
                        simpleBtn.textContent = '📄 RefSense';
                        simpleBtn.style.opacity = '1';
                        simpleBtn.style.pointerEvents = 'auto';
                    }
                }
            }
        }
    },
    
    // Extract PDF content (Stage 3 implementation)
    async extractPDFContent(reader, pdfContext) {
        this.log('Starting PDF content extraction for:', pdfContext.filename);
        
        const result = {
            success: false,
            method: '',
            pageNumber: 1,
            contentType: '',
            content: '',
            contentLength: 0,
            imageDataUrl: null,
            error: null
        };
        
        try {
            // Determine which page to extract based on settings
            const pageToExtract = this.getPageToExtract(pdfContext);
            result.pageNumber = pageToExtract;
            
            this.log('Extracting content from page:', pageToExtract);
            
            // Try text extraction first (preferred method)
            const textResult = await this.extractTextFromPage(reader, pageToExtract);
            
            if (textResult.success && textResult.text && textResult.text.trim().length > 50) {
                // Text extraction successful, now call AI
                result.success = true;
                result.method = 'text';
                result.contentType = 'text';
                result.content = textResult.text;
                result.contentLength = textResult.text.length;
                this.log('Text extraction successful, length:', result.contentLength);
                
                // Process with AI to extract metadata
                const aiResult = await this.processWithAI(textResult.text, pdfContext);
                
                if (aiResult && aiResult.success) {
                    // AI processing successful - handle based on parent existence
                    if (pdfContext.hasParent) {
                        this.log('Parent item exists, showing comparison dialog for user decision');
                        // Parent exists, show comparison dialog for user decision
                        const userDecision = await this.handleExistingParent(aiResult.metadata, reader, pdfContext);
                        
                        if (userDecision.success) {
                            result.success = true;
                        } else {
                            result.success = false;
                            result.error = userDecision.error || 'User cancelled the operation';
                            this.log('User cancelled or operation failed');
                        }
                    } else {
                        this.log('No parent item, showing metadata preview');
                        // No parent exists, show preview first
                        const userConfirmed = await this.showMetadataPreview(aiResult.metadata, pdfContext);
                        
                        if (userConfirmed) {
                            // User confirmed - create parent item
                            await this.createParentFromMetadata(userConfirmed.metadata, reader, pdfContext);
                            result.success = true; // Mark overall process as successful
                        } else {
                            // User cancelled
                            result.success = false;
                            result.error = 'User cancelled the operation';
                            this.log('User cancelled metadata creation');
                        }
                    }
                } else {
                    // AI processing failed
                    result.success = false;
                    result.error = aiResult ? aiResult.error : 'No AI result available';
                    this.showMessage('AI processing failed', result.error, 'warning');
                }
                
            } else {
                // Text extraction failed or insufficient
                result.success = false;
                result.error = `Text extraction failed or insufficient content. Available text length: ${textResult.text ? textResult.text.length : 0}`;
                this.log('PDF content extraction failed:', result.error);
                
                // Show user-friendly message
                this.showMessage('Text extraction failed', 'RefSense could not extract text from this PDF. It may be image-based or protected.', 'warning');
            }
            
        } catch (error) {
            result.success = false;
            result.error = error.message;
            this.handleError(error, 'extractPDFContent');
        }
        
        return result;
    },
    
    // Determine which page to extract based on settings
    getPageToExtract(pdfContext) {
        const pageSource = this.config.defaultPageSource || 'first';
        
        switch (pageSource) {
            case 'current':
                return pdfContext.currentPage;
            case 'range':
                // For now, just use first page of range
                const range = this.config.pageRange || '1';
                const firstPage = parseInt(range.split(/[-–—]/)[0]) || 1;
                return Math.min(firstPage, pdfContext.totalPages || 1);
            case 'first':
            default:
                return 1;
        }
    },
    
    // Extract text from specific page using multiple approaches
    async extractTextFromPage(reader, pageNumber) {
        const result = {
            success: false,
            text: '',
            error: null
        };
        
        try {
            this.log('Attempting text extraction from page:', pageNumber);
            
            // For context menu calls, use a simplified approach
            if (reader._isContextMenu) {
                this.log('Context menu call detected - using simplified extraction');
                return await this.extractTextForContextMenu(reader, pageNumber);
            }
            
            // Try multiple text extraction methods in priority order
            const extractionMethods = [
                { name: '1. Zotero Fulltext API', func: () => this.extractViaZoteroAPI(reader, pageNumber) },
                { name: '2. Direct Reader API', func: () => this.extractViaZoteroReader(reader, pageNumber) },
                { name: '3. PDF.js wrappedJSObject', func: () => this.extractViaPDFJS(reader, pageNumber) },
                { name: '4. DOM textLayer', func: () => this.extractViaTextLayer(reader, pageNumber) },
                { name: '5. Document selection', func: () => this.extractViaDocumentSelection(reader, pageNumber) },
                { name: '6. File system access', func: () => this.extractViaFileSystemAccess(reader, pageNumber) }
            ];
            
            this.log('=== Beginning text extraction attempts ===');
            
            for (let i = 0; i < extractionMethods.length; i++) {
                const { name, func } = extractionMethods[i];
                try {
                    this.log(`🔄 Attempting: ${name}`);
                    const methodResult = await func();
                    
                    if (methodResult.success && methodResult.text && methodResult.text.length > 20) {
                        this.log(`✅ Success: ${name} - text length: ${methodResult.text.length}`);
                        this.log(`📄 Text preview: "${methodResult.text.substring(0, 100)}..."`);
                        this.log('=== Text extraction complete ===');
                        return methodResult;
                    } else if (methodResult.text) {
                        this.log(`⚠️ Partial success: ${name} - text too short (${methodResult.text.length})`);
                        this.log(`📄 Short text: "${methodResult.text}"`);
                    } else {
                        this.log(`❌ Failure: ${name} - no text returned`);
                    }
                } catch (error) {
                    this.log(`❌ Error: ${name} - ${error.message}`);
                }
            }
            
            result.error = 'All text extraction methods failed';
            this.log('❌ All text extraction methods failed');
            this.log('=== Text extraction failed ===');
            
        } catch (error) {
            result.error = error.message;
            this.log('Text extraction error:', error.message);
        }
        
        return result;
    },

    // Context menu specific text extraction
    async extractTextForContextMenu(reader, pageNumber) {
        const result = {
            success: false,
            text: '',
            error: null
        };

        try {
            this.log('=== Context Menu Text Extraction ===');
            
            // Get PDF item from reader
            const pdfItem = reader.pdfItem || (await Zotero.Items.getAsync(reader.itemID));
            if (!pdfItem) {
                throw new Error('Could not find PDF item');
            }

            // Get attachment file path
            const filePath = await pdfItem.getFilePathAsync();
            if (!filePath) {
                throw new Error('Could not get PDF file path');
            }

            this.log('PDF file path:', filePath);

            // Method 1: Try to read .zotero-ft-cache file first
            const cacheResult = await this.extractFromZoteroCache(filePath);
            if (cacheResult.success && cacheResult.text && cacheResult.text.length > 50) {
                this.log('✅ Cache file extraction successful, length:', cacheResult.text.length);
                return cacheResult;
            }

            // Method 2: Try Zotero Fulltext API for this specific item
            const fulltextResult = await this.extractViaZoteroAPI(reader, pageNumber);
            if (fulltextResult.success && fulltextResult.text && fulltextResult.text.length > 50) {
                this.log('✅ Zotero API extraction successful, length:', fulltextResult.text.length);
                return fulltextResult;
            }

            // Method 3: Force fulltext indexing and retry
            const indexingResult = await this.forceFulltextIndexing(pdfItem);
            if (indexingResult.success && indexingResult.text && indexingResult.text.length > 50) {
                this.log('✅ Forced indexing extraction successful, length:', indexingResult.text.length);
                return indexingResult;
            }

            // If all methods fail, return error
            result.error = 'All context menu extraction methods failed';
            this.log('❌ All context menu extraction methods failed');

        } catch (error) {
            result.error = error.message;
            this.log('❌ Context menu extraction error:', error.message);
        }

        return result;
    },

    // Extract text from .zotero-ft-cache file
    async extractFromZoteroCache(filePath) {
        const result = { success: false, text: '', error: null };

        try {
            this.log('=== Zotero Cache File Extraction ===');
            
            // Get directory of PDF file
            const fileDir = filePath.substring(0, filePath.lastIndexOf('/')) || 
                           filePath.substring(0, filePath.lastIndexOf('\\'));
            
            const cacheFilePath = `${fileDir}/.zotero-ft-cache`;
            this.log('Cache file path:', cacheFilePath);

            // Check if cache file exists and read it
            if (typeof IOUtils !== 'undefined') {
                try {
                    const cacheExists = await IOUtils.exists(cacheFilePath);
                    if (cacheExists) {
                        const cacheData = await IOUtils.readUTF8(cacheFilePath);
                        if (cacheData && cacheData.trim().length > 50) {
                            result.success = true;
                            result.text = cacheData.trim();
                            this.log('✅ Cache file read successfully, length:', result.text.length);
                            this.log('📄 Cache text preview:', result.text.substring(0, 200));
                            return result;
                        } else {
                            this.log('⚠️ Cache file exists but content is too short');
                        }
                    } else {
                        this.log('⚠️ Cache file does not exist');
                    }
                } catch (ioError) {
                    this.log('❌ IOUtils cache read error:', ioError.message);
                }
            }

            // Try alternative file reading methods
            if (typeof Components !== 'undefined' && Components.classes) {
                try {
                    const file = Components.classes["@mozilla.org/file/local;1"]
                                          .createInstance(Components.interfaces.nsIFile);
                    file.initWithPath(cacheFilePath);
                    
                    if (file.exists() && file.isFile()) {
                        const fileStream = Components.classes["@mozilla.org/network/file-input-stream;1"]
                                                   .createInstance(Components.interfaces.nsIFileInputStream);
                        const converterStream = Components.classes["@mozilla.org/intl/converter-input-stream;1"]
                                                         .createInstance(Components.interfaces.nsIConverterInputStream);
                        
                        fileStream.init(file, -1, 0, 0);
                        converterStream.init(fileStream, "UTF-8", 0, 0);
                        
                        let str = {};
                        let content = '';
                        while (converterStream.readString(4096, str) !== 0) {
                            content += str.value;
                        }
                        
                        converterStream.close();
                        fileStream.close();
                        
                        if (content && content.trim().length > 50) {
                            result.success = true;
                            result.text = content.trim();
                            this.log('✅ nsIFile cache read successful, length:', result.text.length);
                            return result;
                        }
                    } else {
                        this.log('⚠️ Cache file not found via nsIFile');
                    }
                } catch (nsError) {
                    this.log('❌ nsIFile cache read error:', nsError.message);
                }
            }

            result.error = 'Cache file not found or empty';
            
        } catch (error) {
            result.error = error.message;
            this.log('❌ Cache extraction error:', error.message);
        }

        return result;
    },

    // Force fulltext indexing for specific item
    async forceFulltextIndexing(pdfItem) {
        const result = { success: false, text: '', error: null };

        try {
            this.log('=== Force Fulltext Indexing ===');

            // Trigger fulltext indexing
            if (Zotero.Fulltext && typeof Zotero.Fulltext.indexPDF === 'function') {
                this.log('Triggering PDF indexing...');
                await Zotero.Fulltext.indexPDF(pdfItem);
                
                // Wait a bit for indexing to complete
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                // Try to get fulltext after indexing
                if (typeof Zotero.Fulltext.getIndexedText === 'function') {
                    const indexedText = await Zotero.Fulltext.getIndexedText(pdfItem.id);
                    if (indexedText && indexedText.length > 50) {
                        result.success = true;
                        result.text = indexedText;
                        this.log('✅ Forced indexing successful, length:', result.text.length);
                        return result;
                    }
                }
            }

            result.error = 'Forced indexing failed';
            this.log('❌ Forced indexing failed');

        } catch (error) {
            result.error = error.message;
            this.log('❌ Forced indexing error:', error.message);
        }

        return result;
    },
    
    // Method 1: Use Zotero Reader API directly (primary approach)
    async extractViaZoteroReader(reader, pageNumber) {
        const result = { success: false, text: '', error: null };
        
        try {
            this.log('=== Direct Zotero Reader API Access ===');
            this.log('Reader object keys:', Object.keys(reader));
            this.log('Reader prototype:', Object.getPrototypeOf(reader));
            this.log('Reader constructor:', reader.constructor.name);
            
            // Drill down to discover available methods
            const allMethods = [];
            let obj = reader;
            while (obj && obj !== Object.prototype) {
                const methods = Object.getOwnPropertyNames(obj).filter(prop => {
                    try {
                        return typeof obj[prop] === 'function';
                    } catch (e) {
                        return false;
                    }
                });
                allMethods.push(...methods);
                obj = Object.getPrototypeOf(obj);
            }
            this.log('All available methods:', [...new Set(allMethods)]);
            
            // Inspect _internalReader
            if (reader._internalReader) {
                this.log('Found _internalReader:', Object.keys(reader._internalReader));
                this.log('_internalReader methods:', Object.getOwnPropertyNames(reader._internalReader).filter(prop => 
                    typeof reader._internalReader[prop] === 'function'
                ));
            }
            
            // Direct PDF.js access via wrappedJSObject
            if (reader._iframeWindow && reader._iframeWindow.wrappedJSObject) {
                try {
                    this.log('=== Accessing PDF.js via wrappedJSObject ===');
                    const wrappedWindow = reader._iframeWindow.wrappedJSObject;
                    
                    // Access PDF.js PDFViewerApplication
                    if (wrappedWindow.PDFViewerApplication) {
                        const pdfApp = wrappedWindow.PDFViewerApplication;
                        this.log('PDFViewerApplication found');
                        this.log('PDFViewerApplication properties:', Object.keys(pdfApp));
                        
                        // 🔍 Strategy 1: Deep exploration of reader._pdfViewer structure
                        if (pdfApp.pdfViewer) {
                            this.log('=== Deep exploration of pdfViewer ===');
                            this.log('pdfViewer keys:', Object.keys(pdfApp.pdfViewer));
                            this.log('pdfViewer constructor:', pdfApp.pdfViewer.constructor.name);
                            
                            // Check for _pages array
                            if (pdfApp.pdfViewer._pages || pdfApp.pdfViewer.pages) {
                                const pages = pdfApp.pdfViewer._pages || pdfApp.pdfViewer.pages;
                                this.log('Found pages array, length:', pages.length);
                                
                                if (pages.length >= pageNumber) {
                                    const targetPage = pages[pageNumber - 1];
                                    this.log(`Page ${pageNumber - 1} structure:`, Object.keys(targetPage));
                                    
                                    // Check for textLayer
                                    if (targetPage._textLayer || targetPage.textLayer) {
                                        const textLayer = targetPage._textLayer || targetPage.textLayer;
                                        this.log('Found textLayer:', Object.keys(textLayer));
                                        
                                        if (textLayer.textLayerDiv) {
                                            const layerText = textLayer.textLayerDiv.textContent || textLayer.textLayerDiv.innerText;
                                            if (layerText && layerText.trim().length > 20) {
                                                result.success = true;
                                                result.text = layerText.trim();
                                                this.log('✅ SUCCESS via pdfViewer textLayer, length:', layerText.length);
                                                this.log('Text preview:', layerText.substring(0, 200));
                                                return result;
                                            }
                                        }
                                    }
                                    
                                    // Check for pdfPage object
                                    if (targetPage.pdfPage || targetPage._pdfPage) {
                                        const pdfPage = targetPage.pdfPage || targetPage._pdfPage;
                                        this.log('Found pdfPage object:', Object.getOwnPropertyNames(pdfPage).filter(prop => typeof pdfPage[prop] === 'function'));
                                        
                                        try {
                                            if (typeof pdfPage.getTextContent === 'function') {
                                                const textContent = await pdfPage.getTextContent();
                                                if (textContent && textContent.items) {
                                                    const pageText = textContent.items
                                                        .map(item => item.str)
                                                        .join(' ')
                                                        .replace(/\s+/g, ' ')
                                                        .trim();
                                                    
                                                    if (pageText.length > 20) {
                                                        result.success = true;
                                                        result.text = pageText;
                                                        this.log('✅ SUCCESS via pdfPage.getTextContent, length:', pageText.length);
                                                        this.log('Text preview:', pageText.substring(0, 200));
                                                        return result;
                                                    }
                                                }
                                            }
                                        } catch (pdfPageError) {
                                            this.log('pdfPage.getTextContent failed:', pdfPageError.message);
                                        }
                                    }
                                }
                            }
                        }
                        
                        // 🔍 Strategy 2: Check reader._pdfDocument.getPage(n) structure
                        if (pdfApp.pdfDocument) {
                            this.log('=== Deep exploration of pdfDocument.getPage() ===');
                            this.log('pdfDocument pages:', pdfApp.pdfDocument.numPages);
                            
                            try {
                                const page = await pdfApp.pdfDocument.getPage(pageNumber);
                                this.log('Page object type:', page.constructor.name);
                                this.log('Page object keys:', Object.keys(page));
                                this.log('Page methods:', Object.getOwnPropertyNames(page).filter(prop => typeof page[prop] === 'function'));
                                
                                // Try various text extraction methods
                                const textMethods = [
                                    'getTextContent',
                                    'getTextContentStream', 
                                    'getText',
                                    'extractText',
                                    'getOperatorList',
                                    'render'
                                ];
                                
                                for (const methodName of textMethods) {
                                    if (typeof page[methodName] === 'function') {
                                        this.log(`Found method: ${methodName}`);
                                        try {
                                            const textData = await page[methodName]();
                                            this.log(`${methodName} result type:`, typeof textData, textData.constructor?.name);
                                            
                                            // Handle different result types
                                            if (textData && textData.items && Array.isArray(textData.items)) {
                                                const pageText = textData.items
                                                    .map(item => item.str || item.text || String(item))
                                                    .filter(str => str && str.trim().length > 0)
                                                    .join(' ')
                                                    .replace(/\s+/g, ' ')
                                                    .trim();
                                                
                                                if (pageText && pageText.length > 20) {
                                                    result.success = true;
                                                    result.text = pageText;
                                                    this.log(`✅ SUCCESS via ${methodName}, length:`, pageText.length);
                                                    this.log('Text preview:', pageText.substring(0, 200));
                                                    return result;
                                                }
                                            } else if (typeof textData === 'string' && textData.trim().length > 20) {
                                                result.success = true;
                                                result.text = textData.trim();
                                                this.log(`✅ SUCCESS via ${methodName} (string), length:`, textData.length);
                                                this.log('Text preview:', textData.substring(0, 200));
                                                return result;
                                            }
                                        } catch (methodError) {
                                            this.log(`${methodName} failed:`, methodError.message);
                                        }
                                    }
                                }
                            } catch (getPageError) {
                                this.log('getPage() failed:', getPageError.message);
                            }
                        }
                        
                        // 🔍 Strategy 3: DOM-based textLayer extraction (forced extraction)
                        this.log('=== DOM-based textLayer extraction ===');
                        const targetDoc = wrappedWindow.document;
                        if (targetDoc) {
                            // Try various textLayer selectors
                            const textLayerSelectors = [
                                '.textLayer',
                                `[data-page-number="${pageNumber}"] .textLayer`,
                                `.page[data-page-number="${pageNumber}"] .textLayer`,
                                `#pageContainer${pageNumber} .textLayer`,
                                '.textContent',
                                '.page .textLayer'
                            ];
                            
                            for (const selector of textLayerSelectors) {
                                const textLayers = targetDoc.querySelectorAll(selector);
                                this.log(`Selector "${selector}" found ${textLayers.length} elements`);
                                
                                for (const layer of textLayers) {
                                    const layerText = layer.textContent || layer.innerText;
                                    if (layerText && layerText.trim().length > 20) {
                                        result.success = true;
                                        result.text = layerText.trim();
                                        this.log(`✅ SUCCESS via DOM selector "${selector}", length:`, layerText.length);
                                        this.log('Text preview:', layerText.substring(0, 200));
                                        return result;
                                    }
                                }
                            }
                        }
                    }
                } catch (wrappedError) {
                    this.log('wrappedJSObject access failed:', wrappedError.message);
                }
            }
            
            // Direct approach 1: access through _internalReader
            if (reader._internalReader) {
                try {
                    const internalReader = reader._internalReader;
                    this.log('Trying _internalReader methods...');
                    
                    // Try _internalReader methods
                    const internalMethods = ['getPageText', 'getText', 'getTextContent', 'extractText'];
                    for (const methodName of internalMethods) {
                        if (typeof internalReader[methodName] === 'function') {
                            try {
                                this.log(`Calling _internalReader.${methodName}(${pageNumber - 1})`);
                                const pageText = await internalReader[methodName](pageNumber - 1);
                                this.log(`${methodName} result:`, pageText ? `${pageText.length} chars` : 'null/empty');
                                
                                if (pageText && pageText.trim().length > 10) {
                                    result.success = true;
                                    result.text = pageText.trim();
                                    this.log(`✅ SUCCESS via _internalReader.${methodName}()`);
                                    return result;
                                }
                            } catch (error) {
                                this.log(`_internalReader.${methodName}() failed:`, error.message);
                            }
                        }
                    }
                } catch (error) {
                    this.log('_internalReader access failed:', error.message);
                }
            }
            
            // Direct approach 1b: invoke reader.getPageText()
            if (typeof reader.getPageText === 'function') {
                try {
                    this.log(`Calling reader.getPageText(${pageNumber - 1}) [0-based indexing]`);
                    const pageText = await reader.getPageText(pageNumber - 1);
                    this.log('getPageText result:', pageText ? `${pageText.length} chars` : 'null/empty');
                    
                    if (pageText && pageText.trim().length > 10) {
                        result.success = true;
                        result.text = pageText.trim();
                        this.log('✅ SUCCESS via reader.getPageText()');
                        return result;
                    }
                } catch (error) {
                    this.log('❌ reader.getPageText() failed:', error.message);
                }
            }
            
            // Direct approach 2: retry after checking getCurrentPageNumber() and getPageCount()
            if (typeof reader.getCurrentPageNumber === 'function') {
                try {
                    const currentPage = await reader.getCurrentPageNumber();
                    const pageCount = typeof reader.getPageCount === 'function' ? await reader.getPageCount() : 'unknown';
                    this.log(`Current page: ${currentPage}, Total pages: ${pageCount}`);
                    
                    // Retry using the current page
                    if (typeof reader.getPageText === 'function') {
                        const currentPageText = await reader.getPageText(currentPage);
                        if (currentPageText && currentPageText.trim().length > 10) {
                            result.success = true;
                            result.text = currentPageText.trim();
                            this.log('✅ SUCCESS via current page getPageText()');
                            return result;
                        }
                    }
                } catch (error) {
                    this.log('Current page method failed:', error.message);
                }
            }
            
            // Direct approach 3: invoke reader text extraction methods (official APIs)
            const directMethods = [
                'getPageText',  // Most likely to exist
                'getText',
                'getTextContent', 
                'extractPageText',
                'getPageContent',
                '_getPageText',
                'getDocumentText',
                'getCurrentPageText',
                'extractText'
            ];
            
            for (const methodName of directMethods) {
                if (typeof reader[methodName] === 'function') {
                    try {
                        this.log(`Trying direct method: ${methodName}`);
                        let text = await reader[methodName](pageNumber - 1);
                        if (text && text.trim().length > 10) {
                            result.success = true;
                            result.text = text.trim();
                            this.log(`✅ SUCCESS via reader.${methodName}()`);
                            return result;
                        }
                    } catch (error) {
                        this.log(`Method ${methodName} failed:`, error.message);
                    }
                }
            }
            
            // Direct approach 4: use reader.item for accurate Zotero Fulltext access
            if (reader.item || reader._item) {
                const item = reader.item || reader._item;
                this.log('Trying via reader.item:', item.id);
                
                try {
                    // Verify correct Zotero.Fulltext usage
                    if (typeof Zotero !== 'undefined' && Zotero.Fulltext) {
                        this.log('Zotero.Fulltext available, trying different methods...');
                        
                        // Method 1: Use the official Zotero 7 Fulltext API
                        try {
                            this.log('=== Accessing the Zotero 7 Fulltext API ===');
                            
                            // Step 0: Zotero.Fulltext._fulltextCache.get() - most reliable option
                            try {
                                if (typeof Zotero.Fulltext._fulltextCache !== 'undefined' && 
                                    typeof Zotero.Fulltext._fulltextCache.get === 'function') {
                                    
                                    this.log('Trying Zotero.Fulltext._fulltextCache.get()...');
                                    const textObj = await Zotero.Fulltext._fulltextCache.get(item.id);
                                    this.log('Fulltext cache result:', textObj ? 'Found' : 'Not found');
                                    
                                    if (textObj && textObj.content) {
                                        this.log('Cache content length:', textObj.content.length);
                                        const cacheContent = textObj.content.trim();
                                        
                                        if (cacheContent.length > 100 && this.isValidText(cacheContent)) {
                                            result.success = true;
                                            result.text = cacheContent.substring(0, 5000);
                                            this.log('✅ SUCCESS via Zotero.Fulltext._fulltextCache.get()');
                                            this.log('Cache text preview:', cacheContent.substring(0, 200));
                                            return result;
                                        } else {
                                            this.log('❌ Cache text failed validation');
                                        }
                                    }
                                } else {
                                    this.log('_fulltextCache.get not available');
                                }
                            } catch (cacheMethodError) {
                                this.log('_fulltextCache.get failed:', cacheMethodError.message);
                            }
                            
                            // Step 1: Read cached fulltext directly from the file system
                            try {
                                const filePath = await item.getFilePathAsync();
                                if (filePath) {
                                    // Build the .zotero-ft-cache file path
                                    const cacheFilePath = filePath.replace(/\.[^.]+$/, '') + '.zotero-ft-cache';
                                    this.log('Checking cache file:', cacheFilePath);
                                    
                                    if (typeof IOUtils !== 'undefined') {
                                        try {
                                            const exists = await IOUtils.exists(cacheFilePath);
                                            if (exists) {
                                                const cacheData = await IOUtils.readUTF8(cacheFilePath);
                                                this.log('Cache file content length:', cacheData.length);
                                                
                                                if (cacheData && cacheData.trim().length > 100 && this.isValidText(cacheData)) {
                                                    result.success = true;
                                                    result.text = cacheData.trim().substring(0, 5000);
                                                    this.log('✅ SUCCESS via Zotero cache file');
                                                    this.log('Cache text preview:', cacheData.substring(0, 200));
                                                    return result;
                                                }
                                            }
                                        } catch (cacheError) {
                                            this.log('Cache file access failed:', cacheError.message);
                                        }
                                    }
                                }
                            } catch (cacheAccessError) {
                                this.log('Cache access method failed:', cacheAccessError.message);
                            }
                            
                            // Step 2: Access Zotero's internal fulltext database
                            try {
                                if (typeof Zotero.DB !== 'undefined') {
                                    const sql = "SELECT content FROM fulltextContent WHERE itemID = ?";
                                    const content = await Zotero.DB.valueQueryAsync(sql, [item.id]);
                                    this.log('DB fulltext content length:', content ? content.length : 0);
                                    
                                    if (content && content.trim().length > 100 && this.isValidText(content)) {
                                        result.success = true;
                                        result.text = content.trim().substring(0, 5000);
                                        this.log('✅ SUCCESS via Zotero DB fulltext');
                                        this.log('DB text preview:', content.substring(0, 200));
                                        return result;
                                    }
                                }
                            } catch (dbError) {
                                this.log('DB fulltext access failed:', dbError.message);
                            }
                            
                            // Step 3: Explore correct Zotero.Fulltext API usage
                            if (typeof Zotero.Fulltext !== 'undefined') {
                                this.log('Exploring Zotero.Fulltext methods:', Object.getOwnPropertyNames(Zotero.Fulltext).filter(prop => typeof Zotero.Fulltext[prop] === 'function'));
                                
                                // Try methods that actually exist
                                const realMethods = [
                                    () => Zotero.Fulltext.getTextFromCache(item.libraryID, item.id),
                                    () => Zotero.Fulltext.getItemContent(item.libraryID, item.id),
                                    () => Zotero.Fulltext.getContent(item.id),
                                    () => Zotero.Fulltext.retrieveContent(item),
                                    () => Zotero.Fulltext.getPageText(item.id, 0),
                                    () => Zotero.Fulltext.findTextInItems([item.id], '').then(results => results[0])
                                ];
                                
                                for (let i = 0; i < realMethods.length; i++) {
                                    try {
                                        this.log(`Trying fulltext method ${i + 1}...`);
                                        const fulltext = await realMethods[i]();
                                        this.log(`Method ${i + 1} result:`, typeof fulltext, fulltext ? fulltext.length || 'object' : 'null');
                                        
                                        let textContent = null;
                                        if (fulltext && typeof fulltext === 'object' && fulltext.content) {
                                            textContent = fulltext.content;
                                        } else if (fulltext && typeof fulltext === 'string') {
                                            textContent = fulltext;
                                        } else if (fulltext && fulltext.text) {
                                            textContent = fulltext.text;
                                        }
                                        
                                        if (textContent && textContent.trim().length > 100 && this.isValidText(textContent)) {
                                            result.success = true;
                                            result.text = textContent.trim().substring(0, 5000);
                                            this.log(`✅ SUCCESS via Zotero.Fulltext method ${i + 1}`);
                                            this.log('Fulltext preview:', textContent.substring(0, 200));
                                            return result;
                                        }
                                    } catch (methodError) {
                                        this.log(`Fulltext method ${i + 1} failed:`, methodError.message);
                                    }
                                }
                            }
                            
                        } catch (error) {
                            this.log('Fulltext API exploration failed:', error.message);
                        }
                        
                        // Method 2: getPages (alternative API)
                        try {
                            const pages = await Zotero.Fulltext.getPages(item.libraryID, item.id);
                            this.log('getPages result:', pages);
                            if (pages && pages.length > 0) {
                                const firstPageContent = pages[0];
                                if (firstPageContent && firstPageContent.trim().length > 50) {
                                    result.success = true;
                                    result.text = firstPageContent.trim().substring(0, 5000);
                                    this.log('✅ SUCCESS via Zotero.Fulltext.getPages');
                                    return result;
                                }
                            }
                        } catch (error) {
                            this.log('getPages failed:', error.message);
                        }
                        
                        // Method 3: Direct item getField if fulltext is stored
                        try {
                            const itemFulltext = item.getField('fulltext');
                            if (itemFulltext && itemFulltext.trim().length > 50) {
                                result.success = true;
                                result.text = itemFulltext.trim().substring(0, 5000);
                                this.log('✅ SUCCESS via item.getField("fulltext")');
                                return result;
                            }
                        } catch (error) {
                            this.log('item.getField("fulltext") failed:', error.message);
                        }
                    }
                } catch (error) {
                    this.log('Reader.item fulltext failed:', error.message);
                }
            }
            
            result.error = `All direct reader methods failed. Available methods: ${Object.getOwnPropertyNames(reader).filter(prop => typeof reader[prop] === 'function').join(', ')}`;
            
        } catch (error) {
            result.error = `Zotero Reader method failed: ${error.message}`;
        }
        
        return result;
    },
    
    // Method 2: Direct PDF.js access
    async extractViaPDFJS(reader, pageNumber) {
        const result = { success: false, text: '', error: null };
        
        try {
            // Try multiple window/iframe approaches
            const windows = [
                reader._iframeWindow,
                reader._window,
                reader.iframe?.contentWindow,
                reader.window
            ].filter(w => w);
            
            this.log('Checking', windows.length, 'windows for PDF.js access');
            
            for (const targetWindow of windows) {
                try {
                    // Check for PDF.js in various locations
                    const pdfApps = [
                        targetWindow.PDFViewerApplication,
                        targetWindow.window?.PDFViewerApplication,
                        targetWindow.parent?.PDFViewerApplication
                    ].filter(app => app);
                    
                    for (const pdfApp of pdfApps) {
                        if (pdfApp && pdfApp.pdfDocument) {
                            const pdfDoc = pdfApp.pdfDocument;
                            this.log('Found PDF.js document with', pdfDoc.numPages, 'pages');
                            
                            if (pageNumber <= pdfDoc.numPages) {
                                const page = await pdfDoc.getPage(pageNumber);
                                const textContent = await page.getTextContent();
                                
                                // Better text combination with layout consideration
                                let pageText = '';
                                let currentY = null;
                                const lines = [];
                                let currentLine = [];
                                
                                for (const item of textContent.items) {
                                    const itemY = item.transform[5]; // Y coordinate
                                    
                                    // New line detection
                                    if (currentY !== null && Math.abs(currentY - itemY) > 5) {
                                        if (currentLine.length > 0) {
                                            lines.push(currentLine.join(' '));
                                            currentLine = [];
                                        }
                                    }
                                    
                                    currentLine.push(item.str.trim());
                                    currentY = itemY;
                                }
                                
                                if (currentLine.length > 0) {
                                    lines.push(currentLine.join(' '));
                                }
                                
                                pageText = lines
                                    .filter(line => line.trim().length > 0)
                                    .join('\n')
                                    .replace(/\s+/g, ' ')
                                    .trim();
                                
                                if (pageText && pageText.length > 20) {
                                    result.success = true;
                                    result.text = pageText;
                                    this.log('PDF.js extraction successful, text length:', pageText.length);
                                    return result;
                                } else {
                                    this.log('PDF.js returned insufficient text:', pageText.length);
                                }
                            } else {
                                this.log(`Page ${pageNumber} exceeds document pages (${pdfDoc.numPages})`);
                            }
                        }
                    }
                } catch (winError) {
                    this.log('Window PDF.js access failed:', winError.message);
                }
            }
            
            result.error = 'PDF.js not accessible in any window';
            
        } catch (error) {
            result.error = `PDF.js method failed: ${error.message}`;
        }
        
        return result;
    },
    
    // Method 3: Text layer DOM extraction
    async extractViaTextLayer(reader, pageNumber) {
        const result = { success: false, text: '', error: null };
        
        try {
            const targetDoc = reader._iframeWindow?.document || reader._window?.document;
            
            if (targetDoc) {
                // Wait a bit for text layer to render
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Try various selectors for text layers
                const selectors = [
                    `.textLayer`,
                    `.page[data-page-number="${pageNumber}"] .textLayer`,
                    `[data-page-number="${pageNumber}"] .textLayer`,
                    `.page:nth-child(${pageNumber}) .textLayer`,
                    `.textContent`,
                    `#pageContainer${pageNumber} .textLayer`
                ];
                
                for (const selector of selectors) {
                    const textLayers = targetDoc.querySelectorAll(selector);
                    this.log(`Checking selector ${selector}, found ${textLayers.length} elements`);
                    
                    for (const layer of textLayers) {
                        const layerText = (layer.textContent || layer.innerText || '').trim();
                        if (layerText && layerText.length > 20) {
                            result.success = true;
                            result.text = layerText;
                            this.log('Text layer extraction successful via:', selector);
                            return result;
                        }
                    }
                }
                
                result.error = 'No text found in text layers';
            } else {
                result.error = 'Document not accessible';
            }
        } catch (error) {
            result.error = `Text layer method failed: ${error.message}`;
        }
        
        return result;
    },
    
    // Method 4: Document selection approach
    async extractViaDocumentSelection(reader, pageNumber) {
        const result = { success: false, text: '', error: null };
        
        try {
            const targetWindow = reader._iframeWindow || reader._window;
            const targetDoc = targetWindow?.document;
            
            if (targetWindow && targetDoc) {
                // Try to select all text and copy it
                if (targetWindow.getSelection && targetDoc.body) {
                    const selection = targetWindow.getSelection();
                    const range = targetDoc.createRange();
                    
                    // Select all body content
                    range.selectNodeContents(targetDoc.body);
                    selection.removeAllRanges();
                    selection.addRange(range);
                    
                    const selectedText = selection.toString().trim();
                    selection.removeAllRanges();
                    
                    if (selectedText && selectedText.length > 20) {
                        result.success = true;
                        result.text = selectedText;
                        this.log('Document selection extraction successful');
                    } else {
                        result.error = 'No text found via selection';
                    }
                } else {
                    result.error = 'Selection API not available';
                }
            } else {
                result.error = 'Window/document not accessible';
            }
        } catch (error) {
            result.error = `Document selection method failed: ${error.message}`;
        }
        
        return result;
    },
    
    // Method 5: Zotero internal API approach
    async extractViaZoteroAPI(reader, pageNumber) {
        const result = { success: false, text: '', error: null };
        
        try {
            this.log('[Zotero API] Starting: Using Zotero Fulltext API');
            
            // Try to access the PDF via Zotero's internal systems
            if (typeof Zotero !== 'undefined' && Zotero.Fulltext) {
                this.log('[Zotero API] Zotero.Fulltext available');
                const item = await Zotero.Items.getAsync(reader.itemID);
                if (item && item.isAttachment()) {
                    this.log(`[Zotero API] PDF attachment found: ID ${item.id}`);
                    
                    // Try multiple fulltext methods
                    const methods = [
                        { name: 'getItemContent', func: () => Zotero.Fulltext.getItemContent(item.libraryID, item.id) },
                        { name: 'getPages', func: () => Zotero.Fulltext.getPages(item.libraryID, item.id) },
                        { name: 'getIndexStats', func: () => Zotero.Fulltext.getIndexStats(item.id) },
                        { name: 'findTextInItems', func: () => Zotero.Fulltext.findTextInItems([item.id], '') }
                    ];
                    
                    for (const { name, func } of methods) {
                        try {
                            this.log(`[Zotero API] Attempt: ${name}`);
                            const fulltext = await func();
                            this.log(`[Zotero API] ${name} result:`, fulltext ? 'Found' : 'Empty', typeof fulltext);
                            
                            if (fulltext && fulltext.content && fulltext.content.trim().length > 50) {
                                const content = fulltext.content.trim();
                                result.success = true;
                                result.text = content.substring(0, 5000); // Reasonable limit
                                this.log(`[Zotero API] ✅ ${name} success: ${content.length} chars`);
                                return result;
                            } else if (fulltext && typeof fulltext === 'string' && fulltext.trim().length > 50) {
                                result.success = true;
                                result.text = fulltext.trim().substring(0, 5000);
                                this.log(`[Zotero API] ✅ ${name} string success: ${fulltext.length} chars`);
                                return result;
                            } else {
                                this.log(`[Zotero API] ❌ ${name} failed: insufficient text`);
                            }
                        } catch (methodError) {
                            this.log(`[Zotero API] ❌ ${name} error: ${methodError.message}`);
                        }
                    }
                    
                    // Try to trigger fulltext indexing if not available
                    try {
                        this.log('[Zotero API] Attempting indexing...');
                        await Zotero.Fulltext.indexItems([item.id]);
                        
                        // Wait a bit and try again
                        this.log('[Zotero API] Waiting 2 seconds after indexing...');
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        
                        this.log('[Zotero API] Retrying after indexing...');
                        
                        // Try different methods since getItemContent doesn't exist
                        const retryMethods = [
                            { name: 'DB-query', func: async () => {
                                const sql = "SELECT content FROM fulltextContent WHERE itemID = ?";
                                const content = await Zotero.DB.valueQueryAsync(sql, [item.id]);
                                return content ? { content: content } : null;
                            }},
                            { name: 'getPages-retry', func: () => Zotero.Fulltext.getPages(item.libraryID, item.id) },
                            { name: 'findTextInItems-retry', func: () => Zotero.Fulltext.findTextInItems([item.id], '') }
                        ];
                        
                        for (const { name, func } of retryMethods) {
                            try {
                                this.log(`[Zotero API] Retry: ${name}`);
                                const retryResult = await func();
                                this.log(`[Zotero API] ${name} result:`, retryResult ? 'Found' : 'Empty', typeof retryResult);
                                
                                if (retryResult && retryResult.content && retryResult.content.trim().length > 50) {
                                    result.success = true;
                                    result.text = retryResult.content.trim().substring(0, 5000);
                                    this.log(`[Zotero API] ✅ ${name} post-indexing success: ${retryResult.content.length} chars`);
                                    return result;
                                } else if (retryResult && typeof retryResult === 'string' && retryResult.trim().length > 50) {
                                    result.success = true;
                                    result.text = retryResult.trim().substring(0, 5000);
                                    this.log(`[Zotero API] ✅ ${name} post-indexing string success: ${retryResult.length} chars`);
                                    return result;
                                }
                            } catch (retryError) {
                                this.log(`[Zotero API] ❌ ${name} retry error: ${retryError.message}`);
                            }
                        }
                        
                    } catch (indexError) {
                        this.log('[Zotero API] ❌ Indexing failed:', indexError.message);
                    }
                }
            }
            
            if (!result.success) {
                result.error = 'Zotero API method not available or returned no content';
            }
        } catch (error) {
            result.error = `Zotero API method failed: ${error.message}`;
        }
        
        return result;
    },
    
    // Method 6: File system access approach with basic PDF parsing
    async extractViaFileSystemAccess(reader, pageNumber) {
        const result = { success: false, text: '', error: null };
        
        try {
            this.log('=== File System Access Method ===');
            
            const item = await Zotero.Items.getAsync(reader.itemID);
            if (item && item.isAttachment()) {
                const filePath = await item.getFilePathAsync();
                this.log('PDF file path:', filePath);
                
                if (filePath) {
                    // Check different file access APIs
                    const fileApis = [];
                    
                    if (typeof OS !== 'undefined' && OS.File) {
                        fileApis.push({ name: 'OS.File', api: OS.File });
                    }
                    
                    if (typeof IOUtils !== 'undefined') {
                        fileApis.push({ name: 'IOUtils', api: IOUtils });
                    }
                    
                    if (typeof Components !== 'undefined' && Components.classes) {
                        fileApis.push({ name: 'nsIFile', api: 'nsIFile' });
                    }
                    
                    this.log('Available file APIs:', fileApis.map(api => api.name));
                    
                    for (const fileApi of fileApis) {
                        try {
                            if (fileApi.name === 'OS.File') {
                                const exists = await OS.File.exists(filePath);
                                if (exists) {
                                    this.log('PDF file exists via OS.File');
                                    
                                    // Try to read the file as binary
                                    const fileData = await OS.File.read(filePath);
                                    this.log('File data read, size:', fileData.byteLength);
                                    
                                    // Try basic PDF text extraction (very simple approach)
                                    const textContent = this.extractTextFromPDFBuffer(fileData);
                                    if (textContent && textContent.length > 50 && this.isValidText(textContent)) {
                                        result.success = true;
                                        result.text = textContent.substring(0, 5000);
                                        this.log('✅ SUCCESS via OS.File + basic PDF parsing');
                                        return result;
                                    } else if (textContent && textContent.length > 50) {
                                        this.log('❌ OS.File text failed validation');
                                    }
                                }
                            } else if (fileApi.name === 'IOUtils') {
                                const fileData = await IOUtils.read(filePath);
                                this.log('File data read via IOUtils, size:', fileData.byteLength);
                                
                                const textContent = this.extractTextFromPDFBuffer(fileData);
                                if (textContent && textContent.length > 50 && this.isValidText(textContent)) {
                                    result.success = true;
                                    result.text = textContent.substring(0, 5000);
                                    this.log('✅ SUCCESS via IOUtils + basic PDF parsing');
                                    return result;
                                } else if (textContent && textContent.length > 50) {
                                    this.log('❌ IOUtils text failed validation');
                                }
                            }
                        } catch (apiError) {
                            this.log(`${fileApi.name} failed:`, apiError.message);
                        }
                    }
                    
                    result.error = 'File accessible but PDF text extraction failed';
                } else {
                    result.error = 'File path not available';
                }
            }
            
        } catch (error) {
            result.error = `File system method failed: ${error.message}`;
        }
        
        return result;
    },
    
    // Validate extracted text (filtering out binary noise)
    isValidText(text) {
        if (!text || typeof text !== 'string' || text.trim().length < 20) {
            return false;
        }
        
        const cleanText = text.trim();
        
        // 1. Check ratio of ASCII control characters (over 5% suggests binary content)
        const controlCharCount = (cleanText.match(/[\x00-\x1F\x7F-\x9F]/g) || []).length;
        const controlCharRatio = controlCharCount / cleanText.length;
        if (controlCharRatio > 0.05) {
            this.log('Text rejected: too many control characters', controlCharRatio);
            return false;
        }
        
        // 2. Evaluate proportion of readable words
        const words = cleanText.split(/\s+/);
        const readableWords = words.filter(word => {
            // Words with at least two characters containing letters or digits
            return word.length >= 2 && /[a-zA-Z0-9]/.test(word);
        });
        const readableRatio = readableWords.length / words.length;
        if (readableRatio < 0.3) {
            this.log('Text rejected: too few readable words', readableRatio);
            return false;
        }
        
        // 3. Detect repeated meaningless character patterns
        const gibberishPatterns = [
            /[^\w\s]{10,}/g,  // 10 or more consecutive special characters
            /\b[bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ]{8,}\b/g,  // 8 or more consecutive consonants
            /\b\w{1,2}\s+\w{1,2}\s+\w{1,2}\s+\w{1,2}\s+\w{1,2}/g  // Excessive runs of 1-2 letter words
        ];
        
        let gibberishCount = 0;
        for (const pattern of gibberishPatterns) {
            const matches = cleanText.match(pattern);
            if (matches) {
                gibberishCount += matches.join('').length;
            }
        }
        
        const gibberishRatio = gibberishCount / cleanText.length;
        if (gibberishRatio > 0.2) {
            this.log('Text rejected: too much gibberish', gibberishRatio);
            return false;
        }
        
        // 4. Look for academic paper characteristics (bonus score)
        const academicIndicators = [
            /\babstract\b/i,
            /\bintroduction\b/i,
            /\bconclusion\b/i,
            /\breferences?\b/i,
            /\buniversity\b/i,
            /\bjournal\b/i,
            /\bdoi\b/i,
            /\b(19|20)\d{2}\b/,  // Year
            /\b[A-Z][a-z]+,?\s+[A-Z]\.?\s*[A-Z]?[a-z]*\b/  // Author name pattern
        ];
        
        let academicScore = 0;
        for (const indicator of academicIndicators) {
            if (cleanText.match(indicator)) {
                academicScore++;
            }
        }
        
        // 5. Final determination
        const isValid = readableRatio >= 0.5 || academicScore >= 2;
        this.log(`Text validation: readable=${readableRatio.toFixed(2)}, control=${controlCharRatio.toFixed(2)}, gibberish=${gibberishRatio.toFixed(2)}, academic=${academicScore}, valid=${isValid}`);
        
        return isValid;
    },
    
    // Very basic PDF text extraction (scan raw PDF streams)
    extractTextFromPDFBuffer(buffer) {
        try {
            // Convert ArrayBuffer to string
            const uint8Array = new Uint8Array(buffer);
            let pdfString = '';
            
            // Attempt UTF-8 decoding
            try {
                const decoder = new TextDecoder('utf-8', { fatal: false });
                pdfString = decoder.decode(uint8Array);
            } catch (decodeError) {
                // Convert binary data directly to string (fallback)
                for (let i = 0; i < Math.min(uint8Array.length, 100000); i++) { // First 100KB only
                    if (uint8Array[i] > 31 && uint8Array[i] < 127) { // ASCII range
                        pdfString += String.fromCharCode(uint8Array[i]);
                    } else {
                        pdfString += ' ';
                    }
                }
            }
            
            this.log('PDF string sample:', pdfString.substring(0, 200));
            
            // Locate PDF text streams (basic approach)
            const streamRegex = /stream\s*\n([\s\S]*?)\s*endstream/g;
            const textRegex = /\((.*?)\)/g;
            const tjRegex = /\[(.*?)\]/g;
            
            let extractedText = '';
            let match;
            
            // Extract text inside stream...endstream blocks
            while ((match = streamRegex.exec(pdfString)) !== null) {
                const streamContent = match[1];
                
                // Capture text within parentheses (Tj operator)
                let textMatch;
                while ((textMatch = textRegex.exec(streamContent)) !== null) {
                    const text = textMatch[1];
                    if (text && text.length > 2 && /[a-zA-Z]/.test(text)) {
                        extractedText += text + ' ';
                    }
                }
                
                // Capture array-style text (TJ operator)
                while ((textMatch = tjRegex.exec(streamContent)) !== null) {
                    const arrayContent = textMatch[1];
                    const stringParts = arrayContent.match(/\((.*?)\)/g);
                    if (stringParts) {
                        for (const part of stringParts) {
                            const text = part.replace(/[()]/g, '');
                            if (text && text.length > 2 && /[a-zA-Z]/.test(text)) {
                                extractedText += text + ' ';
                            }
                        }
                    }
                }
            }
            
            // Directly search for text patterns outside streams
            const directTextMatches = pdfString.match(/\b[A-Z][a-z]+(?:\s+[A-Z]?[a-z]+)*\b/g);
            if (directTextMatches) {
                for (const text of directTextMatches.slice(0, 100)) { // First 100 matches only
                    if (text.length > 3 && /^[A-Za-z\s]+$/.test(text)) {
                        extractedText += text + ' ';
                    }
                }
            }
            
            // Clean up text
            extractedText = extractedText
                .replace(/\s+/g, ' ')
                .trim()
                .substring(0, 3000); // Limit to the first 3000 characters
            
            this.log('Extracted text sample:', extractedText.substring(0, 200));
            return extractedText;
            
        } catch (error) {
            this.log('PDF buffer text extraction failed:', error.message);
            return '';
        }
    },
    
    // Extract image from specific page using multiple approaches
    async extractImageFromPage(reader, pageNumber) {
        const result = {
            success: false,
            imageDataUrl: null,
            width: 0,
            height: 0,
            error: null
        };
        
        try {
            this.log('Attempting image extraction from page:', pageNumber);
            
            // 🎯 Image extraction strategies (ordered by priority - force rendering first)
            const imageMethods = [
                () => this.extractImageViaPDFJS(reader, pageNumber), // 🥇 Force PDF.js rendering (highest priority)
                () => this.extractImageViaExistingCanvas(reader, pageNumber), // Reuse existing rendered canvas
                () => this.extractImageViaZoteroReader(reader, pageNumber), // Access via Zotero API directly
                () => this.extractImageViaScreenshot(reader, pageNumber) // DOM screenshot (last resort)
            ];
            
            this.log('🔄 Starting image extraction with', imageMethods.length, 'methods...');
            
            for (let i = 0; i < imageMethods.length; i++) {
                const method = imageMethods[i];
                const methodName = ['PDF.js forced rendering', 'Existing canvas', 'Zotero Reader API', 'DOM screenshot'][i];
                
                this.log(`🔍 Trying method ${i + 1}/4: ${methodName}`);
                
                try {
                    const methodResult = await method();
                    if (methodResult.success && methodResult.imageDataUrl) {
                        this.log(`✅ Image extraction SUCCESS via ${methodName}, size: ${methodResult.width}x${methodResult.height}`);
                        return methodResult;
                    } else {
                        this.log(`⚠️ Method ${i + 1} (${methodName}) failed: ${methodResult.error || 'Unknown reason'}`);
                    }
                } catch (error) {
                    this.log(`❌ Method ${i + 1} (${methodName}) threw error:`, error.message);
                }
            }
            
            result.error = 'All image extraction methods failed';
            this.log('Image extraction failed: all methods exhausted');
            
        } catch (error) {
            result.error = error.message;
            this.log('Image extraction error:', error.message);
        }
        
        return result;
    },
    
    // Method 0: Direct Zotero Reader image extraction (enhanced primary approach)
    async extractImageViaZoteroReader(reader, pageNumber) {
        const result = { success: false, imageDataUrl: null, width: 0, height: 0, error: null };
        
        try {
            this.log('=== Direct Zotero Reader Image Access ===');
            
            // Step 1: Access images via _internalReader
            if (reader._internalReader) {
                try {
                    const internalReader = reader._internalReader;
                    this.log('Checking _internalReader for image methods...');
                    
                    const imageMethods = ['getPageImage', 'getSnapshot', 'captureSnapshot', 'renderPage'];
                    for (const methodName of imageMethods) {
                        if (typeof internalReader[methodName] === 'function') {
                            try {
                                this.log(`Trying _internalReader.${methodName}(${pageNumber - 1})`);
                                const imageData = await internalReader[methodName](pageNumber - 1);
                                
                                if (imageData && this.processImageData(imageData, result, `_internalReader.${methodName}`)) {
                                    return result;
                                }
                            } catch (error) {
                                this.log(`_internalReader.${methodName} failed:`, error.message);
                            }
                        }
                    }
                } catch (error) {
                    this.log('_internalReader image access failed:', error.message);
                }
            }
            
            // Step 2: Direct reader methods
            this.log('Available reader methods:', Object.getOwnPropertyNames(reader).filter(prop => 
                typeof reader[prop] === 'function' && 
                (prop.toLowerCase().includes('image') || prop.toLowerCase().includes('snapshot') || 
                 prop.toLowerCase().includes('canvas') || prop.toLowerCase().includes('capture') ||
                 prop.toLowerCase().includes('render'))
            ));
            
            const directMethods = [
                'getPageImage',
                'getSnapshot', 
                'captureSnapshot',
                'getPageSnapshot',
                'renderPage',
                'capturePage',
                'getPageCanvas',
                'getCanvas',
                'screenshot',
                'capture'
            ];
            
            for (const methodName of directMethods) {
                if (typeof reader[methodName] === 'function') {
                    try {
                        this.log(`Trying reader.${methodName}(${pageNumber - 1})`);
                        const imageData = await reader[methodName](pageNumber - 1);
                        
                        if (imageData && this.processImageData(imageData, result, `reader.${methodName}`)) {
                            return result;
                        }
                    } catch (error) {
                        this.log(`reader.${methodName} failed:`, error.message);
                    }
                }
            }
            
            result.error = 'No working image methods found in reader';
            
        } catch (error) {
            result.error = `Zotero Reader image method failed: ${error.message}`;
        }
        
        return result;
    },
    
    // Helper for processing image data
    processImageData(imageData, result, methodName) {
        try {
            if (typeof imageData === 'string' && imageData.startsWith('data:image/')) {
                // Data URL
                result.imageDataUrl = imageData;
                result.success = true;
                this.log(`✅ SUCCESS via ${methodName} - data URL`);
                return true;
                
            } else if (imageData instanceof Blob) {
                // Convert Blob to data URL
                this.blobToDataURL(imageData).then(dataUrl => {
                    result.imageDataUrl = dataUrl;
                    result.success = true;
                    this.log(`✅ SUCCESS via ${methodName} - Blob`);
                });
                return true;
                
            } else if (imageData instanceof HTMLCanvasElement) {
                // Canvas
                result.imageDataUrl = imageData.toDataURL('image/png', 0.9);
                result.width = imageData.width;
                result.height = imageData.height;
                result.success = true;
                this.log(`✅ SUCCESS via ${methodName} - Canvas ${imageData.width}x${imageData.height}`);
                return true;
                
            } else if (imageData && typeof imageData === 'object') {
                // Check for other object types
                this.log(`${methodName} returned object:`, Object.keys(imageData));
                
                if (imageData.canvas) {
                    result.imageDataUrl = imageData.canvas.toDataURL('image/png', 0.9);
                    result.width = imageData.canvas.width;
                    result.height = imageData.canvas.height;
                    result.success = true;
                    this.log(`✅ SUCCESS via ${methodName} - object.canvas`);
                    return true;
                }
                
                if (imageData.dataURL) {
                    result.imageDataUrl = imageData.dataURL;
                    result.success = true;
                    this.log(`✅ SUCCESS via ${methodName} - object.dataURL`);
                    return true;
                }
            }
            
            this.log(`${methodName} returned unusable data:`, typeof imageData);
            return false;
            
        } catch (error) {
            this.log(`Error processing image data from ${methodName}:`, error.message);
            return false;
        }
    },
    
    // Helper to convert Blob to data URL
    blobToDataURL(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    },
    
    // 🔍 Validate canvas contents to ensure real rendering occurred
    validateCanvasContent(canvas) {
        try {
            if (!canvas || canvas.width <= 0 || canvas.height <= 0) {
                this.log('❌ Canvas validation failed: Invalid dimensions');
                return false;
            }
            
            // Sample pixel data from the canvas
            const context = canvas.getContext('2d');
            const sampleSize = Math.min(canvas.width, canvas.height, 100); // Sample up to 100 pixels
            const imageData = context.getImageData(0, 0, sampleSize, sampleSize);
            const pixels = imageData.data;
            
            let colorVariation = 0;
            let nonWhitePixels = 0;
            let transparentPixels = 0;
            
            // Analyze pixels (RGBA format)
            for (let i = 0; i < pixels.length; i += 4) {
                const r = pixels[i];
                const g = pixels[i + 1];
                const b = pixels[i + 2];
                const a = pixels[i + 3];
                
                // Count transparent pixels
                if (a < 255) {
                    transparentPixels++;
                }
                
                // Count pixels that are not pure white (with a small tolerance)
                if (r < 250 || g < 250 || b < 250) {
                    nonWhitePixels++;
                }
                
                // Measure color variation
                const brightness = (r + g + b) / 3;
                colorVariation += Math.abs(brightness - 255);
            }
            
            const totalPixels = pixels.length / 4;
            const nonWhiteRatio = nonWhitePixels / totalPixels;
            const transparentRatio = transparentPixels / totalPixels;
            const avgColorVariation = colorVariation / totalPixels;
            
            this.log('📊 Canvas analysis:', {
                dimensions: `${canvas.width}x${canvas.height}`,
                sampleSize: `${sampleSize}x${sampleSize}`,
                nonWhiteRatio: nonWhiteRatio.toFixed(3),
                transparentRatio: transparentRatio.toFixed(3),
                avgColorVariation: avgColorVariation.toFixed(2)
            });
            
            // Validation thresholds
            const hasContent = nonWhiteRatio > 0.01; // More than 1% of pixels are not white
            const hasVariation = avgColorVariation > 5; // Average color variation greater than 5
            const notMostlyTransparent = transparentRatio < 0.9; // Less than 90% transparent
            
            const isValid = hasContent && hasVariation && notMostlyTransparent;
            
            this.log(`🔍 Canvas validation result: ${isValid ? '✅ PASS' : '❌ FAIL'}`);
            this.log(`   - Has content (${nonWhiteRatio.toFixed(3)} > 0.01): ${hasContent}`);
            this.log(`   - Has variation (${avgColorVariation.toFixed(2)} > 5): ${hasVariation}`);
            this.log(`   - Not transparent (${transparentRatio.toFixed(3)} < 0.9): ${notMostlyTransparent}`);
            
            return isValid;
            
        } catch (error) {
            this.log('❌ Canvas validation error:', error.message);
            return false;
        }
    },
    
    // Method 1: Enhanced PDF.js canvas rendering with comprehensive access
    async extractImageViaPDFJS(reader, pageNumber) {
        const result = { success: false, imageDataUrl: null, width: 0, height: 0, error: null };
        
        try {
            this.log('🚀 Starting enhanced PDF.js rendering approach...');
            
            // 🕐 Wait for PDF rendering to finish (extended duration)
            this.log('⏳ Waiting for PDF rendering to complete...');
            await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
            
            // 🔍 Attempt broader window access
            const windows = [
                reader._iframeWindow,
                reader._window,
                reader.iframe?.contentWindow,
                reader.window,
                // Additional access strategies
                reader._iframe?.contentWindow,
                reader.tabContainer?.querySelector('iframe')?.contentWindow,
                // Remove document.querySelector usage due to permission issues
                null
            ].filter(w => w && w !== null);
            
            this.log('🔍 Checking', windows.length, 'windows for PDF.js access');
            
            for (let winIdx = 0; winIdx < windows.length; winIdx++) {
                const targetWindow = windows[winIdx];
                this.log(`🪟 Trying window ${winIdx + 1}/${windows.length}`);
                
                try {
                    // 🔐 Strengthen wrappedJSObject access
                    const wrappedWindow = targetWindow.wrappedJSObject || targetWindow;
                    
                    const pdfApps = [
                        targetWindow.PDFViewerApplication,
                        targetWindow.window?.PDFViewerApplication,
                        targetWindow.parent?.PDFViewerApplication,
                        wrappedWindow.PDFViewerApplication,
                        wrappedWindow.window?.PDFViewerApplication,
                        // Additional access paths
                        targetWindow.contentWindow?.PDFViewerApplication,
                        targetWindow.document?.defaultView?.PDFViewerApplication
                    ].filter(app => app);
                    
                    this.log(`📱 Found ${pdfApps.length} PDF applications in window ${winIdx + 1}`);
                    
                    for (let appIdx = 0; appIdx < pdfApps.length; appIdx++) {
                        const pdfApp = pdfApps[appIdx];
                        this.log(`📄 Trying PDF app ${appIdx + 1}/${pdfApps.length}`);
                        
                        if (pdfApp && pdfApp.pdfDocument) {
                            const pdfDoc = pdfApp.pdfDocument;
                            this.log(`✅ Found PDF.js document! Pages: ${pdfDoc.numPages}, Target page: ${pageNumber}`);
                            
                            // 🔍 Check PDF document state
                            this.log('📊 PDF Document state:', {
                                numPages: pdfDoc.numPages,
                                fingerprint: pdfDoc.fingerprint || 'unknown',
                                loadingTask: !!pdfDoc.loadingTask,
                                destroyed: pdfDoc.destroyed || false
                            });
                            
                            if (pageNumber <= pdfDoc.numPages) {
                                this.log(`📋 Attempting to get page ${pageNumber}...`);
                                const page = await pdfDoc.getPage(pageNumber);
                                
                                // 🔍 Explore page object state and APIs
                                const pageProps = Object.getOwnPropertyNames(page);
                                const pageMethods = pageProps.filter(prop => {
                                    try {
                                        return typeof page[prop] === 'function';
                                    } catch (e) {
                                        return false;
                                    }
                                });
                                
                                this.log('📋 Page object analysis:', {
                                    pageIndex: page._pageIndex,
                                    destroyed: page.destroyed || false,
                                    hasTransport: !!page._transport,
                                    allProperties: pageProps.slice(0, 20),
                                    allMethods: pageMethods.slice(0, 15),
                                    constructor: page.constructor?.name,
                                    prototype: Object.getPrototypeOf(page)?.constructor?.name
                                });
                                
                                // 🔍 Explore viewport-related methods
                                const viewportMethods = ['getViewport', 'getViewBox', 'view', 'mediaBox', 'rotate'];
                                const availableViewportMethods = [];
                                
                                for (const method of viewportMethods) {
                                    if (typeof page[method] === 'function') {
                                        availableViewportMethods.push(method);
                                        this.log(`✅ Found viewport method: ${method}`);
                                    }
                                }
                                
                                this.log('📊 Available viewport methods:', availableViewportMethods);
                                
                                // 🎯 Forced rendering approach: call the PDF.js render() API directly
                                this.log('✅ Implementing enhanced forced PDF.js rendering approach');
                                
                                // Try multiple approaches for image rendering
                                const renderApproaches = [
                                    // Approach 1: Ultra high quality rendering with forced timeout
                                    async () => {
                                        this.log('🔄 Starting ultra high quality rendering...');
                                        // 🔍 Try different viewport approaches
                                        let viewport;
                                        
                                        if (typeof page.getViewport === 'function') {
                                            viewport = page.getViewport({ scale: 3.0 });
                                            this.log('✅ Using page.getViewport()');
                                        } else if (typeof page.view === 'object' && page.view) {
                                            // Create alternate viewport
                                            const view = page.view;
                                            viewport = {
                                                width: (view[2] - view[0]) * 3.0,
                                                height: (view[3] - view[1]) * 3.0,
                                                scale: 3.0,
                                                offsetX: 0,
                                                offsetY: 0
                                            };
                                            this.log('✅ Using page.view fallback:', view);
                                        } else if (typeof page.getViewBox === 'function') {
                                            const viewBox = page.getViewBox();
                                            viewport = {
                                                width: (viewBox[2] - viewBox[0]) * 3.0,
                                                height: (viewBox[3] - viewBox[1]) * 3.0,
                                                scale: 3.0,
                                                offsetX: 0,
                                                offsetY: 0
                                            };
                                            this.log('✅ Using page.getViewBox():', viewBox);
                                        } else {
                                            // Configure default viewport
                                            viewport = {
                                                width: 595 * 3.0, // A4 base size
                                                height: 842 * 3.0,
                                                scale: 3.0,
                                                offsetX: 0,
                                                offsetY: 0
                                            };
                                            this.log('⚠️ Using default viewport (A4)');
                                        }
                                        
                                        this.log('📊 Viewport details:', {
                                            width: viewport.width,
                                            height: viewport.height,
                                            scale: viewport.scale || 3.0
                                        });
                                        // 🎨 Attempt to create multiple canvases
                                        let canvas, context;
                                        const canvasCreationMethods = [
                                            () => targetWindow.document.createElement('canvas'),
                                            () => { 
                                                // Safely create canvas - must use targetWindow
                                                if (targetWindow && targetWindow.document) {
                                                    return targetWindow.document.createElement('canvas');
                                                } else {
                                                    throw new Error('No target window available');
                                                }
                                            },
                                            () => new targetWindow.HTMLCanvasElement(),
                                            () => {
                                                const c = targetWindow.document.createElementNS('http://www.w3.org/1999/xhtml', 'canvas');
                                                return c;
                                            }
                                        ];
                                        
                                        for (const createMethod of canvasCreationMethods) {
                                            try {
                                                canvas = createMethod();
                                                context = canvas.getContext('2d');
                                                if (canvas && context) {
                                                    this.log('✅ Canvas created successfully');
                                                    break;
                                                }
                                            } catch (canvasError) {
                                                this.log('⚠️ Canvas creation method failed:', canvasError.message);
                                            }
                                        }
                                        
                                        if (!canvas || !context) {
                                            throw new Error('Failed to create canvas with any method');
                                        }
                                        
                                        canvas.height = viewport.height;
                                        canvas.width = viewport.width;
                                        
                                        // White background for better contrast
                                        context.fillStyle = '#ffffff';
                                        context.fillRect(0, 0, canvas.width, canvas.height);
                                        
                                        const renderContext = {
                                            canvasContext: context,
                                            viewport: viewport,
                                            intent: 'display',
                                            enableWebGL: false, // Force software rendering for compatibility
                                            canvasFactory: targetWindow.document // Ensure proper canvas factory
                                        };
                                        
                                        this.log('📐 Canvas dimensions:', canvas.width, 'x', canvas.height);
                                        this.log('🎨 Render context:', Object.keys(renderContext));
                                        
                                        // 🎯 Try various render methods
                                        let renderPromise;
                                        
                                        if (typeof page.render === 'function') {
                                            this.log('✅ Using page.render()');
                                            const renderTask = page.render(renderContext);
                                            renderPromise = renderTask.promise || renderTask;
                                        } else if (typeof page.draw === 'function') {
                                            this.log('✅ Using page.draw() fallback');
                                            renderPromise = page.draw(context, viewport);
                                        } else if (typeof page.renderIntoCanvas === 'function') {
                                            this.log('✅ Using page.renderIntoCanvas() fallback');
                                            renderPromise = page.renderIntoCanvas(canvas, viewport);
                                        } else {
                                            throw new Error('No available render method found on page object');
                                        }
                                        
                                        // Wait for rendering with an extended timeout
                                        await Promise.race([
                                            renderPromise,
                                            new Promise((_, reject) => 
                                                setTimeout(() => reject(new Error('Render timeout after 60 seconds')), 60000)
                                            )
                                        ]);
                                        
                                        // Wait a bit longer after rendering
                                        await new Promise(resolve => setTimeout(resolve, 1000));
                                        
                                        this.log('✅ Ultra high quality rendering completed');
                                        return canvas;
                                    },
                                    
                                    // Approach 2: High quality rendering with white background
                                    async () => {
                                        this.log('🔄 Starting high quality rendering...');
                                        const viewport = page.getViewport({ scale: 2.0 });
                                        const canvas = targetWindow.document.createElement('canvas');
                                        const context = canvas.getContext('2d');
                                        canvas.height = viewport.height;
                                        canvas.width = viewport.width;
                                        
                                        // White background
                                        context.fillStyle = '#ffffff';
                                        context.fillRect(0, 0, canvas.width, canvas.height);
                                        
                                        const renderContext = {
                                            canvasContext: context,
                                            viewport: viewport,
                                            intent: 'display'
                                        };
                                        
                                        // 🎯 Try various render methods
                                        if (typeof page.render === 'function') {
                                            const renderTask = page.render(renderContext);
                                            await (renderTask.promise || renderTask);
                                        } else if (typeof page.draw === 'function') {
                                            await page.draw(context, viewport);
                                        } else {
                                            throw new Error('No render method available');
                                        }
                                        this.log('✅ High quality rendering completed');
                                        return canvas;
                                    },
                                    
                                    // Approach 3: Medium quality rendering with rendering intent
                                    async () => {
                                        this.log('🔄 Starting medium quality rendering...');
                                        const viewport = page.getViewport({ scale: 1.5 });
                                        const canvas = targetWindow.document.createElement('canvas');
                                        const context = canvas.getContext('2d');
                                        canvas.height = viewport.height;
                                        canvas.width = viewport.width;
                                        
                                        // Light gray background for better readability
                                        context.fillStyle = '#f8f8f8';
                                        context.fillRect(0, 0, canvas.width, canvas.height);
                                        
                                        const renderContext = {
                                            canvasContext: context,
                                            viewport: viewport,
                                            intent: 'display'
                                        };
                                        
                                        // 🎯 Try various render methods
                                        if (typeof page.render === 'function') {
                                            const renderTask = page.render(renderContext);
                                            await (renderTask.promise || renderTask);
                                        } else if (typeof page.draw === 'function') {
                                            await page.draw(context, viewport);
                                        } else {
                                            throw new Error('No render method available');
                                        }
                                        this.log('✅ Medium quality rendering completed');
                                        return canvas;
                                    },
                                    
                                    // Approach 4: Print quality rendering (for academic papers)
                                    async () => {
                                        this.log('🔄 Starting print quality rendering...');
                                        const viewport = page.getViewport({ scale: 1.2 });
                                        const canvas = targetWindow.document.createElement('canvas');
                                        const context = canvas.getContext('2d');
                                        canvas.height = viewport.height;
                                        canvas.width = viewport.width;
                                        
                                        // White background for print quality
                                        context.fillStyle = '#ffffff';
                                        context.fillRect(0, 0, canvas.width, canvas.height);
                                        
                                        const renderContext = {
                                            canvasContext: context,
                                            viewport: viewport,
                                            intent: 'print'
                                        };
                                        
                                        // 🎯 Try various render methods
                                        if (typeof page.render === 'function') {
                                            const renderTask = page.render(renderContext);
                                            await (renderTask.promise || renderTask);
                                        } else if (typeof page.draw === 'function') {
                                            await page.draw(context, viewport);
                                        } else {
                                            throw new Error('No render method available');
                                        }
                                        this.log('✅ Print quality rendering completed');
                                        return canvas;
                                    },
                                    
                                    // Approach 5: Minimal rendering for compatibility
                                    async () => {
                                        this.log('🔄 Starting minimal rendering...');
                                        const viewport = page.getViewport({ scale: 1.0 });
                                        const canvas = targetWindow.document.createElement('canvas');
                                        const context = canvas.getContext('2d');
                                        canvas.height = viewport.height;
                                        canvas.width = viewport.width;
                                        
                                        const renderContext = {
                                            canvasContext: context,
                                            viewport: viewport
                                        };
                                        
                                        // 🎯 Try different render methods
                                        if (typeof page.render === 'function') {
                                            const renderTask = page.render(renderContext);
                                            await (renderTask.promise || renderTask);
                                        } else if (typeof page.draw === 'function') {
                                            await page.draw(context, viewport);
                                        } else {
                                            throw new Error('No render method available');
                                        }
                                        this.log('✅ Minimal rendering completed');
                                        return canvas;
                                    }
                                ];
                                
                                for (let i = 0; i < renderApproaches.length; i++) {
                                    try {
                                        this.log(`🚀 Trying PDF.js render approach ${i + 1}/${renderApproaches.length}...`);
                                        const canvas = await renderApproaches[i]();
                                        
                                        if (canvas && canvas.width > 0 && canvas.height > 0) {
                                            this.log(`📋 Canvas created: ${canvas.width}x${canvas.height}`);
                                            
                                            // 📋 Validate canvas contents
                                            const isCanvasValid = this.validateCanvasContent(canvas);
                                            
                                            if (isCanvasValid) {
                                                result.imageDataUrl = canvas.toDataURL('image/png', 0.95);
                                                result.width = canvas.width;
                                                result.height = canvas.height;
                                                result.success = true;
                                                
                                            this.log(`🎉 Forced PDF.js rendering succeeded! Method: ${i + 1}, Size: ${canvas.width}x${canvas.height}`);
                                                this.log(`📊 Canvas content validation: PASSED`);
                                                return result;
                                            } else {
                                                this.log(`⚠️ Canvas rendered but content validation failed (approach ${i + 1})`);
                                                // Even if validation fails, continue with the next approach
                                            }
                                        } else {
                                            this.log(`❌ Canvas creation failed or invalid dimensions (approach ${i + 1})`);
                                        }
                                        
                                    } catch (approachError) {
                                        this.log(`❌ PDF.js approach ${i + 1} error:`, approachError.message);
                                        
                                        // Log detailed error information
                                        if (approachError.stack) {
                                            this.log('📝 Error stack:', approachError.stack.slice(0, 300));
                                        }
                                    }
                                }
                            } else {
                                this.log(`Page ${pageNumber} exceeds document pages (${pdfDoc.numPages})`);
                            }
                        }
                    }
                } catch (winError) {
                    this.log('Window PDF.js image access failed:', winError.message);
                }
            }
            
            result.error = 'PDF.js not accessible for image extraction in any window';
            
        } catch (error) {
            result.error = `PDF.js image method failed: ${error.message}`;
        }
        
        return result;
    },
    
    // Method 2: Enhanced existing canvas capture with deep DOM exploration
    async extractImageViaExistingCanvas(reader, pageNumber) {
        const result = { success: false, imageDataUrl: null, width: 0, height: 0, error: null };
        
        try {
            this.log('🔍 Starting enhanced existing canvas search...');
            
            // 🔍 Broader document access (safe pathway)
            const targetDocs = [
                reader._iframeWindow?.document,
                reader._window?.document,
                reader.iframe?.contentDocument,
                reader._iframe?.contentDocument
                // Remove direct document access (permission constraints)
            ].filter(doc => doc);
            
            this.log(`📄 Found ${targetDocs.length} documents to search`);
            
            for (let docIdx = 0; docIdx < targetDocs.length; docIdx++) {
                const targetDoc = targetDocs[docIdx];
                this.log(`🔍 Searching document ${docIdx + 1}/${targetDocs.length}`);
                
                // 🕐 Greatly increase rendering wait time
                this.log('⏳ Waiting for rendering completion...');
                await new Promise(resolve => setTimeout(resolve, 8000)); // Wait 8 seconds
                
                // 🔍 Expanded list of canvas selectors
                const canvasSelectors = [
                    // Per-page selectors
                    `[data-page-number="${pageNumber}"] canvas`,
                    `.page[data-page-number="${pageNumber}"] canvas`,
                    `#pageContainer${pageNumber} canvas`,
                    `.page:nth-child(${pageNumber}) canvas`,
                    `canvas[data-page="${pageNumber}"]`,
                    `canvas[data-page-number="${pageNumber}"]`,
                    
                    // Common PDF viewer selectors
                    '.pdfViewer .page canvas',
                    '.pdfViewer canvas',
                    '.viewer canvas',
                    '.pdf-viewer canvas',
                    '.page canvas',
                    
                    // Zotero 7 specific selectors
                    '.readerContainer canvas',
                    '.reader-container canvas',
                    '[class*="reader"] canvas',
                    '[class*="pdf"] canvas',
                    
                    // All canvas elements
                    'canvas:not([data-page-number])',
                    'canvas'
                ];
                
                this.log(`🔍 Using ${canvasSelectors.length} canvas selectors`);
                
                for (let selIdx = 0; selIdx < canvasSelectors.length; selIdx++) {
                    const selector = canvasSelectors[selIdx];
                    
                    try {
                        const canvases = targetDoc.querySelectorAll(selector);
                        this.log(`🔍 Selector ${selIdx + 1}/${canvasSelectors.length}: "${selector}" → ${canvases.length} elements`);
                        
                        if (canvases.length > 0) {
                            // Analyze canvas elements in detail
                            for (let i = 0; i < canvases.length; i++) {
                                const canvas = canvases[i];
                                
                                this.log(`📋 Canvas ${i + 1}/${canvases.length} analysis:`, {
                                    width: canvas.width,
                                    height: canvas.height,
                                    hasToDataURL: typeof canvas.toDataURL === 'function',
                                    className: canvas.className,
                                    id: canvas.id,
                                    dataAttrs: Object.keys(canvas.dataset || {})
                                });
                                
                                if (canvas && canvas.toDataURL && canvas.width > 10 && canvas.height > 10) { // Lowered threshold
                                    try {
                                        // 🔍 Use dedicated validation function
                                        const isValidCanvas = this.validateCanvasContent(canvas);
                                        
                                        if (isValidCanvas) {
                                            result.imageDataUrl = canvas.toDataURL('image/png', 0.9);
                                            result.width = canvas.width;
                                            result.height = canvas.height;
                                            result.success = true;
                                            this.log(`🎉 Existing canvas capture SUCCESS! Selector: "${selector}", Canvas: ${i + 1}, Size: ${canvas.width}x${canvas.height}`);
                                            return result;
                                        } else {
                                            this.log(`⚠️ Canvas ${i + 1} validation failed (empty content)`);
                                        }
                                    } catch (canvasError) {
                                        this.log(`❌ Canvas ${i + 1} processing error:`, canvasError.message);
                                    }
                                } else {
                                    this.log(`❌ Canvas ${i + 1} invalid: dimensions or missing toDataURL`);
                                }
                            }
                        }
                    } catch (selectorError) {
                        this.log(`❌ Selector "${selector}" failed:`, selectorError.message);
                    }
                }
                
                // If nothing is found in this document
                this.log(`⚠️ No valid canvas found in document ${docIdx + 1}`);
            }
                
            result.error = 'No suitable canvas found in any document';
            this.log('❌ No valid canvas found in any accessible document');
        } catch (error) {
            result.error = `Enhanced canvas search failed: ${error.message}`;
            this.log('❌ Enhanced canvas search error:', error.message);
        }
        
        return result;
    },
    
    // Method 3: Screenshot/DOM capture approach
    async extractImageViaScreenshot(reader, pageNumber) {
        const result = { success: false, imageDataUrl: null, width: 0, height: 0, error: null };
        
        try {
            const targetDoc = reader._iframeWindow?.document || reader._window?.document;
            
            if (targetDoc) {
                // Try to find and capture page elements more comprehensively
                const pageSelectors = [
                    `[data-page-number="${pageNumber}"]`,
                    `.page[data-page-number="${pageNumber}"]`,
                    `#pageContainer${pageNumber}`,
                    `.page:nth-child(${pageNumber})`,
                    '.pdfViewer .page',  // Any page in PDF viewer
                    '.page',  // Any page element
                    '.pdf-page',  // Alternative page class
                    '[class*="page"]'  // Any element with "page" in class name
                ];
                
                for (const selector of pageSelectors) {
                    const pageElements = targetDoc.querySelectorAll(selector);
                    this.log(`Checking page selector "${selector}", found ${pageElements.length} elements`);
                    
                    for (let i = 0; i < pageElements.length; i++) {
                        const pageElement = pageElements[i];
                        if (pageElement && pageElement.getBoundingClientRect) {
                            const rect = pageElement.getBoundingClientRect();
                            this.log(`Page element ${i} rect: ${rect.width}x${rect.height}`);
                            
                            if (rect.width > 100 && rect.height > 100) {
                                try {
                                    // Method 1: Try to capture existing background images or content
                                    const computedStyle = targetWindow.getComputedStyle(pageElement);
                                    const backgroundImage = computedStyle.backgroundImage;
                                    
                                    if (backgroundImage && backgroundImage !== 'none') {
                                        this.log('Found background image:', backgroundImage);
                                        // Extract URL from background-image if it's a data URL
                                        const match = backgroundImage.match(/url\(["']?(data:image\/[^"']+)["']?\)/);
                                        if (match) {
                                            result.imageDataUrl = match[1];
                                            result.width = rect.width;
                                            result.height = rect.height;
                                            result.success = true;
                                            this.log(`✅ Background image capture successful: ${rect.width}x${rect.height}`);
                                            return result;
                                        }
                                    }
                                    
                                    // Method 2: Simple DOM-to-canvas rendering with better content
                                    const canvas = targetDoc.createElement('canvas');
                                    const context = canvas.getContext('2d');
                                    canvas.width = Math.min(rect.width, 800);  // Limit size
                                    canvas.height = Math.min(rect.height, 1000);
                                    
                                    // White background
                                    context.fillStyle = '#ffffff';
                                    context.fillRect(0, 0, canvas.width, canvas.height);
                                    
                                    // Try to render text content from the element
                                    const textContent = pageElement.textContent || pageElement.innerText || '';
                                    if (textContent.trim().length > 0) {
                                        context.fillStyle = '#000000';
                                        context.font = '14px Arial';
                                        
                                        // Break text into lines
                                        const words = textContent.trim().split(/\s+/);
                                        const lineHeight = 20;
                                        const maxWidth = canvas.width - 20;
                                        let currentLine = '';
                                        let y = 30;
                                        
                                        for (const word of words.slice(0, 200)) {  // Limit words
                                            const testLine = currentLine + word + ' ';
                                            const metrics = context.measureText(testLine);
                                            
                                            if (metrics.width > maxWidth && currentLine !== '') {
                                                context.fillText(currentLine.trim(), 10, y);
                                                currentLine = word + ' ';
                                                y += lineHeight;
                                                
                                                if (y > canvas.height - 20) break;
                                            } else {
                                                currentLine = testLine;
                                            }
                                        }
                                        
                                        if (currentLine.trim() && y <= canvas.height - 20) {
                                            context.fillText(currentLine.trim(), 10, y);
                                        }
                                    } else {
                                        // No text content, just show placeholder
                                        context.fillStyle = '#666666';
                                        context.font = '16px Arial';
                                        context.fillText('PDF Page (No Text Available)', 10, 30);
                                        context.fillText(`Page ${pageNumber}`, 10, 60);
                                        context.fillText('Image-based content detected', 10, 90);
                                    }
                                    
                                    result.imageDataUrl = canvas.toDataURL('image/png');
                                    result.width = canvas.width;
                                    result.height = canvas.height;
                                    result.success = true;
                                    
                                    this.log(`✅ DOM content capture successful: ${canvas.width}x${canvas.height}`);
                                    return result;
                                    
                                } catch (renderError) {
                                    this.log(`DOM render failed for element ${i}:`, renderError.message);
                                }
                            }
                        }
                    }
                }
                
                result.error = 'No suitable page element found for screenshot';
            } else {
                result.error = 'Document not accessible for screenshot';
            }
        } catch (error) {
            result.error = `Screenshot method failed: ${error.message}`;
        }
        
        return result;
    },
    
    // Validate and preprocess extracted content
    validateAndProcessContent(extractionResult) {
        const result = {
            isValid: false,
            qualityScore: 0,
            processedContent: '',
            validationIssues: [],
            detectedMetadata: [],
            imageQuality: null
        };
        
        try {
            if (!extractionResult.success) {
                result.validationIssues.push('Extraction failed');
                return result;
            }
            
            if (extractionResult.contentType === 'text') {
                result = this.validateAndProcessText(extractionResult, result);
            } else if (extractionResult.contentType === 'image') {
                result = this.validateAndProcessImage(extractionResult, result);
            }
            
            this.log('Content validation complete, quality score:', result.qualityScore);
            
        } catch (error) {
            this.handleError(error, 'validateAndProcessContent');
            result.validationIssues.push(`Validation error: ${error.message}`);
        }
        
        return result;
    },
    
    // Validate and process text content
    validateAndProcessText(extractionResult, result) {
        const text = extractionResult.content || '';
        let qualityScore = 0;
        const issues = [];
        const detectedElements = [];
        
        // Basic validation
        if (text.length < 50) {
            issues.push('Text too short');
        } else {
            qualityScore += 20;
        }
        
        if (text.length > 100) {
            qualityScore += 10;
        }
        
        // Check for meaningful content (not just whitespace/symbols)
        const wordCount = text.split(/\s+/).filter(word => word.match(/[a-zA-Z]{2,}/)).length;
        if (wordCount < 10) {
            issues.push('Insufficient readable words');
        } else {
            qualityScore += 20;
        }
        
        // Text preprocessing
        let processedText = text
            // Normalize whitespace
            .replace(/\s+/g, ' ')
            // Remove excessive special characters
            .replace(/[^\w\s\.\,\:\;\!\?\-\(\)\[\]\"\'\/\&\%\$\#\@]/g, ' ')
            // Clean up multiple spaces again
            .replace(/\s+/g, ' ')
            .trim();
        
        // Check for potential metadata elements
        const metadataPatterns = {
            'title': /^[A-Z][^.!?]*[.!?]?\s*$/m,
            'authors': /\b[A-Z][a-z]+,?\s+[A-Z]\.?\s*[A-Z]?[a-z]*\b/g,
            'journal': /\b(Journal|Proceedings|Conference|Review|Science|Nature|Cell)\b/gi,
            'year': /\b(19|20)\d{2}\b/g,
            'doi': /\b10\.\d{4,}/g,
            'volume': /\bvol\.?\s*\d+/gi,
            'pages': /\bpp?\.?\s*\d+[\-–—]\d+/gi,
            'abstract': /\babstract\b/gi,
            'keywords': /\bkeywords?\b/gi
        };
        
        for (const [type, pattern] of Object.entries(metadataPatterns)) {
            const matches = processedText.match(pattern);
            if (matches && matches.length > 0) {
                detectedElements.push(type);
                qualityScore += 5;
            }
        }
        
        // Check for academic paper indicators
        const academicIndicators = [
            /\babstract\b/i,
            /\bintroduction\b/i,
            /\bmethods?\b/i,
            /\bresults?\b/i,
            /\bconclusions?\b/i,
            /\breferences?\b/i,
            /\bbibliography\b/i,
            /\bcitation\b/i,
            /\buniversity\b/i,
            /\bdepartment\b/i
        ];
        
        let academicScore = 0;
        for (const indicator of academicIndicators) {
            if (processedText.match(indicator)) {
                academicScore += 3;
            }
        }
        qualityScore += Math.min(academicScore, 15);
        
        // Final validation
        result.isValid = issues.length === 0 && qualityScore >= 30;
        result.qualityScore = Math.min(qualityScore, 100);
        result.processedContent = processedText;
        result.validationIssues = issues;
        result.detectedMetadata = detectedElements;
        
        return result;
    },
    
    // Validate and process image content
    validateAndProcessImage(extractionResult, result) {
        let qualityScore = 0;
        const issues = [];
        
        // Basic validation
        if (!extractionResult.imageDataUrl) {
            issues.push('No image data available');
            result.isValid = false;
            result.qualityScore = 0;
            result.validationIssues = issues;
            return result;
        }
        
        // Check image dimensions
        const width = extractionResult.width || 0;
        const height = extractionResult.height || 0;
        
        if (width < 200 || height < 200) {
            issues.push('Image resolution too low');
        } else {
            qualityScore += 30;
        }
        
        if (width >= 600 && height >= 800) {
            qualityScore += 20;
        }
        
        // Check image data size (basic quality indicator)
        const dataSize = extractionResult.imageDataUrl.length;
        if (dataSize < 10000) {
            issues.push('Image data too small');
        } else if (dataSize > 50000) {
            qualityScore += 20;
        } else {
            qualityScore += 10;
        }
        
        // Determine image quality category
        let imageQuality = 'Poor';
        if (qualityScore >= 60) {
            imageQuality = 'Good';
        } else if (qualityScore >= 30) {
            imageQuality = 'Fair';
        }
        
        // For images, we consider it valid if we have basic image data
        result.isValid = issues.length === 0 || qualityScore >= 20;
        result.qualityScore = Math.min(qualityScore, 100);
        result.processedContent = `Image (${width}x${height})`;
        result.validationIssues = issues;
        result.imageQuality = imageQuality;
        
        return result;
    },
    
    // Get comprehensive PDF context information
    async getPDFContext(reader, item) {
        try {
            const context = {
                itemID: reader.itemID,
                title: item.getField('title') || 'Untitled',
                filename: '',
                totalPages: 0,
                currentPage: 1,
                hasParent: false,
                parentTitle: '',
                parentID: null,
                attachmentPath: ''
            };
            
            // Get filename
            if (item.isAttachment()) {
                context.filename = item.getFilename() || 'unknown.pdf';
                context.attachmentPath = await item.getFilePathAsync();
                
                // Check for parent item
                const parentID = item.parentID;
                if (parentID) {
                    context.hasParent = true;
                    context.parentID = parentID;
                    const parentItem = await Zotero.Items.getAsync(parentID);
                    if (parentItem) {
                        context.parentTitle = parentItem.getField('title') || 'Untitled Parent';
                    }
                }
            }
            
            // Get page information from Zotero Reader API only (avoid PDF.js interference)
            try {
                // Use Zotero's safer API instead of direct PDF.js access
                if (reader.getPageIndex && reader.getNumPages) {
                    context.currentPage = (reader.getPageIndex() || 0) + 1; // 0-based to 1-based
                    context.totalPages = reader.getNumPages() || 0;
                } else {
                    // Fallback: no direct PDF.js access to avoid interference
                    context.totalPages = 0;
                    context.currentPage = 1;
                }
                this.log('PDF page info (Zotero API) - Current:', context.currentPage, 'Total:', context.totalPages);
            } catch (error) {
                this.log('Could not access PDF page info via Zotero API:', error.message);
                // Use fallback values
                context.totalPages = 0;
                context.currentPage = 1;
            }
            
            this.log('PDF Context:', context);
            return context;
            
        } catch (error) {
            this.handleError(error, 'getPDFContext');
            throw error;
        }
    },
    
    // Process text with AI to extract metadata
    async processWithAI(text, pdfContext) {
        const result = {
            success: false,
            metadata: null,
            error: null
        };
        
        try {
            this.log('Starting AI processing with Ollama...');
            this.log('AI Backend:', this.config.ai_backend);
            this.log('Ollama Model:', this.config.ollama_model);
            this.log('Ollama Host:', this.config.ollama_host);
            
            // Import Ollama module - inline implementation for better compatibility
            if (!this.ollamaAPI) {
                this.ollamaAPI = this.createOllamaAPI();
                this.log('Ollama API module created successfully');
            }
            
            // Check Ollama connection and available models
            this.log('Checking Ollama connection...');
            const isConnected = await this.ollamaAPI.checkConnection(this.config.ollama_host);
            if (!isConnected) {
                throw new Error(`Cannot connect to the Ollama server.\n\nPlease check:\n1. Ensure the server is running with 'ollama serve'\n2. Verify the host address: ${this.config.ollama_host}`);
            }
            
            this.log('Ollama connection confirmed, checking available models...');
            
            // Check if the model exists
            const availableModels = await this.ollamaAPI.getAvailableModels(this.config.ollama_host);
            this.log('Available models:', availableModels.map(m => m.name || m));
            
            const modelExists = availableModels.some(m => 
                (m.name || m) === this.config.ollama_model || 
                (m.name || m).startsWith(this.config.ollama_model.split(':')[0])
            );
            
            if (!modelExists) {
                const modelList = availableModels.map(m => m.name || m).join(', ');
                throw new Error(`Model '${this.config.ollama_model}' was not found.\n\nAvailable models: ${modelList}\n\nInstall with: ollama pull ${this.config.ollama_model}`);
            }
            
            this.log('Model confirmed:', this.config.ollama_model);
            
            // Call Ollama API with retry
            const metadata = await this.ollamaAPI.retryWithBackoff(async () => {
                return await this.ollamaAPI.queryOllama(
                    text, 
                    this.config.ollama_model,
                    this.config.ollama_host
                );
            });
            
            this.log('Ollama metadata extraction successful:', metadata);
            
            result.success = true;
            result.metadata = metadata;
            
        } catch (error) {
            this.log('AI processing failed:', error.message);
            this.log('AI processing error stack:', error.stack);
            result.error = error.message;
        }
        
        return result;
    },
    
    // Create inline Ollama API implementation
    createOllamaAPI() {
        return {
            async queryOllama(text, model = 'llama3.2:latest', host = 'http://localhost:11434') {
                return new Promise((resolve, reject) => {
                    try {
                        const xhr = new XMLHttpRequest();
                        xhr.open('POST', `${host}/api/generate`, true);
                        xhr.setRequestHeader('Content-Type', 'application/json');
                        
                        xhr.onreadystatechange = () => {
                            if (xhr.readyState === 4) {
                                if (xhr.status === 200) {
                                    try {
                                        const data = JSON.parse(xhr.responseText);
                                        const result = this.parseResponse(data.response);
                                        resolve(result);
                                    } catch (parseError) {
                                        reject(new Error(`Response parsing error: ${parseError.message}`));
                                    }
                                } else {
                                    // Include response text for better debugging
                                    const errorDetail = xhr.responseText ? ` - ${xhr.responseText}` : '';
                                    reject(new Error(`Ollama API error: ${xhr.status} ${xhr.statusText}${errorDetail}`));
                                }
                            }
                        };
                        
                        xhr.onerror = () => {
                            reject(new Error(`Network error: Unable to connect to the Ollama server. (${host})`));
                        };
                        
                        xhr.ontimeout = () => {
                            reject(new Error(`Timeout: Ollama server response is too slow.`));
                        };
                        
                        xhr.timeout = 30000;
                        
                        const requestData = JSON.stringify({
                            model: model,
                            prompt: this.buildPrompt(text),
                            stream: false,
                            options: {
                                temperature: 0.1,
                                top_p: 0.9,
                                num_predict: 1000
                            }
                        });
                        
                        xhr.send(requestData);
                        
                    } catch (error) {
                        reject(new Error(`Request creation error: ${error.message}`));
                    }
                });
            },
            
            async checkConnection(host = 'http://localhost:11434') {
                return new Promise((resolve) => {
                    try {
                        const xhr = new XMLHttpRequest();
                        xhr.open('GET', `${host}/api/tags`, true);
                        xhr.timeout = 5000;
                        
                        xhr.onreadystatechange = () => {
                            if (xhr.readyState === 4) {
                                resolve(xhr.status === 200);
                            }
                        };
                        
                        xhr.onerror = () => resolve(false);
                        xhr.ontimeout = () => resolve(false);
                        
                        xhr.send();
                    } catch (error) {
                        resolve(false);
                    }
                });
            },
            
            async getAvailableModels(host = 'http://localhost:11434') {
                return new Promise((resolve) => {
                    try {
                        const xhr = new XMLHttpRequest();
                        xhr.open('GET', `${host}/api/tags`, true);
                        xhr.timeout = 5000;
                        
                        xhr.onreadystatechange = () => {
                            if (xhr.readyState === 4) {
                                if (xhr.status === 200) {
                                    try {
                                        const data = JSON.parse(xhr.responseText);
                                        resolve(data.models || []);
                                    } catch (error) {
                                        resolve([]);
                                    }
                                } else {
                                    resolve([]);
                                }
                            }
                        };
                        
                        xhr.onerror = () => resolve([]);
                        xhr.ontimeout = () => resolve([]);
                        
                        xhr.send();
                    } catch (error) {
                        resolve([]);
                    }
                });
            },
            
            buildPrompt(text) {
                return `Please extract accurate bibliographic metadata from the following academic paper text and return it as JSON.

Text:
${text.substring(0, 3000)}

Return JSON in this exact format:
{
  "title": "Paper title",
  "authors": ["Author 1", "Author 2"],
  "year": "Publication year",
  "journal": "Journal name",
  "volume": "Volume",
  "issue": "Issue",
  "pages": "Pages",
  "doi": "DOI",
  "abstract": "Full abstract - include if available"
}

Guidelines:
- Extract only accurate information.
- Leave fields as empty strings if the information is uncertain.
- Follow the JSON format exactly.
- Always return authors as an array, separating each author into individual elements.
- Include every author when multiple authors are present.
- If an abstract exists, capture it completely - this is critical.
- Do not summarize the abstract; use the original text as-is.
- Return only the JSON without any additional explanation.`;
            },
            
            parseResponse(response) {
                try {
                    const jsonMatch = response.match(/\{[\s\S]*\}/);
                    if (!jsonMatch) {
                        throw new Error('Unable to find JSON in the response');
                    }

                    const jsonStr = jsonMatch[0];
                    const metadata = JSON.parse(jsonStr);

                    return {
                        title: metadata.title || '',
                        authors: Array.isArray(metadata.authors) ? metadata.authors : [],
                        year: metadata.year || '',
                        journal: metadata.journal || '',
                        volume: metadata.volume || '',
                        issue: metadata.issue || '',
                        pages: metadata.pages || '',
                        doi: metadata.doi || '',
                        abstract: metadata.abstract || ''
                    };
                } catch (error) {
                    throw new Error('Unable to parse AI response: ' + error.message);
                }
            },
            
            async retryWithBackoff(fn, maxRetries = 3) {
                for (let i = 0; i < maxRetries; i++) {
                    try {
                        return await fn();
                    } catch (error) {
                        if (i === maxRetries - 1) throw error;
                        
                        const delay = Math.pow(2, i) * 1000;
                        await new Promise(resolve => setTimeout(resolve, delay));
                    }
                }
            }
        };
    },

    // Handle existing parent item workflow
    async handleExistingParent(metadata, reader, pdfContext) {
        try {
            this.log('🔵 [DEBUG] Handling existing parent item workflow');
            this.log('🔵 [DEBUG] Parent ID:', pdfContext.parentID);
            this.log('🔵 [DEBUG] New metadata:', metadata);
            
            // Store new metadata for comparison
            this.currentNewMetadata = metadata;
            
            this.log('🔵 [DEBUG] About to show comparison dialog...');
            // Show comparison dialog directly
            const updateSelection = await this.showMetadataComparisonDialog(pdfContext.parentID, metadata);
            this.log('🔵 [DEBUG] Update selection result:', updateSelection);
            
            if (updateSelection && updateSelection !== 'create_new') {
                // User chose to update existing parent
                this.log('🔵 [DEBUG] User chose to update, calling updateExistingParentSelective...');
                await this.updateExistingParentSelective(pdfContext.parentID, updateSelection);
                this.log('🔵 [DEBUG] Update completed successfully');
                return { success: true };
            } else if (updateSelection === 'create_new') {
                // User chose to create new parent
                this.log('🔵 [DEBUG] User chose to create new parent instead of updating');
                await this.createNewParent(metadata, reader, pdfContext);
                return { success: true };
            } else {
                // User cancelled
                this.log('🔵 [DEBUG] User cancelled metadata comparison');
                return { success: false, error: 'User cancelled the operation' };
            }
            
        } catch (error) {
            this.handleError(error, 'handleExistingParent');
            return { success: false, error: error.message };
        }
    },

    // Create new parent item (extracted from createParentFromMetadata)
    async createNewParent(metadata, reader, pdfContext) {
        try {
            this.log('Creating new parent item...');
            
            // Validate metadata
            if (!metadata.title || metadata.title.trim().length === 0) {
                throw new Error('No title was extracted; metadata is incomplete.');
            }
            
            // Create new parent item
            const parentItem = new Zotero.Item('journalArticle');
            
            // Set basic fields
            parentItem.setField('title', metadata.title.trim());
            
            if (metadata.year && /^\d{4}$/.test(metadata.year)) {
                parentItem.setField('date', metadata.year);
            }
            
            if (metadata.journal && metadata.journal.trim()) {
                parentItem.setField('publicationTitle', metadata.journal.trim());
            }
            
            if (metadata.volume && metadata.volume.trim()) {
                parentItem.setField('volume', metadata.volume.trim());
            }
            
            if (metadata.issue && metadata.issue.trim()) {
                parentItem.setField('issue', metadata.issue.trim());
            }
            
            if (metadata.pages && metadata.pages.trim()) {
                parentItem.setField('pages', metadata.pages.trim());
            }
            
            if (metadata.doi && metadata.doi.trim()) {
                parentItem.setField('DOI', metadata.doi.trim());
            }
            
            if (metadata.abstract && metadata.abstract.trim()) {
                parentItem.setField('abstractNote', metadata.abstract.trim());
            }
            
            // Add authors
            if (metadata.authors && Array.isArray(metadata.authors)) {
                for (const authorName of metadata.authors) {
                    if (authorName && authorName.trim()) {
                        const creator = this.parseAuthorName(authorName.trim());
                        parentItem.setCreator(parentItem.numCreators(), creator);
                    }
                }
            } else if (metadata.authors && typeof metadata.authors === 'string') {
                // Fallback: if authors is a string, try to split it
                const authorsList = this.parseAuthorsString(metadata.authors);
                for (const authorName of authorsList) {
                    if (authorName && authorName.trim()) {
                        const creator = this.parseAuthorName(authorName.trim());
                        parentItem.setCreator(parentItem.numCreators(), creator);
                    }
                }
            }
            
            // Save parent item
            const parentID = await parentItem.saveTx();
            this.log('New parent item created with ID:', parentID);
            
            // Attach PDF to new parent
            const pdfItem = await Zotero.Items.getAsync(reader.itemID);
            if (pdfItem) {
                pdfItem.parentID = parentID;
                await pdfItem.saveTx();
                this.log('PDF attached to new parent');
            }
            
            // Show success message
            const abstractInfo = metadata.abstract && metadata.abstract.trim() ? `Abstract: ${metadata.abstract.substring(0, 100)}${metadata.abstract.length > 100 ? '...' : ''}` : '';
            let successMessage = `A new parent item has been created:\n\n` +
                `Title: ${metadata.title}\n` +
                `Authors: ${metadata.authors.join(', ')}\n` +
                `Journal: ${metadata.journal}\n` +
                `Year: ${metadata.year}`;
            
            if (abstractInfo) {
                successMessage += `\n${abstractInfo}`;
            }
            
            this.showMessage(
                'Parent creation complete',
                successMessage,
                'success'
            );
            
        } catch (error) {
            this.handleError(error, 'createNewParent');
            this.showMessage('Parent creation failed', error.message, 'error');
            throw error;
        }
    },
    
    // Create parent item from extracted metadata (for new parent only)
    async createParentFromMetadata(metadata, reader, pdfContext) {
        try {
            this.log('Creating parent item from metadata (new parent only)...');
            
            // This function is now only used when there's no existing parent
            // Existing parent handling is done in handleExistingParent()
            
            await this.createNewParent(metadata, reader, pdfContext);
            
        } catch (error) {
            this.handleError(error, 'createParentFromMetadata');
            throw error;
        }
    },
    
    // Show message to user
    showMessage(title, message, type = 'info') {
        try {
            const icon = {
                'success': '✅',
                'warning': '⚠️', 
                'error': '❌',
                'info': 'ℹ️'
            }[type] || 'ℹ️';
            
            alert(`${icon} ${title}\n\n${message}`);
            
        } catch (error) {
            this.log('Error showing message:', error.message);
        }
    },

    // Parse a single author name into firstName and lastName
    parseAuthorName(fullName) {
        if (!fullName || !fullName.trim()) {
            return {
                creatorType: 'author',
                name: ''
            };
        }

        const name = fullName.trim();
        
        // Check for comma-separated format: "Last, First"
        if (name.includes(',')) {
            const parts = name.split(',').map(part => part.trim());
            if (parts.length >= 2 && parts[0] && parts[1]) {
                return {
                    creatorType: 'author',
                    lastName: parts[0],
                    firstName: parts[1]
                };
            }
        }
        
        // Check for typical Western format: "First Last" or "First Middle Last"
        const parts = name.split(/\s+/);
        if (parts.length >= 2) {
            const lastName = parts[parts.length - 1];
            const firstName = parts.slice(0, -1).join(' ');
            
            if (firstName && lastName) {
                return {
                    creatorType: 'author',
                    lastName: lastName,
                    firstName: firstName
                };
            }
        }
        
        // Fallback: use as single name field (for names that don't follow typical patterns)
        return {
            creatorType: 'author',
            name: name
        };
    },

    // Parse authors from a string (fallback for non-array responses)
    parseAuthorsString(authorsString) {
        if (!authorsString || typeof authorsString !== 'string') {
            return [];
        }

        const authors = [];
        
        // Try different separators
        const separators = [';', ',', ' and ', ' & ', '\n'];
        let authorsList = [authorsString.trim()];
        
        for (const separator of separators) {
            if (authorsString.includes(separator)) {
                authorsList = authorsString.split(separator).map(author => author.trim());
                break;
            }
        }
        
        // Clean up and filter
        for (const author of authorsList) {
            const cleanAuthor = author.trim();
            if (cleanAuthor && 
                cleanAuthor.length > 1 && 
                !cleanAuthor.toLowerCase().includes('et al') &&
                !/^\d+$/.test(cleanAuthor)) {
                authors.push(cleanAuthor);
            }
        }
        
        return authors;
    },

    // Show preferences dialog (Zotero 7 compatible)
    showPreferencesDialog() {
        try {
            const mainWindow = Zotero.getMainWindow();
            if (!mainWindow) {
                this.log('No main window found');
                this.showInteractivePreferences();
                return;
            }
            
            // First try a simple HTML test dialog
            const testURL = this.rootURI + 'preferences/test.html';
            this.log('Testing with simple HTML at:', testURL);
            
            try {
                const testDialog = mainWindow.openDialog(
                    testURL,
                    'refsense-test',
                    'chrome,dialog,centerscreen,resizable,width=400,height=300',
                    null
                );
                this.log('Test dialog result:', testDialog ? 'success' : 'failed');
            } catch (testError) {
                this.log('Test dialog error:', testError.message);
            }
            
            // Open the actual preferences window
            const preferencesURL = this.rootURI + 'prefs.html';
            this.log('Opening preferences with openDialog at:', preferencesURL);
            
            const dialog = mainWindow.openDialog(
                preferencesURL,
                'refsense-preferences',
                'chrome,dialog,centerscreen,resizable,width=600,height=500',
                null
            );
            
            if (dialog) {
                this.log('Preferences dialog opened successfully with openDialog');
            } else {
                this.log('openDialog failed, falling back to interactive preferences');
                this.showInteractivePreferences();
            }

        } catch (error) {
            this.handleError(error, 'showPreferencesDialog');
            this.log('openDialog error, falling back to interactive preferences');
            this.showInteractivePreferences();
        }
    },

    // Interactive preferences using native dialogs
    showInteractivePreferences() {
        try {
            // Check the current configuration state
            const currentEncodedKey = Zotero.Prefs.get('extensions.refsense.openai_api_key');
            const currentKey = currentEncodedKey ? atob(currentEncodedKey) : null;
            const hasKey = currentKey && currentKey.length > 0;
            
            // Display configuration summary
            let message = '🤖 RefSense configuration\n\n';
            if (hasKey) {
                message += `✅ Current API key: ${currentKey.substring(0, 15)}...\n\n`;
                message += '1. Change API key\n';
                message += '2. Test connection\n';
                message += '3. View settings\n';
                message += '4. Cancel\n\n';
                message += 'Enter your choice (1-4):';
            } else {
                message += '❌ No API key is currently configured.\n\n';
                message += 'Would you like to configure an OpenAI API key now?\n';
                message += '(OK: configure now, Cancel: later)';
            }
            
            if (hasKey) {
                // If a key exists, allow user to choose
                const choice = prompt(message);
                
                switch (choice) {
                    case '1':
                        this.changeApiKey();
                        break;
                    case '2':
                        this.testApiConnection(currentKey);
                        break;
                    case '3':
                        this.showCurrentSettings();
                        break;
                    case '4':
                    default:
                        // Cancel
                        break;
                }
            } else {
                // If no key exists, request direct input
                if (confirm(message)) {
                    this.changeApiKey();
                }
            }
            
        } catch (error) {
            this.handleError(error, 'showInteractivePreferences');
            this.showSimplePreferencesDialog();
        }
    },

    // Change API key
    changeApiKey() {
        try {
            const currentEncodedKey = Zotero.Prefs.get('extensions.refsense.openai_api_key');
            const currentKey = currentEncodedKey ? atob(currentEncodedKey) : '';
            
            let message = 'Enter the OpenAI API key:\n\n';
            message += '• It must start with sk-\n';
            message += '• Use the key issued from your OpenAI account\n';
            message += '• Leave blank to cancel';
            
            const newKey = prompt(message, currentKey ? '' : 'sk-');
            
            if (newKey && newKey.trim()) {
                if (!newKey.startsWith('sk-')) {
                    alert('❌ Error: The OpenAI API key must start with sk-.');
                    return;
                }
                
                // Save settings
                Zotero.Prefs.set('extensions.refsense.openai_api_key', btoa(newKey.trim()));
                Zotero.Prefs.set('extensions.refsense.ai_backend', 'openai');
                Zotero.Prefs.set('extensions.refsense.openai_model', 'gpt-4-turbo');
                Zotero.Prefs.set('extensions.refsense.default_page_source', 'first');
                
                alert('✅ API key saved!\n\nYou can now use the RefSense button on PDFs.');
                this.log('API key saved successfully');
                
            } else if (newKey === '') {
                // Cancel
                return;
            }
            
        } catch (error) {
            this.handleError(error, 'changeApiKey');
            alert('❌ An error occurred while saving the API key.');
        }
    },

    // API connection test
    async testApiConnection(apiKey) {
        try {
            if (!apiKey) {
                alert('❌ No API key is configured.');
                return;
            }
            
            // Simple connection test (without real API call)
            if (apiKey.startsWith('sk-') && apiKey.length > 40) {
                alert('✅ API key format looks valid.\n\nUse the RefSense button on a PDF to perform a real connection test.');
            } else {
                alert('❌ API key format is invalid.');
            }
            
        } catch (error) {
            this.handleError(error, 'testApiConnection');
            alert('❌ An error occurred during the connection test.');
        }
    },

    // Display current settings
    showCurrentSettings() {
        try {
            const settings = {
                apiKey: Zotero.Prefs.get('extensions.refsense.openai_api_key'),
                backend: Zotero.Prefs.get('extensions.refsense.ai_backend') || 'openai',
                model: Zotero.Prefs.get('extensions.refsense.openai_model') || 'gpt-4-turbo',
                pageSource: Zotero.Prefs.get('extensions.refsense.default_page_source') || 'first'
            };
            
            let message = '📋 Current RefSense settings:\n\n';
            message += `• AI backend: ${settings.backend}\n`;
            message += `• Model: ${settings.model}\n`;
            message += `• Page extraction: ${settings.pageSource}\n`;
            
            if (settings.apiKey) {
                const decodedKey = atob(settings.apiKey);
                message += `• API key: ${decodedKey.substring(0, 15)}... (${decodedKey.length} characters)`;
            } else {
                message += '• API key: not set';
            }
            
            alert(message);
            
        } catch (error) {
            this.handleError(error, 'showCurrentSettings');
            alert('❌ An error occurred while retrieving settings.');
        }
    },

    // Return HTML content as a string
    getPreferencesHTML() {
        return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>RefSense Settings</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 20px;
            background: #f5f5f5;
        }
        
        .container {
            background: white;
            border-radius: 8px;
            padding: 24px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            max-width: 500px;
        }
        
        h1 {
            margin: 0 0 24px 0;
            color: #333;
            font-size: 20px;
            font-weight: 600;
        }
        
        .form-group {
            margin-bottom: 16px;
        }
        
        label {
            display: block;
            margin-bottom: 6px;
            font-weight: 500;
            color: #555;
        }
        
        input[type="text"], input[type="password"], select {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
            box-sizing: border-box;
        }
        
        input:focus, select:focus {
            outline: none;
            border-color: #007acc;
            box-shadow: 0 0 0 2px rgba(0,122,204,0.2);
        }
        
        .help-text {
            font-size: 12px;
            color: #666;
            margin-top: 4px;
        }
        
        .button-group {
            display: flex;
            gap: 12px;
            justify-content: flex-end;
            margin-top: 32px;
            padding-top: 20px;
            border-top: 1px solid #eee;
        }
        
        button {
            padding: 8px 16px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
            cursor: pointer;
            background: white;
        }
        
        button.primary {
            background: #007acc;
            color: white;
            border-color: #007acc;
        }
        
        button:hover {
            background: #f0f0f0;
        }
        
        button.primary:hover {
            background: #005a9e;
        }
        
        .status-message {
            padding: 12px;
            border-radius: 4px;
            margin-bottom: 16px;
            display: none;
        }
        
        .status-message.success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        
        .status-message.error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🤖 RefSense Settings</h1>
        
        <div id="statusMessage" class="status-message"></div>
        
        <div class="form-group">
            <label for="openaiApiKey">OpenAI API key</label>
            <input type="password" id="openaiApiKey" placeholder="sk-...">
            <div class="help-text">
                Enter the API key issued from your OpenAI account.
            </div>
        </div>
        
        <div class="form-group">
            <label for="openaiModel">Model</label>
            <select id="openaiModel">
                <option value="gpt-4-turbo">GPT-4 Turbo (recommended)</option>
                <option value="gpt-4">GPT-4</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
            </select>
        </div>
        
        <div class="button-group">
            <button type="button" onclick="testConnection()">Test connection</button>
            <button type="button" class="primary" onclick="saveSettings()">Save</button>
        </div>
    </div>
    
    <script>
        console.log('RefSense settings window loaded');
        
        // Load settings
        document.addEventListener('DOMContentLoaded', function() {
            loadSettings();
        });
        
        function loadSettings() {
            try {
                if (window.RefSensePlugin) {
                    // Load settings from the plugin (future enhancement)
                    console.log('Plugin connected');
                }
                
                // Load settings from Zotero.Prefs
                if (typeof Zotero !== 'undefined' && Zotero.Prefs) {
                    const encodedKey = Zotero.Prefs.get('extensions.refsense.openai_api_key');
                    if (encodedKey) {
                        document.getElementById('openaiApiKey').value = atob(encodedKey);
                    }
                    
                    const model = Zotero.Prefs.get('extensions.refsense.openai_model');
                    if (model) {
                        document.getElementById('openaiModel').value = model;
                    }
                }
                
                console.log('Settings loaded');
            } catch (error) {
                console.error('Failed to load settings:', error);
            }
        }

        function saveSettings() {
            try {
                const apiKey = document.getElementById('openaiApiKey').value.trim();
                
                if (!apiKey) {
                    showMessage('error', 'Please enter the API key.');
                    return;
                }

                if (!apiKey.startsWith('sk-')) {
                    showMessage('error', 'The OpenAI API key must start with sk-.');
                    return;
                }
                
                const model = document.getElementById('openaiModel').value;
                
                // Persist to Zotero.Prefs
                if (typeof Zotero !== 'undefined' && Zotero.Prefs) {
                    Zotero.Prefs.set('extensions.refsense.openai_api_key', btoa(apiKey));
                    Zotero.Prefs.set('extensions.refsense.ai_backend', 'openai');
                    Zotero.Prefs.set('extensions.refsense.openai_model', model);
                    Zotero.Prefs.set('extensions.refsense.default_page_source', 'first');
                    
                    showMessage('success', 'API key and settings have been saved!');
                    console.log('Settings saved');
                } else {
                    showMessage('error', 'Unable to access Zotero.Prefs.');
                }

            } catch (error) {
                console.error('Failed to save settings:', error);
                showMessage('error', 'Failed to save settings: ' + error.message);
            }
        }
        
        async function testConnection() {
            try {
                const apiKey = document.getElementById('openaiApiKey').value.trim();
                
                if (!apiKey) {
                    showMessage('error', 'Please enter the API key first.');
                    return;
                }

                showMessage('info', 'Testing the OpenAI connection...');
                
                const response = await fetch('https://api.openai.com/v1/models', {
                    headers: {
                        'Authorization': 'Bearer ' + apiKey
                    }
                });
                
                if (response.ok) {
                    showMessage('success', 'OpenAI connection successful!');
                } else {
                    showMessage('error', 'The API key is invalid.');
                }

            } catch (error) {
                console.error('Connection test failed:', error);
                showMessage('error', 'Connection test failed: ' + error.message);
            }
        }
        
        function showMessage(type, text) {
            const messageDiv = document.getElementById('statusMessage');
            messageDiv.className = 'status-message ' + type;
            messageDiv.textContent = text;
            messageDiv.style.display = 'block';
            
            if (type === 'success' || type === 'info') {
                setTimeout(() => {
                    messageDiv.style.display = 'none';
                }, 3000);
            }
        }
    </script>
</body>
</html>`;
    },

    // Simple preferences dialog using multiple fallback methods
    showSimplePreferencesDialog() {
        try {
            // Check the currently stored API key
            const currentEncodedKey = Zotero.Prefs.get('extensions.refsense.openai_api_key');
            const currentKey = currentEncodedKey ? atob(currentEncodedKey) : null;
            const hasKey = currentKey && currentKey.length > 0;
            
            let message = 'RefSense API key setup instructions:\n\n';
            if (hasKey) {
                message += `Current API key: ${currentKey.substring(0, 15)}...\n\n`;
                message += 'To change to a new API key, run the following code in the developer console:\n\n';
            } else {
                message += 'No API key is configured.\n\n';
                message += 'To set an API key, open the developer console (F12) and run the following code:\n\n';
            }
            
            message += 'Zotero.Prefs.set("extensions.refsense.openai_api_key", btoa("sk-your-api-key-here"));\n';
            message += 'Zotero.Prefs.set("extensions.refsense.ai_backend", "openai");\n';
            message += 'Zotero.Prefs.set("extensions.refsense.openai_model", "gpt-4-turbo");\n\n';
            message += 'Replace "sk-your-api-key-here" with your actual OpenAI API key.';
            
            // Show guidance in a message box
            this.showMessage('API key setup instructions', message, 'info');
            
        } catch (error) {
            this.handleError(error, 'showSimplePreferencesDialog');
            
            // Final fallback: log instructions to the console
            this.log('=== RefSense API key setup ===');
            this.log('Run the following code in the developer console:');
            this.log('Zotero.Prefs.set("extensions.refsense.openai_api_key", btoa("sk-your-api-key-here"));');
            this.log('Zotero.Prefs.set("extensions.refsense.ai_backend", "openai");');
            this.log('Zotero.Prefs.set("extensions.refsense.openai_model", "gpt-4-turbo");');
            this.log('=================================');
            
            this.showMessage('Setup instructions', 'Check the developer console for API key setup guidance.', 'info');
        }
    },
    
    // Clean up resources
    cleanup() {
        try {
            // Stop reader monitoring
            if (this.readerMonitorInterval) {
                clearInterval(this.readerMonitorInterval);
                this.log('Stopped reader monitoring');
            }
            
            // Unregister notifier
            if (this.notifierID && Zotero.Notifier) {
                Zotero.Notifier.unregisterObserver(this.notifierID);
                this.log('Unregistered notifier:', this.notifierID);
            }
            
            // Try to clean up readers safely
            try {
                let readers = [];
                
                if (Zotero.Reader && typeof Zotero.Reader.getReaders === 'function') {
                    readers = Zotero.Reader.getReaders();
                } else if (Zotero.Reader && Zotero.Reader._readers) {
                    readers = Array.from(Zotero.Reader._readers.values() || []);
                }
                
                this.log('Cleaning up', readers.length, 'readers');
                
                for (let reader of readers) {
                    try {
                        // Try both iframe and window documents
                        const docs = [];
                        if (reader._iframeWindow && reader._iframeWindow.document) {
                            docs.push(reader._iframeWindow.document);
                        }
                        if (reader._window && reader._window.document) {
                            docs.push(reader._window.document);
                        }
                        
                        for (let doc of docs) {
                            // Remove simple button
                            const simpleBtn = doc.querySelector('#refsense-simple-btn');
                            if (simpleBtn) {
                                simpleBtn.remove();
                                this.log('Removed simple button from reader', reader.itemID);
                            }
                            
                            // Remove old style buttons too
                            const oldBtn = doc.querySelector('#refsense-extract-btn');
                            if (oldBtn) {
                                oldBtn.remove();
                                this.log('Removed old toolbar button from reader', reader.itemID);
                            }
                            
                            const floatingBtn = doc.querySelector('#refsense-floating-btn');
                            if (floatingBtn) {
                                floatingBtn.remove();
                                this.log('Removed floating button from reader', reader.itemID);
                            }
                        }
                    } catch (error) {
                        this.log('Error cleaning up reader buttons:', error.message);
                    }
                }
                
                // Also clean up any buttons that might have been added to the main window by mistake
                try {
                    if (typeof Zotero !== 'undefined' && Zotero.getMainWindow) {
                        const mainWindow = Zotero.getMainWindow();
                        if (mainWindow && mainWindow.document) {
                            const wrongButton = mainWindow.document.querySelector('#refsense-extract-btn');
                            if (wrongButton) {
                                wrongButton.remove();
                                this.log('Removed misplaced button from main window');
                            }
                        }
                    }
                } catch (error) {
                    this.log('Error cleaning up main window:', error.message);
                }
            } catch (error) {
                this.log('Error accessing readers during cleanup:', error.message);
            }
            
            this.log('Cleanup completed');
        } catch (error) {
            this.log('Error during cleanup:', error.message);
        }
    },
    
    // Logging utility
    log(message, ...args) {
        if (args.length > 0) {
            Zotero.debug(`[RefSense] ${message}`, args);
        } else {
            Zotero.debug(`[RefSense] ${message}`);
        }
    },
    
    // Error handling utility
    handleError(error, context = '') {
        const errorMessage = `[RefSense] Error${context ? ` in ${context}` : ''}: ${error.message}`;
        Zotero.debug(errorMessage);
        Zotero.debug(error.stack || 'No stack trace available');
    },


    // Process extracted metadata and create parent item
    async processExtractedMetadata(metadata, pdfContext) {
        this.log('Processing extracted metadata:', metadata);
        
        try {
            // Validate metadata quality
            if (!metadata || !metadata.title) {
                this.showMessage('Metadata incomplete', 'The extracted information is insufficient. Please enter the metadata manually.', 'warning');
                return;
            }
            
            // Check confidence level
            if (metadata.confidence < 0.5) {
                this.showMessage('Low confidence', 'The extracted information has low confidence. Please review the results.', 'warning');
            }
            
            // Create parent item
            await this.createParentItem(metadata, pdfContext);
            
        } catch (error) {
            this.handleError(error, 'processExtractedMetadata');
            this.showMessage('Metadata processing failed', `An error occurred while processing: ${error.message}`, 'error');
        }
    },

    // Create parent item from metadata (Stage 7 implementation)
    async createParentItem(metadata, pdfContext) {
        this.log('Creating parent item from metadata:', metadata);
        
        try {
            // Get the current PDF attachment item
            const pdfItem = await Zotero.Items.getAsync(pdfContext.itemID);
            if (!pdfItem) {
                throw new Error('Unable to find the PDF item');
            }
            
            // Check if parent already exists
            if (pdfItem.parentID) {
                const existingParent = await Zotero.Items.getAsync(pdfItem.parentID);
                if (existingParent) {
                    this.showMessage('Parent item exists', 'A parent item already exists. Would you like to edit the existing item?', 'info');
                    return;
                }
            }
            
            // Determine item type
            const itemType = this.determineItemType(metadata);
            
            // Create new item
            const newItem = new Zotero.Item(itemType);
            
            // Set basic fields
            if (metadata.title) newItem.setField('title', metadata.title);
            if (metadata.year) newItem.setField('date', metadata.year.toString());
            if (metadata.journal) newItem.setField('publicationTitle', metadata.journal);
            if (metadata.volume) newItem.setField('volume', metadata.volume);
            if (metadata.issue) newItem.setField('issue', metadata.issue);
            if (metadata.pages) newItem.setField('pages', metadata.pages);
            if (metadata.doi) newItem.setField('DOI', metadata.doi);
            if (metadata.abstract) newItem.setField('abstractNote', metadata.abstract);
            
            // Add authors
            if (metadata.authors && Array.isArray(metadata.authors)) {
                for (const authorName of metadata.authors) {
                    if (authorName && authorName.trim()) {
                        const creator = {
                            firstName: '',
                            lastName: authorName.trim(),
                            creatorType: 'author'
                        };
                        
                        // Try to split name into first and last
                        const nameParts = authorName.trim().split(/\s+/);
                        if (nameParts.length > 1) {
                            creator.lastName = nameParts.pop();
                            creator.firstName = nameParts.join(' ');
                        }
                        
                        newItem.setCreator(newItem.numCreators(), creator);
                    }
                }
            }
            
            // Add tags/keywords
            if (metadata.keywords && Array.isArray(metadata.keywords)) {
                for (const keyword of metadata.keywords) {
                    if (keyword && keyword.trim()) {
                        newItem.addTag(keyword.trim());
                    }
                }
            }
            
            // Save the new item
            const newItemID = await newItem.saveTx();
            this.log('New parent item created with ID:', newItemID);
            
            // Set PDF as child of new item
            pdfItem.parentID = newItemID;
            await pdfItem.saveTx();
            
            this.log('PDF attached to new parent item');
            
            // Show success message
            this.showMessage('Success', `A new bibliography item has been created: "${metadata.title}"`, 'success');
            
        } catch (error) {
            this.handleError(error, 'createParentItem');
            throw error;
        }
    },

    // Determine appropriate Zotero item type
    determineItemType(metadata) {
        // Default to journal article
        if (metadata.journal) {
            return 'journalArticle';
        }
        
        // Could add more logic here to detect other types
        // (book, conference paper, etc.)
        
        return 'journalArticle';
    },

    // Utility Methods
    
    // Logging function
    log(...args) {
        try {
            const timestamp = new Date().toISOString();
            const message = `[RefSense ${timestamp}]`;
            
            if (typeof Zotero !== 'undefined' && Zotero.debug) {
                Zotero.debug(`${message} ${args.join(' ')}`);
            } else {
                console.log(message, ...args);
            }
        } catch (error) {
            console.log('[RefSense Log Error]', ...args);
        }
    },

    // Error handling function
    handleError(error, context) {
        try {
            const errorMessage = `Error in ${context}: ${error.message}`;
            this.log('ERROR:', errorMessage);
            this.log('Stack:', error.stack);
            
            if (typeof Zotero !== 'undefined' && Zotero.debug) {
                Zotero.debug(`[RefSense Error] ${errorMessage}`, 1);
            }
        } catch (handlingError) {
            console.error('[RefSense] Error handling failed:', handlingError);
            console.error('[RefSense] Original error:', error);
        }
    },

    // Show message to user
    showMessage(title, message, type = 'info') {
        try {
            // Use Zotero's built-in notification system
            if (typeof Zotero !== 'undefined' && Zotero.alert) {
                // For critical messages, use alert
                if (type === 'error') {
                    Zotero.alert(null, title, message);
                } else {
                    // For info/warning/success, use the progress window system
                    this.showProgressMessage(title, message, type);
                }
            } else {
                // Fallback to browser alert
                alert(`${title}: ${message}`);
            }
            
            // Always log the message
            this.log(`Message [${type}] ${title}: ${message}`);
            
        } catch (error) {
            this.log('Failed to show message:', error.message);
            // Ultimate fallback
            console.log(`[RefSense ${type.toUpperCase()}] ${title}: ${message}`);
        }
    },

    // Show progress/status message using Zotero's progress system
    showProgressMessage(title, message, type = 'info') {
        try {
            if (typeof Zotero !== 'undefined' && Zotero.ProgressWindow) {
                const progressWindow = new Zotero.ProgressWindow({ closeOnClick: true });
                progressWindow.changeHeadline(title);
                
                let icon;
                switch (type) {
                    case 'success':
                        icon = 'chrome://zotero/skin/tick.png';
                        break;
                    case 'warning':
                        icon = 'chrome://zotero/skin/warning.png';
                        break;
                    case 'error':
                        icon = 'chrome://zotero/skin/cross.png';
                        break;
                    default:
                        icon = 'chrome://zotero/skin/toolbar-advanced-search.png';
                }
                
                progressWindow.addDescription(message, icon);
                progressWindow.show();
                progressWindow.startCloseTimer(4000); // Auto-close after 4 seconds
            }
        } catch (error) {
            this.log('Progress message failed:', error.message);
        }
    },

    // Show dialog for parent item update options
    showParentUpdateDialog(existingTitle, metadata) {
        const dialog = Services.prompt;
        const title = "Existing Parent Item Found";
        const message = 
            `This PDF already has a parent item:\n` +
            `"${existingTitle}"\n\n` +
            `Newly extracted information:\n` +
            `Title: ${metadata.title}\n` +
            `Authors: ${metadata.authors.join(', ')}\n` +
            `Year: ${metadata.year}\n` +
            `Journal: ${metadata.journal}\n\n` +
            `How would you like to proceed?`;

        const buttons = ["Update existing information", "Create new parent", "Cancel"];
        
        try {
            const result = dialog.confirmEx(
                null, // parent window
                title,
                message,
                (dialog.BUTTON_TITLE_IS_STRING * dialog.BUTTON_POS_0) +
                (dialog.BUTTON_TITLE_IS_STRING * dialog.BUTTON_POS_1) +
                (dialog.BUTTON_TITLE_IS_STRING * dialog.BUTTON_POS_2),
                buttons[0], // button 0 text
                buttons[1], // button 1 text  
                buttons[2], // button 2 text
                null, // checkbox text
                {} // checkbox state
            );
            
            switch (result) {
                case 0: return 'update';   // Update existing information
                case 1: return 'new';      // Create new parent
                case 2: return 'cancel';   // Cancel
                default: return 'cancel';
            }
        } catch (error) {
            this.log('Dialog error, falling back to simple confirm:', error.message);
            // Fallback to simple confirm dialog
            const simpleChoice = confirm(
                `${message}\n\nWould you like to update the existing information?\n` +
                `(Cancel to create a new parent item)`
            );
            return simpleChoice ? 'update' : 'new';
        }
    },

    // Update existing parent item with new metadata
    async updateExistingParent(parentID, metadata) {
        try {
            this.log(`Updating existing parent item: ${parentID}`);
            
            const parentItem = await Zotero.Items.getAsync(parentID);
            if (!parentItem) {
                throw new Error('Unable to find the existing parent item.');
            }

            // Start transaction
            await Zotero.DB.executeTransaction(async () => {
                // Update basic fields
                if (metadata.title && metadata.title.trim()) {
                    parentItem.setField('title', metadata.title.trim());
                }
                
                if (metadata.year && metadata.year.toString().trim()) {
                    parentItem.setField('date', metadata.year.toString().trim());
                }
                
                if (metadata.journal && metadata.journal.trim()) {
                    parentItem.setField('publicationTitle', metadata.journal.trim());
                }
                
                if (metadata.doi && metadata.doi.trim()) {
                    parentItem.setField('DOI', metadata.doi.trim());
                }
                
                if (metadata.abstract && metadata.abstract.trim()) {
                    parentItem.setField('abstractNote', metadata.abstract.trim());
                }
                
                if (metadata.pages && metadata.pages.trim()) {
                    parentItem.setField('pages', metadata.pages.trim());
                }
                
                if (metadata.volume && metadata.volume.trim()) {
                    parentItem.setField('volume', metadata.volume.trim());
                }
                
                if (metadata.issue && metadata.issue.trim()) {
                    parentItem.setField('issue', metadata.issue.trim());
                }

                // Clear existing creators and add new ones
                if (metadata.authors && metadata.authors.length > 0) {
                    parentItem.setCreators([]);
                    
                    for (const authorName of metadata.authors) {
                        if (authorName && authorName.trim()) {
                            const creator = {
                                creatorType: 'author',
                                name: authorName.trim()
                            };
                            
                            // Try to split name into first/last if it contains comma or multiple words
                            const nameParts = authorName.trim().split(/,\s*|\s+/);
                            if (nameParts.length >= 2) {
                                creator.lastName = nameParts[0];
                                creator.firstName = nameParts.slice(1).join(' ');
                                delete creator.name;
                            }
                            
                            parentItem.setCreator(parentItem.numCreators(), creator);
                        }
                    }
                }

                // Save the item
                await parentItem.save();
                
                this.log('Parent item updated successfully');
                this.showMessage(
                    'Information updated',
                    `The existing parent item has been updated with new information.\n\nTitle: ${metadata.title}`,
                    'success'
                );
                
                return parentItem;
            });

        } catch (error) {
            this.error('Failed to update existing parent:', error);
            this.showMessage(
                'Update failed',
                `An error occurred while updating the existing parent item: ${error.message}`,
                'error'
            );
            throw error;
        }
    },

    // Get metadata from existing parent item
    async getExistingParentMetadata(parentID) {
        try {
            const parentItem = await Zotero.Items.getAsync(parentID);
            if (!parentItem) {
                throw new Error('Parent item not found');
            }

            const metadata = {
                title: parentItem.getField('title') || '',
                year: parentItem.getField('date') || '',
                journal: parentItem.getField('publicationTitle') || '',
                doi: parentItem.getField('DOI') || '',
                abstract: parentItem.getField('abstractNote') || '',
                pages: parentItem.getField('pages') || '',
                volume: parentItem.getField('volume') || '',
                issue: parentItem.getField('issue') || '',
                authors: []
            };

            // Get authors
            const creators = parentItem.getCreators();
            for (const creator of creators) {
                if (creator.creatorType === 'author') {
                    if (creator.name) {
                        metadata.authors.push(creator.name);
                    } else if (creator.firstName && creator.lastName) {
                        metadata.authors.push(`${creator.firstName} ${creator.lastName}`);
                    } else if (creator.lastName) {
                        metadata.authors.push(creator.lastName);
                    }
                }
            }

            return metadata;
        } catch (error) {
            this.error('Failed to get existing parent metadata:', error);
            throw error;
        }
    },

    // Show metadata comparison dialog with field-by-field selection
    async showMetadataComparisonDialog(parentID, newMetadata) {
        try {
            this.log('🟡 [DEBUG] Starting metadata comparison dialog for parent ID:', parentID);
            const existingMetadata = await this.getExistingParentMetadata(parentID);
            this.log('🟡 [DEBUG] Existing metadata:', existingMetadata);
            this.log('🟡 [DEBUG] New metadata:', newMetadata);
            
            // Create HTML-based comparison dialog for Zotero 7
            const comparisonContent = this.createComparisonContent(existingMetadata, newMetadata);
            this.log('🟡 [DEBUG] Comparison content created, about to show dialog...');
            
            // Use custom dialog system with delay to ensure document is ready
            const result = await new Promise((resolve) => {
                const dialogData = {
                    title: 'Update Existing Parent Item',
                    content: comparisonContent,
                    buttons: [
                        { label: 'Create new parent', action: 'cancel' },
                        { label: 'Keep all existing values', action: 'all_existing' },
                        { label: 'Use all new values', action: 'all_new' },
                        { label: 'Apply selected values', action: 'apply', default: true }
                    ],
                    wide: true,
                    callback: (action, contentElement) => {
                        if (action === 'apply') {
                            // Collect user selections
                            const selections = this.collectFieldSelections(contentElement);
                            resolve(selections);
                            return true; // Close dialog
                        } else if (action === 'all_existing') {
                            // Select all existing values
                            this.selectAllFields('existing', contentElement);
                            return false; // Don't close dialog
                        } else if (action === 'all_new') {
                            // Select all new values
                            this.selectAllFields('new', contentElement);
                            return false; // Don't close dialog
                        } else {
                            resolve('create_new'); // Create new parent instead
                            return true; // Close dialog
                        }
                    }
                };
                
                // Add small delay to ensure DOM is ready
                setTimeout(() => {
                    this.showCustomDialog(dialogData);
                }, 100);
            });
            
            this.log('🟡 [DEBUG] Dialog closed, result:', result);
            return result;
            
        } catch (error) {
            this.handleError(error, 'showMetadataComparisonDialog');
            
            // Show error to user and don't update anything
            this.showMessage(
                'Comparison dialog error',
                'An error occurred while displaying the metadata comparison dialog. Existing information remains unchanged.',
                'error'
            );
            
            // Return null to cancel operation
            return null;
        }
    },

    // Create HTML-based comparison content for Zotero 7
    createComparisonContent(existing, newData) {
        try {
            const fields = [
                { key: 'title', label: 'Title' },
                { key: 'authors', label: 'Authors' },
                { key: 'year', label: 'Year' },
                { key: 'journal', label: 'Journal' },
                { key: 'doi', label: 'DOI' },
                { key: 'abstract', label: 'Abstract' },
                { key: 'pages', label: 'Pages' },
                { key: 'volume', label: 'Volume' },
                { key: 'issue', label: 'Issue' }
            ];

        const truncateText = (text, maxLength = 80) => {
            return text && text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
        };

        const formatValue = (value, fieldKey) => {
            if (fieldKey === 'authors' && Array.isArray(value)) {
                return value.join(', ');
            }
            return value || '';
        };

        const escapeHtml = (text) => {
            if (!text) return '';
            try {
                return text.toString()
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#39;')
                    .replace(/\n/g, ' ')           // Replace newlines with spaces
                    .replace(/\r/g, ' ')           // Replace carriage returns
                    .replace(/\t/g, ' ')           // Replace tabs
                    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove ASCII + Latin-1 control chars
                    .replace(/[\u2000-\u200F\u2028-\u202F]/g, ' ') // Replace Unicode whitespace
                    .replace(/[\uFEFF\uFFFE\uFFFF]/g, '') // Remove BOM and other problematic chars
                    .replace(/[\uD800-\uDFFF]/g, ''); // Remove unpaired surrogate characters
            } catch (error) {
                this.log('🟡 [ERROR] HTML escaping failed:', error.message);
                return String(text).replace(/[<>&"']/g, ''); // Fallback: basic cleanup
            }
        };

        const rowsHTML = fields.map(field => {
            const existingValue = formatValue(existing[field.key], field.key);
            const newValue = formatValue(newData[field.key], field.key);
        const existingDisplay = escapeHtml(truncateText(existingValue) || '(empty)');
        const newDisplay = escapeHtml(truncateText(newValue) || '(empty)');
            const existingTitle = escapeHtml(existingValue);
            const newTitle = escapeHtml(newValue);

            return `
                <tr class="comparison-row" data-field="${field.key}">
                    <td style="font-weight: bold; padding: 8px; border-right: 1px solid #ddd; background: #f5f5f5;">
                        ${field.label}
                    </td>
                    <td style="padding: 8px; border-right: 1px solid #ddd;">
                        <label style="display: flex; align-items: center; cursor: pointer;">
                            <input type="radio" name="field_${field.key}" value="existing" style="margin-right: 8px;">
                            <span title="${existingTitle}" style="color: ${existingValue ? '#333' : '#999'}; ${existingValue ? '' : 'font-style: italic;'}">
                                ${existingDisplay}
                            </span>
                        </label>
                    </td>
                    <td style="padding: 8px;">
                        <label style="display: flex; align-items: center; cursor: pointer;">
                            <input type="radio" name="field_${field.key}" value="new" style="margin-right: 8px;" checked>
                            <span title="${newTitle}" style="color: ${newValue ? '#333' : '#999'}; ${newValue ? '' : 'font-style: italic;'}">
                                ${newDisplay}
                            </span>
                        </label>
                    </td>
                </tr>
            `;
        }).join('');

        return `
            <div style="margin-bottom: 15px; padding: 10px; background: #e8f4f8; border-radius: 5px;">
                <div style="font-weight: bold; margin-bottom: 5px;">Comparison of existing information and AI output</div>
                <div style="font-size: 0.9em; color: #666;">This PDF already has a parent item. Choose the value to use for each field.</div>
                <div style="font-size: 0.9em; color: #666; margin-top: 5px;">By default, the newly extracted value is selected.</div>
            </div>
            
            <div style="max-height: 400px; overflow-y: auto; border: 1px solid #ddd; border-radius: 4px;">
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: #f0f0f0; font-weight: bold;">
                            <th style="padding: 10px; text-align: left; width: 20%; border-right: 1px solid #ddd;">Field</th>
                            <th style="padding: 10px; text-align: left; width: 40%; border-right: 1px solid #ddd;">Existing value</th>
                            <th style="padding: 10px; text-align: left; width: 40%;">Newly extracted value</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHTML}
                    </tbody>
                </table>
            </div>
            
            <div style="margin-top: 15px; text-align: center; font-size: 0.9em; color: #666;">
                <strong>Tip:</strong> Click each row to choose a value, or use the buttons above for bulk selection.
            </div>
        `;
    } catch (error) {
        this.log('🟡 [ERROR] createComparisonContent failed:', error.message);
        this.log('🟡 [ERROR] Stack trace:', error.stack);
        return `
            <div style="padding: 20px; text-align: center; color: #666;">
                <div style="margin-bottom: 10px;">⚠️ An error occurred while generating the comparison dialog</div>
                <div style="font-size: 0.9em;">Error: ${this.escapeHtml(error.message)}</div>
                <div style="margin-top: 15px; font-size: 0.9em;">
                    Click 'Cancel' to keep the existing parent item.
                </div>
            </div>
        `;
    }
    },

    // Collect user field selections from comparison dialog
    collectFieldSelections(contentElement) {
        const selections = {};
        const fields = ['title', 'authors', 'year', 'journal', 'doi', 'abstract', 'pages', 'volume', 'issue'];
        
        for (const field of fields) {
            const radios = contentElement.querySelectorAll(`input[name="field_${field}"]`);
            for (const radio of radios) {
                if (radio.checked) {
                    selections[field] = radio.value;
                    break;
                }
            }
        }
        
        return selections;
    },

    // Select all fields to either 'existing' or 'new'
    selectAllFields(choice, contentElement) {
        const fields = ['title', 'authors', 'year', 'journal', 'doi', 'abstract', 'pages', 'volume', 'issue'];
        
        for (const field of fields) {
            const radio = contentElement.querySelector(`input[name="field_${field}"][value="${choice}"]`);
            if (radio) {
                radio.checked = true;
            }
        }
    },

    // Update existing parent with selective fields
    async updateExistingParentSelective(parentID, selection) {
        try {
            this.log(`🟢 [DEBUG] Updating existing parent item selectively: ${parentID}`);
            this.log('🟢 [DEBUG] User selection:', selection);
            
            const parentItem = await Zotero.Items.getAsync(parentID);
            const existingMetadata = await this.getExistingParentMetadata(parentID);
            
            if (!parentItem) {
                throw new Error('Unable to locate the existing parent item.');
            }

            // Determine final values based on selection
            const finalValues = {};
            const fields = ['title', 'year', 'journal', 'doi', 'abstract', 'pages', 'volume', 'issue', 'authors'];
            
            for (const field of fields) {
                if (selection[field] === 'existing') {
                    finalValues[field] = existingMetadata[field];
                } else {
                    finalValues[field] = this.currentNewMetadata[field]; // Store new metadata for reference
                }
            }

            // Start transaction
            await Zotero.DB.executeTransaction(async () => {
                // Update basic fields only if they were selected as 'new'
                if (selection.title === 'new' && finalValues.title && finalValues.title.trim()) {
                    parentItem.setField('title', finalValues.title.trim());
                }
                
                if (selection.year === 'new' && finalValues.year && finalValues.year.toString().trim()) {
                    parentItem.setField('date', finalValues.year.toString().trim());
                }
                
                if (selection.journal === 'new' && finalValues.journal && finalValues.journal.trim()) {
                    parentItem.setField('publicationTitle', finalValues.journal.trim());
                }
                
                if (selection.doi === 'new' && finalValues.doi && finalValues.doi.trim()) {
                    parentItem.setField('DOI', finalValues.doi.trim());
                }
                
                if (selection.abstract === 'new' && finalValues.abstract && finalValues.abstract.trim()) {
                    parentItem.setField('abstractNote', finalValues.abstract.trim());
                }
                
                if (selection.pages === 'new' && finalValues.pages && finalValues.pages.trim()) {
                    parentItem.setField('pages', finalValues.pages.trim());
                }
                
                if (selection.volume === 'new' && finalValues.volume && finalValues.volume.trim()) {
                    parentItem.setField('volume', finalValues.volume.trim());
                }
                
                if (selection.issue === 'new' && finalValues.issue && finalValues.issue.trim()) {
                    parentItem.setField('issue', finalValues.issue.trim());
                }

                // Update authors only if selected as 'new'
                if (selection.authors === 'new' && finalValues.authors && finalValues.authors.length > 0) {
                    parentItem.setCreators([]);
                    
                    for (const authorName of finalValues.authors) {
                        if (authorName && authorName.trim()) {
                            const creator = {
                                creatorType: 'author',
                                name: authorName.trim()
                            };
                            
                            // Try to split name into first/last if it contains comma or multiple words
                            const nameParts = authorName.trim().split(/,\s*|\s+/);
                            if (nameParts.length >= 2) {
                                creator.lastName = nameParts[0];
                                creator.firstName = nameParts.slice(1).join(' ');
                                delete creator.name;
                            }
                            
                            parentItem.setCreator(parentItem.numCreators(), creator);
                        }
                    }
                }

                // Save the item
                await parentItem.save();
                
                this.log('Parent item updated selectively');
                
                // Count updated fields
                const updatedFields = Object.values(selection).filter(val => val === 'new').length;
                
                this.showMessage(
                    'Selective update complete',
                    `${updatedFields} fields were updated with new information.`,
                    'success'
                );
                
                return parentItem;
            });

        } catch (error) {
            this.error('Failed to update existing parent selectively:', error);
            this.showMessage(
                'Selective update failed',
                `An error occurred during the selective update: ${error.message}`,
                'error'
            );
            throw error;
        }
    },

    // Show metadata preview dialog for user confirmation (Zotero 7 compatible)
    async showMetadataPreview(metadata, pdfContext) {
        try {
            this.log('Showing metadata preview dialog');
            
            // Create simple HTML-based dialog content
            const previewContent = this.createPreviewContent(metadata, pdfContext);
            
            // Use Zotero's built-in dialog system
            const result = await new Promise((resolve) => {
                const dialogData = {
                    title: 'AI-extracted metadata preview',
                    content: previewContent,
                    buttons: [
                        { label: 'Cancel', action: 'cancel' },
                        { label: 'Edit before creating', action: 'edit' },
                        { label: 'Confirm and create', action: 'accept', default: true }
                    ],
                    callback: (action, data) => {
                        resolve({ action, data });
                    }
                };
                
                this.showCustomDialog(dialogData);
            });
            
            if (result.action === 'accept' || result.action === 'edit') {
                this.log('User confirmed metadata preview');
                return { metadata: result.data || metadata };
            } else {
                this.log('User cancelled metadata preview');
                return null;
            }
            
        } catch (error) {
            this.handleError(error, 'showMetadataPreview');
            
            // Fallback to simple confirmation dialog
            const window = Services.wm.getMostRecentWindow('navigator:browser');
            const confirmed = window.confirm(
                `AI-extracted metadata:\n\n` +
                `Title: ${metadata.title || '(none)'}\n` +
                `Authors: ${metadata.authors || '(none)'}\n` +
                `Journal: ${metadata.journal || '(none)'}\n` +
                `Year: ${metadata.year || '(none)'}\n` +
                `DOI: ${metadata.doi || '(none)'}\n\n` +
                `Create the parent item with this information?`
            );
            
            return confirmed ? { metadata } : null;
        }
    },

    // Create custom dialog for Zotero 7
    showCustomDialog(dialogData) {
        // Try to find a window with ready document
        let window = Services.wm.getMostRecentWindow('navigator:browser');
        
        // If main window doesn't have body, try other approaches
        if (!window || !window.document || !window.document.body) {
            // Try Zotero main window
            if (typeof Zotero !== 'undefined' && Zotero.getMainWindow) {
                window = Zotero.getMainWindow();
                this.log('🟡 [DEBUG] Trying Zotero.getMainWindow()');
            }
            
            // Try all open windows
            if (!window || !window.document || !window.document.body) {
                const windowEnum = Services.wm.getEnumerator('navigator:browser');
                while (windowEnum.hasMoreElements()) {
                    const testWindow = windowEnum.getNext();
                    if (testWindow.document && testWindow.document.body) {
                        window = testWindow;
                        this.log('🟡 [DEBUG] Found window with ready document');
                        break;
                    }
                }
            }
        }
        
        // Final check - if still no good window, use fallback
        if (!window || !window.document || !window.document.body) {
            this.log('🟡 [ERROR] Document or body not ready, using alternative approach');
            // Use Zotero's built-in prompt system as fallback
            this.showFallbackSelectionDialog(dialogData);
            return;
        }
        
        // Create modal overlay
        const overlay = window.document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        
        // Create dialog box
        const dialog = window.document.createElement('div');
        const maxWidth = dialogData.wide ? '900px' : '600px';
        dialog.style.cssText = `
            background: white;
            border-radius: 8px;
            padding: 20px;
            max-width: ${maxWidth};
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        `;
        
        // Add title
        const title = window.document.createElement('h2');
        title.textContent = dialogData.title;
        title.style.cssText = 'margin-top: 0; margin-bottom: 15px; color: #333;';
        dialog.appendChild(title);
        
        // Add content with enhanced error handling
        const content = window.document.createElement('div');
        try {
            // Validate content before setting innerHTML
            if (!dialogData.content || typeof dialogData.content !== 'string') {
                throw new Error('Invalid content type');
            }
            
            // Test if content can be parsed as HTML
            const testDiv = window.document.createElement('div');
            testDiv.innerHTML = dialogData.content;
            
            // If successful, set the actual content
            content.innerHTML = dialogData.content;
            this.log('🟢 [DEBUG] HTML content set successfully');
            
        } catch (htmlError) {
            this.log('🟡 [ERROR] HTML content error:', htmlError.message);
            // If HTML parsing fails, show simple text
            content.textContent = `Unable to display HTML content: ${htmlError.message}\n\nClose the dialog and try again.`;
            content.style.cssText = 'padding: 20px; text-align: center; color: #666; white-space: pre-line;';
        }
        dialog.appendChild(content);
        
        // Add buttons
        const buttonContainer = window.document.createElement('div');
        buttonContainer.style.cssText = 'margin-top: 20px; text-align: right;';
        
        dialogData.buttons.forEach((button, index) => {
            const btn = window.document.createElement('button');
            btn.textContent = button.label;
            btn.style.cssText = `
                margin-left: 10px;
                padding: 8px 16px;
                border: 1px solid #ccc;
                border-radius: 4px;
                background: ${button.default ? '#007cba' : 'white'};
                color: ${button.default ? 'white' : '#333'};
                cursor: pointer;
            `;
            
            btn.addEventListener('click', () => {
                // Call callback first to get result
                const shouldClose = dialogData.callback(button.action, content);
                
                // Close dialog unless callback returns false
                if (shouldClose !== false) {
                    window.document.body.removeChild(overlay);
                }
            });
            
            buttonContainer.appendChild(btn);
        });
        
        dialog.appendChild(buttonContainer);
        overlay.appendChild(dialog);
        window.document.body.appendChild(overlay);
        
        // Focus on default button
        const defaultBtn = buttonContainer.querySelector('button:last-child');
        if (defaultBtn) defaultBtn.focus();
    },

    // Fallback selection dialog using Zotero services
    showFallbackSelectionDialog(dialogData) {
        try {
            this.log('🟡 [DEBUG] Showing fallback selection dialog');
            
            // Use setTimeout to ensure proper execution context
            setTimeout(() => {
                try {
                    // Use Services.prompt for cross-platform compatibility
                    const prompts = Services.prompt;
                    const title = "Metadata Comparison";
                    const text = `An existing parent item was found.\n\nHow would you like to proceed?`;
                    
                    const button0 = "Create new parent";
                    const button1 = "Update all with new values";  
                    const button2 = "Cancel (keep existing values)";
                    
                    const flags = prompts.BUTTON_TITLE_IS_STRING * prompts.BUTTON_POS_0 +
                                 prompts.BUTTON_TITLE_IS_STRING * prompts.BUTTON_POS_1 +
                                 prompts.BUTTON_TITLE_IS_STRING * prompts.BUTTON_POS_2;
                    
                    const result = prompts.confirmEx(
                        null, // parent window
                        title,
                        text,
                        flags,
                        button0,
                        button1, 
                        button2,
                        null, // checkbox text
                        {} // checkbox state
                    );
                    
                    this.log('🟡 [DEBUG] Fallback dialog result:', result);
                    
                    // Process result
                    if (dialogData.callback) {
                        switch (result) {
                            case 0: // Create new parent
                                dialogData.callback('create_new', null);
                                break;
                            case 1: // Update all with new values
                                dialogData.callback('all_new', null);
                                break;
                            case 2: // Cancel
                            default:
                                dialogData.callback('cancel', null);
                                break;
                        }
                    }
                    
                } catch (promptError) {
                    this.log('🟡 [ERROR] Fallback prompt failed:', promptError.message);
                    // Final fallback - just callback with cancel
                    if (dialogData.callback) {
                        dialogData.callback('cancel', null);
                    }
                }
            }, 100);
            
        } catch (error) {
            this.log('🟡 [ERROR] showFallbackSelectionDialog failed:', error.message);
            // Final fallback
            if (dialogData.callback) {
                dialogData.callback('cancel', null);
            }
        }
    },

    // Create preview content HTML
    createPreviewContent(metadata, pdfContext) {
        try {
            const fields = [
                { key: 'title', label: 'Title' },
                { key: 'authors', label: 'Authors' },
                { key: 'year', label: 'Year' },
                { key: 'journal', label: 'Journal' },
                { key: 'doi', label: 'DOI' },
                { key: 'abstract', label: 'Abstract' },
                { key: 'pages', label: 'Pages' },
                { key: 'volume', label: 'Volume' },
                { key: 'issue', label: 'Issue' }
            ];
        
        const fieldsHTML = fields.map(field => {
            const value = metadata[field] || '';
            const displayValue = value || '(empty)';
            const isEmpty = !value;
            
            return `
                <div style="margin-bottom: 12px; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    <div style="font-weight: bold; margin-bottom: 4px; color: #333;">
                        ${field.label}
                    </div>
                    <div style="background: #f9f9f9; padding: 6px; border-radius: 3px; ${isEmpty ? 'color: #999; font-style: italic;' : ''} ${field.key === 'abstract' ? 'max-height: 120px;' : 'max-height: 60px;'} overflow-y: auto; line-height: 1.4;">
                        ${this.escapeHtml(displayValue)}
                    </div>
                </div>
            `;
        }).join('');
        
        return `
            <div style="margin-bottom: 15px; padding: 10px; background: #e8f4f8; border-radius: 5px;">
                <div style="font-weight: bold;">PDF file: ${pdfContext.filename || 'Unknown'}</div>
                <div style="font-size: 0.9em; color: #666;">Extraction method: AI metadata extraction</div>
            </div>
            <div style="max-height: 400px; overflow-y: auto;">
                ${fieldsHTML}
            </div>
            <div style="margin-top: 15px; padding-top: 10px; border-top: 1px solid #ddd; font-size: 0.9em; color: #666; text-align: center;">
                Confirm: create as-is | Edit: modify before creating | Cancel: abort
            </div>
        `;
        } catch (error) {
            this.log('🟡 [ERROR] createPreviewContent failed:', error.message);
            return `
                <div style="padding: 20px; text-align: center; color: #666;">
                    <div style="margin-bottom: 10px;">⚠️ An error occurred while generating the preview</div>
                    <div style="font-size: 0.9em;">Error: ${this.escapeHtml(error.message)}</div>
                    <div style="margin-top: 15px;">
                        <div style="font-weight: bold;">Extracted details:</div>
                        <div>Title: ${this.escapeHtml(metadata.title || 'Extraction failed')}</div>
                        <div>Authors: ${this.escapeHtml(metadata.authors ? String(metadata.authors) : 'Extraction failed')}</div>
                    </div>
                </div>
            `;
        }
    },

    // Collect edited metadata (placeholder for future edit functionality)
    collectEditedMetadata(contentElement) {
        // For now, return original metadata
        // In the future, this could collect edited values from input fields
        return null;
    },

    // Add context menu to item list
    addItemListContextMenu(attempt = 1, maxAttempts = 10) {
        this.log(`Adding context menu to item list... (attempt ${attempt}/${maxAttempts})`);
        
        try {
            // Check multiple approaches for Zotero 7 compatibility
            const hasItemTreeView = Zotero.ItemTreeView && typeof Zotero.ItemTreeView === 'function';
            const hasMainWindow = Zotero.getMainWindow && Zotero.getMainWindow();
            
            this.log(`ItemTreeView available: ${hasItemTreeView}, MainWindow available: ${!!hasMainWindow}`);
            
            if (!hasItemTreeView && !hasMainWindow) {
                if (attempt < maxAttempts) {
                    this.log('Zotero components not ready, retrying...');
                    setTimeout(() => this.addItemListContextMenu(attempt + 1, maxAttempts), 1000);
                } else {
                    this.log('❌ Zotero components not available after maximum attempts - trying direct approach');
                    // Still try the alternative setup
                    this.setupAlternativeContextMenu();
                }
                return;
            }

            // Try primary method first, fallback to alternative
            if (hasItemTreeView) {
                this.setupContextMenuObserver();
            } else {
                this.log('Using alternative context menu setup...');
                this.setupAlternativeContextMenu();
            }
            
            this.log('✅ Item list context menu setup completed');
            
        } catch (error) {
            this.log('❌ Failed to setup item list context menu:', error.message);
            // Try alternative as fallback
            this.setupAlternativeContextMenu();
        }
    },

    // Setup context menu observer
    setupContextMenuObserver() {
        try {
            // Check if ItemTreeView has the expected method
            if (!Zotero.ItemTreeView.prototype._showContextMenu) {
                this.log('⚠️ Could not find _showContextMenu method, trying alternative approach...');
                
                // Alternative: Try to hook into the popup showing event
                this.setupAlternativeContextMenu();
                return;
            }
            
            // Monitor when context menus are created
            const originalShowContextMenu = Zotero.ItemTreeView.prototype._showContextMenu;
            
            Zotero.ItemTreeView.prototype._showContextMenu = function(event) {
                // Call original function first
                const result = originalShowContextMenu.call(this, event);
                
                try {
                    // Add our RefSense menu item
                    RefSense.Plugin.addRefSenseContextMenuItem(this, event);
                } catch (error) {
                    RefSense.Plugin.log('Error adding RefSense context menu item:', error.message);
                }
                
                return result;
            };
            
            this.log('✅ Context menu observer registered');
            
        } catch (error) {
            this.log('❌ Failed to setup context menu observer:', error.message);
            this.log('Trying alternative approach...');
            this.setupAlternativeContextMenu();
        }
    },

    // Alternative context menu setup method
    setupAlternativeContextMenu() {
        try {
            this.log('Setting up alternative context menu approach...');
            
            // Wait for main window and try to find item tree
            const mainWindow = Zotero.getMainWindow();
            if (!mainWindow) {
                this.log('Main window not available, retrying in 2 seconds...');
                setTimeout(() => this.setupAlternativeContextMenu(), 2000);
                return;
            }

            const doc = mainWindow.document;
            
            // Try multiple selectors for the item tree in Zotero 7
            const selectors = [
                '#zotero-items-tree',
                '#item-tree',
                'item-tree',
                '[id*="item"][id*="tree"]',
                '.virtualized-table'
            ];
            
            let itemTree = null;
            for (const selector of selectors) {
                itemTree = doc.querySelector(selector);
                if (itemTree) {
                    this.log(`Found item tree with selector: ${selector}`);
                    break;
                }
            }
            
            if (itemTree) {
                // Add event listener for context menu with better timing
                itemTree.addEventListener('contextmenu', (event) => {
                    // Use setTimeout instead of requestAnimationFrame (not available in all contexts)
                    setTimeout(() => {
                        try {
                            this.handleAlternativeContextMenu(event);
                        } catch (error) {
                            this.log('Error in alternative context menu handler:', error.message);
                        }
                    }, 100);
                });
                
                // Also try to hook into the popup menu directly
                const contextMenu = doc.getElementById('zotero-itemmenu');
                if (contextMenu) {
                    contextMenu.addEventListener('popupshowing', (event) => {
                        try {
                            this.handleContextMenuPopup(event);
                        } catch (error) {
                            this.log('Error in context menu popup handler:', error.message);
                        }
                    });
                    this.log('✅ Hooked into context menu popup event');
                }
                
                this.log('✅ Alternative context menu setup completed');
            } else {
                this.log('⚠️ Could not find item tree element with any selector');
                this.log('Available elements:', [...doc.querySelectorAll('[id*="tree"], [id*="item"]')].map(el => el.id || el.tagName));
            }
            
        } catch (error) {
            this.log('❌ Alternative context menu setup failed:', error.message);
        }
    },

    // Handle context menu popup event
    handleContextMenuPopup(event) {
        try {
            this.log('Context menu popup showing...');
            
            const mainWindow = Zotero.getMainWindow();
            if (!mainWindow) return;

            // Get currently selected items
            const zoteroPane = mainWindow.ZoteroPane;
            if (zoteroPane && zoteroPane.getSelectedItems) {
                const selectedItems = zoteroPane.getSelectedItems();
                this.log(`Selected items count: ${selectedItems.length}`);
                
                // Check for PDFs without parent
                const pdfAttachmentsWithoutParent = selectedItems.filter(item => {
                    return this.isPDFAttachmentWithoutParent(item);
                });

                this.log(`PDF attachments without parent: ${pdfAttachmentsWithoutParent.length}`);

                if (pdfAttachmentsWithoutParent.length > 0) {
                    this.addRefSenseContextMenuItem(null, event, pdfAttachmentsWithoutParent);
                }
            }
            
        } catch (error) {
            this.log('Error in context menu popup handler:', error.message);
        }
    },

    // Handle alternative context menu
    handleAlternativeContextMenu(event) {
        try {
            const mainWindow = Zotero.getMainWindow();
            if (!mainWindow) return;

            const doc = mainWindow.document;
            const contextMenu = doc.getElementById('zotero-itemmenu');
            
            if (contextMenu && contextMenu.state === 'open') {
                // Get currently selected items
                const zoteroPane = mainWindow.ZoteroPane;
                if (zoteroPane && zoteroPane.getSelectedItems) {
                    const selectedItems = zoteroPane.getSelectedItems();
                    
                    // Check for PDFs without parent
                    const pdfAttachmentsWithoutParent = selectedItems.filter(item => {
                        return this.isPDFAttachmentWithoutParent(item);
                    });

                    if (pdfAttachmentsWithoutParent.length > 0) {
                        this.addRefSenseContextMenuItem(null, { target: { ownerDocument: doc } }, pdfAttachmentsWithoutParent);
                    }
                }
            }
            
        } catch (error) {
            this.log('Error in alternative context menu handler:', error.message);
        }
    },

    // Add RefSense menu item to context menu
    addRefSenseContextMenuItem(itemTreeView, event, pdfItems = null) {
        try {
            let pdfAttachmentsWithoutParent = pdfItems;
            
            // If no PDF items provided, get them from itemTreeView
            if (!pdfAttachmentsWithoutParent && itemTreeView) {
                const selectedItems = itemTreeView.getSelectedItems();
                if (!selectedItems || selectedItems.length === 0) {
                    return;
                }

                // Check if any selected item is a PDF attachment without parent
                pdfAttachmentsWithoutParent = selectedItems.filter(item => {
                    return this.isPDFAttachmentWithoutParent(item);
                });
            }

            if (!pdfAttachmentsWithoutParent || pdfAttachmentsWithoutParent.length === 0) {
                return;
            }

            // Find the context menu popup
            const contextMenu = event.target.ownerDocument.getElementById('zotero-itemmenu');
            if (!contextMenu) {
                this.log('Context menu popup not found');
                return;
            }

            // Check if our menu item already exists
            let refSenseMenuItem = contextMenu.querySelector('#refsense-extract-metadata');
            if (refSenseMenuItem) {
                // Update visibility
                refSenseMenuItem.hidden = false;
                return;
            }

            // Create RefSense menu item
            refSenseMenuItem = event.target.ownerDocument.createElementNS(
                'http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul', 
                'menuitem'
            );
            
            refSenseMenuItem.id = 'refsense-extract-metadata';
            refSenseMenuItem.setAttribute('label', '📄 RefSense: Extract Bibliographic Info');
            refSenseMenuItem.setAttribute('tooltiptext', 'Use AI to extract bibliographic metadata from the PDF and create the parent item');
            
            // Add event listener
            refSenseMenuItem.addEventListener('command', () => {
                this.handleContextMenuAction(pdfAttachmentsWithoutParent);
            });

            // Find appropriate position (after "Show File" if it exists)
            // Include Korean label matcher to support localized Zotero menus
            const showFileItem = contextMenu.querySelector('[label*="Show File"], [label*="파일 보기"]');
            if (showFileItem) {
                contextMenu.insertBefore(refSenseMenuItem, showFileItem.nextSibling);
            } else {
                // Insert at the beginning
                contextMenu.insertBefore(refSenseMenuItem, contextMenu.firstChild);
            }

            // Add separator if needed
            let separator = contextMenu.querySelector('#refsense-separator');
            if (!separator) {
                separator = event.target.ownerDocument.createElementNS(
                    'http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul', 
                    'menuseparator'
                );
                separator.id = 'refsense-separator';
                contextMenu.insertBefore(separator, refSenseMenuItem.nextSibling);
            }

            this.log(`✅ Added RefSense context menu item for ${pdfAttachmentsWithoutParent.length} PDF(s)`);

        } catch (error) {
            this.log('❌ Failed to add RefSense context menu item:', error.message);
        }
    },

    // Check if item is PDF attachment without parent
    isPDFAttachmentWithoutParent(item) {
        try {
            if (!item) return false;

            // Check if it's an attachment
            if (!item.isAttachment()) return false;

            // Check if it's a PDF
            if (item.attachmentContentType !== 'application/pdf') return false;

            // Check if it has no parent item
            const hasParent = item.parentItemID && item.parentItemID > 0;
            
            this.log(`Item ${item.id} PDF check:`, {
                isAttachment: item.isAttachment(),
                contentType: item.attachmentContentType,
                parentItemID: item.parentItemID,
                hasParent: hasParent
            });

            return !hasParent;

        } catch (error) {
            this.log('Error checking PDF attachment status:', error.message);
            return false;
        }
    },

    // Handle context menu action
    async handleContextMenuAction(pdfItems) {
        try {
            this.log(`🔄 Handling context menu action for ${pdfItems.length} PDF(s)`);

            // If multiple PDFs selected, ask user which one to process
            let targetItem = pdfItems[0];
            if (pdfItems.length > 1) {
                targetItem = await this.selectPDFFromMultiple(pdfItems);
                if (!targetItem) {
                    this.log('User cancelled PDF selection');
                    return;
                }
            }

            // Process the selected PDF using existing workflow
            await this.processPDFItem(targetItem);

        } catch (error) {
            this.log('❌ Context menu action failed:', error.message);
            this.showError('RefSense error', `An error occurred during processing: ${error.message}`);
        }
    },

    // Select PDF from multiple options
    async selectPDFFromMultiple(pdfItems) {
        return new Promise((resolve) => {
            try {
                const options = pdfItems.map((item, index) => {
                    const filename = item.getField('title') || item.getDisplayTitle() || `PDF ${index + 1}`;
                    return `${index + 1}. ${filename}`;
                }).join('\n');

                const choice = Services.prompt.select(
                    null,
                    'Select RefSense PDF',
                    `Choose the PDF to process:\n\n${options}`,
                    pdfItems.length,
                    pdfItems.map((item, index) => {
                        const filename = item.getField('title') || item.getDisplayTitle() || `PDF ${index + 1}`;
                        return filename;
                    }),
                    {}
                );

                if (choice.value >= 0) {
                    resolve(pdfItems[choice.value]);
                } else {
                    resolve(null);
                }

            } catch (error) {
                this.log('Error in PDF selection dialog:', error.message);
                resolve(pdfItems[0]); // Fallback to first item
            }
        });
    },

    // Process PDF item (similar to reader-based processing)
    async processPDFItem(pdfItem) {
        try {
            this.log(`🔄 Processing PDF item: ${pdfItem.id}`);

            // Create a pseudo-reader object for consistency with existing workflow
            const pseudoReader = {
                itemID: pdfItem.id,
                _isContextMenu: true,  // Flag to identify context menu calls
                pdfItem: pdfItem
            };

            // Use existing extraction workflow
            await this.handleExtractMetadata(pseudoReader);

        } catch (error) {
            this.log('❌ Failed to process PDF item:', error.message);
            throw error;
        }
    }
};

// Plugin lifecycle functions for Zotero
function startup({ id, version, rootURI }) {
    try {
        RefSense.Plugin.id = id;
        RefSense.Plugin.version = version;
        RefSense.Plugin.rootURI = rootURI;
        
        // Make sure RefSense is globally accessible after plugin loads
        const mainWindow = Services.wm.getMostRecentWindow('navigator:browser');
        if (mainWindow) {
            mainWindow.RefSense = RefSense;
        }
        
        RefSense.Plugin.startup();
    } catch (error) {
        if (typeof Zotero !== 'undefined' && Zotero.debug) {
            Zotero.debug(`[RefSense] Startup error: ${error.message}`);
        }
    }
}

function shutdown() {
    try {
        if (RefSense && RefSense.Plugin) {
            RefSense.Plugin.shutdown();
        }
    } catch (error) {
        if (typeof Zotero !== 'undefined' && Zotero.debug) {
            Zotero.debug(`[RefSense] Shutdown error: ${error.message}`);
        }
    }
}

function install() {
    if (typeof Zotero !== 'undefined' && Zotero.debug) {
        Zotero.debug('[RefSense] Plugin installed');
    }
}

function startup() {
    if (typeof Zotero !== 'undefined' && RefSense && RefSense.Plugin) {
        RefSense.Plugin.startup();
    }
}

function uninstall() {
    if (typeof Zotero !== 'undefined' && Zotero.debug) {
        Zotero.debug('[RefSense] Plugin uninstalled');
    }
}
