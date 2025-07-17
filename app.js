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
          '*This notebook provides a structured and consistent way to document threat hunting activities using the PEAK Framework (Prepare, Execute, Act with Knowledge). It guides threat hunters through defining clear hypotheses, scoping the hunt precisely using the ABLE methodology, executing targeted queries, and documenting findings to ensure thorough and actionable results.*\n',
          '\n',
          `**Generated:** ${timestamp}  \n`,
          `**Source:** THOR Collective HEARTH Database  \n`,
          `**Database:** https://hearth.thorcollective.com  \n`,
          `**Framework:** PEAK (Prepare, Execute, Act with Knowledge)  \n`,
          `**Template:** https://dispatch.thorcollective.com/p/the-peak-threat-hunting-template\n`,
          '\n',
          '---\n',
          '\n',
          '# Threat Hunting Report - PEAK Framework\n',
          '\n',
          `## Hunt ID: ${huntData.id}\n`,
          `*(${huntData.category} - ${huntData.category === 'Flames' ? 'Hypothesis-driven' : huntData.category === 'Embers' ? 'Baseline' : 'Model-Assisted'})*\n`,
          '\n',
          `## Hunt Title: ${huntTitle}`
        ]
      },
      {
        cell_type: 'markdown',
        metadata: {},
        source: [
          '---\n',
          '\n',
          '## PREPARE: Define the Hunt\n',
          '\n',
          '| **Hunt Information**            | **Details** |\n',
          '|----------------------------------|-------------|\n',
          `| **Hypothesis**                  | ${huntData.hypothesis} |\n`,
          '| **Threat Hunter Name**          | [Your Name] |\n',
          `| **Date**                        | ${new Date().toLocaleDateString()} |\n`,
          '| **Requestor**                   | [Requestor Name] |\n',
          '| **Timeframe for hunt**          | [Expected Duration] |\n',
          '\n',
          '## Scoping with the ABLE Methodology\n',
          '\n',
          '*Clearly define your hunt scope using the ABLE framework. Replace all placeholders with relevant details for your scenario.*\n',
          '\n',
          '| **Field**   | **Description**                                                                                                                                                                                                                                                                             | **Your Input**                   |\n',
          '|-------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------|\n',
          '| **Actor**   | *(Optional)* Identify the threat actor involved with the behavior, if applicable. This step is optional because hunts aren\'t always tied to a specific actor. You may be investigating techniques used across multiple adversaries or looking for suspicious activity regardless of attribution. Focus on the what and how before the who, unless actor context adds meaningful value to the hunt.  | `[Threat Actor or N/A]`          |\n',
          '| **Behavior**| Describe the actions observed or expected, including tactics, techniques, and procedures (TTPs). Specify methods or tools involved.                                                                                                                                                 | `[Describe observed or expected behavior]` |\n',
          '| **Location**| Specify where the activity occurred, such as an endpoint, network segment, or cloud environment.                                                                                                                                 | `[Location]`            |\n',
          '| **Evidence**| Clearly list logs, artifacts, or telemetry supporting your hypothesis. For each source, provide critical fields required to validate the behavior, and include specific examples of observed or known malicious activity to illustrate expected findings. | `- Source: [Log Source]`<br>`- Key Fields: [Critical Fields]`<br>`- Example: [Expected Example of Malicious Activity]`<br><br>`- Source: [Additional Source]`<br>`- Key Fields: [Critical Fields]`<br>`- Example: [Expected Example of Malicious Activity]` |\n',
          '\n',
          '## Related Tickets (detection coverage, previous incidents, etc.)\n',
          '\n',
          '| **Role**                        | **Ticket and Other Details** |\n',
          '|----------------------------------|------------------------------|\n',
          '| **SOC/IR**                      | [Insert related ticket or incident details] |\n',
          '| **Threat Intel (TI)**            | [Insert related ticket] |\n',
          '| **Detection Engineering (DE)**   | [Insert related ticket] |\n',
          '| **Red Team / Pen Testing**       | [Insert related ticket] |\n',
          '| **Other**                        | [Insert related ticket] |\n',
          '\n',
          '## **Threat Intel & Research**\n',
          '- **MITRE ATT&CK Techniques:**\n',
          `  - \`${huntData.tactic || 'TAxxxx - Tactic Name'}\`\n`,
          '  - `Txxxx - Technique Name`\n',
          '- **Related Reports, Blogs, or Threat Intel Sources:**\n',
          `  - ${huntData.references || '[Link to references]'}\n`,
          '- **Historical Prevalence & Relevance:**\n',
          `  - ${huntData.why || '*(Has this been observed before in your environment? Are there any detections/mitigations for this activity already in place?)*'}\n`,
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
          '# Threat Hunting Environment Setup\n',
          'import pandas as pd\n',
          'import numpy as np\n',
          'import matplotlib.pyplot as plt\n',
          'import seaborn as sns\n',
          'from datetime import datetime, timedelta\n',
          'import json\n',
          'import warnings\n',
          'warnings.filterwarnings(\'ignore\')\n',
          '\n',
          '# Configure plotting style\n',
          'plt.style.use(\'default\')\n',
          'sns.set_palette("husl")\n',
          'plt.rcParams[\'figure.figsize\'] = (12, 8)\n',
          '\n',
          '# Hunt tracking variables\n',
          `hunt_id = "${huntData.id}"\n`,
          `hunt_title = "${huntTitle}"\n`,
          `hunt_hypothesis = "${huntData.hypothesis}"\n`,
          'hunt_start_time = datetime.now()\n',
          '\n',
          '# Helper functions for hunt analysis\n',
          'def log_hunt_step(step_name, details=""):\n',
          '    """Log hunt steps for documentation."""\n',
          '    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")\n',
          '    print(f"[{timestamp}] {step_name}: {details}")\n',
          '\n',
          'def analyze_results(data, description=""):\n',
          '    """Analyze and summarize hunt results."""\n',
          '    if isinstance(data, pd.DataFrame):\n',
          '        print(f"Analysis: {description}")\n',
          '        print(f"Total Records: {len(data):,}")\n',
          '        print(f"Columns: {list(data.columns)}")\n',
          '        print(f"Date Range: {data.index.min() if hasattr(data.index, \'min\') else \'N/A\'} to {data.index.max() if hasattr(data.index, \'max\') else \'N/A\'}")\n',
          '        print("-" * 50)\n',
          '    else:\n',
          '        print(f"Analysis: {description} - {len(data) if hasattr(data, \'__len__\') else \'N/A\'} items")\n',
          '\n',
          'print("🔥 THOR Collective HEARTH - Threat Hunting Environment Initialized")\n',
          'print(f"Hunt ID: {hunt_id}")\n',
          'print(f"Hunt Title: {hunt_title}")\n',
          'print(f"Started: {hunt_start_time}")\n',
          'print("-" * 60)'
        ]
      },
      {
        cell_type: 'markdown',
        metadata: {},
        source: [
          '## EXECUTE: Run the Hunt\n',
          '\n',
          '### Hunting Queries\n',
          '*(Document queries for Splunk, Sigma, KQL, or another query language to execute the hunt. Capture any adjustments made during analysis and iterate on findings.)*\n',
          '\n',
          '#### Initial Query'
        ]
      },
      {
        cell_type: 'code',
        execution_count: null,
        metadata: {},
        outputs: [],
        source: [
          '# Initial Hunt Query\n',
          '# Replace this with your actual query for your SIEM/logging platform\n',
          '\n',
          '# Example Splunk query:\n',
          '# index=main sourcetype=windows:security EventCode=4688\n',
          '# | search CommandLine="*suspicious_pattern*"\n',
          '# | stats count by host, user, CommandLine\n',
          '\n',
          '# Example KQL query:\n',
          '# SecurityEvent\n',
          '# | where EventID == 4688\n',
          '# | where CommandLine contains "suspicious_pattern"\n',
          '# | summarize count() by Computer, Account, CommandLine\n',
          '\n',
          '# For demonstration, we\'ll simulate some data\n',
          'log_hunt_step("Initial Query Execution", "Running initial hunt query")\n',
          '\n',
          '# Simulate initial query results\n',
          'initial_results = pd.DataFrame({\n',
          '    \'timestamp\': pd.date_range(start=\'2024-01-01\', periods=100, freq=\'H\'),\n',
          '    \'host\': np.random.choice([\'srv-01\', \'srv-02\', \'ws-001\', \'ws-002\'], 100),\n',
          '    \'user\': np.random.choice([\'admin\', \'user1\', \'service_account\'], 100),\n',
          '    \'event_type\': np.random.choice([\'process_creation\', \'network_connection\', \'file_access\'], 100),\n',
          '    \'suspicious_score\': np.random.uniform(0, 1, 100)\n',
          '})\n',
          '\n',
          'analyze_results(initial_results, "Initial hunt query results")\n',
          'print(f"\\nTop 10 results:")\n',
          'print(initial_results.head(10))'
        ]
      },
      {
        cell_type: 'markdown',
        metadata: {},
        source: [
          '**Notes:**\n',
          '- Did this query return expected results?\n',
          '- Were there false positives or gaps?\n',
          '- How did you refine the query based on findings?\n',
          '\n',
          '#### Refined Query (if applicable)'
        ]
      },
      {
        cell_type: 'code',
        execution_count: null,
        metadata: {},
        outputs: [],
        source: [
          '# Refined Hunt Query\n',
          'log_hunt_step("Refined Query Execution", "Running refined hunt query based on initial findings")\n',
          '\n',
          '# Apply refinements based on initial query results\n',
          '# Example refinements:\n',
          '# - Add time-based filtering\n',
          '# - Exclude known false positives\n',
          '# - Add additional correlation criteria\n',
          '\n',
          'refined_results = initial_results[\n',
          '    (initial_results[\'suspicious_score\'] > 0.7) &  # Higher threshold\n',
          '    (initial_results[\'event_type\'] == \'process_creation\')  # Focus on process creation\n',
          '].copy()\n',
          '\n',
          'analyze_results(refined_results, "Refined hunt query results")\n',
          '\n',
          'print("\\nRationale for Refinement:")\n',
          'print("- Applied suspicious score threshold > 0.7 to reduce false positives")\n',
          'print("- Focused on process creation events for better signal-to-noise ratio")\n',
          'print("- Excluded service account activities to focus on user-driven activity")'
        ]
      },
      {
        cell_type: 'markdown',
        metadata: {},
        source: [
          '### Visualization or Analytics\n',
          '*(Describe any dashboards, anomaly detection methods, or visualizations used. Capture observations and note whether visualizations revealed additional insights. **Add screenshots!**)*'
        ]
      },
      {
        cell_type: 'code',
        execution_count: null,
        metadata: {},
        outputs: [],
        source: [
          '# Visualization and Analytics\n',
          'log_hunt_step("Visualization", "Creating hunt visualizations")\n',
          '\n',
          '# Create visualizations to identify patterns\n',
          'fig, axes = plt.subplots(2, 2, figsize=(15, 10))\n',
          '\n',
          '# Timeline of events\n',
          'timeline_data = refined_results.set_index(\'timestamp\').resample(\'D\').size()\n',
          'axes[0, 0].plot(timeline_data.index, timeline_data.values, marker=\'o\')\n',
          'axes[0, 0].set_title(\'Event Timeline\')\n',
          'axes[0, 0].set_xlabel(\'Date\')\n',
          'axes[0, 0].set_ylabel(\'Event Count\')\n',
          'axes[0, 0].tick_params(axis=\'x\', rotation=45)\n',
          '\n',
          '# Host distribution\n',
          'host_counts = refined_results[\'host\'].value_counts()\n',
          'axes[0, 1].bar(host_counts.index, host_counts.values)\n',
          'axes[0, 1].set_title(\'Events by Host\')\n',
          'axes[0, 1].set_xlabel(\'Host\')\n',
          'axes[0, 1].set_ylabel(\'Event Count\')\n',
          '\n',
          '# User activity distribution\n',
          'user_counts = refined_results[\'user\'].value_counts()\n',
          'axes[1, 0].pie(user_counts.values, labels=user_counts.index, autopct=\'%1.1f%%\')\n',
          'axes[1, 0].set_title(\'User Activity Distribution\')\n',
          '\n',
          '# Suspicious score distribution\n',
          'axes[1, 1].hist(refined_results[\'suspicious_score\'], bins=20, alpha=0.7)\n',
          'axes[1, 1].set_title(\'Suspicious Score Distribution\')\n',
          'axes[1, 1].set_xlabel(\'Suspicious Score\')\n',
          'axes[1, 1].set_ylabel(\'Frequency\')\n',
          '\n',
          'plt.tight_layout()\n',
          'plt.show()\n',
          '\n',
          '# Analytics observations\n',
          'print("\\n" + "="*60)\n',
          'print("VISUALIZATION INSIGHTS")\n',
          'print("="*60)\n',
          'print("- Examples:")\n',
          'print("  - Time-series charts to detect activity spikes")\n',
          'print("  - Heatmaps of unusual application installs")\n',
          'print("  - Add your specific observations here")\n',
          'print("="*60)'
        ]
      },
      {
        cell_type: 'markdown',
        metadata: {},
        source: [
          '### Detection Logic\n',
          '*(How would this be turned into a detection rule? Thresholds, tuning considerations, etc.)*\n',
          '\n',
          '- **Initial Detection Criteria:**\n',
          '  - What conditions would trigger an alert?\n',
          '  - Are there threshold values that indicate malicious activity?\n',
          '\n',
          '- **Refinements After Review:**\n',
          '  - Did certain legitimate activities cause false positives?\n',
          '  - How can you tune the rule to focus on real threats?\n',
          '\n',
          '### Capturing Your Analysis & Iteration\n',
          '- **Summarize insights gained from each query modification and visualization.**\n',
          '- **Reiterate key findings:**\n',
          '  - Did this query lead to any findings, false positives, or hypotheses for further hunting?\n',
          '  - If this hunt were repeated, what changes should be made?\n',
          '  - Does this hunt generate ideas for additional hunts?\n',
          '\n',
          '- **Document the next steps for refining queries for detections and other outputs.**\n',
          '\n',
          '---'
        ]
      },
      {
        cell_type: 'markdown',
        metadata: {},
        source: [
          '## ACT: Findings & Response\n',
          '\n',
          '### Hunt Review Template\n',
          '\n',
          '### **Hypothesis / Topic**\n',
          `*(Restate the hypothesis and topic of the investigation: ${huntData.hypothesis})*\n`,
          '\n',
          '### **Executive Summary**\n',
          '**Key Points:**\n',
          '- 3-5 sentences summarizing the investigation.\n',
          '- Indicate whether the hypothesis was proved or disproved.\n',
          '- Summarize the main findings (e.g., "We found..., we did not find..., we did not find... but we did find...").\n',
          '\n',
          '### **Findings**\n',
          '*(Summarize key results, including any unusual activity.)*\n',
          '\n',
          '| **Finding** | **Ticket Number and Link** | **Description** |\n',
          '|------------|----------------------------|------------------|\n',
          '| [Describe finding] | [Insert Ticket Number] | [Brief description of the finding, such as suspicious activity, new detection idea, data gap, etc.] |\n',
          '| [Describe finding] | [Insert Ticket Number] | [Brief description of the finding] |\n',
          '| [Describe finding] | [Insert Ticket Number] | [Brief description of the finding] |'
        ]
      },
      {
        cell_type: 'code',
        execution_count: null,
        metadata: {},
        outputs: [],
        source: [
          '# ACT Phase - Generate Hunt Summary\n',
          'hunt_end_time = datetime.now()\n',
          'hunt_duration = hunt_end_time - hunt_start_time\n',
          '\n',
          'log_hunt_step("Hunt Summary", "Generating final hunt report")\n',
          '\n',
          '# Calculate hunt metrics\n',
          'total_events_analyzed = len(initial_results) if \'initial_results\' in locals() else 0\n',
          'suspicious_events_found = len(refined_results) if \'refined_results\' in locals() else 0\n',
          'false_positive_rate = "TBD - Requires validation"\n',
          '\n',
          'hunt_summary = {\n',
          '    "hunt_id": hunt_id,\n',
          '    "hunt_title": hunt_title,\n',
          '    "hypothesis": hunt_hypothesis,\n',
          '    "start_time": hunt_start_time,\n',
          '    "end_time": hunt_end_time,\n',
          '    "duration": hunt_duration,\n',
          '    "total_events_analyzed": total_events_analyzed,\n',
          '    "suspicious_events_found": suspicious_events_found,\n',
          '    "false_positive_rate": false_positive_rate\n',
          '}\n',
          '\n',
          'print("\\n" + "="*70)\n',
          'print("🔥 THOR COLLECTIVE HEARTH - HUNT SUMMARY REPORT")\n',
          'print("="*70)\n',
          'print(f"Hunt ID: {hunt_summary[\'hunt_id\']}")\n',
          'print(f"Hunt Title: {hunt_summary[\'hunt_title\']}")\n',
          'print(f"Hypothesis: {hunt_summary[\'hypothesis\']}")\n',
          'print(f"Duration: {hunt_summary[\'duration\']}")\n',
          'print(f"Total Events Analyzed: {hunt_summary[\'total_events_analyzed\']:,}")\n',
          'print(f"Suspicious Events Found: {hunt_summary[\'suspicious_events_found\']:,}")\n',
          'print(f"False Positive Rate: {hunt_summary[\'false_positive_rate\']}")\n',
          'print("="*70)\n',
          '\n',
          '# Export summary for documentation\n',
          'import json\n',
          'with open(f"hunt_summary_{hunt_id}.json", "w") as f:\n',
          '    json.dump(hunt_summary, f, indent=2, default=str)\n',
          '\n',
          'print(f"\\nHunt summary exported to: hunt_summary_{hunt_id}.json")'
        ]
      },
      {
        cell_type: 'markdown',
        metadata: {},
        source: [
          '## K - Knowledge: Lessons Learned & Documentation\n',
          '\n',
          '### **Adjustments to Future Hunts**\n',
          '- **What worked well?**\n',
          '- **What could be improved?**\n',
          '- **Should this hunt be automated as a detection?**\n',
          '- **Are there any follow-up hunts that should be conducted?**\n',
          '- **What feedback should be shared with other teams (SOC, IR, Threat Intel, Detection Engineering, etc.)?**\n',
          '\n',
          '### **Sharing Knowledge & Documentation**\n',
          '*(Ensure insights from this hunt are shared with the broader security team to improve future hunts and detections.)*\n',
          '\n',
          '- **Knowledge Base (KB) Articles**\n',
          '  - [ ] Write an internal KB article that captures:\n',
          '    - [ ] The hunt\'s objective, scope, and key findings\n',
          '    - [ ] Any detection logic or rule improvements\n',
          '    - [ ] Lessons learned that are relevant for future hunts or incident response\n',
          '  - [ ] Document newly uncovered insights or patterns that could benefit SOC, IR, or Detection Engineering teams, especially anything that could inform future detections, playbooks, or tuning decisions.\n',
          '\n',
          '- **Threat Hunt Readouts**\n',
          '  - [ ] Schedule a readout with SOC, IR, and Threat Intel teams.\n',
          '  - [ ] Present key findings and suggested improvements to detections.\n',
          '\n',
          '- **Reports & External Sharing**\n',
          '  - [ ] Publish findings in an internal hunt report.\n',
          '  - [ ] Share relevant insights with stakeholders, vendors, or industry communities if applicable.\n',
          '\n',
          '### **References**\n',
          `- ${huntData.references || '[Insert link to related documentation, reports, or sources]'}\n`,
          '- [Insert link to any external references or articles]\n',
          '\n',
          '---'
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
          '## Credits & Additional Resources\n',
          '\n',
          'This notebook was generated by **THOR Collective HEARTH** using the official PEAK Threat Hunting Framework template.\n',
          '\n',
          '### THOR Collective Resources\n',
          '- **HEARTH Database:** https://hearth.thorcollective.com\n',
          '- **THOR Collective GitHub:** https://github.com/THORCollective\n',
          '- **Submit New Hunts:** https://github.com/THORCollective/HEARTH/issues/new/choose\n',
          '- **Notebook Generator:** https://github.com/THORCollective/threat-hunting-notebook-generator\n',
          '\n',
          '### PEAK Framework Resources\n',
          '- **PEAK Template Guide:** https://dispatch.thorcollective.com/p/the-peak-threat-hunting-template\n',
          '- **Framework Documentation:** https://github.com/THORCollective/HEARTH/blob/main/Kindling/PEAK-Template.md\n',
          '\n',
          '### Community\n',
          '- **Join the Community:** Contribute your own hunts to help the security community\n',
          '- **Share Your Results:** Consider sharing interesting findings with the broader security community\n',
          '- **Follow THOR Collective:** Stay updated on new tools and threat hunting resources\n',
          '\n',
          '---\n',
          '\n',
          '*Generated using the official PEAK Threat Hunting Framework template from THOR Collective HEARTH*\n',
          '\n',
          '**Happy Hunting! 🔥**'
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