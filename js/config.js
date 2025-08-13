// Configuration management for the AI Agent
export class Config {
    constructor() {
        this.storageKey = 'ai-agent-config';
        this.defaultConfig = {
            apiKey: '',
            model: 'openai/gpt-4o-mini',
            chatHistory: []
        };
        this.config = this.loadConfig();
        this.listeners = new Set();
    }

    // Add listener for configuration changes
    addListener(callback) {
        this.listeners.add(callback);
    }

    // Remove listener
    removeListener(callback) {
        this.listeners.delete(callback);
    }

    // Notify all listeners of changes
    notifyListeners() {
        this.listeners.forEach(callback => callback(this.config));
    }

    loadConfig() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                return { ...this.defaultConfig, ...JSON.parse(stored) };
            }
        } catch (error) {
            console.warn('Failed to load config from localStorage:', error);
        }
        return { ...this.defaultConfig };
    }

    saveConfig() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.config));
            return true;
        } catch (error) {
            console.error('Failed to save config to localStorage:', error);
            return false;
        }
    }

    get(key) {
        return this.config[key];
    }

    set(key, value) {
        this.config[key] = value;
        this.saveConfig();
    }

    getApiKey() {
        return this.config.apiKey;
    }

    setApiKey(apiKey) {
        this.config.apiKey = apiKey;
        this.saveConfig();
    }

    getModel() {
        return this.config.model;
    }

    setModel(model) {
        this.config.model = model;
        this.saveConfig();
    }

    getChatHistory() {
        return this.config.chatHistory || [];
    }

    addMessage(message) {
        if (!this.config.chatHistory) {
            this.config.chatHistory = [];
        }
        this.config.chatHistory.push({
            ...message,
            timestamp: new Date().toISOString()
        });
        this.saveConfig();
    }

    clearChatHistory() {
        this.config.chatHistory = [];
        this.saveConfig();
    }

    isConfigured() {
        return this.config.apiKey && this.config.apiKey.trim().length > 0;
    }

    getOpenRouterHeaders() {
        return {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': window.location.origin,
            'X-Title': 'AI Agent Tool Caller'
        };
    }

    getModelConfig() {
        return {
            model: this.config.model,
            temperature: 0.7,
            max_tokens: 1000,
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0
        };
    }
}

// Create and export a singleton instance
export const config = new Config();
