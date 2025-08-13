// UI management for the AI Agent
import { config } from './config.js';
import { agent } from './agent.js';
import { modelManager } from './models.js';

class UIManager {
    constructor() {
        this.chatHistory = null;
        this.messageInput = null;
        this.sendBtn = null;
        this.settingsModal = null;
        this.loadingIndicator = null;
        this.init();
    }

    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupUI());
        } else {
            this.setupUI();
        }
    }

    setupUI() {
        // Get DOM elements
        this.chatHistory = document.getElementById('chatHistory');
        this.messageInput = document.getElementById('messageInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.settingsModal = document.getElementById('settingsModal');
        this.loadingIndicator = document.getElementById('loadingIndicator');

        // Setup event listeners
        this.setupEventListeners();

        // Load saved settings
        this.loadSettings();

        // Load chat history
        this.loadChatHistory();

        // Update UI state
        this.updateUIState();
    }

    setupEventListeners() {
        // Settings button
        document.getElementById('settingsBtn').addEventListener('click', () => {
            this.showSettings();
        });

        // Settings modal close
        document.querySelector('.close').addEventListener('click', () => {
            this.hideSettings();
        });

        // Click outside modal to close
        this.settingsModal.addEventListener('click', (e) => {
            if (e.target === this.settingsModal) {
                this.hideSettings();
            }
        });

        // Save settings button
        document.getElementById('saveSettings').addEventListener('click', () => {
            this.saveSettings();
        });

        // Clear history button
        document.getElementById('clearHistory').addEventListener('click', () => {
            this.clearChatHistory();
        });

        // Send message
        this.sendBtn.addEventListener('click', () => {
            this.sendMessage();
        });

        // Enter key to send message
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Auto-resize textarea (if we change to textarea later)
        this.messageInput.addEventListener('input', () => {
            this.updateUIState();
        });

        // Model search functionality
        this.setupModelSearchListeners();
    }

    showSettings() {
        this.settingsModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    hideSettings() {
        this.settingsModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    loadSettings() {
        // Load API key
        const apiKey = config.getApiKey();
        if (apiKey) {
            document.getElementById('apiKey').value = apiKey;
        }

        // Load model selection
        const model = config.getModel();
        document.getElementById('modelSelect').value = model;
    }

    saveSettings() {
        const apiKey = document.getElementById('apiKey').value.trim();
        const model = document.getElementById('modelSelect').value;

        // Save to config
        config.setApiKey(apiKey);
        config.setModel(model);

        // Update UI state
        this.updateUIState();

        // Show success message
        this.showNotification('Settings saved successfully!', 'success');

        // Hide settings modal
        this.hideSettings();
    }

    loadChatHistory() {
        const history = config.getChatHistory();
        
        // Clear current chat display (except system message)
        const systemMessage = this.chatHistory.querySelector('.system-message');
        this.chatHistory.innerHTML = '';
        if (systemMessage) {
            this.chatHistory.appendChild(systemMessage);
        }

        // Load saved messages
        history.forEach(message => {
            if (message.role === 'user' || message.role === 'assistant') {
                this.addMessageToUI(message.content, message.role, message.toolExecutions);
            }
        });

        this.scrollToBottom();
    }

    clearChatHistory() {
        // Clear from config
        config.clearChatHistory();
        
        // Clear agent history
        agent.clearHistory();

        // Clear UI (keep system message)
        const systemMessage = this.chatHistory.querySelector('.system-message');
        this.chatHistory.innerHTML = '';
        if (systemMessage) {
            this.chatHistory.appendChild(systemMessage);
        }

        this.showNotification('Chat history cleared!', 'info');
    }

    updateUIState() {
        const isConfigured = config.isConfigured();
        const isReady = agent.isReady();
        const hasMessage = this.messageInput && this.messageInput.value.trim().length > 0;

        // Enable/disable input and send button
        if (this.messageInput) {
            this.messageInput.disabled = !isConfigured;
            this.messageInput.placeholder = isConfigured ? 
                'Ask me anything...' : 
                'Configure your API key in settings first';
        }

        if (this.sendBtn) {
            this.sendBtn.disabled = !isConfigured || !isReady || !hasMessage;
        }

        // Update system message if not configured
        const systemMessage = this.chatHistory?.querySelector('.system-message .message-content');
        if (systemMessage && !isConfigured) {
            systemMessage.textContent = 'Welcome! Please configure your OpenRouter API key in settings to get started.';
        } else if (systemMessage && isConfigured) {
            systemMessage.textContent = 'Welcome! I\'m an AI agent with access to tools like DuckDuckGo search. Ask me anything!';
        }
    }

    async sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message || !agent.isReady()) return;

        // Clear input
        this.messageInput.value = '';
        this.updateUIState();

        // Add user message to UI
        this.addMessageToUI(message, 'user');

        // Save user message
        config.addMessage({ role: 'user', content: message });

        // Show loading
        this.showLoading();

        try {
            // Send to agent
            const response = await agent.sendMessage(message);

            // Hide loading
            this.hideLoading();

            // Add assistant response to UI
            this.addMessageToUI(response.content, 'assistant', response.toolExecutions);

            // Save assistant message
            config.addMessage({ 
                role: 'assistant', 
                content: response.content,
                toolExecutions: response.toolExecutions 
            });

        } catch (error) {
            console.error('Send message error:', error);
            this.hideLoading();
            
            // Show error message
            const errorMessage = `Sorry, I encountered an error: ${error.message}`;
            this.addMessageToUI(errorMessage, 'assistant');
            
            // Save error message
            config.addMessage({ role: 'assistant', content: errorMessage });
        }

        this.updateUIState();
    }

    addMessageToUI(content, role, toolExecutions = null) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}`;

        // Add tool executions if present
        if (toolExecutions && toolExecutions.length > 0) {
            toolExecutions.forEach(execution => {
                const toolDiv = document.createElement('div');
                toolDiv.className = 'tool-execution';
                toolDiv.innerHTML = `🔧 <strong>${execution.tool}</strong>: ${execution.result.success ? '✅' : '❌'} ${execution.args.query || execution.args.expression || 'Executed'}`;
                messageDiv.appendChild(toolDiv);
            });
        }

        // Add main message content
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        // Convert markdown-like formatting to HTML
        const formattedContent = this.formatMessage(content);
        contentDiv.innerHTML = formattedContent;
        
        messageDiv.appendChild(contentDiv);
        this.chatHistory.appendChild(messageDiv);
        
        this.scrollToBottom();
    }

    formatMessage(content) {
        // Basic markdown-like formatting
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>')
            .replace(/`(.*?)`/g, '<code>$1</code>');
    }

    scrollToBottom() {
        this.chatHistory.scrollTop = this.chatHistory.scrollHeight;
    }

    showLoading() {
        this.loadingIndicator.style.display = 'flex';
    }

    hideLoading() {
        this.loadingIndicator.style.display = 'none';
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            animation: slideIn 0.3s ease;
            background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#007bff'};
        `;

        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    // Model search functionality
    setupModelSearchListeners() {
        // Search models button
        document.getElementById('searchModelsBtn').addEventListener('click', () => {
            this.toggleModelSearch();
        });

        // Refresh models button
        document.getElementById('refreshModelsBtn').addEventListener('click', () => {
            this.refreshModels();
        });

        // Filter checkboxes
        document.getElementById('freeModelsFilter').addEventListener('change', () => {
            this.applyModelFilters();
        });

        document.getElementById('toolCallingFilter').addEventListener('change', () => {
            this.applyModelFilters();
        });
    }

    async toggleModelSearch() {
        const searchSection = document.getElementById('modelSearchSection');
        const searchBtn = document.getElementById('searchModelsBtn');

        if (searchSection.style.display === 'none') {
            // Show model search
            searchSection.style.display = 'block';
            searchBtn.textContent = 'Hide Models';
            
            // Load models if not already loaded
            if (modelManager.models.length === 0) {
                await this.loadModels();
            } else {
                this.displayModels();
            }
        } else {
            // Hide model search
            searchSection.style.display = 'none';
            searchBtn.textContent = 'Search Models';
        }
    }

    async loadModels() {
        const resultsContainer = document.getElementById('modelSearchResults');
        
        if (!config.isConfigured()) {
            resultsContainer.innerHTML = '<div class="error-loading-models">Please configure your OpenRouter API key first.</div>';
            return;
        }

        resultsContainer.innerHTML = '<div class="loading-models">Loading models...</div>';

        try {
            await modelManager.fetchModels();
            this.displayModels();
            this.showNotification('Models loaded successfully!', 'success');
        } catch (error) {
            console.error('Error loading models:', error);
            resultsContainer.innerHTML = `<div class="error-loading-models">Failed to load models: ${error.message}</div>`;
            this.showNotification('Failed to load models', 'error');
        }
    }

    async refreshModels() {
        await this.loadModels();
    }

    applyModelFilters() {
        const freeOnly = document.getElementById('freeModelsFilter').checked;
        const toolCallingOnly = document.getElementById('toolCallingFilter').checked;

        modelManager.filterModels({ freeOnly, toolCallingOnly });
        this.displayModels();
    }

    displayModels() {
        const resultsContainer = document.getElementById('modelSearchResults');
        const models = modelManager.getFilteredModels();
        const currentModel = config.getModel();

        if (models.length === 0) {
            resultsContainer.innerHTML = '<div class="no-models">No models match the current filters.</div>';
            return;
        }

        const modelsHTML = models.map(model => {
            const isSelected = model.id === currentModel;
            const tagsHTML = model.tags.map(tag => 
                `<span class="model-tag ${tag.class}">${tag.text}</span>`
            ).join('');

            return `
                <div class="model-item ${isSelected ? 'selected' : ''}" data-model-id="${model.id}">
                    <div class="model-info">
                        <div class="model-name">${model.name}</div>
                        <div class="model-description">${model.description}</div>
                        <div class="model-tags">${tagsHTML}</div>
                    </div>
                    <div class="model-pricing">${model.pricing}</div>
                </div>
            `;
        }).join('');

        resultsContainer.innerHTML = modelsHTML;

        // Add click listeners to model items
        resultsContainer.querySelectorAll('.model-item').forEach(item => {
            item.addEventListener('click', () => {
                this.selectModel(item.dataset.modelId);
            });
        });
    }

    selectModel(modelId) {
        // Update the model select dropdown
        const modelSelect = document.getElementById('modelSelect');
        
        // Check if the model exists in the dropdown
        const existingOption = Array.from(modelSelect.options).find(option => option.value === modelId);
        
        if (!existingOption) {
            // Add the model to the dropdown
            const model = modelManager.getModelById(modelId);
            if (model) {
                const option = document.createElement('option');
                option.value = modelId;
                option.textContent = model.name;
                modelSelect.appendChild(option);
            }
        }

        // Select the model
        modelSelect.value = modelId;
        
        // Update the visual selection in the model list
        document.querySelectorAll('.model-item').forEach(item => {
            item.classList.remove('selected');
        });
        
        const selectedItem = document.querySelector(`[data-model-id="${modelId}"]`);
        if (selectedItem) {
            selectedItem.classList.add('selected');
        }

        this.showNotification(`Selected model: ${modelManager.getModelById(modelId)?.name || modelId}`, 'info');
    }
}

// Add CSS for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Initialize UI when script loads
const uiManager = new UIManager();

// Export for potential external use
export { UIManager };
