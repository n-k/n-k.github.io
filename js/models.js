// Model search and management for OpenRouter
import { config } from './config.js';

export class ModelManager {
    constructor() {
        this.models = [];
        this.filteredModels = [];
        this.isLoading = false;
    }

    async fetchModels() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        
        try {
            const response = await fetch('https://openrouter.ai/api/v1/models', {
                headers: {
                    'Authorization': `Bearer ${config.getApiKey()}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch models: ${response.status}`);
            }

            const data = await response.json();
            this.models = data.data || [];
            this.filteredModels = [...this.models];
            return this.models;
        } catch (error) {
            console.error('Error fetching models:', error);
            throw error;
        } finally {
            this.isLoading = false;
        }
    }

    filterModels(options = {}) {
        const { freeOnly = false, toolCallingOnly = false } = options;
        
        this.filteredModels = this.models.filter(model => {
            // Filter for free models
            if (freeOnly) {
                const isFree = this.isModelFree(model);
                if (!isFree) return false;
            }

            // Filter for tool calling support
            if (toolCallingOnly) {
                const supportsToolCalling = this.supportsToolCalling(model);
                if (!supportsToolCalling) return false;
            }

            return true;
        });

        return this.filteredModels;
    }

    isModelFree(model) {
        // Check if model is free based on pricing
        if (model.pricing) {
            const promptPrice = parseFloat(model.pricing.prompt) || 0;
            const completionPrice = parseFloat(model.pricing.completion) || 0;
            return promptPrice === 0 && completionPrice === 0;
        }
        return false;
    }

    supportsToolCalling(model) {
        // Check if model supports tool calling
        return model.supported_parameters.includes('tools');
    }

    formatModelForDisplay(model) {
        const tags = [];
        
        // Add pricing tag
        if (this.isModelFree(model)) {
            tags.push({ text: 'Free', class: 'free' });
        } else {
            tags.push({ text: 'Paid', class: 'paid' });
        }

        // Add tool calling tag
        if (this.supportsToolCalling(model)) {
            tags.push({ text: 'Tool Calling', class: 'tool-calling' });
        }

        // Add context length tag
        if (model.context_length) {
            const contextK = Math.floor(model.context_length / 1000);
            tags.push({ text: `${contextK}K context`, class: 'context' });
        }

        // Format pricing
        let pricing = 'Free';
        if (model.pricing && !this.isModelFree(model)) {
            const promptPrice = parseFloat(model.pricing.prompt) || 0;
            const completionPrice = parseFloat(model.pricing.completion) || 0;
            
            if (promptPrice > 0 || completionPrice > 0) {
                // Convert to more readable format (per 1M tokens)
                const promptPer1M = (promptPrice * 1000000).toFixed(2);
                const completionPer1M = (completionPrice * 1000000).toFixed(2);
                pricing = `$${promptPer1M}/$${completionPer1M}`;
            }
        }

        return {
            id: model.id,
            name: model.name || model.id,
            description: model.description || 'No description available',
            tags: tags,
            pricing: pricing,
            contextLength: model.context_length,
            raw: model
        };
    }

    getFilteredModels() {
        return this.filteredModels.map(model => this.formatModelForDisplay(model));
    }

    getAllModels() {
        return this.models.map(model => this.formatModelForDisplay(model));
    }

    searchModels(query) {
        if (!query || query.trim() === '') {
            return this.getFilteredModels();
        }

        const searchTerm = query.toLowerCase();
        const filtered = this.filteredModels.filter(model => {
            return model.id.toLowerCase().includes(searchTerm) ||
                   (model.name && model.name.toLowerCase().includes(searchTerm)) ||
                   (model.description && model.description.toLowerCase().includes(searchTerm));
        });

        return filtered.map(model => this.formatModelForDisplay(model));
    }

    getModelById(modelId) {
        const model = this.models.find(m => m.id === modelId);
        return model ? this.formatModelForDisplay(model) : null;
    }
}

// Create and export a singleton instance
export const modelManager = new ModelManager();
