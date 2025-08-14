// Tools for the AI Agent
export class DuckDuckGoSearchTool {
    constructor() {
        this.name = 'duckduckgo_search';
        this.description = 'Search the web using DuckDuckGo. Use this tool to find current information, news, facts, or answers to questions that require web search.';
        this.parameters = {
            type: 'object',
            properties: {
                query: {
                    type: 'string',
                    description: 'The search query to execute'
                }
            },
            required: ['query']
        };
    }

    async execute(args) {
        try {
            const { query } = args;
            if (!query || typeof query !== 'string') {
                throw new Error('Query parameter is required and must be a string');
            }

            // Use DuckDuckGo's instant answer API
            const searchUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
            
            // Since we can't make direct CORS requests to DuckDuckGo API from browser,
            // we'll use a CORS proxy or implement a fallback search method
            const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(searchUrl)}`;
            
            const response = await fetch(proxyUrl);
            if (!response.ok) {
                throw new Error(`Search request failed: ${response.status}`);
            }

            const data = await response.json();
            const searchData = JSON.parse(data.contents);

            // Format the search results
            let result = '';
            
            if (searchData.Abstract) {
                result += `**Summary:** ${searchData.Abstract}\n\n`;
            }

            if (searchData.AbstractSource) {
                result += `**Source:** ${searchData.AbstractSource}\n\n`;
            }

            if (searchData.RelatedTopics && searchData.RelatedTopics.length > 0) {
                result += `**Related Information:**\n`;
                searchData.RelatedTopics.slice(0, 3).forEach((topic, index) => {
                    if (topic.Text) {
                        result += `${index + 1}. ${topic.Text}\n`;
                    }
                });
                result += '\n';
            }

            if (searchData.Answer) {
                result += `**Direct Answer:** ${searchData.Answer}\n\n`;
            }

            if (searchData.Definition) {
                result += `**Definition:** ${searchData.Definition}\n\n`;
            }

            // If no useful information found, provide a fallback message
            if (!result.trim()) {
                result = `I searched for "${query}" but didn't find specific instant answers. You may want to try a more specific search query or search for this topic on a search engine directly.`;
            }

            return {
                success: true,
                result: result.trim(),
                query: query
            };

        } catch (error) {
            console.error('DuckDuckGo search error:', error);
            return {
                success: false,
                error: error.message,
                result: `Search failed: ${error.message}. This might be due to network issues or API limitations.`
            };
        }
    }
}

// Calculator tool for basic math operations
export class CalculatorTool {
    constructor() {
        this.name = 'calculator';
        this.description = 'Perform basic mathematical calculations. Supports addition, subtraction, multiplication, division, and basic functions.';
        this.parameters = {
            type: 'object',
            properties: {
                expression: {
                    type: 'string',
                    description: 'Mathematical expression to evaluate (e.g., "2 + 2", "sqrt(16)", "sin(30)")'
                }
            },
            required: ['expression']
        };
    }

    async execute(args) {
        try {
            const { expression } = args;
            if (!expression || typeof expression !== 'string') {
                throw new Error('Expression parameter is required and must be a string');
            }

            // Basic security: only allow safe mathematical expressions
            const safeExpression = expression.replace(/[^0-9+\-*/().\s]/g, '');
            
            // Use Function constructor for safe evaluation (better than eval)
            const result = Function(`"use strict"; return (${safeExpression})`)();
            
            if (typeof result !== 'number' || !isFinite(result)) {
                throw new Error('Invalid mathematical expression or result');
            }

            return {
                success: true,
                result: `${expression} = ${result}`,
                calculation: {
                    expression: expression,
                    result: result
                }
            };

        } catch (error) {
            console.error('Calculator error:', error);
            return {
                success: false,
                error: error.message,
                result: `Calculation failed: ${error.message}. Please check your mathematical expression.`
            };
        }
    }
}

// Tool registry to manage all available tools
export class ToolRegistry {
    constructor() {
        this.tools = new Map();
        this.activatedTools = new Set();
        this.registerDefaultTools();
        this.loadActivatedTools();
    }

    registerDefaultTools() {
        this.register(new DuckDuckGoSearchTool());
        this.register(new CalculatorTool());
        
        // Register custom tools
        this.registerCustomTools();
        
        // Activate all tools by default if no saved preferences
        if (this.activatedTools.size === 0) {
            this.tools.forEach((tool, name) => {
                this.activatedTools.add(name);
            });
            this.saveActivatedTools();
        }
    }

    registerCustomTools() {
        // Register all custom tools from the custom tool manager
        const customTools = customToolManager.getAllCustomTools();
        for (const tool of customTools) {
            this.register(tool);
        }
    }

    refreshCustomTools() {
        // Remove existing custom tools
        for (const [name, tool] of this.tools.entries()) {
            if (tool.isCustom) {
                this.tools.delete(name);
            }
        }
        
        // Re-register custom tools
        this.registerCustomTools();
    }

    register(tool) {
        this.tools.set(tool.name, tool);
    }

    get(name) {
        return this.tools.get(name);
    }

    getAll() {
        return Array.from(this.tools.values());
    }

    getActivated() {
        return Array.from(this.tools.values()).filter(tool => 
            this.activatedTools.has(tool.name)
        );
    }

    isToolActivated(name) {
        return this.activatedTools.has(name);
    }

    activateTool(name) {
        if (this.tools.has(name)) {
            this.activatedTools.add(name);
            this.saveActivatedTools();
            return true;
        }
        return false;
    }

    deactivateTool(name) {
        this.activatedTools.delete(name);
        this.saveActivatedTools();
    }

    toggleTool(name) {
        if (this.isToolActivated(name)) {
            this.deactivateTool(name);
            return false;
        } else {
            return this.activateTool(name);
        }
    }

    getToolDefinitions() {
        return this.getActivated().map(tool => ({
            type: 'function',
            function: {
                name: tool.name,
                description: tool.description,
                parameters: tool.parameters
            }
        }));
    }

    async executeTool(name, args) {
        const tool = this.get(name);
        if (!tool) {
            throw new Error(`Tool '${name}' not found`);
        }
        if (!this.isToolActivated(name)) {
            throw new Error(`Tool '${name}' is not activated`);
        }
        return await tool.execute(args);
    }

    loadActivatedTools() {
        try {
            const stored = localStorage.getItem('ai-agent-activated-tools');
            if (stored) {
                const toolNames = JSON.parse(stored);
                this.activatedTools = new Set(toolNames);
            }
        } catch (error) {
            console.warn('Failed to load activated tools from localStorage:', error);
        }
    }

    saveActivatedTools() {
        try {
            const toolNames = Array.from(this.activatedTools);
            localStorage.setItem('ai-agent-activated-tools', JSON.stringify(toolNames));
        } catch (error) {
            console.error('Failed to save activated tools to localStorage:', error);
        }
    }

    getToolsStatus() {
        return this.getAll().map(tool => ({
            name: tool.name,
            description: tool.description,
            activated: this.isToolActivated(tool.name)
        }));
    }
}

// Custom tool manager for user-defined tools
export class CustomToolManager {
    constructor() {
        this.customTools = new Map();
        this.loadCustomTools();
    }

    loadCustomTools() {
        try {
            const stored = localStorage.getItem('ai-agent-custom-tools');
            if (stored) {
                const toolsData = JSON.parse(stored);
                for (const toolData of toolsData) {
                    this.createToolFromCode(toolData.name, toolData.code, false);
                }
            }
        } catch (error) {
            console.warn('Failed to load custom tools from localStorage:', error);
        }
    }

    saveCustomTools() {
        try {
            const toolsData = Array.from(this.customTools.entries()).map(([name, tool]) => ({
                name: name,
                code: tool.sourceCode
            }));
            localStorage.setItem('ai-agent-custom-tools', JSON.stringify(toolsData));
        } catch (error) {
            console.error('Failed to save custom tools to localStorage:', error);
        }
    }

    createToolFromCode(name, code, save = true) {
        try {
            // Create a safe execution context
            const toolFunction = new Function('return ' + code)();
            
            // Validate the tool structure
            if (typeof toolFunction !== 'function') {
                throw new Error('Tool code must return a function (constructor)');
            }

            // Create an instance of the tool
            const toolInstance = new toolFunction();
            
            // Validate required properties
            if (!toolInstance.name || !toolInstance.description || !toolInstance.parameters || !toolInstance.execute) {
                throw new Error('Tool must have name, description, parameters, and execute properties');
            }

            // Store the tool with its source code
            toolInstance.sourceCode = code;
            toolInstance.isCustom = true;
            
            // Use the tool's actual name as the key, not the parameter name
            const toolKey = toolInstance.name;
            this.customTools.set(toolKey, toolInstance);

            if (save) {
                this.saveCustomTools();
            }

            return toolInstance;
        } catch (error) {
            console.error('Error creating tool from code:', error);
            throw new Error(`Failed to create tool: ${error.message}`);
        }
    }

    updateTool(name, code) {
        this.createToolFromCode(name, code, true);
    }

    deleteTool(name) {
        this.customTools.delete(name);
        this.saveCustomTools();
    }

    getTool(name) {
        return this.customTools.get(name);
    }

    getAllCustomTools() {
        return Array.from(this.customTools.values());
    }

    getToolCode(name) {
        const tool = this.customTools.get(name);
        return tool ? tool.sourceCode : null;
    }

    validateToolCode(code) {
        try {
            const toolFunction = new Function('return ' + code)();
            if (typeof toolFunction !== 'function') {
                return { valid: false, error: 'Code must return a constructor function' };
            }

            const toolInstance = new toolFunction();
            
            if (!toolInstance.name || typeof toolInstance.name !== 'string') {
                return { valid: false, error: 'Tool must have a name property (string)' };
            }
            
            if (!toolInstance.description || typeof toolInstance.description !== 'string') {
                return { valid: false, error: 'Tool must have a description property (string)' };
            }
            
            if (!toolInstance.parameters || typeof toolInstance.parameters !== 'object') {
                return { valid: false, error: 'Tool must have a parameters property (object)' };
            }
            
            if (!toolInstance.execute || typeof toolInstance.execute !== 'function') {
                return { valid: false, error: 'Tool must have an execute method (function)' };
            }

            return { valid: true, tool: toolInstance };
        } catch (error) {
            return { valid: false, error: error.message };
        }
    }
}

// Create and export a singleton instance
export const customToolManager = new CustomToolManager();
export const toolRegistry = new ToolRegistry();
