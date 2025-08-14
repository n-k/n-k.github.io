import { h, render } from 'https://esm.sh/preact';
import { useState } from 'https://esm.sh/preact/hooks';
import htm from 'https://esm.sh/htm';

// Import components
import { Chat } from './chat.js';
import { Settings } from './settings.js';
import { ToolsPanel } from './tools-panel.js';

// Import services
import { config } from './config.js';
import { agent } from './agent.js';

// Create the html template function
const html = htm.bind(h);

// Main App Component
function App() {
    const [isConfigured, setIsConfigured] = useState(config.isConfigured());
    const [chatHistory, setChatHistory] = useState(config.getChatHistory());
    const [showSettings, setShowSettings] = useState(false);
    const [showToolsPanel, setShowToolsPanel] = useState(false);

    // Update configuration state when settings change
    const handleSettingsUpdate = () => {
        setIsConfigured(config.isConfigured());
        setChatHistory(config.getChatHistory());
        
        // Clear agent history if chat history was cleared
        if (config.getChatHistory().length === 0) {
            agent.clearHistory();
        }
    };

    const handleClearHistory = () => {
        if (confirm('Are you sure you want to clear the chat history?')) {
            config.clearChatHistory();
            setChatHistory([]);
            agent.clearHistory();
        }
    };

    return html`
        <div class="container">
            <div class="header-buttons">
                <button 
                    class="tools-btn" 
                    title="Tools Manager"
                    onClick=${() => setShowToolsPanel(true)}
                >
                    🔧
                </button>
                <button 
                    class="settings-btn" 
                    title="Settings"
                    onClick=${() => setShowSettings(true)}
                >
                    ⚙️
                </button>
                <button 
                    class="clear-history-btn" 
                    title="Clear Chat History"
                    onClick=${handleClearHistory}
                >
                    🗑️
                </button>
            </div>

            <${Chat} 
                isConfigured=${isConfigured}
                chatHistory=${chatHistory}
                onHistoryUpdate=${setChatHistory}
            />

            <${Settings}
                isOpen=${showSettings}
                onClose=${() => setShowSettings(false)}
                onSave=${handleSettingsUpdate}
            />

            <${ToolsPanel}
                isOpen=${showToolsPanel}
                onClose=${() => setShowToolsPanel(false)}
            />
        </div>
    `;
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

// Render the app
render(html`<${App} />`, document.getElementById('app'));
