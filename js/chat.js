import { h } from 'https://esm.sh/preact';
import { useState, useEffect } from 'https://esm.sh/preact/hooks';
import htm from 'https://esm.sh/htm';
import { config } from './config.js';
import { agent } from './agent.js';
import { toolRegistry } from './tools.js';

const html = htm.bind(h);

export function Chat({ isConfigured, chatHistory, onHistoryUpdate }) {
    const [currentMessage, setCurrentMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Auto-scroll to bottom when chat history changes
    useEffect(() => {
        const chatHistoryElement = document.querySelector('.chat-history');
        if (chatHistoryElement) {
            chatHistoryElement.scrollTop = chatHistoryElement.scrollHeight;
        }
    }, [chatHistory]);

    const handleSendMessage = async () => {
        if (!currentMessage.trim() || !agent.isReady()) return;

        const message = currentMessage.trim();
        setCurrentMessage('');

        // Add user message to chat
        const userMessage = { role: 'user', content: message };
        const newHistory = [...chatHistory, userMessage];
        onHistoryUpdate(newHistory);
        config.addMessage(userMessage);

        setIsLoading(true);

        try {
            const response = await agent.sendMessage(message);
            
            // Add assistant response to chat
            const assistantMessage = { 
                role: 'assistant', 
                content: response.content,
                toolExecutions: response.toolExecutions 
            };
            
            const updatedHistory = [...newHistory, assistantMessage];
            onHistoryUpdate(updatedHistory);
            config.addMessage(assistantMessage);

        } catch (error) {
            console.error('Send message error:', error);
            const errorMessage = { 
                role: 'assistant', 
                content: `Sorry, I encountered an error: ${error.message}` 
            };
            const updatedHistory = [...newHistory, errorMessage];
            onHistoryUpdate(updatedHistory);
            config.addMessage(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const formatMessage = (content) => {
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>')
            .replace(/`(.*?)`/g, '<code>$1</code>');
    };

    return html`
        <div class="chat-container">
            <div class="chat-history">
                <div class="message system-message">
                    <div class="message-content">
                        ${isConfigured 
                            ? "Welcome! I'm an AI agent with access to tools like DuckDuckGo search. Ask me anything!"
                            : "Welcome! Please configure your OpenRouter API key in settings to get started."
                        }
                    </div>
                </div>
                
                ${isConfigured && html`
                    <div class="active-tools-indicator">
                        <div class="active-tools-header">🔧 Active Tools:</div>
                        <div class="active-tools-list">
                            ${toolRegistry.getActivated().length > 0 
                                ? toolRegistry.getActivated().map(tool => html`
                                    <span key=${tool.name} class="active-tool-badge">
                                        ${tool.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                    </span>
                                  `)
                                : html`<span class="no-tools-message">No tools activated. Enable tools in settings.</span>`
                            }
                        </div>
                    </div>
                `}
                
                ${chatHistory.map((message, index) => {
                    if (message.role === 'user' || message.role === 'assistant') {
                        return html`
                            <div key=${index} class="message ${message.role}">
                                ${message.toolExecutions && message.toolExecutions.map((execution, execIndex) => html`
                                    <div key=${execIndex} class="tool-execution">
                                        🔧 <strong>${execution.tool}</strong>: ${execution.result.success ? '✅' : '❌'} ${execution.args.query || execution.args.expression || 'Executed'}
                                    </div>
                                `)}
                                <div 
                                    class="message-content"
                                    dangerouslySetInnerHTML=${{ __html: formatMessage(message.content) }}
                                ></div>
                            </div>
                        `;
                    }
                    return null;
                })}
            </div>
            
            <div class="input-container">
                <input 
                    id="messageInput"
                    type="text" 
                    placeholder=${isConfigured ? 'Ask me anything...' : 'Configure your API key in settings first'}
                    disabled=${!isConfigured}
                    value=${currentMessage}
                    onInput=${(e) => setCurrentMessage(e.target.value)}
                    onKeyPress=${handleKeyPress}
                />
                <button 
                    id="sendBtn"
                    disabled=${!isConfigured || !agent.isReady() || !currentMessage.trim()}
                    onClick=${handleSendMessage}
                >
                    Send
                </button>
            </div>
        </div>

        ${isLoading && html`
            <div class="loading-indicator" style="display: flex;">
                <div class="spinner"></div>
                <span>AI is thinking...</span>
            </div>
        `}
    `;
}
