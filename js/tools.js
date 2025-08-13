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
        this.registerDefaultTools();
    }

    registerDefaultTools() {
        this.register(new DuckDuckGoSearchTool());
        this.register(new CalculatorTool());
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

    getToolDefinitions() {
        return this.getAll().map(tool => ({
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
        return await tool.execute(args);
    }
}

// Create and export a singleton instance
export const toolRegistry = new ToolRegistry();
