import React, { useState, useEffect } from 'react';
import { ChevronLeft, Plus, RotateCcw, Check, X, Star, BookOpen, Settings, Upload, FileText } from 'lucide-react';

const VocabApp = () => {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [currentDeck, setCurrentDeck] = useState(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [newWord, setNewWord] = useState('');
  const [newDefinition, setNewDefinition] = useState('');
  const [importStatus, setImportStatus] = useState('');
  const [newDeckName, setNewDeckName] = useState('');

  // Sample vocabulary decks
  const [decks, setDecks] = useState([
    {
      id: 1,
      name: "English Vocabulary",
      cards: [
        { word: "Serendipity", definition: "The occurrence of events by chance in a happy way", mastered: false },
        { word: "Ubiquitous", definition: "Present, appearing, or found everywhere", mastered: false },
        { word: "Ephemeral", definition: "Lasting for a very short time", mastered: true },
        { word: "Cognitive", definition: "Related to the mental process of perception and learning", mastered: false },
        { word: "Paradigm", definition: "A typical example or pattern of something", mastered: false }
      ]
    },
    {
      id: 2,
      name: "SAT Words",
      cards: [
        { word: "Ameliorate", definition: "To make better or improve", mastered: false },
        { word: "Copious", definition: "Abundant in supply or quantity", mastered: true },
        { word: "Erudite", definition: "Having great knowledge or learning", mastered: false }
      ]
    }
  ]);

  const handleFlipCard = () => {
    setIsFlipped(!isFlipped);
    setShowAnswer(!showAnswer);
  };

  const handleNextCard = () => {
    if (currentCardIndex < currentDeck.cards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
    } else {
      setCurrentCardIndex(0);
    }
    setShowAnswer(false);
    setIsFlipped(false);
  };

  const handlePrevCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
    } else {
      setCurrentCardIndex(currentDeck.cards.length - 1);
    }
    setShowAnswer(false);
    setIsFlipped(false);
  };

  const markAsMastered = (mastered) => {
    const updatedDecks = decks.map(deck => {
      if (deck.id === currentDeck.id) {
        const updatedCards = [...deck.cards];
        updatedCards[currentCardIndex].mastered = mastered;
        return { ...deck, cards: updatedCards };
      }
      return deck;
    });
    setDecks(updatedDecks);
    setCurrentDeck(updatedDecks.find(d => d.id === currentDeck.id));
    handleNextCard();
  };

  const addNewCard = () => {
    if (newWord.trim() && newDefinition.trim()) {
      const updatedDecks = decks.map(deck => {
        if (deck.id === currentDeck.id) {
          return {
            ...deck,
            cards: [...deck.cards, { word: newWord, definition: newDefinition, mastered: false }]
          };
        }
        return deck;
      });
      setDecks(updatedDecks);
      setCurrentDeck(updatedDecks.find(d => d.id === currentDeck.id));
      setNewWord('');
      setNewDefinition('');
      setCurrentScreen('study');
    }
  };

  const resetDeck = () => {
    const resetDecks = decks.map(deck => {
      if (deck.id === currentDeck.id) {
        return {
          ...deck,
          cards: deck.cards.map(card => ({ ...card, mastered: false }))
        };
      }
      return deck;
    });
    setDecks(resetDecks);
    setCurrentDeck(resetDecks.find(d => d.id === currentDeck.id));
    setCurrentCardIndex(0);
    setShowAnswer(false);
    setIsFlipped(false);
  };

  const handleFileImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setImportStatus('Importing...');

    try {
      const text = await file.text();
      let cards = [];
      
      // Detect file type and parse accordingly
      if (file.name.endsWith('.csv') || file.type === 'text/csv') {
        cards = parseCSV(text);
      } else if (file.name.endsWith('.txt')) {
        cards = parseText(text);
      } else {
        throw new Error('Unsupported file format. Please use CSV or TXT files.');
      }

      if (cards.length === 0) {
        throw new Error('No valid cards found in the file.');
      }

      // Create new deck
      const newDeck = {
        id: Date.now(),
        name: newDeckName || file.name.replace(/\.[^/.]+$/, ""),
        cards: cards
      };

      setDecks([...decks, newDeck]);
      setImportStatus(`Successfully imported ${cards.length} cards!`);
      setNewDeckName('');
      
      // Clear the file input
      event.target.value = '';
      
      setTimeout(() => {
        setImportStatus('');
        setCurrentScreen('home');
      }, 2000);

    } catch (error) {
      setImportStatus(`Error: ${error.message}`);
      setTimeout(() => setImportStatus(''), 3000);
    }
  };

  const parseCSV = (text) => {
    const lines = text.split('\n').filter(line => line.trim());
    const cards = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Handle CSV with quotes and commas
      const parts = parseCSVLine(line);
      
      if (parts.length >= 2) {
        const word = parts[0].trim();
        const definition = parts[1].trim();
        
        if (word && definition) {
          cards.push({
            word: word,
            definition: definition,
            mastered: false
          });
        }
      }
    }

    return cards;
  };

  const parseCSVLine = (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current);
    return result.map(item => item.replace(/^"|"$/g, ''));
  };

  const parseText = (text) => {
    const lines = text.split('\n').filter(line => line.trim());
    const cards = [];

    for (let line of lines) {
      line = line.trim();
      if (!line) continue;

      // Try different separators
      let parts = [];
      if (line.includes('\t')) {
        parts = line.split('\t');
      } else if (line.includes('|')) {
        parts = line.split('|');
      } else if (line.includes(':')) {
        parts = line.split(':');
      } else if (line.includes(';')) {
        parts = line.split(';');
      }

      if (parts.length >= 2) {
        const word = parts[0].trim();
        const definition = parts.slice(1).join(' ').trim();
        
        if (word && definition) {
          cards.push({
            word: word,
            definition: definition,
            mastered: false
          });
        }
      }
    }

    return cards;
  };

  const HomeScreen = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Status bar */}
      <div className="flex justify-between items-center px-6 py-2 text-sm">
        <span className="font-medium">9:41</span>
        <span className="font-medium">100%</span>
      </div>

      {/* Header */}
      <div className="px-6 py-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Vocabulary</h1>
        <p className="text-gray-600">Choose a deck to start learning</p>
      </div>

      {/* Deck cards */}
      <div className="px-6 space-y-4">
        {decks.map(deck => {
          const masteredCount = deck.cards.filter(card => card.mastered).length;
          const progress = (masteredCount / deck.cards.length) * 100;
          
          return (
            <div
              key={deck.id}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 active:scale-95 transition-transform cursor-pointer"
              onClick={() => {
                setCurrentDeck(deck);
                setCurrentScreen('study');
                setCurrentCardIndex(0);
                setShowAnswer(false);
                setIsFlipped(false);
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xl font-semibold text-gray-900">{deck.name}</h3>
                <BookOpen className="w-6 h-6 text-blue-500" />
              </div>
              <p className="text-gray-600 mb-4">{deck.cards.length} cards</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-500">{masteredCount}/{deck.cards.length} mastered</p>
            </div>
          );
        })}

        {/* Import deck button */}
        <div
          className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 shadow-sm border border-gray-100 active:scale-95 transition-transform cursor-pointer"
          onClick={() => setCurrentScreen('import')}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xl font-semibold text-white">Import Deck</h3>
            <Upload className="w-6 h-6 text-white" />
          </div>
          <p className="text-white/80">Import from Anki CSV or text files</p>
        </div>
      </div>
    </div>
  );

  const StudyScreen = () => {
    const currentCard = currentDeck.cards[currentCardIndex];
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-sm">
          <button 
            onClick={() => setCurrentScreen('home')}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="text-center">
            <h2 className="font-semibold text-gray-900">{currentDeck.name}</h2>
            <p className="text-sm text-gray-600">{currentCardIndex + 1} of {currentDeck.cards.length}</p>
          </div>
          <button 
            onClick={() => setCurrentScreen('add')}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="px-6 py-2">
          <div className="w-full bg-white/50 rounded-full h-1">
            <div 
              className="bg-purple-500 h-1 rounded-full transition-all duration-300"
              style={{ width: `${((currentCardIndex + 1) / currentDeck.cards.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Flashcard */}
        <div className="flex-1 flex items-center justify-center px-6 py-8">
          <div 
            className={`w-full max-w-sm h-80 relative cursor-pointer transition-transform duration-500 transform-gpu ${isFlipped ? 'rotate-y-180' : ''}`}
            onClick={handleFlipCard}
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* Front of card */}
            <div className="absolute inset-0 bg-white rounded-3xl shadow-xl border border-gray-100 flex items-center justify-center p-8 backface-hidden">
              <div className="text-center">
                <h3 className="text-3xl font-bold text-gray-900 mb-4">{currentCard.word}</h3>
                <p className="text-gray-500">Tap to reveal definition</p>
              </div>
            </div>

            {/* Back of card */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl shadow-xl flex items-center justify-center p-8 rotate-y-180 backface-hidden">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-white mb-4">{currentCard.word}</h3>
                <p className="text-white/90 text-lg leading-relaxed">{currentCard.definition}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="px-6 pb-8">
          {showAnswer && (
            <div className="flex justify-center space-x-4 mb-6">
              <button
                onClick={() => markAsMastered(false)}
                className="flex items-center space-x-2 bg-red-500 text-white px-6 py-3 rounded-full font-medium hover:bg-red-600 transition-colors"
              >
                <X className="w-5 h-5" />
                <span>Need Practice</span>
              </button>
              <button
                onClick={() => markAsMastered(true)}
                className="flex items-center space-x-2 bg-green-500 text-white px-6 py-3 rounded-full font-medium hover:bg-green-600 transition-colors"
              >
                <Check className="w-5 h-5" />
                <span>Mastered</span>
              </button>
            </div>
          )}

          <div className="flex justify-between items-center">
            <button
              onClick={handlePrevCard}
              className="p-4 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            
            <div className="flex space-x-4">
              <button
                onClick={resetDeck}
                className="p-4 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow"
              >
                <RotateCcw className="w-6 h-6" />
              </button>
              {currentCard.mastered && (
                <div className="p-4">
                  <Star className="w-6 h-6 text-yellow-500 fill-current" />
                </div>
              )}
            </div>

            <button
              onClick={handleNextCard}
              className="p-4 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow rotate-180"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const AddCardScreen = () => (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-sm">
        <button 
          onClick={() => setCurrentScreen('study')}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h2 className="font-semibold text-gray-900">Add New Card</h2>
        <div className="w-10"></div>
      </div>

      {/* Form */}
      <div className="px-6 py-8">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Word</label>
            <input
              type="text"
              value={newWord}
              onChange={(e) => setNewWord(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Enter the vocabulary word"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Definition</label>
            <textarea
              value={newDefinition}
              onChange={(e) => setNewDefinition(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
              placeholder="Enter the definition"
            />
          </div>

          <button
            onClick={addNewCard}
            disabled={!newWord.trim() || !newDefinition.trim()}
            className="w-full bg-green-500 text-white py-4 rounded-2xl font-medium hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Add Card
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-sm mx-auto bg-white shadow-2xl rounded-3xl overflow-hidden">
      <style jsx>{`
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
      `}</style>
      
      {currentScreen === 'home' && <HomeScreen />}
      {currentScreen === 'study' && <StudyScreen />}
      {currentScreen === 'add' && <AddCardScreen />}
    </div>
  );
};

export default VocabApp;