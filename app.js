// HEARTH Hunt Database Webfront
// Requires: hunts-data.js (defines HUNTS_DATA)

// Enhanced HEARTH Application with Performance Optimizations
class HearthApp {
  constructor() {
    this.huntsData = HUNTS_DATA;
    this.filteredHunts = [...this.huntsData];
    this.searchCache = new Map();
    this.renderCache = new Map();
    this.debounceTimer = null;
    
    this.initializeElements();
    this.setupEventListeners();
    this.initializeApp();
  }
  
  initializeElements() {
    this.elements = {
      huntsGrid: document.getElementById('huntsGrid'),
      searchInput: document.getElementById('searchInput'),
      clearSearch: document.getElementById('clearSearch'),
      categoryFilter: document.getElementById('categoryFilter'),
      tacticFilter: document.getElementById('tacticFilter'),
      tagFilter: document.getElementById('tagFilter'),
      huntCount: document.getElementById('huntCount'),
      loadingSection: document.getElementById('loading'),
      sortHuntsSelect: document.getElementById('sortHunts')
    };
    
    // Validate required elements
    const missingElements = Object.entries(this.elements)
      .filter(([name, element]) => !element)
      .map(([name]) => name);
    
    if (missingElements.length > 0) {
      console.error('Missing required elements:', missingElements);
      throw new Error(`Required DOM elements not found: ${missingElements.join(', ')}`);
    }

  }
  
  createModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <span class="close">&times;</span>
        <div id="modal-body"></div>
      </div>
    `;
    document.body.appendChild(modal);
    
    const closeBtn = modal.querySelector('.close');
    const modalBody = document.getElementById('modal-body');
    
    // Enhanced modal controls
    const closeModal = () => {
      modal.style.display = 'none';
      document.body.style.overflow = 'auto'; // Re-enable scrolling
    };
    
    closeBtn.onclick = closeModal;
    modal.onclick = (e) => {
      if (e.target === modal) closeModal();
    };
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.style.display === 'block') {
        closeModal();
      }
    });
    
    this.modal = modal;
    this.modalBody = modalBody;
  }

  // Helper: Get unique values for dropdowns
  getUniqueValues(fieldName) {
    // Use cache for expensive operations
    const cacheKey = `unique_${fieldName}`;
    if (this.searchCache.has(cacheKey)) {
      return this.searchCache.get(cacheKey);
    }
    
    const uniqueValues = new Set();
    this.huntsData.forEach(hunt => {
      switch (fieldName) {
        case 'tags':
          (hunt.tags || []).forEach(tag => uniqueValues.add(tag));
          break;
        case 'tactic':
          if (hunt.tactic) {
            hunt.tactic.split(',').map(tactic => tactic.trim()).forEach(tactic => {
              if (tactic) uniqueValues.add(tactic);
            });
          }
          break;
        default:
          if (hunt[fieldName]) uniqueValues.add(hunt[fieldName]);
      }
    });
    
    const result = Array.from(uniqueValues).filter(Boolean).sort();
    this.searchCache.set(cacheKey, result);
    return result;
  }

  // Helper: Populate dropdown with values
  populateDropdown(selectElement, optionValues, labelText) {
    selectElement.innerHTML = `<option value="">All ${labelText}</option>` +
      optionValues.map(value => `<option value="${value}">${value}</option>`).join('');
  }

  // Initialize dropdowns
  initializeDropdowns() {
    this.populateDropdown(this.elements.tacticFilter, this.getUniqueValues('tactic'), 'Tactics');
    this.populateDropdown(this.elements.tagFilter, this.getUniqueValues('tags'), 'Tags');
  }

  // Show hunt details in modal
  showHuntDetails(hunt) {
    const modalContent = this.buildHuntDetailContent(hunt);
    this.modalBody.innerHTML = modalContent;
    this.modal.style.display = 'block';
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
  }

  // Build hunt detail content
  buildHuntDetailContent(hunt) {
    const header = this.buildHuntHeader(hunt);
    const sections = this.buildHuntSections(hunt);
    const footer = this.buildHuntFooter(hunt);
    return header + sections + footer;
  }

  // Build hunt header
  buildHuntHeader(hunt) {
    return `
      <div class="hunt-detail-header">
        <div class="hunt-detail-id">${hunt.id}</div>
        <div class="hunt-detail-category">${hunt.category}</div>
      </div>
      <h2 class="hunt-detail-title">${hunt.title}</h2>
    `;
  }

  // Build hunt sections
  buildHuntSections(hunt) {
    let sections = '';
    
    if (hunt.tactic) {
      sections += `<div class="hunt-detail-tactic"><strong>Tactic:</strong> ${hunt.tactic}</div>`;
    }
    
    if (hunt.notes) {
      sections += `<div class="hunt-detail-notes"><strong>Notes:</strong> ${hunt.notes}</div>`;
    }
    
    if (hunt.tags && hunt.tags.length) {
      const tagElements = hunt.tags.map(tag => `<span class="hunt-tag">#${tag}</span>`).join('');
      sections += `<div class="hunt-detail-tags"><strong>Tags:</strong> ${tagElements}</div>`;
    }
    
    if (hunt.submitter && hunt.submitter.name) {
      const submitterLink = hunt.submitter.link ? 
        `<a href="${hunt.submitter.link}" target="_blank">${hunt.submitter.name}</a>` : 
        hunt.submitter.name;
      sections += `<div class="hunt-detail-submitter"><strong>Submitter:</strong> ${submitterLink}</div>`;
    }
    
    if (hunt.why) {
      sections += `<div class="hunt-detail-why"><h3>Why</h3><div class="hunt-detail-content">${hunt.why.replace(/\n/g, '<br>')}</div></div>`;
    }
    
    if (hunt.references) {
      sections += `<div class="hunt-detail-references"><h3>References</h3><div class="hunt-detail-content">${hunt.references.replace(/\n/g, '<br>')}</div></div>`;
    }
    
    return sections;
  }

  // Build hunt footer
  buildHuntFooter(hunt) {
    return `
      <div class="hunt-detail-footer">
        <a href="https://github.com/THORCollective/HEARTH/blob/main/${hunt.file_path}" target="_blank" class="btn">
          View Source
        </a>
        <button class="btn btn-primary" onclick="generateNotebook('${hunt.id}')">
          Generate Notebook
        </button>
      </div>
    `;
  }

  // Render hunts
  renderHunts(hunts) {
    this.elements.huntsGrid.innerHTML = '';
    if (!hunts.length) {
      this.elements.huntsGrid.innerHTML = `<div class="no-results"><h3>No hunts found</h3><p>Try adjusting your search or filters.</p></div>`;
    } else {
      hunts.forEach(hunt => {
        this.elements.huntsGrid.appendChild(this.createHuntCard(hunt));
      });
    }
    this.elements.huntCount.textContent = `Showing ${hunts.length} hunt${hunts.length === 1 ? '' : 's'}`;
  }

  // Create a hunt card element
  createHuntCard(hunt) {
    const card = document.createElement('div');
    card.className = 'hunt-card';
    card.style.cursor = 'pointer';
    card.onclick = () => this.showHuntDetails(hunt);

    // Header
    const header = document.createElement('div');
    header.className = 'hunt-header';
    header.innerHTML = `
      <span class="hunt-id">${hunt.id}</span>
      <span class="hunt-category">${hunt.category}</span>
    `;
    card.appendChild(header);

    // Title/Idea
    const title = document.createElement('div');
    title.className = 'hunt-title';
    title.textContent = hunt.title || hunt.notes || '';
    card.appendChild(title);

    // Tactic
    if (hunt.tactic) {
      const tactic = document.createElement('div');
      tactic.className = 'hunt-tactic';
      tactic.textContent = hunt.tactic;
      card.appendChild(tactic);
    }

    // Tags
    if (hunt.tags && hunt.tags.length) {
      const tags = document.createElement('div');
      tags.className = 'hunt-tags';
      hunt.tags.forEach(tag => {
        const tagEl = document.createElement('span');
        tagEl.className = 'hunt-tag';
        tagEl.textContent = `#${tag}`;
        tags.appendChild(tagEl);
      });
      card.appendChild(tags);
    }

    // Submitter
    if (hunt.submitter && hunt.submitter.name) {
      const submitter = document.createElement('div');
      submitter.className = 'hunt-submitter';
      submitter.textContent = `Submitter: ${hunt.submitter.name}`;
      card.appendChild(submitter);
    }

    // Click indicator
    const clickIndicator = document.createElement('div');
    clickIndicator.className = 'hunt-click-indicator';
    clickIndicator.textContent = 'Click to view details';
    card.appendChild(clickIndicator);

    return card;
  }

  // Sorting logic
  sortHunts(hunts) {
    const sortValue = this.elements.sortHuntsSelect.value;
    const direction = sortValue.split('-')[1];

    // Return a sorted COPY of the array.
    return [...hunts].sort((a, b) => {
      const valA = a.id;
      const valB = b.id;

      // Extract letter and number from IDs like 'H001', 'B002', etc.
      const letterA = valA.charAt(0);
      const letterB = valB.charAt(0);
      const numA = parseInt(valA.substring(1), 10);
      const numB = parseInt(valB.substring(1), 10);

      // First, compare by the letter prefix (e.g., 'B' vs 'H')
      if (letterA !== letterB) {
        return direction === 'asc' ? letterA.localeCompare(letterB) : letterB.localeCompare(letterA);
      }

      // If letters are the same, compare by number
      return direction === 'asc' ? numA - numB : numB - numA;
    });
  }

  // Filter and sort hunts
  filterAndSortHunts() {
    const searchTerm = (this.elements.searchInput.value || '').toLowerCase();
    const selectedCategory = this.elements.categoryFilter.value;
    const selectedTactic = this.elements.tacticFilter.value;
    const selectedTag = this.elements.tagFilter.value;
    
    this.filteredHunts = this.huntsData.filter(hunt => {
      return this.matchesSearchCriteria(hunt, searchTerm) &&
             this.matchesCategory(hunt, selectedCategory) &&
             this.matchesTactic(hunt, selectedTactic) &&
             this.matchesTag(hunt, selectedTag);
    });

    const sortedHunts = this.sortHunts(this.filteredHunts);
    this.renderHunts(sortedHunts);
  }

  // Search criteria matching
  matchesSearchCriteria(hunt, searchTerm) {
    if (!searchTerm) return true;
    
    const searchableContent = [
      hunt.id,
      hunt.title,
      hunt.tactic,
      hunt.notes,
      (hunt.tags || []).join(' '),
      (hunt.submitter && hunt.submitter.name) || ''
    ].join(' ').toLowerCase();
    
    return searchableContent.includes(searchTerm);
  }

  // Category matching
  matchesCategory(hunt, category) {
    return !category || hunt.category === category;
  }

  // Tactic matching
  matchesTactic(hunt, tactic) {
    return !tactic || (hunt.tactic && hunt.tactic.split(',').map(tacticItem => tacticItem.trim()).includes(tactic));
  }

  // Tag matching
  matchesTag(hunt, tag) {
    return !tag || (hunt.tags && hunt.tags.includes(tag));
  }

  // Setup event listeners
  setupEventListeners() {
    // Debounced search
    this.elements.searchInput.addEventListener('input', () => {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => this.filterAndSortHunts(), 300);
    });
    
    this.elements.clearSearch.addEventListener('click', () => {
      this.elements.searchInput.value = '';
      this.filterAndSortHunts();
    });
    
    this.elements.categoryFilter.addEventListener('change', () => this.filterAndSortHunts());
    this.elements.tacticFilter.addEventListener('change', () => this.filterAndSortHunts());
    this.elements.tagFilter.addEventListener('change', () => this.filterAndSortHunts());
    this.elements.sortHuntsSelect.addEventListener('change', () => this.filterAndSortHunts());
  }

  // Initialize the application
  initializeApp() {
    this.createModal();
    this.initializeDropdowns();
    
    // Hide loading, show grid
    this.elements.loadingSection.style.display = 'none';
    this.elements.huntsGrid.style.display = 'grid';

    // Initial render
    this.filterAndSortHunts();
  }
}

// Generate notebook content based on PEAK framework
async function generateNotebookContent(huntData) {
  const timestamp = new Date().toISOString();
  const huntTitle = huntData.title || 'Threat Hunting Notebook';
  
  // Create Jupyter notebook structure
  const notebook = {
    cells: [
      {
        cell_type: 'markdown',
        metadata: {},
        source: [
          `# Threat Hunting Notebook: ${huntTitle}\n`,
          '\n',
          `**Hunt ID:** ${huntData.id}  \n`,
          `**Category:** ${huntData.category}  \n`,
          `**Tactic:** ${huntData.tactic}  \n`,
          `**Generated:** ${timestamp}  \n`,
          `**Framework:** PEAK (Prepare, Execute, Act with Knowledge)\n`,
          `**Source:** THOR Collective HEARTH Database  \n`,
          `**Repository:** https://github.com/THORCollective/HEARTH\n`,
          '\n',
          '## About This Notebook\n',
          '\n',
          'This notebook was generated from the **THOR Collective HEARTH** (Hunting Exchange and Research Threat Hub) database - a community-driven, open-source platform for sharing threat hunting hypotheses and methodologies.\n',
          '\n',
          'Each hunt follows the **PEAK framework** methodology:\n',
          '\n',
          '- **Prepare:** Research, planning, and hypothesis development\n',
          '- **Execute:** Data analysis and investigation\n',
          '- **Act:** Documentation, automation, and communication\n',
          '\n',
          '### About THOR Collective\n',
          'THOR Collective is dedicated to advancing the cybersecurity community through open-source threat hunting tools, research, and collaboration. Visit https://hearth.thorcollective.com to explore the full database.\n',
          '\n',
          '---'
        ]
      },
      {
        cell_type: 'markdown',
        metadata: {},
        source: [
          '## Hunt Overview\n',
          '\n',
          `**Hypothesis:** ${huntData.hypothesis}\n`,
          '\n',
          `**Why This Hunt Matters:**\n`,
          `${huntData.why || 'No explanation provided'}\n`,
          '\n',
          `**Tags:** ${huntData.tags.join(', ')}\n`,
          '\n',
          `**References:**\n`,
          `${huntData.references || 'No references provided'}\n`,
          '\n',
          '---'
        ]
      },
      {
        cell_type: 'code',
        execution_count: null,
        metadata: {},
        outputs: [],
        source: [
          '# Required imports and setup\n',
          'import pandas as pd\n',
          'import numpy as np\n',
          'import matplotlib.pyplot as plt\n',
          'import seaborn as sns\n',
          'from datetime import datetime, timedelta\n',
          'import json\n',
          '\n',
          '# Configure plotting\n',
          'plt.style.use(\'default\')\n',
          'sns.set_palette("husl")\n',
          '\n',
          '# Helper functions\n',
          'def display_hunt_metrics(hunt_name, start_time, end_time, total_events, suspicious_events):\n',
          '    """Display hunt execution metrics."""\n',
          '    duration = end_time - start_time\n',
          '    print(f"Hunt: {hunt_name}")\n',
          '    print(f"Duration: {duration}")\n',
          '    print(f"Total Events Analyzed: {total_events:,}")\n',
          '    print(f"Suspicious Events: {suspicious_events:,}")\n',
          '    print(f"Suspicious Rate: {(suspicious_events/total_events)*100:.2f}%")\n',
          '    print("-" * 40)\n',
          '\n',
          'print("Threat Hunting Environment Initialized")\n',
          'print(f"Notebook executed at: {datetime.now()}")'
        ]
      },
      {
        cell_type: 'markdown',
        metadata: {},
        source: [
          `## Hunt: ${huntTitle}\n`,
          '\n',
          `**Hunt Type:** Hypothesis-Driven Hunt\n`,
          `**Hypothesis:** ${huntData.hypothesis}`
        ]
      },
      {
        cell_type: 'markdown',
        metadata: {},
        source: [
          '### 🎯 PREPARE Phase\n',
          '\n',
          '#### Research Questions\n',
          `- How can we detect activities related to: ${huntData.hypothesis}?\n`,
          `- What data sources contain relevant information for ${huntData.tactic} tactics?\n`,
          '- What are the key indicators we should look for?\n',
          '- What is the expected false positive rate?\n',
          '\n',
          '#### Data Sources\n',
          '- Security event logs\n',
          '- Network traffic logs\n',
          '- Endpoint detection and response (EDR) logs\n',
          '- Authentication logs\n',
          '- Process execution logs\n',
          '\n',
          '#### Required Tools\n',
          '- SIEM/Log analysis platform\n',
          '- Data visualization tools\n',
          '- Statistical analysis capabilities\n',
          '\n',
          '#### Hunt Scope\n',
          '- **Time Range:** 30 days\n',
          '- **Priority:** Medium\n',
          '- **Environment:** Production'
        ]
      },
      {
        cell_type: 'code',
        execution_count: null,
        metadata: {},
        outputs: [],
        source: [
          '# PREPARE Phase - Hunt Configuration\n',
          `hunt_name = "${huntTitle}"\n`,
          'hunt_type = "hypothesis_driven"\n',
          'start_time = datetime.now()\n',
          '\n',
          '# Hunt parameters\n',
          'hunt_config = {\n',
          "    'time_range': '30 days',\n",
          "    'data_sources': ['security_logs', 'network_logs', 'endpoint_logs'],\n",
          "    'priority': 'Medium'\n",
          '}\n',
          '\n',
          'print(f"Configured hunt: {hunt_name}")\n',
          'print(f"Hunt type: {hunt_type}")\n',
          'print(f"Priority: {hunt_config[\'priority\']}")\n',
          'print(f"Data sources: {\', \'.join(hunt_config[\'data_sources\'])}")'
        ]
      },
      {
        cell_type: 'markdown',
        metadata: {},
        source: [
          '### 🔍 EXECUTE Phase\n',
          '\n',
          '#### Analysis Steps\n',
          '1. Load and prepare data from configured sources\n',
          '2. Apply initial filters based on hunt hypothesis\n',
          '3. Analyze patterns and anomalies\n',
          '4. Correlate findings across data sources\n',
          '5. Validate suspicious events\n',
          '\n',
          '#### Search Queries\n',
          '```\n',
          '# Example search queries (adapt to your environment)\n',
          `# Hunt: ${huntData.hypothesis}\n`,
          `# Tactic: ${huntData.tactic}\n`,
          '# Add your specific queries here\n',
          '```\n',
          '\n',
          '#### Detection Logic\n',
          '- Look for patterns consistent with the hypothesis\n',
          '- Identify deviations from normal behavior\n',
          '- Correlate multiple data sources for validation'
        ]
      },
      {
        cell_type: 'code',
        execution_count: null,
        metadata: {},
        outputs: [],
        source: [
          '# EXECUTE Phase - Data Analysis\n',
          '\n',
          '# Simulated data loading (replace with actual data connectors)\n',
          'print("Loading data from configured sources...")\n',
          '\n',
          '# Example: Load network logs\n',
          '# network_logs = pd.read_csv(\'network_logs.csv\')\n',
          '# endpoint_logs = pd.read_csv(\'endpoint_logs.csv\')\n',
          '\n',
          '# Simulated data for demonstration\n',
          'sample_data = pd.DataFrame({\n',
          "    'timestamp': pd.date_range(start='2024-01-01', periods=1000, freq='H'),\n",
          "    'source_ip': np.random.choice(['10.1.1.1', '10.1.1.2', '192.168.1.100'], 1000),\n",
          "    'destination_ip': np.random.choice(['8.8.8.8', '1.1.1.1', '10.1.1.5'], 1000),\n",
          "    'process_name': np.random.choice(['chrome.exe', 'powershell.exe', 'cmd.exe'], 1000),\n",
          "    'event_type': np.random.choice(['process_creation', 'network_connection', 'file_access'], 1000)\n",
          '})\n',
          '\n',
          'print(f"Loaded {len(sample_data)} events for analysis")\n',
          'print("\\nSample data preview:")\n',
          'print(sample_data.head())\n',
          '\n',
          '# Apply hunt-specific filters\n',
          '# Modify this logic based on your specific hunt hypothesis\n',
          'suspicious_events = sample_data[\n',
          "    (sample_data['process_name'].str.contains('powershell', case=False)) |\n",
          "    (sample_data['event_type'] == 'process_creation')\n",
          ']\n',
          '\n',
          'print(f"\\nIdentified {len(suspicious_events)} potentially suspicious events")'
        ]
      },
      {
        cell_type: 'markdown',
        metadata: {},
        source: [
          '### 📊 ACT Phase\n',
          '\n',
          '#### Documentation Requirements\n',
          '- **Hunt Results:** Document all findings and their significance\n',
          '- **False Positives:** Track and document false positive cases\n',
          '- **Validation Steps:** Record steps taken to validate findings\n',
          '- **Recommendations:** Provide actionable next steps\n',
          '\n',
          '#### Automation Opportunities\n',
          '- Convert successful hunt queries into automated detection rules\n',
          '- Create alerting for confirmed indicators\n',
          '- Implement regular execution of hunt logic\n',
          '\n',
          '#### Communication Plan\n',
          '- **Stakeholders:** Security team, IT operations, management\n',
          '- **Report Format:** Executive summary with technical details\n',
          '- **Escalation:** Define thresholds for escalation'
        ]
      },
      {
        cell_type: 'code',
        execution_count: null,
        metadata: {},
        outputs: [],
        source: [
          '# ACT Phase - Results Documentation and Automation\n',
          '\n',
          'end_time = datetime.now()\n',
          'total_events = len(sample_data)\n',
          'suspicious_count = len(suspicious_events)\n',
          '\n',
          '# Display hunt metrics\n',
          'display_hunt_metrics(hunt_name, start_time, end_time, total_events, suspicious_count)\n',
          '\n',
          '# Visualize findings\n',
          'plt.figure(figsize=(12, 8))\n',
          '\n',
          '# Event timeline\n',
          'plt.subplot(2, 2, 1)\n',
          'sample_data.set_index(\'timestamp\')[\'event_type\'].value_counts().plot(kind=\'bar\')\n',
          'plt.title(\'Event Types Distribution\')\n',
          'plt.xticks(rotation=45)\n',
          '\n',
          '# Suspicious events over time\n',
          'plt.subplot(2, 2, 2)\n',
          'suspicious_timeline = suspicious_events.groupby(suspicious_events[\'timestamp\'].dt.date).size()\n',
          'suspicious_timeline.plot(kind=\'line\', marker=\'o\')\n',
          'plt.title(\'Suspicious Events Timeline\')\n',
          'plt.xticks(rotation=45)\n',
          '\n',
          '# Top processes\n',
          'plt.subplot(2, 2, 3)\n',
          'sample_data[\'process_name\'].value_counts().head(10).plot(kind=\'barh\')\n',
          'plt.title(\'Top Processes\')\n',
          '\n',
          '# Findings summary\n',
          'plt.subplot(2, 2, 4)\n',
          'findings_data = [\'Total Events\', \'Suspicious Events\', \'Clean Events\']\n',
          'findings_counts = [total_events, suspicious_count, total_events - suspicious_count]\n',
          'plt.pie(findings_counts[1:], labels=findings_data[1:], autopct=\'%1.1f%%\')\n',
          'plt.title(\'Hunt Results Summary\')\n',
          '\n',
          'plt.tight_layout()\n',
          'plt.show()\n',
          '\n',
          '# Generate findings report\n',
          'findings_report = {\n',
          "    'hunt_name': hunt_name,\n",
          "    'execution_time': str(end_time - start_time),\n",
          "    'total_events_analyzed': total_events,\n",
          "    'suspicious_events_found': suspicious_count,\n",
          "    'false_positive_rate': 'TBD - Requires validation',\n",
          "    'recommendations': [\n",
          "        'Validate suspicious events with additional context',\n",
          "        'Implement automated alerting for confirmed indicators',\n",
          "        'Schedule regular execution of successful hunt queries'\n",
          '    ]\n',
          '}\n',
          '\n',
          'print("\\n" + "="*50)\n',
          'print("HUNT FINDINGS REPORT")\n',
          'print("="*50)\n',
          'for key, value in findings_report.items():\n',
          '    if isinstance(value, list):\n',
          '        print(f"{key.upper()}:")\n',
          '        for item in value:\n',
          '            print(f"  - {item}")\n',
          '    else:\n',
          '        print(f"{key.upper()}: {value}")'
        ]
      },
      {
        cell_type: 'markdown',
        metadata: {},
        source: [
          '## 📋 Conclusion\n',
          '\n',
          'This threat hunting notebook has been generated based on the PEAK framework methodology. The hunt provides:\n',
          '\n',
          '1. **Structured approach** following PEAK phases (Prepare, Execute, Act)\n',
          '2. **Actionable search queries** and detection logic\n',
          '3. **Visualization capabilities** for findings analysis\n',
          '4. **Documentation templates** for reporting and communication\n',
          '\n',
          '### Next Steps\n',
          '\n',
          '1. **Customize data sources** - Replace simulated data with your actual security logs\n',
          '2. **Validate findings** - Review and confirm any suspicious activities identified\n',
          '3. **Implement automation** - Convert successful hunts into automated detection rules\n',
          '4. **Schedule regular execution** - Run hunts periodically to maintain security posture\n',
          '\n',
          '### Knowledge Integration\n',
          '\n',
          'The Knowledge component of PEAK is integrated throughout this hunt:\n',
          '- Threat intelligence from research and CTI sources\n',
          '- Organizational context and business knowledge\n',
          '- Technical expertise and hunting experience\n',
          '- Findings from previous hunt iterations\n',
          '\n',
          '---\n',
          '\n',
          '## Credits\n',
          '\n',
          'This notebook was generated by **THOR Collective HEARTH** using the PEAK Threat Hunting Framework.\n',
          '\n',
          '- **HEARTH Database:** https://hearth.thorcollective.com\n',
          '- **THOR Collective:** https://github.com/THORCollective\n',
          '- **Submit Hunts:** https://github.com/THORCollective/HEARTH/issues/new/choose\n',
          '- **Notebook Generator:** https://github.com/THORCollective/threat-hunting-notebook-generator\n',
          '\n',
          '*Generated using PEAK Threat Hunting Framework from THOR Collective HEARTH*'
        ]
      }
    ],
    metadata: {
      kernelspec: {
        display_name: 'Python 3',
        language: 'python',
        name: 'python3'
      },
      language_info: {
        codemirror_mode: {
          name: 'ipython',
          version: 3
        },
        file_extension: '.py',
        mimetype: 'text/x-python',
        name: 'python',
        nbconvert_exporter: 'python',
        pygments_lexer: 'ipython3',
        version: '3.8.5'
      }
    },
    nbformat: 4,
    nbformat_minor: 4
  };
  
  return JSON.stringify(notebook, null, 2);
}

// Show hunt JSON data function
function showHuntJsonData(huntId) {
  const hunt = HUNTS_DATA.find(h => h.id === huntId);
  if (!hunt) return;
  
  const huntData = {
    id: hunt.id,
    title: hunt.title || hunt.notes || 'Untitled Hunt',
    category: hunt.category,
    hypothesis: hunt.notes || hunt.title || '',
    tactic: hunt.tactic || '',
    tags: hunt.tags || [],
    references: hunt.references || '',
    why: hunt.why || '',
    submitter: hunt.submitter ? hunt.submitter.name : 'Unknown',
    file_path: hunt.file_path
  };
  
  const modalBody = document.getElementById('modal-body');
  modalBody.innerHTML = `
    <div class="hunt-json-data">
      <h3>Hunt Data for Advanced Notebook Generation</h3>
      <p>Copy the JSON below and use it with the THOR Collective 
      <a href="https://github.com/THORCollective/threat-hunting-notebook-generator" target="_blank">threat-hunting-notebook-generator</a> 
      tool for more advanced notebooks:</p>
      <div class="json-container">
        <pre class="json-code">${JSON.stringify(huntData, null, 2)}</pre>
      </div>
      <div class="json-actions">
        <button class="btn btn-primary" onclick="copyToClipboard(JSON.stringify(${JSON.stringify(huntData)}, null, 2))">
          Copy JSON
        </button>
        <button class="btn btn-secondary" onclick="generateNotebook('${huntId}')">
          Back to Notebook
        </button>
      </div>
      <div class="usage-instructions">
        <h4>Usage Instructions:</h4>
        <ol>
          <li>Copy the JSON data above</li>
          <li>Clone the THOR Collective threat-hunting-notebook-generator repository</li>
          <li>Save the JSON to a file (e.g., hunt_data.json)</li>
          <li>Run: <code>python -m src.main --input hunt_data.json --output notebook.ipynb</code></li>
        </ol>
      </div>
    </div>
  `;
}

// Copy to clipboard function
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    // Show temporary success message
    const originalContent = event.target.textContent;
    event.target.textContent = '✓ Copied!';
    setTimeout(() => {
      event.target.textContent = originalContent;
    }, 2000);
  });
}

// Generate notebook function
async function generateNotebook(huntId) {
  try {
    // Show loading indicator
    const loadingHtml = `
      <div class="notebook-loading">
        <div class="spinner"></div>
        <p>Generating Jupyter notebook...</p>
        <p class="loading-subtext">This may take a moment while we process your hunt hypothesis</p>
      </div>
    `;
    
    // Find the modal body and show loading
    const modalBody = document.getElementById('modal-body');
    if (modalBody) {
      modalBody.innerHTML = loadingHtml;
    }
    
    // Find the hunt data
    const hunt = HUNTS_DATA.find(h => h.id === huntId);
    if (!hunt) {
      throw new Error('Hunt not found');
    }
    
    // Prepare hunt data for notebook generation
    const huntData = {
      id: hunt.id,
      title: hunt.title || hunt.notes || 'Untitled Hunt',
      category: hunt.category,
      hypothesis: hunt.notes || hunt.title || '',
      tactic: hunt.tactic || '',
      tags: hunt.tags || [],
      references: hunt.references || '',
      why: hunt.why || '',
      submitter: hunt.submitter ? hunt.submitter.name : 'Unknown',
      file_path: hunt.file_path
    };
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate notebook content using the threat-hunting-notebook-generator approach
    const notebookContent = await generateNotebookContent(huntData);
    
    // Create a blob with the notebook content
    const blob = new Blob([notebookContent], { type: 'application/json' });
    const downloadUrl = URL.createObjectURL(blob);
    
    // Show success message with download link
    modalBody.innerHTML = `
      <div class="notebook-success">
        <h3>✅ Notebook Generated Successfully!</h3>
        <p>Your threat hunting notebook has been generated based on the PEAK framework.</p>
        <div class="notebook-actions">
          <a href="${downloadUrl}" class="btn btn-primary" download="${huntData.id}_threat_hunting_notebook.ipynb">
            Download Notebook (.ipynb)
          </a>
          <button class="btn btn-secondary" onclick="generateNotebook('${huntData.id}')">
            Generate Another
          </button>
        </div>
        <div class="notebook-info">
          <h4>What's included:</h4>
          <ul>
            <li>PEAK framework structure (Prepare, Execute, Act)</li>
            <li>Hunt hypothesis and research questions</li>
            <li>Sample data analysis code</li>
            <li>Visualization templates</li>
            <li>Documentation templates</li>
          </ul>
        </div>
        <div class="notebook-github">
          <p><strong>Advanced Option:</strong> For more sophisticated notebook generation, you can use the THOR Collective 
          <a href="https://github.com/THORCollective/threat-hunting-notebook-generator" target="_blank">threat-hunting-notebook-generator</a> 
          tool with the following hunt data:</p>
          <button class="btn btn-secondary" onclick="showHuntJsonData('${huntData.id}')">
            Show Hunt Data
          </button>
        </div>
      </div>
    `;
    
  } catch (error) {
    console.error('Error generating notebook:', error);
    
    // Show error message
    const modalBody = document.getElementById('modal-body');
    if (modalBody) {
      modalBody.innerHTML = `
        <div class="notebook-error">
          <h3>❌ Error Generating Notebook</h3>
          <p>We encountered an error while generating your notebook:</p>
          <p class="error-message">${error.message}</p>
          <div class="error-actions">
            <button class="btn btn-primary" onclick="generateNotebook('${huntId}')">
              Try Again
            </button>
            <button class="btn btn-secondary" onclick="location.reload()">
              Close
            </button>
          </div>
          <div class="error-fallback">
            <p><strong>Alternative:</strong> You can manually create a notebook using the hunt details shown above and the THOR Collective 
            <a href="https://github.com/THORCollective/threat-hunting-notebook-generator" target="_blank">threat-hunting-notebook-generator</a> tool.</p>
          </div>
        </div>
      `;
    }
  }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new HearthApp();
}); 