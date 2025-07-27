class JapaneseVocabularyApp {
    constructor() {
        this.words = this.loadWords();
        this.lists = this.loadLists();
        this.currentSection = this.loadCurrentSection();
        this.currentFrequency = 'high';
        this.dailyWordsDate = this.getTodayDate();
        this.dailyWords = this.loadDailyWords();
        this.currentList = null;
        
        this.initializeEventListeners();
        this.loadInitialContent();
    }

    // Data Management
    loadWords() {
        const words = localStorage.getItem('vocabularyWords');
        return words ? JSON.parse(words) : [];
    }

    saveWords() {
        localStorage.setItem('vocabularyWords', JSON.stringify(this.words));
    }

    loadLists() {
        const lists = localStorage.getItem('vocabularyLists');
        return lists ? JSON.parse(lists) : [];
    }

    saveLists() {
        localStorage.setItem('vocabularyLists', JSON.stringify(this.lists));
    }

    loadDailyWords() {
        const dailyData = localStorage.getItem('dailyWords');
        if (dailyData) {
            const data = JSON.parse(dailyData);
            if (data.date === this.dailyWordsDate) {
                return data.words;
            }
        }
        return [];
    }

    saveDailyWords() {
        const dailyData = {
            date: this.dailyWordsDate,
            words: this.dailyWords
        };
        localStorage.setItem('dailyWords', JSON.stringify(dailyData));
    }

    getTodayDate() {
        return new Date().toDateString();
    }

    loadCurrentSection() {
        const savedSection = localStorage.getItem('currentSection');
        return savedSection || 'addWord';
    }

    saveCurrentSection() {
        localStorage.setItem('currentSection', this.currentSection);
    }

    getSectionId(sectionName) {
        const sectionMap = {
            'addWord': 'addWordSection',
            'dailyWords': 'dailyWordsSection',
            'review': 'reviewSection',
            'recentWords': 'recentWordsSection',
            'allWords': 'allWordsSection',
            'lists': 'listsSection'
        };
        return sectionMap[sectionName] || 'addWordSection';
    }

    loadInitialContent() {
        // Load content for the initially active section without UI transitions
        const sectionId = this.getSectionId(this.currentSection);
        switch(sectionId) {
            case 'dailyWordsSection':
                this.displayDailyWords();
                break;
            case 'reviewSection':
                this.displayReviewWords();
                break;
            case 'recentWordsSection':
                this.displayRecentWords();
                break;
            case 'allWordsSection':
                this.displayAllWords();
                break;
            case 'listsSection':
                this.displayLists();
                break;
        }
    }

    // Event Listeners
    initializeEventListeners() {
        // Navigation
        document.getElementById('addWordBtn').addEventListener('click', () => this.showSection('addWordSection'));
        document.getElementById('dailyWordsBtn').addEventListener('click', () => this.showSection('dailyWordsSection'));
        document.getElementById('reviewBtn').addEventListener('click', () => this.showSection('reviewSection'));
        document.getElementById('recentWordsBtn').addEventListener('click', () => this.showSection('recentWordsSection'));
        document.getElementById('allWordsBtn').addEventListener('click', () => this.showSection('allWordsSection'));
        document.getElementById('listsBtn').addEventListener('click', () => this.showSection('listsSection'));

        // Add word form
        document.getElementById('vocabularyForm').addEventListener('submit', (e) => this.handleAddWord(e));

        // Daily words
        document.getElementById('generateDailyWords').addEventListener('click', () => this.generateDailyWords());

        // Review frequency tabs
        document.querySelectorAll('.freq-tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.switchFrequencyTab(e.target.dataset.freq));
        });

        // Sync and Import/Export
        document.getElementById('syncBtn').addEventListener('click', () => this.showSyncOptions());
        document.getElementById('exportBtn').addEventListener('click', () => this.exportData());
        document.getElementById('importBtn').addEventListener('click', () => this.triggerImport());
        document.getElementById('importFile').addEventListener('change', (e) => this.importData(e));
        document.getElementById('searchInput').addEventListener('input', (e) => this.handleSearch(e.target.value));
        document.getElementById('clearAllWordsBtn').addEventListener('click', () => this.clearAllWords());

        // Lists functionality
        document.getElementById('createListBtn').addEventListener('click', () => this.createList());
        document.getElementById('backToListsBtn').addEventListener('click', () => this.showListsGrid());
        document.getElementById('editListNameBtn').addEventListener('click', () => this.editListName());
        document.getElementById('deleteListBtn').addEventListener('click', () => this.deleteCurrentList());

        // Event delegation for dynamically created word cards
        document.addEventListener('click', (e) => {
            // Don't flip if clicking on menu, buttons, or interactive elements
            if (e.target.closest('.word-menu') || 
                e.target.closest('button') || 
                e.target.closest('.word-label') ||
                e.target.closest('.word-actions')) {
                return;
            }

            // Check if clicking on vocabulary area (front) or pronunciation/meaning area (back)
            if (e.target.classList.contains('word-vocabulary') || 
                e.target.classList.contains('word-pronunciation') || 
                e.target.classList.contains('word-meaning')) {
                const wordCard = e.target.closest('.word-card');
                if (wordCard) {
                    this.toggleWordFlip(wordCard);
                }
            } else if (e.target.closest('.word-card-front') || e.target.closest('.word-card-back')) {
                // Allow clicking on empty areas of front/back to flip
                const wordCard = e.target.closest('.word-card');
                if (wordCard) {
                    this.toggleWordFlip(wordCard);
                }
            }
            
            // Close menus when clicking outside
            if (!e.target.closest('.word-menu')) {
                const allMenus = document.querySelectorAll('.menu-dropdown');
                allMenus.forEach(menu => {
                    menu.style.display = 'none';
                });
            }
        });
    }

    // Navigation
    showSection(sectionId) {
        // Check if we're switching to a different section
        const currentActiveSection = document.querySelector('.section.active');
        const isNewSection = !currentActiveSection || currentActiveSection.id !== sectionId;
        
        // Clean up any active edit forms before switching sections
        this.cancelAllActiveEdits();
        
        // Force close any dropdown menus
        document.querySelectorAll('.menu-dropdown').forEach(menu => {
            menu.style.display = 'none';
        });
        
        // Update navigation buttons
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.section').forEach(section => section.classList.remove('active'));

        // Show selected section
        document.getElementById(sectionId).classList.add('active');
        
        // Update active nav button
        const navBtnMap = {
            'addWordSection': 'addWordBtn',
            'dailyWordsSection': 'dailyWordsBtn',
            'reviewSection': 'reviewBtn',
            'recentWordsSection': 'recentWordsBtn',
            'allWordsSection': 'allWordsBtn',
            'listsSection': 'listsBtn'
        };
        
        document.getElementById(navBtnMap[sectionId]).classList.add('active');

        // Save current section
        const sectionNameMap = {
            'addWordSection': 'addWord',
            'dailyWordsSection': 'dailyWords',
            'reviewSection': 'review',
            'recentWordsSection': 'recentWords',
            'allWordsSection': 'allWords',
            'listsSection': 'lists'
        };
        this.currentSection = sectionNameMap[sectionId];
        this.saveCurrentSection();

        // Only reload content if this is actually a new section (prevents interference with edit operations)
        if (isNewSection) {
            setTimeout(() => {
                // Load content for the section
                switch(sectionId) {
                    case 'dailyWordsSection':
                        this.displayDailyWords();
                        break;
                    case 'reviewSection':
                        this.displayReviewWords();
                        break;
                    case 'recentWordsSection':
                        this.displayRecentWords();
                        break;
                    case 'allWordsSection':
                        this.displayAllWords();
                        break;
                    case 'listsSection':
                        this.displayLists();
                        break;
                }
            }, 5);
        }
    }

    // Add Word Functionality
    handleAddWord(e) {
        e.preventDefault();
        
        const vocabulary = document.getElementById('vocabulary').value.trim();
        const pronunciation = document.getElementById('pronunciation').value.trim();
        const meaning = document.getElementById('meaning').value.trim();

        if (!vocabulary || !pronunciation || !meaning) {
            this.showErrorMessage('Please fill in all fields');
            return;
        }

        const newWord = {
            id: Date.now(),
            vocabulary,
            pronunciation,
            meaning,
            frequency: null,
            dateAdded: new Date().toISOString(),
            reviewCount: 0
        };

        this.words.push(newWord);
        this.saveWords();

        // Clear form
        document.getElementById('vocabularyForm').reset();
        
        // Show success feedback without alert
        this.showSuccessMessage('Word added successfully!');
    }

    // Daily Words Management
    generateDailyWords() {
        if (this.words.length === 0) {
            this.showErrorMessage('No words available. Please add some vocabulary first.');
            return;
        }

        // Prioritize words by frequency and review count
        const sortedWords = [...this.words].sort((a, b) => {
            const frequencyOrder = { high: 3, medium: 2, low: 1 };
            const freqDiff = frequencyOrder[b.frequency] - frequencyOrder[a.frequency];
            if (freqDiff !== 0) return freqDiff;
            return a.reviewCount - b.reviewCount;
        });

        this.dailyWords = sortedWords.slice(0, Math.min(50, sortedWords.length));
        this.saveDailyWords();
        this.displayDailyWords();
        
        this.showSuccessMessage(`Generated ${this.dailyWords.length} words for today's study!`);
    }

    displayDailyWords() {
        const container = document.getElementById('dailyWordsList');
        
        if (this.dailyWords.length === 0) {
            container.innerHTML = '<p>No daily words generated yet. Click "Generate Today\'s Words" to start.</p>';
            return;
        }

        container.innerHTML = this.dailyWords.map(word => this.createWordCard(word, true)).join('');
    }

    // Review Functionality
    switchFrequencyTab(frequency) {
        this.currentFrequency = frequency;
        
        // Update tab styling
        document.querySelectorAll('.freq-tab').forEach(tab => {
            tab.classList.remove('active');
            if (tab.dataset.freq === frequency) {
                tab.classList.add('active');
            }
        });

        this.displayReviewWords();
    }

    displayReviewWords() {
        const container = document.getElementById('reviewWordsList');
        const filteredWords = this.words.filter(word => word.frequency === this.currentFrequency);
        
        if (filteredWords.length === 0) {
            container.innerHTML = `<p>No words marked as ${this.currentFrequency} frequency.</p>`;
            return;
        }

        container.innerHTML = filteredWords.map(word => this.createWordCard(word)).join('');
    }

    // All Words Functionality
    displayAllWords(searchTerm = '') {
        const container = document.getElementById('allWordsList');
        let filteredWords = this.words;

        if (searchTerm) {
            filteredWords = this.words.filter(word => 
                word.vocabulary.toLowerCase().includes(searchTerm.toLowerCase()) ||
                word.pronunciation.toLowerCase().includes(searchTerm.toLowerCase()) ||
                word.meaning.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (filteredWords.length === 0) {
            container.innerHTML = searchTerm ? 
                '<p>No words found matching your search.</p>' : 
                '<p>No vocabulary words added yet.</p>';
            return;
        }

        container.innerHTML = filteredWords.map(word => this.createWordCard(word)).join('');
    }

    handleSearch(searchTerm) {
        this.displayAllWords(searchTerm);
    }

    // Recent Words Functionality
    displayRecentWords() {
        const container = document.getElementById('recentWordsList');
        
        if (this.words.length === 0) {
            container.innerHTML = '<p>No vocabulary words added yet.</p>';
            return;
        }

        // Sort by dateAdded (most recent first) and take first 30
        const recentWords = [...this.words]
            .sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded))
            .slice(0, 30);

        container.innerHTML = recentWords.map(word => this.createWordCard(word)).join('');
    }

    // Clear All Words Functionality
    clearAllWords() {
        this.showConfirmDialog(
            'Delete All Words',
            'Are you sure you want to delete ALL vocabulary words? This action cannot be undone.',
            () => {
                this.words = [];
                this.dailyWords = [];
                this.saveWords();
                this.saveDailyWords();
                
                // Refresh current view
                const activeSection = document.querySelector('.section.active').id;
                switch(activeSection) {
                    case 'dailyWordsSection':
                        this.displayDailyWords();
                        break;
                    case 'reviewSection':
                        this.displayReviewWords();
                        break;
                    case 'recentWordsSection':
                        this.displayRecentWords();
                        break;
                    case 'allWordsSection':
                        this.displayAllWords();
                        break;
                }
                
                this.showSuccessMessage('All words have been cleared.');
        });
    }

    // Sync Functionality
    showSyncOptions() {
        this.showInfoDialog(
            'Sync Options',
            'Use Export to save your data as a file, or Import to load data from a file. This allows you to sync between devices or backup your vocabulary.'
        );
    }

    exportData() {
        if (this.words.length === 0) {
            this.showErrorMessage('No vocabulary words to export.');
            return;
        }

        // Generate markdown table
        let markdownContent = '# Japanese Vocabulary Export\n\n';
        markdownContent += `Export Date: ${new Date().toLocaleDateString()}\n`;
        markdownContent += `Total Words: ${this.words.length}\n\n`;
        markdownContent += '| Vocabulary | Hiragana | Meaning |\n';
        markdownContent += '|------------|----------|----------|\n';
        
        this.words.forEach(word => {
            // Only replace pipes that are actually in the content (not markdown structure)
            const vocabulary = word.vocabulary || '';
            const hiragana = word.pronunciation || '';
            const meaning = word.meaning || '';
            
            // Use a placeholder that won't interfere with markdown
            const escapedVocab = vocabulary.replace(/\|/g, '｜');
            const escapedHiragana = hiragana.replace(/\|/g, '｜');
            const escapedMeaning = meaning.replace(/\|/g, '｜');
            
            markdownContent += `| ${escapedVocab} | ${escapedHiragana} | ${escapedMeaning} |\n`;
        });
        
        markdownContent += '\n---\n';
        markdownContent += 'Generated by Japanese Vocabulary Learning App\n';
        
        const blob = new Blob([markdownContent], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `japanese-vocabulary-${new Date().toISOString().split('T')[0]}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showSuccessMessage(`${this.words.length} words exported to markdown file!`);
    }

    triggerImport() {
        document.getElementById('importFile').click();
    }

    importData(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target.result;
                const words = this.parseMarkdownTable(content);
                
                if (words.length === 0) {
                    this.showErrorMessage('No valid vocabulary table found. Please ensure your file contains a markdown table with Vocabulary, Hiragana, and Meaning columns.');
                    return;
                }

                this.showConfirmDialog(
                    'Import Data',
                    `Import ${words.length} words? This will replace your current vocabulary.`,
                    () => {
                        this.words = words;
                        this.dailyWords = [];
                        this.saveWords();
                        this.saveDailyWords();
                        
                        // Refresh current view
                        const activeSection = document.querySelector('.section.active').id;
                        switch(activeSection) {
                            case 'dailyWordsSection':
                                this.displayDailyWords();
                                break;
                            case 'reviewSection':
                                this.displayReviewWords();
                                break;
                            case 'recentWordsSection':
                                this.displayRecentWords();
                                break;
                            case 'allWordsSection':
                                this.displayAllWords();
                                break;
                        }
                        
                        this.showSuccessMessage(`Successfully imported ${words.length} words!`);
                    }
                );
            } catch (error) {
                this.showErrorMessage('Error reading file. Please check the file format.');
            }
        };
        reader.readAsText(file);
        
        // Reset file input
        event.target.value = '';
    }

    parseMarkdownTable(content) {
        const words = [];
        const lines = content.split('\n');
        
        let headerIndex = -1;
        let vocabularyCol = -1;
        let hiraganaCol = -1;
        let meaningCol = -1;
        
        // Find the header row
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line.startsWith('|') && line.endsWith('|')) {
                // Remove leading and trailing pipes, then split
                const cleanLine = line.slice(1, -1);
                const columns = cleanLine.split('|').map(col => col.trim().toLowerCase());
                
                // Look for our expected columns (flexible matching)
                for (let j = 0; j < columns.length; j++) {
                    const col = columns[j];
                    if (col.includes('vocabulary') || col.includes('word')) {
                        vocabularyCol = j;
                    } else if (col.includes('hiragana') || col.includes('pronunciation') || col.includes('reading')) {
                        hiraganaCol = j;
                    } else if (col.includes('meaning') || col.includes('translation') || col.includes('english')) {
                        meaningCol = j;
                    }
                }
                
                // If we found all three columns, this is our header
                if (vocabularyCol !== -1 && hiraganaCol !== -1 && meaningCol !== -1) {
                    headerIndex = i;
                    break;
                }
            }
        }
        
        if (headerIndex === -1) {
            return words; // No valid header found
        }
        
        // Skip header and separator line, then parse data rows
        for (let i = headerIndex + 2; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Stop at end of table or file footer
            if (!line || line.startsWith('#') || line.startsWith('---') || line.startsWith('Generated by')) {
                break;
            }
            
            if (line.startsWith('|') && line.endsWith('|')) {
                // Remove leading and trailing pipes, then split
                const cleanLine = line.slice(1, -1);
                const columns = cleanLine.split('|').map(col => col.trim());
                
                if (columns.length > Math.max(vocabularyCol, hiraganaCol, meaningCol)) {
                    // Get the content and convert full-width pipes back to regular pipes
                    let vocabulary = (columns[vocabularyCol] || '').replace(/｜/g, '|').trim();
                    let hiragana = (columns[hiraganaCol] || '').replace(/｜/g, '|').trim();
                    let meaning = (columns[meaningCol] || '').replace(/｜/g, '|').trim();
                    
                    // Only add if all fields have content
                    if (vocabulary && hiragana && meaning) {
                        words.push({
                            id: Date.now() + Math.random(),
                            vocabulary: vocabulary,
                            pronunciation: hiragana,
                            meaning: meaning,
                            frequency: null,
                            dateAdded: new Date().toISOString(),
                            reviewCount: 0
                        });
                    }
                }
            }
        }
        
        return words;
    }

    // Markdown Helper Functions - Simplified approach

    escapeHTML(text) {
        if (!text) return '';
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // Word Card Interaction
    toggleWordFlip(wordCard) {
        if (wordCard.classList.contains('flipped')) {
            wordCard.classList.remove('flipped');
        } else {
            wordCard.classList.add('flipped');
        }
    }

    // Message System
    showSuccessMessage(message) {
        // Create or update success message element
        let successDiv = document.getElementById('successMessage');
        if (!successDiv) {
            successDiv = document.createElement('div');
            successDiv.id = 'successMessage';
            successDiv.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #48bb78;
                color: white;
                padding: 12px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                z-index: 1000;
                transition: all 0.3s ease;
            `;
            document.body.appendChild(successDiv);
        }
        
        successDiv.textContent = message;
        successDiv.style.opacity = '1';
        successDiv.style.transform = 'translateX(0)';
        
        // Hide after 3 seconds
        setTimeout(() => {
            successDiv.style.opacity = '0';
            successDiv.style.transform = 'translateX(100%)';
        }, 3000);
    }

    showErrorMessage(message) {
        let errorDiv = document.getElementById('errorMessage');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.id = 'errorMessage';
            errorDiv.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #f56565;
                color: white;
                padding: 12px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                z-index: 1000;
                transition: all 0.3s ease;
            `;
            document.body.appendChild(errorDiv);
        }
        
        errorDiv.textContent = message;
        errorDiv.style.opacity = '1';
        errorDiv.style.transform = 'translateX(0)';
        
        setTimeout(() => {
            errorDiv.style.opacity = '0';
            errorDiv.style.transform = 'translateX(100%)';
        }, 4000);
    }

    showInfoDialog(title, message) {
        this.createCustomDialog(title, message, [{
            text: 'OK',
            action: () => this.closeDialog()
        }]);
    }

    showConfirmDialog(title, message, onConfirm) {
        this.createCustomDialog(title, message, [
            {
                text: 'Cancel',
                action: () => this.closeDialog()
            },
            {
                text: 'Confirm',
                action: () => {
                    this.closeDialog();
                    onConfirm();
                },
                primary: true
            }
        ]);
    }

    createCustomDialog(title, message, buttons) {
        const overlay = document.createElement('div');
        overlay.id = 'dialogOverlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2000;
        `;

        const dialog = document.createElement('div');
        dialog.style.cssText = `
            background: white;
            border-radius: 12px;
            padding: 24px;
            max-width: 400px;
            width: 90%;
            box-shadow: 0 20px 40px rgba(0,0,0,0.2);
        `;

        const titleEl = document.createElement('h3');
        titleEl.textContent = title;
        titleEl.style.cssText = `
            margin: 0 0 16px 0;
            color: #2d3748;
            font-size: 1.2em;
        `;

        const messageEl = document.createElement('p');
        messageEl.textContent = message;
        messageEl.style.cssText = `
            margin: 0 0 24px 0;
            color: #4a5568;
            line-height: 1.5;
        `;

        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
            display: flex;
            gap: 12px;
            justify-content: flex-end;
        `;

        buttons.forEach(button => {
            const btn = document.createElement('button');
            btn.textContent = button.text;
            btn.style.cssText = `
                padding: 8px 16px;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-weight: 500;
                transition: background 0.2s ease;
                ${button.primary ? 
                    'background: #667eea; color: white;' : 
                    'background: #e2e8f0; color: #4a5568;'
                }
            `;
            btn.addEventListener('click', button.action);
            buttonContainer.appendChild(btn);
        });

        dialog.appendChild(titleEl);
        dialog.appendChild(messageEl);
        dialog.appendChild(buttonContainer);
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
    }

    closeDialog() {
        const overlay = document.getElementById('dialogOverlay');
        if (overlay) {
            document.body.removeChild(overlay);
        }
    }

    // Word Card Creation
    createWordCard(word, isDailyView = false, isListView = false) {
        const wordLists = this.getWordLists(word.id);
        
        return `
            <div class="word-card" data-word-id="${word.id}">
                <div class="word-card-inner">
                    <div class="word-card-front">
                        ${!isListView ? this.createWordMenu(word) : ''}
                        <div class="word-vocabulary">${this.escapeHTML(word.vocabulary)}</div>
                        ${wordLists.length > 0 ? this.createWordLabels(wordLists, word.id) : ''}
                        <div class="word-actions">
                            ${isListView ? this.createListWordActions(word) : this.createFrequencyButtons(word, isDailyView)}
                            ${!isListView ? `
                                <button class="edit-btn" onclick="app.editWord(${word.id})">Edit</button>
                                <button class="delete-btn" onclick="app.deleteWord(${word.id})">Delete</button>
                            ` : ''}
                        </div>
                    </div>
                    <div class="word-card-back">
                        <div class="word-pronunciation">${this.escapeHTML(word.pronunciation)}</div>
                        <div class="word-meaning">${this.escapeHTML(word.meaning)}</div>
                    </div>
                </div>
            </div>
        `;
    }

    createFrequencyButtons(word, isDailyView) {
        const frequencies = ['high', 'medium', 'low'];
        return frequencies.map(freq => `
            <button 
                class="freq-btn ${freq} ${word.frequency === freq ? 'active' : ''}" 
                onclick="app.updateFrequency(${word.id}, '${freq}', ${isDailyView})"
            >
                ${freq.charAt(0).toUpperCase() + freq.slice(1)}
            </button>
        `).join('');
    }

    createWordMenu(word) {
        const availableLists = this.lists.filter(list => !list.wordIds.includes(word.id));
        
        // Always show menu if there are lists or we can create new ones
        if (this.lists.length === 0 && availableLists.length === 0) {
            // Show only create new list option when no lists exist
        }

        const listOptions = availableLists.map(list => 
            `<div class="menu-item" onclick="app.addWordToList(${word.id}, ${list.id})">
                Add to "${this.escapeHTML(list.name)}"
            </div>`
        ).join('');

        const createNewListOption = `
            <div class="menu-item create-list-item" onclick="app.createNewListWithWord(${word.id})">
                ✚ Create New List
            </div>
        `;

        const hasContent = listOptions || true; // Always show if we have create option

        return `
            <div class="word-menu">
                <div class="menu-trigger" onclick="app.toggleWordMenu(${word.id})">
                    <span class="menu-dots">⋯</span>
                </div>
                <div class="menu-dropdown" id="menu${word.id}" style="display: none;">
                    ${listOptions}
                    ${listOptions && availableLists.length > 0 ? '<div class="menu-divider"></div>' : ''}
                    ${createNewListOption}
                </div>
            </div>
        `;
    }

    getWordLists(wordId) {
        return this.lists.filter(list => list.wordIds.includes(wordId));
    }

    createWordLabels(wordLists, wordId) {
        return `
            <div class="word-labels">
                ${wordLists.map(list => `
                    <span class="word-label">
                        ${this.escapeHTML(list.name)}
                        <span class="remove-label" onclick="event.stopPropagation(); app.removeWordFromSpecificList(${list.id}, ${wordId})">×</span>
                    </span>
                `).join('')}
            </div>
        `;
    }

    createListWordActions(word) {
        const otherLists = this.lists.filter(list => list.id !== this.currentList.id);
        const moveOptions = otherLists.map(list => 
            `<option value="${list.id}">${this.escapeHTML(list.name)}</option>`
        ).join('');

        return `
            <div class="list-word-actions">
                <button class="remove-from-list-btn" onclick="app.removeWordFromCurrentList(${word.id})">
                    Remove from List
                </button>
                ${otherLists.length > 0 ? `
                    <select class="move-to-list-select" id="moveSelect${word.id}">
                        <option value="">Move to...</option>
                        ${moveOptions}
                    </select>
                    <button class="move-to-list-btn" onclick="app.moveWordToList(${word.id})">
                        Move
                    </button>
                ` : ''}
                <button class="edit-btn" onclick="app.editWord(${word.id})">Edit</button>
                <button class="delete-btn" onclick="app.deleteWord(${word.id})">Delete</button>
            </div>
        `;
    }

    // Word Management
    updateFrequency(wordId, frequency, isDailyView = false) {
        const wordIndex = this.words.findIndex(w => w.id === wordId);
        if (wordIndex !== -1) {
            this.words[wordIndex].frequency = frequency;
            this.words[wordIndex].reviewCount += 1;
            this.saveWords();

            // Update daily words if this word is in today's list
            const dailyWordIndex = this.dailyWords.findIndex(w => w.id === wordId);
            if (dailyWordIndex !== -1) {
                this.dailyWords[dailyWordIndex] = this.words[wordIndex];
                this.saveDailyWords();
            }

            // Refresh current view
            if (isDailyView) {
                this.displayDailyWords();
            } else {
                const activeSection = document.querySelector('.section.active').id;
                switch(activeSection) {
                    case 'reviewSection':
                        this.displayReviewWords();
                        break;
                    case 'recentWordsSection':
                        this.displayRecentWords();
                        break;
                    case 'allWordsSection':
                        this.displayAllWords();
                        break;
                }
            }
        }
    }

    deleteWord(wordId) {
        this.showConfirmDialog(
            'Delete Word',
            'Are you sure you want to delete this word?',
            () => {
                this.words = this.words.filter(w => w.id !== wordId);
                this.dailyWords = this.dailyWords.filter(w => w.id !== wordId);
                this.saveWords();
                this.saveDailyWords();

                // Refresh current view
                const activeSection = document.querySelector('.section.active').id;
                switch(activeSection) {
                    case 'dailyWordsSection':
                        this.displayDailyWords();
                        break;
                    case 'reviewSection':
                        this.displayReviewWords();
                        break;
                    case 'recentWordsSection':
                        this.displayRecentWords();
                        break;
                    case 'allWordsSection':
                        this.displayAllWords();
                        break;
                }
        });
    }

    editWord(wordId) {
        const word = this.words.find(w => w.id === wordId);
        if (!word) {
            console.error(`Word with ID ${wordId} not found`);
            return;
        }

        const wordCard = document.querySelector(`[data-word-id="${wordId}"]`);
        if (!wordCard) {
            console.error(`Word card with ID ${wordId} not found in DOM`);
            return;
        }

        // Remove flip class if present
        wordCard.classList.remove('flipped');

        // Close any open menus
        const allMenus = document.querySelectorAll('.menu-dropdown');
        allMenus.forEach(menu => menu.style.display = 'none');

        // Check if there's already an edit form for this word
        const existingEditForm = document.querySelector(`#edit-form-${wordId}`);
        if (existingEditForm) {
            console.log(`Edit form already exists for word ${wordId}, removing it first`);
            this.cancelWordEdit(wordId);
        }

        const cardInner = wordCard.querySelector('.word-card-inner');
        const currentFront = wordCard.querySelector('.word-card-front');
        const currentBack = wordCard.querySelector('.word-card-back');

        if (!cardInner || !currentFront || !currentBack) {
            console.error(`Missing card elements for word ${wordId}`);
            return;
        }

        const editForm = document.createElement('div');
        editForm.className = 'edit-form';
        editForm.id = `edit-form-${wordId}`;
        editForm.innerHTML = `
            <div class="edit-field">
                <input type="text" id="edit-vocabulary-${wordId}" placeholder="Vocabulary" value="${this.escapeHTML(word.vocabulary)}">
            </div>
            <div class="edit-field">
                <input type="text" id="edit-pronunciation-${wordId}" placeholder="Pronunciation" value="${this.escapeHTML(word.pronunciation)}">
            </div>
            <div class="edit-field">
                <input type="text" id="edit-meaning-${wordId}" placeholder="Meaning" value="${this.escapeHTML(word.meaning)}">
            </div>
            <div class="edit-actions">
                <button class="save-btn" onclick="app.saveWordEdit(${wordId})">✓</button>
                <button class="cancel-btn" onclick="app.cancelWordEdit(${wordId})">✕</button>
            </div>
        `;

        // Hide front and back, show edit form inline
        currentFront.style.display = 'none';
        currentBack.style.display = 'none';
        cardInner.appendChild(editForm);
        
        // Focus on first input
        setTimeout(() => {
            const firstInput = editForm.querySelector('input');
            if (firstInput) firstInput.focus();
        }, 100);
    }

    saveWordEdit(wordId) {
        const vocabularyInput = document.getElementById(`edit-vocabulary-${wordId}`);
        const pronunciationInput = document.getElementById(`edit-pronunciation-${wordId}`);
        const meaningInput = document.getElementById(`edit-meaning-${wordId}`);

        const newVocabulary = vocabularyInput.value.trim();
        const newPronunciation = pronunciationInput.value.trim();
        const newMeaning = meaningInput.value.trim();

        if (!newVocabulary || !newPronunciation || !newMeaning) {
            this.showErrorMessage('All fields are required');
            return;
        }

        const wordIndex = this.words.findIndex(w => w.id === wordId);
        if (wordIndex !== -1) {
            this.words[wordIndex].vocabulary = newVocabulary;
            this.words[wordIndex].pronunciation = newPronunciation;
            this.words[wordIndex].meaning = newMeaning;
            this.saveWords();

            const dailyWordIndex = this.dailyWords.findIndex(w => w.id === wordId);
            if (dailyWordIndex !== -1) {
                this.dailyWords[dailyWordIndex] = this.words[wordIndex];
                this.saveDailyWords();
            }

            this.cancelWordEdit(wordId);
            this.refreshCurrentView();
            this.showSuccessMessage('Word updated successfully!');
        }
    }

    cancelWordEdit(wordId) {
        const wordCard = document.querySelector(`[data-word-id="${wordId}"]`);
        if (!wordCard) return;

        const cardInner = wordCard.querySelector('.word-card-inner');
        const editForm = cardInner.querySelector('.edit-form');
        const currentFront = wordCard.querySelector('.word-card-front');
        const currentBack = wordCard.querySelector('.word-card-back');

        if (editForm) {
            cardInner.removeChild(editForm);
        }

        currentFront.style.display = 'flex';
        currentBack.style.display = 'flex';
    }

    cancelAllActiveEdits() {
        // Find all active edit forms and cancel them
        const editForms = document.querySelectorAll('.edit-form');
        editForms.forEach(form => {
            const wordId = form.id.replace('edit-form-', '');
            if (wordId && !isNaN(parseInt(wordId))) {
                this.cancelWordEdit(parseInt(wordId));
            }
        });
        
        // Close any open menus
        const allMenus = document.querySelectorAll('.menu-dropdown');
        allMenus.forEach(menu => menu.style.display = 'none');
        
        // Remove flip state from all cards
        const flippedCards = document.querySelectorAll('.word-card.flipped');
        flippedCards.forEach(card => card.classList.remove('flipped'));
        
        // Clear any inline styles that might interfere
        const wordCardFronts = document.querySelectorAll('.word-card-front');
        const wordCardBacks = document.querySelectorAll('.word-card-back');
        
        wordCardFronts.forEach(front => {
            front.style.display = '';
        });
        
        wordCardBacks.forEach(back => {
            back.style.display = '';
        });
    }

    refreshCurrentView() {
        const activeSection = document.querySelector('.section.active').id;
        switch(activeSection) {
            case 'dailyWordsSection':
                this.displayDailyWords();
                break;
            case 'reviewSection':
                this.displayReviewWords();
                break;
            case 'recentWordsSection':
                this.displayRecentWords();
                break;
            case 'allWordsSection':
                this.displayAllWords();
                break;
            case 'listsSection':
                if (this.currentList) {
                    this.displayListWords();
                } else {
                    this.showListsGrid();
                }
                break;
        }
    }

    // Lists Management
    displayLists() {
        this.showListsGrid();
    }

    showListsGrid() {
        const listsGrid = document.getElementById('listsGrid');
        const selectedListView = document.getElementById('selectedListView');
        
        listsGrid.style.display = 'grid';
        selectedListView.style.display = 'none';
        
        if (this.lists.length === 0) {
            listsGrid.innerHTML = '<p style="grid-column: 1 / -1; text-align: center; color: #666;">No vocabulary lists created yet. Create your first list above!</p>';
            return;
        }

        listsGrid.innerHTML = this.lists.map(list => this.createListCard(list)).join('');
    }

    createListCard(list) {
        const wordCount = list.wordIds ? list.wordIds.length : 0;
        const previewWords = list.wordIds ? 
            list.wordIds.slice(0, 3).map(id => {
                const word = this.words.find(w => w.id === id);
                return word ? word.vocabulary : '';
            }).filter(v => v).join(', ') : '';
        
        const preview = previewWords ? `${previewWords}${wordCount > 3 ? '...' : ''}` : 'No words yet';
        
        return `
            <div class="list-card" onclick="app.showListView(${list.id})">
                <div class="list-card-header">
                    <div class="list-name">${this.escapeHTML(list.name)}</div>
                    <div class="list-word-count">${wordCount}</div>
                </div>
                <div class="list-preview">${this.escapeHTML(preview)}</div>
            </div>
        `;
    }

    createList() {
        const nameInput = document.getElementById('newListName');
        const listName = nameInput.value.trim();
        
        if (!listName) {
            this.showErrorMessage('Please enter a list name');
            return;
        }

        if (this.lists.some(list => list.name.toLowerCase() === listName.toLowerCase())) {
            this.showErrorMessage('A list with this name already exists');
            return;
        }

        const newList = {
            id: Date.now(),
            name: listName,
            wordIds: [],
            dateCreated: new Date().toISOString()
        };

        this.lists.push(newList);
        this.saveLists();
        
        nameInput.value = '';
        this.displayLists();
        this.showSuccessMessage(`List "${listName}" created successfully!`);
    }

    showListView(listId) {
        const list = this.lists.find(l => l.id === listId);
        if (!list) return;

        this.currentList = list;
        
        const listsGrid = document.getElementById('listsGrid');
        const selectedListView = document.getElementById('selectedListView');
        const listViewTitle = document.getElementById('listViewTitle');
        
        listsGrid.style.display = 'none';
        selectedListView.style.display = 'block';
        listViewTitle.textContent = list.name;
        
        this.displayListWords();
    }


    displayListWords() {
        const container = document.getElementById('listWordsList');
        
        if (!this.currentList || this.currentList.wordIds.length === 0) {
            container.innerHTML = '<p>No words in this list yet. Add some words above!</p>';
            return;
        }

        const listWords = this.currentList.wordIds.map(id => 
            this.words.find(w => w.id === id)
        ).filter(word => word);

        container.innerHTML = listWords.map(word => this.createWordCard(word, false, true)).join('');
    }

    removeWordFromCurrentList(wordId) {
        if (!this.currentList) return;
        
        this.currentList.wordIds = this.currentList.wordIds.filter(id => id !== wordId);
        
        const listIndex = this.lists.findIndex(l => l.id === this.currentList.id);
        if (listIndex !== -1) {
            this.lists[listIndex] = this.currentList;
            this.saveLists();
        }

        this.displayListWords();
        this.showSuccessMessage('Word removed from list');
    }

    moveWordToList(wordId) {
        const selectElement = document.getElementById(`moveSelect${wordId}`);
        const targetListId = parseInt(selectElement.value);
        
        if (!targetListId) {
            this.showErrorMessage('Please select a list to move to');
            return;
        }

        this.moveWordToAnotherList(wordId, targetListId);
    }

    moveWordToAnotherList(wordId, targetListId) {
        if (!this.currentList || this.currentList.id === targetListId) return;
        
        const targetList = this.lists.find(l => l.id === targetListId);
        if (!targetList) return;

        this.removeWordFromCurrentList(wordId);
        
        if (!targetList.wordIds.includes(wordId)) {
            targetList.wordIds.push(wordId);
            const targetListIndex = this.lists.findIndex(l => l.id === targetListId);
            if (targetListIndex !== -1) {
                this.lists[targetListIndex] = targetList;
                this.saveLists();
            }
        }

        this.showSuccessMessage(`Word moved to "${targetList.name}"`);
    }

    createNewListWithWord(wordId) {
        const word = this.words.find(w => w.id === wordId);
        if (!word) return;

        // Close the menu
        const menu = document.getElementById(`menu${wordId}`);
        if (menu) menu.style.display = 'none';

        // Prompt for list name
        const listName = prompt(`Create new list for "${word.vocabulary}":`);
        if (!listName || listName.trim() === '') return;

        const trimmedName = listName.trim();

        // Check if list name already exists
        if (this.lists.some(list => list.name.toLowerCase() === trimmedName.toLowerCase())) {
            this.showErrorMessage('A list with this name already exists');
            return;
        }

        // Create new list with the word
        const newList = {
            id: Date.now(),
            name: trimmedName,
            wordIds: [wordId],
            dateCreated: new Date().toISOString()
        };

        this.lists.push(newList);
        this.saveLists();

        this.refreshCurrentView();
        this.showSuccessMessage(`Created list "${trimmedName}" and added "${word.vocabulary}"`);
    }

    toggleWordMenu(wordId) {
        const menu = document.getElementById(`menu${wordId}`);
        const allMenus = document.querySelectorAll('.menu-dropdown');
        
        // Close all other menus
        allMenus.forEach(m => {
            if (m.id !== `menu${wordId}`) {
                m.style.display = 'none';
            }
        });
        
        // Toggle current menu
        if (menu) {
            menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
        }
    }

    addWordToList(wordId, listId) {
        const list = this.lists.find(l => l.id === listId);
        if (!list) return;

        if (!list.wordIds.includes(wordId)) {
            list.wordIds.push(wordId);
            const listIndex = this.lists.findIndex(l => l.id === listId);
            if (listIndex !== -1) {
                this.lists[listIndex] = list;
                this.saveLists();
            }

            // Close the menu
            const menu = document.getElementById(`menu${wordId}`);
            if (menu) menu.style.display = 'none';

            this.refreshCurrentView();
            this.showSuccessMessage(`Word added to "${list.name}"`);
        } else {
            this.showErrorMessage('Word is already in this list');
        }
    }

    removeWordFromSpecificList(listId, wordId) {
        const list = this.lists.find(l => l.id === listId);
        if (!list) return;

        list.wordIds = list.wordIds.filter(id => id !== wordId);
        const listIndex = this.lists.findIndex(l => l.id === listId);
        if (listIndex !== -1) {
            this.lists[listIndex] = list;
            this.saveLists();
        }

        // Small delay to ensure DOM updates are processed
        setTimeout(() => {
            this.refreshCurrentView();
        }, 10);
        
        this.showSuccessMessage(`Word removed from "${list.name}"`);
    }

    editListName() {
        if (!this.currentList) return;
        
        const newName = prompt('Enter new list name:', this.currentList.name);
        if (!newName || newName.trim() === '' || newName === this.currentList.name) return;
        
        if (this.lists.some(list => list.id !== this.currentList.id && list.name.toLowerCase() === newName.toLowerCase())) {
            this.showErrorMessage('A list with this name already exists');
            return;
        }

        this.currentList.name = newName;
        const listIndex = this.lists.findIndex(l => l.id === this.currentList.id);
        if (listIndex !== -1) {
            this.lists[listIndex] = this.currentList;
            this.saveLists();
        }

        document.getElementById('listViewTitle').textContent = newName;
        this.showSuccessMessage('List name updated');
    }

    deleteCurrentList() {
        if (!this.currentList) return;
        
        this.showConfirmDialog(
            'Delete List',
            `Are you sure you want to delete the list "${this.currentList.name}"? This action cannot be undone.`,
            () => {
                this.lists = this.lists.filter(l => l.id !== this.currentList.id);
                this.saveLists();
                this.currentList = null;
                this.showListsGrid();
                this.showSuccessMessage('List deleted successfully');
            }
        );
    }
}

// Initialize the app
const app = new JapaneseVocabularyApp();