// Application State
let appState = {
    allEntries: [],
    selectedUpdate: null, // Holds { updateId, type, text, date, url }
    activeTypeFilter: 'all',
    searchQuery: '',
    selectedHashtags: new Set(['#BigQuery', '#GoogleCloud']),
    customTweetText: ''
};

// DOM Elements
const elements = {
    refreshBtn: document.getElementById('refresh-btn'),
    searchInput: document.getElementById('search-input'),
    typeFilters: document.getElementById('type-filters'),
    updatesCount: document.getElementById('updates-count'),
    skeletonLoader: document.getElementById('skeleton-loader'),
    errorState: document.getElementById('error-state'),
    errorMessage: document.getElementById('error-message'),
    retryBtn: document.getElementById('retry-btn'),
    emptyState: document.getElementById('empty-state'),
    notesFeed: document.getElementById('notes-feed'),
    
    // Twitter Drawer Elements
    twitterDrawer: document.getElementById('twitter-drawer'),
    closeDrawerBtn: document.getElementById('close-drawer-btn'),
    tweetTextarea: document.getElementById('tweet-textarea'),
    charCounter: document.getElementById('char-counter'),
    copyTweetBtn: document.getElementById('copy-tweet-btn'),
    tweetBtn: document.getElementById('tweet-btn'),
    hashtagTags: document.querySelectorAll('.hashtag-tag')
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    fetchReleaseNotes();
});

// Event Listeners
function setupEventListeners() {
    // Refresh & Retry
    elements.refreshBtn.addEventListener('click', () => fetchReleaseNotes(true));
    elements.retryBtn.addEventListener('click', () => fetchReleaseNotes(true));
    
    // Search
    elements.searchInput.addEventListener('input', (e) => {
        appState.searchQuery = e.target.value.toLowerCase().strip();
        renderFeed();
    });
    
    // Type Filters
    elements.typeFilters.addEventListener('click', (e) => {
        const pill = e.target.closest('.filter-pill');
        if (!pill) return;
        
        // Update active class
        elements.typeFilters.querySelectorAll('.filter-pill').forEach(btn => btn.classList.remove('active'));
        pill.classList.add('active');
        
        appState.activeTypeFilter = pill.dataset.type;
        renderFeed();
    });
    
    // Twitter Drawer Close
    elements.closeDrawerBtn.addEventListener('click', closeTwitterDrawer);
    
    // Hashtags
    elements.hashtagTags.forEach(tag => {
        const tagText = tag.dataset.tag;
        
        // Sync initial state with UI
        if (appState.selectedHashtags.has(tagText)) {
            tag.classList.add('active');
        }
        
        tag.addEventListener('click', () => {
            if (appState.selectedHashtags.has(tagText)) {
                appState.selectedHashtags.delete(tagText);
                tag.classList.remove('active');
            } else {
                appState.selectedHashtags.add(tagText);
                tag.classList.add('active');
            }
            regenerateTweetDraft();
        });
    });
    
    // Custom Tweet Text Editing
    elements.tweetTextarea.addEventListener('input', (e) => {
        appState.customTweetText = e.target.value;
        updateCharCount();
    });
    
    // Copy Tweet Button
    elements.copyTweetBtn.addEventListener('click', copyTweetToClipboard);
    
    // Tweet Button
    elements.tweetBtn.addEventListener('click', openTwitterIntent);
}

// Helper to sanitize / strip extra spacing
String.prototype.strip = function() {
    return this.trim().replace(/\s+/g, ' ');
};

// Fetch release notes from our Flask API
async function fetchReleaseNotes(isRefresh = false) {
    // Show spinner & skeletons
    elements.refreshBtn.disabled = true;
    const refreshIcon = elements.refreshBtn.querySelector('.refresh-icon');
    refreshIcon.classList.add('spinning');
    
    showSection('skeleton');
    
    try {
        const response = await fetch('/api/release-notes');
        const data = await response.json();
        
        if (data.success) {
            appState.allEntries = data.entries;
            renderFeed();
            showSection('feed');
        } else {
            showError(data.error || "An error occurred while parsing the feed.");
        }
    } catch (error) {
        showError("Could not connect to the local server. Please check if Flask is running.");
    } finally {
        // Remove spinner
        elements.refreshBtn.disabled = false;
        refreshIcon.classList.remove('spinning');
    }
}

// Render release notes grid with filters & search applied
function renderFeed() {
    elements.notesFeed.innerHTML = '';
    let totalDisplayedUpdates = 0;
    
    const query = appState.searchQuery;
    const filterType = appState.activeTypeFilter;
    
    appState.allEntries.forEach(entry => {
        // Filter the updates in this entry
        const filteredUpdates = entry.updates.filter(update => {
            const matchesType = (filterType === 'all' || update.type.toLowerCase() === filterType.toLowerCase());
            const matchesSearch = !query || 
                update.type.toLowerCase().includes(query) || 
                update.text.toLowerCase().includes(query) || 
                entry.date.toLowerCase().includes(query);
            return matchesType && matchesSearch;
        });
        
        if (filteredUpdates.length === 0) return;
        
        totalDisplayedUpdates += filteredUpdates.length;
        
        // Create Date Group Container
        const dateGroup = document.createElement('div');
        dateGroup.className = 'date-group';
        
        // Date Header
        const dateHeader = document.createElement('div');
        dateHeader.className = 'date-header';
        
        const dateTitle = document.createElement('h2');
        dateTitle.className = 'date-title';
        dateTitle.textContent = entry.date;
        
        const dateDivider = document.createElement('div');
        dateDivider.className = 'date-divider';
        
        dateHeader.appendChild(dateTitle);
        dateHeader.appendChild(dateDivider);
        
        if (entry.url) {
            const dateLink = document.createElement('a');
            dateLink.className = 'date-link';
            dateLink.href = entry.url;
            dateLink.target = '_blank';
            dateLink.innerHTML = `
                <span>View Source</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
            `;
            dateHeader.appendChild(dateLink);
        }
        
        dateGroup.appendChild(dateHeader);
        
        // Updates List Container
        const listContainer = document.createElement('div');
        listContainer.className = 'updates-list';
        
        filteredUpdates.forEach(update => {
            const isSelected = appState.selectedUpdate && appState.selectedUpdate.updateId === update.id;
            
            const card = document.createElement('div');
            card.className = `update-card ${isSelected ? 'selected' : ''}`;
            card.dataset.updateId = update.id;
            
            // Checkbox column
            const checkboxCol = document.createElement('div');
            checkboxCol.className = 'checkbox-column';
            checkboxCol.innerHTML = `
                <div class="custom-checkbox">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                </div>
            `;
            
            // Content column
            const contentCol = document.createElement('div');
            contentCol.className = 'content-column';
            
            // Meta: badge
            const cardMeta = document.createElement('div');
            cardMeta.className = 'card-meta';
            
            const badgeClass = `badge badge-${update.type.toLowerCase()}`;
            cardMeta.innerHTML = `<span class="${badgeClass}">${update.type}</span>`;
            
            // Body
            const cardBody = document.createElement('div');
            cardBody.className = 'card-body';
            cardBody.innerHTML = update.html;
            
            // Stop propagation on clicks inside links so selection isn't triggered
            cardBody.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', (e) => e.stopPropagation());
            });
            
            contentCol.appendChild(cardMeta);
            contentCol.appendChild(cardBody);
            
            card.appendChild(checkboxCol);
            card.appendChild(contentCol);
            
            // Click Handler for selecting a card
            card.addEventListener('click', () => handleCardSelect(update, entry));
            
            listContainer.appendChild(card);
        });
        
        dateGroup.appendChild(listContainer);
        elements.notesFeed.appendChild(dateGroup);
    });
    
    // Update Stats Label
    elements.updatesCount.textContent = `Showing ${totalDisplayedUpdates} update${totalDisplayedUpdates !== 1 ? 's' : ''}`;
    
    // Show empty state if no items
    if (totalDisplayedUpdates === 0 && appState.allEntries.length > 0) {
        showSection('empty');
    } else if (appState.allEntries.length > 0) {
        showSection('feed');
    }
}

// Handle card selection
function handleCardSelect(update, entry) {
    const isCurrentlySelected = appState.selectedUpdate && appState.selectedUpdate.updateId === update.id;
    
    // Deselect all cards first in the UI
    document.querySelectorAll('.update-card').forEach(card => card.classList.remove('selected'));
    
    if (isCurrentlySelected) {
        // Deselect
        appState.selectedUpdate = null;
        closeTwitterDrawer();
    } else {
        // Select
        appState.selectedUpdate = {
            updateId: update.id,
            type: update.type,
            text: update.text,
            date: entry.date,
            url: entry.url
        };
        
        // Find the DOM card and add selected class
        const cardDOM = document.querySelector(`.update-card[data-update-id="${update.id}"]`);
        if (cardDOM) cardDOM.classList.add('selected');
        
        // Generate draft and open drawer
        regenerateTweetDraft();
        openTwitterDrawer();
    }
}

// Generate the initial tweet draft based on selected update and active hashtags
function regenerateTweetDraft() {
    if (!appState.selectedUpdate) return;
    
    const update = appState.selectedUpdate;
    const dateStr = update.date;
    
    // Base format:
    // Google BigQuery [Type] (Date):
    // [Text summary truncated if needed]
    //
    // Source: [URL]
    // [Hashtags]
    
    const prefix = `BigQuery ${update.type} (${dateStr}):\n`;
    const sourceLink = update.url ? `\n\nRead more: ${update.url}` : '';
    
    const hashtagsArray = Array.from(appState.selectedHashtags);
    const hashtagsStr = hashtagsArray.length > 0 ? `\n\n${hashtagsArray.join(' ')}` : '';
    
    // Calculate space remaining for the body text
    const fixedLength = prefix.length + sourceLink.length + hashtagsStr.length;
    const maxBodyLength = 280 - fixedLength - 4; // 4 extra chars buffer for "..."
    
    let bodyText = update.text;
    if (bodyText.length > maxBodyLength) {
        bodyText = bodyText.substring(0, maxBodyLength - 3) + '...';
    }
    
    appState.customTweetText = `${prefix}${bodyText}${sourceLink}${hashtagsStr}`;
    elements.tweetTextarea.value = appState.customTweetText;
    updateCharCount();
}

// Update character counter in drawer
function updateCharCount() {
    const length = appState.customTweetText.length;
    elements.charCounter.textContent = `${length}/280`;
    
    // Stylize character counter
    elements.charCounter.className = 'char-counter';
    if (length > 280) {
        elements.charCounter.classList.add('danger');
        elements.tweetBtn.disabled = true;
    } else if (length > 250) {
        elements.charCounter.classList.add('warning');
        elements.tweetBtn.disabled = false;
    } else {
        elements.tweetBtn.disabled = false;
    }
}

// Drawer animations
function openTwitterDrawer() {
    elements.twitterDrawer.classList.add('open');
}

function closeTwitterDrawer() {
    elements.twitterDrawer.classList.remove('open');
    // Deselect cards
    appState.selectedUpdate = null;
    document.querySelectorAll('.update-card').forEach(card => card.classList.remove('selected'));
}

// Copy to Clipboard
function copyTweetToClipboard() {
    if (!appState.customTweetText) return;
    
    navigator.clipboard.writeText(appState.customTweetText).then(() => {
        const btnTextSpan = elements.copyTweetBtn.querySelector('span');
        const origText = btnTextSpan.textContent;
        
        btnTextSpan.textContent = 'Copied!';
        elements.copyTweetBtn.style.background = 'rgba(16, 185, 129, 0.15)';
        elements.copyTweetBtn.style.color = '#10b981';
        elements.copyTweetBtn.style.borderColor = 'rgba(16, 185, 129, 0.4)';
        
        setTimeout(() => {
            btnTextSpan.textContent = origText;
            elements.copyTweetBtn.style.background = '';
            elements.copyTweetBtn.style.color = '';
            elements.copyTweetBtn.style.borderColor = '';
        }, 2000);
    });
}

// Open Twitter Intent Link
function openTwitterIntent() {
    if (!appState.customTweetText || appState.customTweetText.length > 280) return;
    
    const encodedText = encodeURIComponent(appState.customTweetText);
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodedText}`;
    window.open(twitterUrl, '_blank', 'width=550,height=420');
}

// UI State Switcher
function showSection(section) {
    elements.skeletonLoader.classList.add('hidden');
    elements.errorState.classList.add('hidden');
    elements.emptyState.classList.add('hidden');
    elements.notesFeed.classList.add('hidden');
    
    if (section === 'skeleton') {
        elements.skeletonLoader.classList.remove('hidden');
    } else if (section === 'error') {
        elements.errorState.classList.remove('hidden');
    } else if (section === 'empty') {
        elements.emptyState.classList.remove('hidden');
    } else if (section === 'feed') {
        elements.notesFeed.classList.remove('hidden');
    }
}

// Handle and show errors
function showError(message) {
    elements.errorMessage.textContent = message;
    showSection('error');
}
