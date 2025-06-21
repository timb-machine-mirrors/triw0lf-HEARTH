// HEARTH Hunt Database Webfront
// Requires: hunts-data.js (defines HUNTS_DATA)

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const huntsGrid = document.getElementById('huntsGrid');
  const searchInput = document.getElementById('searchInput');
  const clearSearch = document.getElementById('clearSearch');
  const categoryFilter = document.getElementById('categoryFilter');
  const tacticFilter = document.getElementById('tacticFilter');
  const tagFilter = document.getElementById('tagFilter');
  const huntCount = document.getElementById('huntCount');
  const loadingSection = document.getElementById('loading');
  const sortHuntsSelect = document.getElementById('sortHunts');

  // Create modal for hunt details
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <span class="close">&times;</span>
      <div id="modal-body"></div>
    </div>
  `;
  document.body.appendChild(modal);

  // Modal functionality
  const closeBtn = modal.querySelector('.close');
  const modalBody = document.getElementById('modal-body');

  closeBtn.onclick = () => modal.style.display = 'none';
  modal.onclick = (e) => {
    if (e.target === modal) modal.style.display = 'none';
  };

  // Helper: Get unique values for dropdowns
  function getUnique(field) {
    const set = new Set();
    HUNTS_DATA.forEach(h => {
      if (field === 'tags') {
        (h.tags || []).forEach(tag => set.add(tag));
      } else if (field === 'tactic') {
        if (h.tactic) h.tactic.split(',').map(t => t.trim()).forEach(t => t && set.add(t));
      } else {
        set.add(h[field]);
      }
    });
    return Array.from(set).filter(Boolean).sort();
  }

  // Populate dropdowns
  function populateDropdown(select, values, label) {
    select.innerHTML = `<option value="">All ${label}</option>` +
      values.map(v => `<option value="${v}">${v}</option>`).join('');
  }

  populateDropdown(tacticFilter, getUnique('tactic'), 'Tactics');
  populateDropdown(tagFilter, getUnique('tags'), 'Tags');

  // State
  let filteredHunts = [...HUNTS_DATA];

  // Show hunt details in modal
  function showHuntDetails(hunt) {
    modalBody.innerHTML = `
      <div class="hunt-detail-header">
        <div class="hunt-detail-id">${hunt.id}</div>
        <div class="hunt-detail-category">${hunt.category}</div>
      </div>
      
      <h2 class="hunt-detail-title">${hunt.title}</h2>
      
      ${hunt.tactic ? `<div class="hunt-detail-tactic"><strong>Tactic:</strong> ${hunt.tactic}</div>` : ''}
      
      ${hunt.notes ? `<div class="hunt-detail-notes"><strong>Notes:</strong> ${hunt.notes}</div>` : ''}
      
      ${hunt.tags && hunt.tags.length ? `
        <div class="hunt-detail-tags">
          <strong>Tags:</strong>
          ${hunt.tags.map(tag => `<span class="hunt-tag">#${tag}</span>`).join('')}
        </div>
      ` : ''}
      
      ${hunt.submitter && hunt.submitter.name ? `
        <div class="hunt-detail-submitter">
          <strong>Submitter:</strong>
          ${hunt.submitter.link ? 
            `<a href="${hunt.submitter.link}" target="_blank">${hunt.submitter.name}</a>` : 
            hunt.submitter.name}
        </div>
      ` : ''}
      
      ${hunt.why ? `
        <div class="hunt-detail-why">
          <h3>Why</h3>
          <div class="hunt-detail-content">${hunt.why.replace(/\n/g, '<br>')}</div>
        </div>
      ` : ''}
      
      ${hunt.references ? `
        <div class="hunt-detail-references">
          <h3>References</h3>
          <div class="hunt-detail-content">${hunt.references.replace(/\n/g, '<br>')}</div>
        </div>
      ` : ''}
      
      <div class="hunt-detail-footer">
        <a href="https://github.com/THORCollective/HEARTH/blob/main/${hunt.file_path}" target="_blank" class="btn">
          View Source
        </a>
      </div>
    `;
    modal.style.display = 'block';
  }

  // Render hunts
  function renderHunts(hunts) {
    huntsGrid.innerHTML = '';
    if (!hunts.length) {
      huntsGrid.innerHTML = `<div class="no-results"><h3>No hunts found</h3><p>Try adjusting your search or filters.</p></div>`;
    } else {
      hunts.forEach(hunt => {
        huntsGrid.appendChild(createHuntCard(hunt));
      });
    }
    huntCount.textContent = `Showing ${hunts.length} hunt${hunts.length === 1 ? '' : 's'}`;
  }

  // Create a hunt card element
  function createHuntCard(hunt) {
    const card = document.createElement('div');
    card.className = 'hunt-card';
    card.style.cursor = 'pointer';
    card.onclick = () => showHuntDetails(hunt);

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
  function sortHunts(hunts) {
    const sortValue = sortHuntsSelect.value;
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

  // Filtering logic
  function filterAndSortHunts() {
    const search = (searchInput.value || '').toLowerCase();
    const category = categoryFilter.value;
    const tactic = tacticFilter.value;
    const tag = tagFilter.value;
    filteredHunts = HUNTS_DATA.filter(hunt => {
      // Search
      let matchesSearch = true;
      if (search) {
        const haystack = [hunt.id, hunt.title, hunt.tactic, hunt.notes, (hunt.tags || []).join(' '), (hunt.submitter && hunt.submitter.name) || '']
          .join(' ').toLowerCase();
        matchesSearch = haystack.includes(search);
      }
      // Category
      let matchesCategory = !category || hunt.category === category;
      // Tactic
      let matchesTactic = !tactic || (hunt.tactic && hunt.tactic.split(',').map(t => t.trim()).includes(tactic));
      // Tag
      let matchesTag = !tag || (hunt.tags && hunt.tags.includes(tag));
      return matchesSearch && matchesCategory && matchesTactic && matchesTag;
    });

    const sortedHunts = sortHunts(filteredHunts);
    renderHunts(sortedHunts);
  }

  // Event listeners
  searchInput.addEventListener('input', filterAndSortHunts);
  clearSearch.addEventListener('click', () => {
    searchInput.value = '';
    filterAndSortHunts();
  });
  categoryFilter.addEventListener('change', filterAndSortHunts);
  tacticFilter.addEventListener('change', filterAndSortHunts);
  tagFilter.addEventListener('change', filterAndSortHunts);
  sortHuntsSelect.addEventListener('change', filterAndSortHunts);

  // Hide loading, show grid
  loadingSection.style.display = 'none';
  huntsGrid.style.display = 'grid';

  // Initial render
  filterAndSortHunts();
}); 