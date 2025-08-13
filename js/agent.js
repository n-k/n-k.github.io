// AI Agent with tool calling capabilities
import { config } from './config.js';
import { toolRegistry } from './tools.js';

export class AIAgent {
    constructor() {
        this.conversationHistory = [];
        this.isProcessing = false;
    }

    async sendMessage(userMessage) {
        if (this.isProcessing) {
            throw new Error('Agent is already processing a message');
        }

        if (!config.isConfigured()) {
            throw new Error('OpenRouter API key is not configured. Please check your settings.');
        }

        this.isProcessing = true;

        try {
            // Add user message to history
            this.conversationHistory.push({
                role: 'user',
                content: userMessage
            });

            // Get available tools
            const tools = toolRegistry.getToolDefinitions();

            // Prepare the system message
            const systemMessage = {
                role: 'system',
                content: `You are a helpful AI assistant with access to tools. You can search the web using DuckDuckGo and perform calculations. 

Available tools:
${tools.map(tool => `- ${tool.function.name}: ${tool.function.description}`).join('\n')}

When you need to use a tool, respond with a function call. Always be helpful and provide clear, accurate information.`
            };

            // Prepare messages for the API
            const messages = [systemMessage, ...this.conversationHistory];

            // Make the API call to OpenRouter
            const response = await this.callOpenRouter(messages, tools);

            // Handle the response
            if (response.choices && response.choices[0]) {
                const choice = response.choices[0];
                const message = choice.message;

                // Check if the assistant wants to call a tool
                if (message.tool_calls && message.tool_calls.length > 0) {
                    return await this.handleToolCalls(message, message.tool_calls);
                } else {
                    // Regular response
                    this.conversationHistory.push(message);
                    return {
                        type: 'message',
                        content: message.content,
                        role: 'assistant'
                    };
                }
            } else {
                throw new Error('Invalid response from OpenRouter API');
            }

        } catch (error) {
            console.error('Agent error:', error);
            throw error;
        } finally {
            this.isProcessing = false;
        }
    }

    async callOpenRouter(messages, tools = null) {
        const headers = config.getOpenRouterHeaders();
        const modelConfig = config.getModelConfig();

        const requestBody = {
            ...modelConfig,
            messages: messages
        };

        // Add tools if available
        if (tools && tools.length > 0) {
            requestBody.tools = tools;
            requestBody.tool_choice = 'auto';
        }

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`OpenRouter API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
        }

        return await response.json();
    }

    async handleToolCalls(assistantMessage, toolCalls) {
        // Add the assistant's message with tool calls to history
        this.conversationHistory.push(assistantMessage);

        const toolResults = [];
        const toolExecutions = [];

        // Execute each tool call
        for (const toolCall of toolCalls) {
            try {
                const toolName = toolCall.function.name;
                const toolArgs = JSON.parse(toolCall.function.arguments);

                // Execute the tool
                const result = await toolRegistry.executeTool(toolName, toolArgs);

                toolExecutions.push({
                    tool: toolName,
                    args: toolArgs,
                    result: result
                });

                // Add tool result to conversation history
                const toolMessage = {
                    role: 'tool',
                    tool_call_id: toolCall.id,
                    content: JSON.stringify(result)
                };

                this.conversationHistory.push(toolMessage);
                toolResults.push(toolMessage);

            } catch (error) {
                console.error(`Tool execution error for ${toolCall.function.name}:`, error);
                
                const errorMessage = {
                    role: 'tool',
                    tool_call_id: toolCall.id,
                    content: JSON.stringify({
                        success: false,
                        error: error.message,
                        result: `Tool execution failed: ${error.message}`
                    })
                };

                this.conversationHistory.push(errorMessage);
                toolResults.push(errorMessage);

                toolExecutions.push({
                    tool: toolCall.function.name,
                    args: JSON.parse(toolCall.function.arguments),
                    result: {
                        success: false,
                        error: error.message
                    }
                });
            }
        }

        // Get the final response from the assistant after tool execution
        try {
            const systemMessage = {
                role: 'system',
                content: 'You are a helpful AI assistant. Based on the tool results, provide a clear and helpful response to the user.'
            };

            const messages = [systemMessage, ...this.conversationHistory];
            const finalResponse = await this.callOpenRouter(messages);

            if (finalResponse.choices && finalResponse.choices[0]) {
                const finalMessage = finalResponse.choices[0].message;
                this.conversationHistory.push(finalMessage);

                return {
                    type: 'tool_response',
                    content: finalMessage.content,
                    role: 'assistant',
                    toolExecutions: toolExecutions
                };
            } else {
                throw new Error('Invalid final response from OpenRouter API');
            }

        } catch (error) {
            console.error('Final response error:', error);
            
            // Fallback: provide a summary of tool results
            const summary = toolExecutions.map(exec => {
                if (exec.result.success) {
                    return `✅ ${exec.tool}: ${exec.result.result}`;
                } else {
                    return `❌ ${exec.tool}: ${exec.result.error}`;
                }
            }).join('\n\n');

            return {
                type: 'tool_response',
                content: `I executed the following tools:\n\n${summary}`,
                role: 'assistant',
                toolExecutions: toolExecutions
            };
        }
    }

    clearHistory() {
        this.conversationHistory = [];
    }

    getHistory() {
        return [...this.conversationHistory];
    }

    isReady() {
        return config.isConfigured() && !this.isProcessing;
    }
}

// Create and export a singleton instance
export const agent = new AIAgent();
