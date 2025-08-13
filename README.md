# AI Tool-Calling Agent

A browser-based AI agent built with vanilla JavaScript that uses OpenRouter for LLM access and includes tool-calling capabilities like DuckDuckGo search and calculator functions.

## Features

- 🤖 **AI Chat Interface**: Clean, modern chat UI for interacting with the AI agent
- 🔧 **Tool Calling**: Built-in tools including:
  - DuckDuckGo web search
  - Calculator for mathematical operations
- ⚙️ **Settings Panel**: Configure OpenRouter API key and select different models
- 🔍 **Model Search**: Browse and filter available OpenRouter models with:
  - Free models filter
  - Tool calling support filter
  - Real-time model information and pricing
- 💾 **Persistent Storage**: Chat history and settings saved in localStorage
- 📱 **Responsive Design**: Works on desktop and mobile devices
- 🌐 **CDN-Only**: No npm dependencies, uses only CDN libraries

## Setup

1. **Get an OpenRouter API Key**:
   - Visit [OpenRouter](https://openrouter.ai/keys)
   - Create an account and generate an API key

2. **Open the Application**:
   - Open `index.html` in your web browser
   - Click the settings gear icon (⚙️) in the top right
   - Enter your OpenRouter API key
   - Select your preferred model (GPT-4o Mini is recommended for cost-effectiveness)
   - Click "Save Settings"

3. **Start Chatting**:
   - Type your message in the input field
   - The AI can search the web, perform calculations, and answer questions
   - Tool executions are shown with visual indicators

## Project Structure

```
/
├── index.html          # Main HTML file with chat interface
├── css/
│   └── style.css      # Styling for the application
├── js/
│   ├── config.js      # Configuration and localStorage management
│   ├── tools.js       # Tool definitions (search, calculator)
│   ├── models.js      # Model search and management for OpenRouter
│   ├── agent.js       # AI agent with OpenRouter integration
│   └── ui.js          # UI management and event handling
└── README.md          # This file
```

## Available Models

The application supports various models through OpenRouter:

- **GPT-4o Mini** (Recommended) - Fast and cost-effective
- **GPT-4o** - Most capable OpenAI model
- **Claude 3.5 Sonnet** - Anthropic's latest model
- **Llama 3.1 8B** - Open-source alternative

## Tools

### DuckDuckGo Search
- Searches the web for current information
- Returns summaries, sources, and related topics
- Useful for news, facts, and general knowledge

### Calculator
- Performs basic mathematical operations
- Supports arithmetic: +, -, *, /
- Handles parentheses and decimal numbers

## Technical Details

- **No Build Process**: Pure HTML, CSS, and JavaScript
- **ES6 Modules**: Modern JavaScript module system
- **OpenRouter API**: Direct integration with OpenRouter's chat completions endpoint
- **Tool Calling**: Implements OpenAI-compatible function calling
- **CORS Proxy**: Uses allorigins.win for DuckDuckGo API access
- **Local Storage**: Persistent settings and chat history

## Usage Examples

1. **Web Search**: "What's the latest news about AI?"
2. **Calculations**: "Calculate 15% tip on $45.67"
3. **General Questions**: "Explain quantum computing"
4. **Mixed Queries**: "Search for the current price of Bitcoin and calculate 10% of that amount"

## Browser Compatibility

- Modern browsers with ES6 module support
- Chrome 61+, Firefox 60+, Safari 10.1+, Edge 16+

## Security Notes

- API keys are stored in browser localStorage
- Mathematical expressions are sanitized before evaluation
- CORS proxy is used for external API calls

## Troubleshooting

1. **"API key not configured"**: Enter your OpenRouter API key in settings
2. **Search not working**: Check internet connection and CORS proxy availability
3. **Calculator errors**: Ensure mathematical expressions use valid syntax
4. **Model errors**: Try switching to a different model in settings

## License

This project is open source and available under the MIT License.
