# Japanese Vocabulary Learning App

A web-based application for learning Japanese vocabulary with spaced repetition and daily study management.

## Features

1. **Add Vocabulary**: Input new words with vocabulary (漢字/ひらがな), pronunciation (ローマ字), and meaning (English)
2. **Daily Study**: Generate daily study sets of up to 50 words
3. **Frequency Marking**: Mark words as high, medium, or low priority for review
4. **Review Lists**: View words filtered by frequency priority
5. **Search & Browse**: View and search all vocabulary words
6. **Data Persistence**: All data saved locally in browser storage

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

3. Open your browser to `http://localhost:3000`

## Usage

### Adding Words
- Navigate to "Add Word" tab
- Fill in the vocabulary, pronunciation, and meaning fields
- Click "Add Word" to save

### Daily Study
- Go to "Daily Words" tab
- Click "Generate Today's Words" to create a study set
- Words are prioritized by frequency and review count
- Mark frequency during study to improve future recommendations

### Review System
- Use "Review" tab to focus on specific frequency levels
- High frequency = needs more practice
- Medium frequency = regular review
- Low frequency = occasional review

### Managing Vocabulary
- "All Words" tab shows complete vocabulary list
- Use search bar to find specific words
- Delete words you no longer need
- Update frequency ratings as you learn

## Project Structure

```
japanese-vocabulary-app/
├── index.html          # Main HTML structure
├── styles.css          # Application styling
├── app.js              # Core JavaScript functionality
├── package.json        # Project dependencies
└── README.md           # This file
```

## Browser Support

Works in all modern browsers with localStorage support.