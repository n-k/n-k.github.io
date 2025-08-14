import { h } from 'https://esm.sh/preact';
import { useState, useEffect } from 'https://esm.sh/preact/hooks';
import htm from 'https://esm.sh/htm';
import { config } from './config.js';
import { modelManager } from './models.js';
import { toolRegistry } from './tools.js';

const html = htm.bind(h);

export function Settings({ isOpen, onClose, onSave }) {
    const [apiKey, setApiKey] = useState(config.getApiKey());
    const [selectedModel, setSelectedModel] = useState(config.getModel());
    const [showModelSearch, setShowModelSearch] = useState(false);
    const [models, setModels] = useState([]);
    const [filteredModels, setFilteredModels] = useState([]);
    const [freeModelsOnly, setFreeModelsOnly] = useState(false);
    const [toolCallingOnly, setToolCallingOnly] = useState(false);
    const [isLoadingModels, setIsLoadingModels] = useState(false);

    // Apply filters when filter options change
    useEffect(() => {
        applyFilters();
    }, [freeModelsOnly, toolCallingOnly, models]);

    const applyFilters = (modelList = models) => {
        let filtered = modelList;
        
        if (freeModelsOnly) {
            filtered = filtered.filter(model => model.pricing === 'Free');
        }
        
        if (toolCallingOnly) {
            filtered = filtered.filter(model => 
                model.tags.some(tag => tag.class === 'tool-calling')
            );
        }
        
        setFilteredModels(filtered);
    };

    const loadModels = async () => {
        if (!config.isConfigured()) {
            showNotification('Please configure your OpenRouter API key first.', 'error');
            return;
        }

        setIsLoadingModels(true);
        try {
            await modelManager.fetchModels();
            const allModels = modelManager.getAllModels();
            setModels(allModels);
            applyFilters(allModels);
            showNotification('Models loaded successfully!', 'success');
        } catch (error) {
            console.error('Error loading models:', error);
            showNotification('Failed to load models', 'error');
        } finally {
            setIsLoadingModels(false);
        }
    };

    const selectModel = (modelId) => {
        setSelectedModel(modelId);
        config.setModel(modelId); // Save immediately to config
        showNotification(`Selected model: ${modelManager.getModelById(modelId)?.name || modelId}`, 'info');
    };

    const handleSave = () => {
        config.setApiKey(apiKey);
        config.setModel(selectedModel);
        onSave();
        onClose();
        showNotification('Settings saved successfully!', 'success');
    };

    const handleClearHistory = () => {
        config.clearChatHistory();
        onSave(); // Trigger parent to update chat history
        showNotification('Chat history cleared!', 'info');
    };

    const showNotification = (message, type = 'info') => {
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
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    };

    if (!isOpen) return null;

    return html`
        <div class="modal" onClick=${(e) => e.target.classList.contains('modal') && onClose()}>
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Settings</h2>
                    <span class="close" onClick=${onClose}>&times;</span>
                </div>
                <div class="modal-body">
                    <div class="setting-group">
                        <label>OpenRouter API Key:</label>
                        <input 
                            type="password" 
                            placeholder="Enter your OpenRouter API key"
                            value=${apiKey}
                            onInput=${(e) => setApiKey(e.target.value)}
                        />
                        <small>Get your API key from <a href="https://openrouter.ai/keys" target="_blank">OpenRouter</a></small>
                    </div>
                    
                    <div class="setting-group">
                        <label>Model:</label>
                        <div class="model-selection">
                            <select value=${selectedModel} onChange=${(e) => {
                                const newModel = e.target.value;
                                setSelectedModel(newModel);
                                config.setModel(newModel); // Save immediately to config
                            }}>
                                <option value="openai/gpt-4o-mini">GPT-4o Mini (Recommended)</option>
                                <option value="openai/gpt-4o">GPT-4o</option>
                                <option value="anthropic/claude-3.5-sonnet">Claude 3.5 Sonnet</option>
                                <option value="meta-llama/llama-3.1-8b-instruct">Llama 3.1 8B</option>
                            </select>
                            <button 
                                class="search-models-btn"
                                onClick=${() => {
                                    setShowModelSearch(!showModelSearch);
                                    if (!showModelSearch && models.length === 0) {
                                        loadModels();
                                    }
                                }}
                            >
                                ${showModelSearch ? 'Hide Models' : 'Search Models'}
                            </button>
                        </div>
                    </div>

                    ${showModelSearch && html`
                        <div class="setting-group">
                            <div class="model-search-header">
                                <h3>Available Models</h3>
                                <div class="model-filters">
                                    <label class="filter-checkbox">
                                        <input 
                                            type="checkbox" 
                                            checked=${freeModelsOnly}
                                            onChange=${(e) => setFreeModelsOnly(e.target.checked)}
                                        />
                                        <span>Free models only</span>
                                    </label>
                                    <label class="filter-checkbox">
                                        <input 
                                            type="checkbox" 
                                            checked=${toolCallingOnly}
                                            onChange=${(e) => setToolCallingOnly(e.target.checked)}
                                        />
                                        <span>Tool calling support</span>
                                    </label>
                                    <button class="refresh-btn" onClick=${loadModels}>Refresh</button>
                                </div>
                            </div>
                            <div class="model-search-results">
                                ${isLoadingModels ? html`
                                    <div class="loading-models">Loading models...</div>
                                ` : filteredModels.length === 0 ? html`
                                    <div class="no-models">No models match the current filters.</div>
                                ` : filteredModels.map(model => html`
                                    <div 
                                        key=${model.id}
                                        class="model-item ${selectedModel === model.id ? 'selected' : ''}"
                                        onClick=${() => selectModel(model.id)}
                                    >
                                        <div class="model-info">
                                            <div class="model-name">${model.name}</div>
                                            <div class="model-description">${model.description}</div>
                                            <div class="model-tags">
                                                ${model.tags.map(tag => html`
                                                    <span key=${tag.text} class="model-tag ${tag.class}">${tag.text}</span>
                                                `)}
                                            </div>
                                        </div>
                                        <div class="model-pricing">${model.pricing}</div>
                                    </div>
                                `)}
                            </div>
                        </div>
                    `}
                    
                    <div class="setting-group">
                        <label>Active Tools:</label>
                        <div class="tools-selection">
                            <p class="tools-description">Select which tools the AI can use:</p>
                            <div class="tools-list">
                                ${toolRegistry.getToolsStatus().map(tool => html`
                                    <div key=${tool.name} class="tool-item">
                                        <label class="tool-checkbox">
                                            <input 
                                                type="checkbox" 
                                                checked=${tool.activated}
                                                onChange=${(e) => {
                                                    const wasActivated = toolRegistry.toggleTool(tool.name);
                                                    showNotification(
                                                        `${tool.name} ${wasActivated ? 'activated' : 'deactivated'}`, 
                                                        'info'
                                                    );
                                                }}
                                            />
                                            <span class="tool-name">${tool.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                                        </label>
                                        <div class="tool-description">${tool.description}</div>
                                    </div>
                                `)}
                            </div>
                        </div>
                    </div>
                    
                    <div class="setting-group">
                        <button class="save-btn" onClick=${handleSave}>Save Settings</button>
                        <button class="clear-btn" onClick=${handleClearHistory}>Clear Chat History</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}
