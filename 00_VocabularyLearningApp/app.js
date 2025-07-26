class JapaneseVocabularyApp {
    constructor() {
        this.words = this.loadWords();
        this.currentSection = 'addWord';
        this.currentFrequency = 'high';
        this.dailyWordsDate = this.getTodayDate();
        this.dailyWords = this.loadDailyWords();
        
        this.initializeEventListeners();
        this.showSection('addWordSection');
    }

    // Data Management
    loadWords() {
        const words = localStorage.getItem('vocabularyWords');
        return words ? JSON.parse(words) : [];
    }

    saveWords() {
        localStorage.setItem('vocabularyWords', JSON.stringify(this.words));
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

    // Event Listeners
    initializeEventListeners() {
        // Navigation
        document.getElementById('addWordBtn').addEventListener('click', () => this.showSection('addWordSection'));
        document.getElementById('dailyWordsBtn').addEventListener('click', () => this.showSection('dailyWordsSection'));
        document.getElementById('reviewBtn').addEventListener('click', () => this.showSection('reviewSection'));
        document.getElementById('recentWordsBtn').addEventListener('click', () => this.showSection('recentWordsSection'));
        document.getElementById('allWordsBtn').addEventListener('click', () => this.showSection('allWordsSection'));

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

        // Event delegation for dynamically created word cards
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('word-vocabulary')) {
                const wordCard = e.target.closest('.word-card');
                if (wordCard) {
                    const wordId = wordCard.getAttribute('data-word-id');
                    this.toggleWordDetails(wordId);
                }
            }
        });
    }

    // Navigation
    showSection(sectionId) {
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
            'allWordsSection': 'allWordsBtn'
        };
        
        document.getElementById(navBtnMap[sectionId]).classList.add('active');

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
            frequency: 'medium',
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
                            frequency: 'medium',
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
    toggleWordDetails(wordId) {
        const detailsElement = document.getElementById(`details-${wordId}`);
        if (detailsElement) {
            if (detailsElement.style.display === 'none') {
                detailsElement.style.display = 'block';
            } else {
                detailsElement.style.display = 'none';
            }
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
    createWordCard(word, isDailyView = false) {
        return `
            <div class="word-card" data-word-id="${word.id}">
                <div class="word-vocabulary">${this.escapeHTML(word.vocabulary)}</div>
                <div class="word-details" id="details-${word.id}" style="display: none;">
                    <div class="word-pronunciation">${this.escapeHTML(word.pronunciation)}</div>
                    <div class="word-meaning">${this.escapeHTML(word.meaning)}</div>
                </div>
                <div class="word-actions">
                    ${this.createFrequencyButtons(word, isDailyView)}
                    <button class="delete-btn" onclick="app.deleteWord(${word.id})">Delete</button>
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
}

// Initialize the app
const app = new JapaneseVocabularyApp();