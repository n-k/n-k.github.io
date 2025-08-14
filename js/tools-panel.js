import { h } from 'https://esm.sh/preact';
import { useState, useEffect } from 'https://esm.sh/preact/hooks';
import htm from 'https://esm.sh/htm';
import { toolRegistry, customToolManager } from './tools.js';

const html = htm.bind(h);

export function ToolsPanel({ isOpen, onClose }) {
    // Custom tool management state
    const [editingTool, setEditingTool] = useState(null);
    const [toolCode, setToolCode] = useState('');
    const [toolName, setToolName] = useState('');
    const [validationError, setValidationError] = useState('');
    const [activeTab, setActiveTab] = useState('active'); // 'active' or 'custom'

    // Force re-render when tools change
    const [, forceUpdate] = useState({});
    const refreshPanel = () => forceUpdate({});

    // Custom tool management functions
    const startNewTool = () => {
        setEditingTool(null);
        setToolName('');
        setToolCode(`function() {
    this.name = 'my_custom_tool';
    this.description = 'Description of what this tool does';
    this.parameters = {
        type: 'object',
        properties: {
            input: {
                type: 'string',
                description: 'Input parameter description'
            }
        },
        required: ['input']
    };

    this.execute = async function(args) {
        try {
            const { input } = args;
            
            // Your tool logic here
            const result = \`Processed: \${input}\`;
            
            return {
                success: true,
                result: result
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                result: \`Error: \${error.message}\`
            };
        }
    };
}`);
        setValidationError('');
        setActiveTab('custom');
    };

    const editTool = (toolName) => {
        const code = customToolManager.getToolCode(toolName);
        if (!code) {
            showNotification(`Could not find code for tool '${toolName}'`, 'error');
            return;
        }
        setEditingTool(toolName);
        setToolName(toolName);
        setToolCode(code);
        setValidationError('');
        setActiveTab('custom');
    };

    const saveTool = () => {
        const validation = customToolManager.validateToolCode(toolCode);
        if (!validation.valid) {
            setValidationError(validation.error);
            return;
        }

        try {
            // Get the actual tool name from the validated code
            const actualToolName = validation.tool.name;
            
            if (editingTool && editingTool !== actualToolName) {
                // Tool name changed, delete old one
                customToolManager.deleteTool(editingTool);
                toolRegistry.refreshCustomTools();
            }

            customToolManager.createToolFromCode(actualToolName, toolCode);
            toolRegistry.refreshCustomTools();
            
            showNotification(`Tool '${actualToolName}' saved successfully!`, 'success');
            setEditingTool(null);
            setToolName('');
            setToolCode('');
            setValidationError('');
            refreshPanel();
        } catch (error) {
            setValidationError(error.message);
        }
    };

    const deleteTool = (toolName) => {
        if (confirm(`Are you sure you want to delete the tool '${toolName}'?`)) {
            customToolManager.deleteTool(toolName);
            toolRegistry.refreshCustomTools();
            showNotification(`Tool '${toolName}' deleted successfully!`, 'info');
            
            if (editingTool === toolName) {
                setEditingTool(null);
                setToolName('');
                setToolCode('');
                setValidationError('');
            }
            refreshPanel();
        }
    };

    const cancelEdit = () => {
        setEditingTool(null);
        setToolName('');
        setToolCode('');
        setValidationError('');
    };

    const toggleTool = (toolName) => {
        const wasActivated = toolRegistry.toggleTool(toolName);
        showNotification(
            `${toolName} ${wasActivated ? 'activated' : 'deactivated'}`, 
            'info'
        );
        refreshPanel();
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
        <div class="tools-panel ${isOpen ? 'open' : ''}">
            <div class="tools-panel-header">
                <h2>🔧 Tools Manager</h2>
                <button class="close-panel-btn" onClick=${onClose}>×</button>
            </div>
            
            <div class="tools-panel-tabs">
                <button 
                    class="tab-btn ${activeTab === 'active' ? 'active' : ''}"
                    onClick=${() => setActiveTab('active')}
                >
                    Active Tools
                </button>
                <button 
                    class="tab-btn ${activeTab === 'custom' ? 'active' : ''}"
                    onClick=${() => setActiveTab('custom')}
                >
                    Custom Tools
                </button>
            </div>

            <div class="tools-panel-content">
                ${activeTab === 'active' && html`
                    <div class="active-tools-tab">
                        <div class="tools-description">
                            <p>Toggle tools on/off to control which ones the AI can use:</p>
                        </div>
                        <div class="tools-list">
                            ${toolRegistry.getToolsStatus().map(tool => html`
                                <div key=${tool.name} class="tool-item">
                                    <label class="tool-checkbox">
                                        <input 
                                            type="checkbox" 
                                            checked=${tool.activated}
                                            onChange=${() => toggleTool(tool.name)}
                                        />
                                        <span class="tool-name">${tool.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                                        ${toolRegistry.get(tool.name)?.isCustom && html`
                                            <span class="custom-badge">Custom</span>
                                        `}
                                    </label>
                                    <div class="tool-description">${tool.description}</div>
                                    ${toolRegistry.get(tool.name)?.isCustom && html`
                                        <div class="tool-actions">
                                            <button class="edit-tool-btn" onClick=${() => editTool(tool.name)}>Edit</button>
                                            <button class="delete-tool-btn" onClick=${() => deleteTool(tool.name)}>Delete</button>
                                        </div>
                                    `}
                                </div>
                            `)}
                        </div>
                    </div>
                `}

                ${activeTab === 'custom' && html`
                    <div class="custom-tools-tab">
                        <div class="custom-tools-header">
                            <h3>Custom Tools</h3>
                            <button class="new-tool-btn" onClick=${startNewTool}>+ New Tool</button>
                        </div>
                        
                        ${(editingTool !== null || toolCode) && html`
                            <div class="tool-editor">
                                <div class="editor-header">
                                    <h4>${editingTool ? 'Edit Tool' : 'Create New Tool'}</h4>
                                    <button class="cancel-btn" onClick=${cancelEdit}>×</button>
                                </div>
                                
                                <div class="editor-field">
                                    <label>Tool Name:</label>
                                    <input 
                                        type="text" 
                                        value=${toolName}
                                        onInput=${(e) => setToolName(e.target.value)}
                                        placeholder="my_custom_tool"
                                    />
                                </div>
                                
                                <div class="editor-field">
                                    <label>JavaScript Code:</label>
                                    <textarea 
                                        class="code-editor"
                                        value=${toolCode}
                                        onInput=${(e) => setToolCode(e.target.value)}
                                        placeholder="Enter your tool code here..."
                                        rows="15"
                                    ></textarea>
                                </div>
                                
                                ${validationError && html`
                                    <div class="validation-error">${validationError}</div>
                                `}
                                
                                <div class="editor-actions">
                                    <button class="save-tool-btn" onClick=${saveTool}>Save Tool</button>
                                    <button class="cancel-edit-btn" onClick=${cancelEdit}>Cancel</button>
                                </div>
                            </div>
                        `}
                        
                        <div class="custom-tools-list">
                            <h4>Your Custom Tools:</h4>
                            ${customToolManager.getAllCustomTools().length === 0 ? html`
                                <div class="no-custom-tools">
                                    <p>No custom tools created yet.</p>
                                    <p>Click "New Tool" to create your first custom tool!</p>
                                </div>
                            ` : customToolManager.getAllCustomTools().map(tool => html`
                                <div key=${tool.name} class="custom-tool-item">
                                    <div class="custom-tool-info">
                                        <div class="custom-tool-name">${tool.name}</div>
                                        <div class="custom-tool-description">${tool.description}</div>
                                    </div>
                                    <div class="custom-tool-actions">
                                        <button class="edit-tool-btn" onClick=${() => editTool(tool.name)}>Edit</button>
                                        <button class="delete-tool-btn" onClick=${() => deleteTool(tool.name)}>Delete</button>
                                    </div>
                                </div>
                            `)}
                        </div>
                        
                        <div class="custom-tools-help">
                            <h4>How to create a custom tool:</h4>
                            <ul>
                                <li>Write a constructor function that defines the tool properties</li>
                                <li>Set <code>name</code>, <code>description</code>, and <code>parameters</code> properties</li>
                                <li>Implement an <code>execute</code> async function that processes the input</li>
                                <li>Return an object with <code>success</code> and <code>result</code> properties</li>
                            </ul>
                        </div>
                    </div>
                `}
            </div>
        </div>
    `;
}
