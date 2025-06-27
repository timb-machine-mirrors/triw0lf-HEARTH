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

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new HearthApp();
}); 