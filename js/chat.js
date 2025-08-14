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
    const [expandedToolMessages, setExpandedToolMessages] = useState(new Set());
    const [showToolsManagement, setShowToolsManagement] = useState(false);
    const [forceUpdate, setForceUpdate] = useState(0);

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

    const toggleToolMessage = (messageIndex) => {
        const newExpanded = new Set(expandedToolMessages);
        if (newExpanded.has(messageIndex)) {
            newExpanded.delete(messageIndex);
        } else {
            newExpanded.add(messageIndex);
        }
        setExpandedToolMessages(newExpanded);
    };

    const toggleTool = (toolName) => {
        const wasActivated = toolRegistry.toggleTool(toolName);
        // Force re-render by incrementing the counter
        setForceUpdate(prev => prev + 1);
    };

    return html`
        <div class="chat-container">
            <div class="chat-history">
                
                ${chatHistory.map((message, index) => {
                    if (message.role === 'user' || message.role === 'assistant') {
                        const isExpanded = expandedToolMessages.has(index);
                        return html`
                            <div key=${index} class="message ${message.role}">
                                ${message.toolExecutions && message.toolExecutions.length > 0 && html`
                                    <div class="tool-execution-summary clickable" onClick=${() => toggleToolMessage(index)}>
                                        🔧 Used ${message.toolExecutions.length} tool${message.toolExecutions.length > 1 ? 's' : ''}: ${message.toolExecutions.map(exec => exec.tool).join(', ')}
                                        <span class="expand-icon">${isExpanded ? '▼' : '▶'}</span>
                                    </div>
                                    ${isExpanded && html`
                                        <div class="tool-execution-details">
                                            ${message.toolExecutions.map((execution, execIndex) => html`
                                                <div key=${execIndex} class="tool-execution-item">
                                                    <div class="tool-execution-header">
                                                        <span class="tool-name">${execution.tool}</span>
                                                        <span class="tool-status ${execution.result.success ? 'success' : 'error'}">
                                                            ${execution.result.success ? '✅' : '❌'}
                                                        </span>
                                                    </div>
                                                    <div class="tool-execution-args">
                                                        <strong>Input:</strong> ${JSON.stringify(execution.args, null, 2)}
                                                    </div>
                                                    <div class="tool-execution-result">
                                                        <strong>Result:</strong> ${execution.result.result || execution.result.error || 'No result'}
                                                    </div>
                                                    ${execution.result.error && html`
                                                        <div class="tool-execution-error">
                                                            <strong>Error:</strong> ${execution.result.error}
                                                        </div>
                                                    `}
                                                </div>
                                            `)}
                                        </div>
                                    `}
                                `}
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
                <div class="input-section">
                    <textarea 
                        id="messageInput"
                        placeholder=${isConfigured ? 'Ask me anything...' : 'Configure your API key in settings first'}
                        disabled=${!isConfigured}
                        value=${currentMessage}
                        onInput=${(e) => setCurrentMessage(e.target.value)}
                        onKeyPress=${handleKeyPress}
                        rows="3"
                    ></textarea>
                    <button 
                        id="sendBtn"
                        disabled=${!isConfigured || !agent.isReady() || !currentMessage.trim()}
                        onClick=${handleSendMessage}
                    >
                        Send
                    </button>
                </div>
                
                ${isConfigured && html`
                    <div class="tools-section">
                        <div class="active-tools-list">
                            <span>🔧 Active Tools:</span>
                            ${toolRegistry.getActivated().length > 0 
                                ? toolRegistry.getActivated().map(tool => html`
                                    <span key=${tool.name} class="active-tool-badge">
                                        ${tool.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                        <button class="remove-tool-btn" onClick=${(e) => {
                                            e.stopPropagation();
                                            toggleTool(tool.name);
                                        }}>×</button>
                                    </span>
                                  `)
                                : html`<span class="no-tools-message">No tools activated. Click "Manage Tools" to add tools.</span>`
                            }
                            <button class="manage-tools-toggle-btn" onClick=${() => setShowToolsManagement(!showToolsManagement)}>
                                ${showToolsManagement ? 'Hide Tools' : 'Manage Tools'}
                            </button>
                        </div>
                        ${showToolsManagement && html`
                            <div class="tools-management-section">
                                <div class="available-tools">
                                    <h4>Available Tools:</h4>
                                    <div class="tools-grid">
                                        ${toolRegistry.getAll().map(tool => html`
                                            <div key=${tool.name} class="tool-toggle-item">
                                                <label class="tool-toggle-checkbox">
                                                    <input 
                                                        type="checkbox" 
                                                        checked=${toolRegistry.isToolActivated(tool.name)}
                                                        onChange=${() => toggleTool(tool.name)}
                                                    />
                                                    <span class="tool-toggle-name">${tool.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                                                    ${tool.isCustom && html`<span class="custom-badge-small">Custom</span>`}
                                                </label>
                                                <div class="tool-toggle-description">${tool.description}</div>
                                            </div>
                                        `)}
                                    </div>
                                </div>
                            </div>
                        `}
                    </div>
                `}
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
