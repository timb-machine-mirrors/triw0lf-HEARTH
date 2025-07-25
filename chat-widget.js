// HEARTH Chat Widget - AI-powered hunt discovery assistant
// Integrates with existing HEARTH hunts-data.js

class HearthChatWidget {
  constructor() {
    this.huntsData = typeof HUNTS_DATA !== 'undefined' ? HUNTS_DATA : [];
    this.isOpen = false;
    this.messages = [];
    this.currentTypingIndicator = null;
    
    // Chat capabilities
    this.capabilities = {
      huntSearch: true,
      huntRecommendation: true,
      peakFrameworkGuidance: true,
      tacticsExploration: true
    };
    
    this.init();
  }
  
  init() {
    this.createChatWidget();
    this.setupEventListeners();
    this.addWelcomeMessage();
  }
  
  createChatWidget() {
    // Create chat toggle button
    const chatToggle = document.createElement('button');
    chatToggle.className = 'chat-toggle';
    chatToggle.innerHTML = '💬';
    chatToggle.setAttribute('aria-label', 'Open HEARTH Hunt Assistant');
    document.body.appendChild(chatToggle);
    
    // Create chat widget
    const chatWidget = document.createElement('div');
    chatWidget.className = 'chat-widget';
    chatWidget.innerHTML = `
      <div class="chat-header">
        <span>🔥 HEARTH Hunt Assistant</span>
        <button class="close-btn" aria-label="Close chat">×</button>
      </div>
      <div class="chat-messages" id="chat-messages"></div>
      <div class="chat-input-container">
        <input type="text" class="chat-input" placeholder="Ask about threat hunts..." maxlength="500">
        <button class="chat-send-btn">Send</button>
      </div>
    `;
    document.body.appendChild(chatWidget);
    
    // Store references
    this.chatToggle = chatToggle;
    this.chatWidget = chatWidget;
    this.messagesContainer = chatWidget.querySelector('.chat-messages');
    this.chatInput = chatWidget.querySelector('.chat-input');
    this.sendButton = chatWidget.querySelector('.chat-send-btn');
    this.closeButton = chatWidget.querySelector('.close-btn');
  }
  
  setupEventListeners() {
    // Toggle chat widget
    this.chatToggle.addEventListener('click', () => this.toggleChat());
    this.closeButton.addEventListener('click', () => this.closeChat());
    
    // Send message on button click or Enter key
    this.sendButton.addEventListener('click', () => this.sendMessage());
    this.chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });
    
    // Auto-resize input and enable/disable send button
    this.chatInput.addEventListener('input', () => {
      this.sendButton.disabled = this.chatInput.value.trim().length === 0;
    });
    
    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.closeChat();
      }
    });
  }
  
  toggleChat() {
    if (this.isOpen) {
      this.closeChat();
    } else {
      this.openChat();
    }
  }
  
  openChat() {
    this.isOpen = true;
    this.chatWidget.classList.add('open');
    this.chatToggle.classList.add('hidden');
    this.chatInput.focus();
    
    // Scroll to bottom
    setTimeout(() => this.scrollToBottom(), 100);
  }
  
  closeChat() {
    this.isOpen = false;
    this.chatWidget.classList.remove('open');
    this.chatToggle.classList.remove('hidden');
  }
  
  addWelcomeMessage() {
    const welcomeText = `👋 Welcome to the HEARTH Hunt Assistant! I can help you:

🔍 **Search hunts** - "Show me lateral movement hunts"
🎯 **Explore tactics** - "What hunts target persistence?"
🔥 **PEAK guidance** - "When should I use Flames vs Embers?"
📊 **Hunt stats** - "How many hunts do we have?"

What would you like to explore?`;
    
    this.addMessage('bot', welcomeText);
  }
  
  sendMessage() {
    const message = this.chatInput.value.trim();
    if (!message) return;
    
    // Add user message
    this.addMessage('user', message);
    this.chatInput.value = '';
    this.sendButton.disabled = true;
    
    // Show typing indicator
    this.showTypingIndicator();
    
    // Process message with slight delay for better UX
    setTimeout(() => {
      this.processMessage(message);
    }, 500 + Math.random() * 1000);
  }
  
  addMessage(type, content, isHtml = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${type}`;
    
    if (isHtml) {
      messageDiv.innerHTML = content;
    } else {
      messageDiv.textContent = content;
    }
    
    this.messagesContainer.appendChild(messageDiv);
    this.scrollToBottom();
    
    // Store message
    this.messages.push({ type, content, timestamp: Date.now() });
  }
  
  showTypingIndicator() {
    if (this.currentTypingIndicator) {
      this.currentTypingIndicator.remove();
    }
    
    const typingDiv = document.createElement('div');
    typingDiv.className = 'typing-indicator';
    typingDiv.innerHTML = `
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
    `;
    
    this.messagesContainer.appendChild(typingDiv);
    this.currentTypingIndicator = typingDiv;
    this.scrollToBottom();
  }
  
  hideTypingIndicator() {
    if (this.currentTypingIndicator) {
      this.currentTypingIndicator.remove();
      this.currentTypingIndicator = null;
    }
  }
  
  processMessage(message) {
    this.hideTypingIndicator();
    
    const lowerMessage = message.toLowerCase();
    
    // Intent detection and routing
    if (this.isSearchQuery(lowerMessage)) {
      this.handleHuntSearch(message);
    } else if (this.isTacticQuery(lowerMessage)) {
      this.handleTacticExploration(message);
    } else if (this.isPeakFrameworkQuery(lowerMessage)) {
      this.handlePeakFrameworkGuidance(message);
    } else if (this.isStatsQuery(lowerMessage)) {
      this.handleStatsQuery(message);
    } else if (this.isHelpQuery(lowerMessage)) {
      this.handleHelpQuery();
    } else {
      this.handleGeneralQuery(message);
    }
  }
  
  // Intent detection methods
  isSearchQuery(message) {
    const searchKeywords = ['show me', 'find', 'search', 'look for', 'hunts for', 'related to'];
    return searchKeywords.some(keyword => message.includes(keyword));
  }
  
  isTacticQuery(message) {
    const tacticKeywords = ['tactic', 'persistence', 'execution', 'lateral movement', 'exfiltration', 'command and control'];
    return tacticKeywords.some(keyword => message.includes(keyword));
  }
  
  isPeakFrameworkQuery(message) {
    const peakKeywords = ['peak', 'flames', 'embers', 'alchemy', 'framework', 'category', 'when to use'];
    return peakKeywords.some(keyword => message.includes(keyword));
  }
  
  isStatsQuery(message) {
    const statsKeywords = ['how many', 'count', 'stats', 'statistics', 'total'];
    return statsKeywords.some(keyword => message.includes(keyword));
  }
  
  isHelpQuery(message) {
    const helpKeywords = ['help', 'what can you do', 'commands', 'how to'];
    return helpKeywords.some(keyword => message.includes(keyword));
  }
  
  // Handler methods
  handleHuntSearch(query) {
    const results = this.searchHunts(query);
    
    if (results.length === 0) {
      this.addMessage('bot', "I couldn't find any hunts matching your query. Try searching for different keywords like 'persistence', 'network traffic', or 'suspicious processes'.");
      return;
    }
    
    const responseText = `Found ${results.length} hunt${results.length > 1 ? 's' : ''} matching your query:`;
    this.addMessage('bot', responseText);
    
    // Show hunt results
    results.slice(0, 5).forEach(hunt => {
      this.addHuntResult(hunt);
    });
    
    if (results.length > 5) {
      this.addMessage('system', `Showing top 5 results. ${results.length - 5} more hunts match your query.`);
    }
  }
  
  handleTacticExploration(message) {
    const tactic = this.extractTactic(message);
    const hunts = this.huntsData.filter(hunt => 
      hunt.tactic.toLowerCase().includes(tactic.toLowerCase())
    );
    
    if (hunts.length === 0) {
      this.addMessage('bot', `I couldn't find hunts specifically for "${tactic}". Try these common tactics: Persistence, Execution, Lateral Movement, Exfiltration, Command and Control.`);
      return;
    }
    
    this.addMessage('bot', `Found ${hunts.length} hunt${hunts.length > 1 ? 's' : ''} targeting **${tactic}**:`);
    
    hunts.slice(0, 3).forEach(hunt => {
      this.addHuntResult(hunt);
    });
  }
  
  handlePeakFrameworkGuidance(message) {
    const guidance = `🔥 **PEAK Framework Guidance:**

**🔥 Flames** - Hypothesis-driven hunts
- Use when you have a specific threat or technique to investigate
- Clear, testable objectives
- Example: "Hunt for suspicious PowerShell execution"

**🪵 Embers** - Baselining and exploratory analysis  
- Use to understand your environment's normal behavior
- Foundation for detecting anomalies
- Example: "Establish network traffic baselines"

**🔮 Alchemy** - Model-assisted and algorithmic approaches
- Use advanced analytics and machine learning
- Pattern detection and automated analysis
- Example: "ML-based user behavior anomaly detection"

Would you like to see examples of hunts in any specific category?`;
    
    this.addMessage('bot', guidance);
  }
  
  handleStatsQuery(message) {
    const stats = this.generateStats();
    const response = `📊 **HEARTH Database Stats:**

🎯 **Total Hunts:** ${stats.total}
🔥 **Flames:** ${stats.flames} hunts
🪵 **Embers:** ${stats.embers} hunts  
🔮 **Alchemy:** ${stats.alchemy} hunts

**Top Tactics:**
${stats.topTactics.map(t => `• ${t.tactic}: ${t.count} hunts`).join('\n')}

**Recent Contributors:** ${stats.contributors} people`;
    
    this.addMessage('bot', response);
  }
  
  handleHelpQuery() {
    const helpText = `🤖 **I can help you with:**

🔍 **Hunt Search**
- "Show me persistence hunts"
- "Find hunts about lateral movement"
- "Search for PowerShell hunts"

🎯 **Tactic Exploration**  
- "What hunts target execution?"
- "Show me command and control hunts"

🔥 **PEAK Framework**
- "When should I use Flames?"
- "Explain the PEAK framework"
- "Difference between Embers and Alchemy"

📊 **Statistics**
- "How many hunts do we have?"
- "Show me database stats"

Just ask me in natural language! What would you like to explore?`;
    
    this.addMessage('bot', helpText);
  }
  
  handleGeneralQuery(message) {
    // Simple keyword matching for general queries
    const keywords = this.extractKeywords(message);
    const results = this.searchHuntsByKeywords(keywords);
    
    if (results.length > 0) {
      this.addMessage('bot', `Based on your message, here are some relevant hunts:`);
      results.slice(0, 3).forEach(hunt => {
        this.addHuntResult(hunt);
      });
    } else {
      const suggestions = [
        "Try asking me to 'show me persistence hunts' or 'find lateral movement hunts'",
        "Ask about the PEAK framework: 'when should I use Flames?'",
        "Get stats: 'how many hunts do we have?'",
        "Need help? Just ask 'what can you help with?'"
      ];
      
      const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
      this.addMessage('bot', `I'm not sure how to help with that. ${randomSuggestion}`);
    }
  }
  
  // Search and utility methods
  searchHunts(query) {
    const lowerQuery = query.toLowerCase();
    
    return this.huntsData.filter(hunt => {
      return hunt.title.toLowerCase().includes(lowerQuery) ||
             hunt.tactic.toLowerCase().includes(lowerQuery) ||
             hunt.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
             hunt.submitter.name.toLowerCase().includes(lowerQuery) ||
             (hunt.notes && hunt.notes.toLowerCase().includes(lowerQuery));
    }).sort((a, b) => {
      // Prioritize exact matches in title
      const aScore = a.title.toLowerCase().includes(lowerQuery) ? 2 : 1;
      const bScore = b.title.toLowerCase().includes(lowerQuery) ? 2 : 1;
      return bScore - aScore;
    });
  }
  
  searchHuntsByKeywords(keywords) {
    if (keywords.length === 0) return [];
    
    return this.huntsData.filter(hunt => {
      return keywords.some(keyword => 
        hunt.title.toLowerCase().includes(keyword) ||
        hunt.tactic.toLowerCase().includes(keyword) ||
        hunt.tags.some(tag => tag.toLowerCase().includes(keyword))
      );
    }).slice(0, 5);
  }
  
  extractKeywords(message) {
    const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'about', 'can', 'you', 'me', 'i', 'is', 'are', 'was', 'were', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should'];
    
    return message.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2 && !commonWords.includes(word));
  }
  
  extractTactic(message) {
    const tactics = ['persistence', 'execution', 'lateral movement', 'exfiltration', 'command and control', 'reconnaissance', 'initial access', 'defense evasion', 'credential access', 'discovery', 'collection', 'impact'];
    
    for (const tactic of tactics) {
      if (message.toLowerCase().includes(tactic)) {
        return tactic;
      }
    }
    
    return 'unknown';
  }
  
  generateStats() {
    const total = this.huntsData.length;
    const flames = this.huntsData.filter(h => h.category === 'Flames').length;
    const embers = this.huntsData.filter(h => h.category === 'Embers').length;
    const alchemy = this.huntsData.filter(h => h.category === 'Alchemy').length;
    
    // Count tactics
    const tacticCounts = {};
    this.huntsData.forEach(hunt => {
      const tactics = hunt.tactic.split(',').map(t => t.trim());
      tactics.forEach(tactic => {
        tacticCounts[tactic] = (tacticCounts[tactic] || 0) + 1;
      });
    });
    
    const topTactics = Object.entries(tacticCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([tactic, count]) => ({ tactic, count }));
    
    const contributors = new Set(this.huntsData.map(h => h.submitter.name)).size;
    
    return {
      total,
      flames,
      embers,
      alchemy,
      topTactics,
      contributors
    };
  }
  
  addHuntResult(hunt) {
    const huntDiv = document.createElement('div');
    huntDiv.className = 'hunt-result';
    huntDiv.innerHTML = `
      <div class="hunt-result-header">
        <span class="hunt-result-id">${hunt.id}</span>
        <span class="hunt-result-category">${hunt.category}</span>
      </div>
      <div class="hunt-result-title">${hunt.title}</div>
      <div class="hunt-result-tactic">${hunt.tactic}</div>
    `;
    
    // Add click handler to show hunt in main interface
    huntDiv.addEventListener('click', () => {
      this.showHuntInMainInterface(hunt);
    });
    
    this.messagesContainer.appendChild(huntDiv);
    this.scrollToBottom();
  }
  
  showHuntInMainInterface(hunt) {
    // Close chat and filter to show the specific hunt
    this.closeChat();
    
    // Check if the main app exists and has a filterAndSortHunts function
    if (typeof hearthApp !== 'undefined' && hearthApp.elements && hearthApp.elements.searchInput) {
      // Set search to hunt ID to filter to that specific hunt
      hearthApp.elements.searchInput.value = hunt.id;
      hearthApp.elements.categoryFilter.value = hunt.category;
      
      // Trigger the filter and sort function
      if (typeof hearthApp.filterAndSortHunts === 'function') {
        hearthApp.filterAndSortHunts();
      }
      
      // Scroll to top of results with a small delay to allow filtering
      setTimeout(() => {
        if (hearthApp.elements.huntsGrid) {
          hearthApp.elements.huntsGrid.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  }
  
  scrollToBottom() {
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }
}

// Initialize chat widget when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Wait for HUNTS_DATA to be available
  if (typeof HUNTS_DATA !== 'undefined') {
    window.hearthChatWidget = new HearthChatWidget();
  } else {
    // Retry after a short delay if HUNTS_DATA isn't loaded yet
    setTimeout(() => {
      if (typeof HUNTS_DATA !== 'undefined') {
        window.hearthChatWidget = new HearthChatWidget();
      } else {
        console.warn('HEARTH Chat Widget: HUNTS_DATA not available');
      }
    }, 1000);
  }
});