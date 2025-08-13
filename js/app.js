import { h, render } from 'https://esm.sh/preact';
import { useState } from 'https://esm.sh/preact/hooks';
import htm from 'https://esm.sh/htm';

// Import components
import { Chat } from './chat.js';
import { Settings } from './settings.js';

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

    // Update configuration state when settings change
    const handleSettingsUpdate = () => {
        setIsConfigured(config.isConfigured());
        setChatHistory(config.getChatHistory());
        
        // Clear agent history if chat history was cleared
        if (config.getChatHistory().length === 0) {
            agent.clearHistory();
        }
    };

    return html`
        <div class="container">
            <header>
                <h1>🤖 AI Agent with Tools</h1>
                <button 
                    class="settings-btn" 
                    title="Settings"
                    onClick=${() => setShowSettings(true)}
                >
                    ⚙️
                </button>
            </header>

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
