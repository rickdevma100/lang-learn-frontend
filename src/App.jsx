import React, { useState, useEffect, useRef } from 'react';

function App() {
  const [activeTab, setActiveTab] = useState('dialogue'); // 'dialogue' or 'explain'

  // Dialogue states
  const [scenario, setScenario] = useState('ordering a hot chocolate');
  const [level, setLevel] = useState('A2');
  const [temperature, setTemperature] = useState(0.7);
  const [loadingDialogue, setLoadingDialogue] = useState(false);
  const [dialogueData, setDialogueData] = useState(null);
  const [dialogueError, setDialogueError] = useState(null);
  const [dialogueFeedback, setDialogueFeedback] = useState(null); // 'up', 'down', or null

  // Word Explainer states
  const [word, setWord] = useState('Ausbildung');
  const [loadingWord, setLoadingWord] = useState(false);
  const [wordData, setWordData] = useState(null);
  const [wordError, setWordError] = useState(null);
  const [wordFeedback, setWordFeedback] = useState(null); // 'up', 'down', or null

  const messagesEndRef = useRef(null);

  // Auto scroll to bottom of chat
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [dialogueData, loadingDialogue]);

  // Handle generating a new dialogue
  const handleGenerateDialogue = async (e) => {
    e.preventDefault();
    if (!scenario.trim()) return;

    setLoadingDialogue(true);
    setDialogueError(null);
    setDialogueData(null);
    setDialogueFeedback(null);

    try {
      const response = await fetch('/api/scenario_dialogue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario,
          level,
          temperature: parseFloat(temperature),
          language: 'German'
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      setDialogueData(data);
    } catch (err) {
      console.error(err);
      setDialogueError(err.message || 'Failed to generate dialogue. Please try again.');
    } finally {
      setLoadingDialogue(false);
    }
  };

  // Helper to explain a word by name
  const explainWordByName = async (wordToExplain) => {
    if (!wordToExplain.trim()) return;

    setLoadingWord(true);
    setWordError(null);
    setWordData(null);
    setWordFeedback(null);

    try {
      const response = await fetch('/api/explain_word', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: wordToExplain })
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      setWordData(data);
    } catch (err) {
      console.error(err);
      setWordError(err.message || 'Failed to explain word. Please try again.');
    } finally {
      setLoadingWord(false);
    }
  };

  // Handle explaining a word from form submission
  const handleExplainWord = async (e) => {
    e.preventDefault();
    explainWordByName(word);
  };

  // Handle clicking a word in the dialogue
  const handleWordClick = (clickedWord) => {
    // Strip punctuation
    const cleaned = clickedWord.replace(/[^a-zA-ZäöüÄÖÜß]/g, '');
    if (!cleaned) return;
    setWord(cleaned);
    setActiveTab('explain');
    explainWordByName(cleaned);
  };

  // Render text with clickable words
  const renderClickableText = (text) => {
    if (!text) return null;
    const tokens = text.split(/(\s+|[.,!?;:"'()]+)/g);
    return tokens.map((token, i) => {
      const isWord = /[a-zA-ZäöüÄÖÜß]+/.test(token);
      if (isWord) {
        return (
          <span 
            key={i} 
            className="clickable-word"
            onClick={() => handleWordClick(token)}
          >
            {token}
          </span>
        );
      }
      return <span key={i}>{token}</span>;
    });
  };

  // Handle recording feedback
  const handleFeedback = async (endpoint, type) => {
    // Determine current state and set local state
    let targetFeedbackState = type;
    if (endpoint === 'scenario_dialogue') {
      if (dialogueFeedback === type) return; // Prevent duplicate clicks
      setDialogueFeedback(type);
    } else if (endpoint === 'explain_word') {
      if (wordFeedback === type) return;
      setWordFeedback(type);
    }

    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint,
          language: 'German',
          level: endpoint === 'scenario_dialogue' ? level : 'A2',
          rating: type
        })
      });
    } catch (err) {
      console.error('Failed to submit feedback:', err);
    }
  };

  return (
    <div className="app-container">
      {/* Header Panel */}
      <header className="app-header">
        <div className="brand">
          <div className="brand-icon">L</div>
          <h1 className="brand-title">LangLearn</h1>
        </div>
        
        <nav className="nav-tabs">
          <button 
            className={`tab-btn ${activeTab === 'dialogue' ? 'active' : ''}`}
            onClick={() => setActiveTab('dialogue')}
          >
            Dialogue Practice
          </button>
          <button 
            className={`tab-btn ${activeTab === 'explain' ? 'active' : ''}`}
            onClick={() => setActiveTab('explain')}
          >
            Word Explainer
          </button>
        </nav>
      </header>

      {/* Main Content Area */}
      <main>
        {activeTab === 'dialogue' ? (
          <div className="dashboard-grid">
            {/* Sidebar configuration */}
            <section className="glass-panel" style={{ padding: '1.5rem' }}>
              <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Configure Scenario</h2>
              <form onSubmit={handleGenerateDialogue}>
                <div className="form-group">
                  <label className="form-label">Scenario / Topic</label>
                  <textarea 
                    className="form-control"
                    value={scenario}
                    onChange={(e) => setScenario(e.target.value)}
                    placeholder="e.g. Asking for a menu, bargaining on a coffee mug..."
                    disabled={loadingDialogue}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Difficulty (CEFR Level)</label>
                  <select 
                    className="form-control"
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    disabled={loadingDialogue}
                  >
                    <option value="A1">A1 (Beginner)</option>
                    <option value="A2">A2 (Elementary)</option>
                    <option value="B1">B1 (Intermediate)</option>
                    <option value="B2">B2 (Upper Intermediate)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Creativity (Temperature: {temperature})</label>
                  <input 
                    type="range" 
                    min="0.1" 
                    max="1.0" 
                    step="0.1"
                    className="form-control"
                    style={{ padding: '0' }}
                    value={temperature}
                    onChange={(e) => setTemperature(e.target.value)}
                    disabled={loadingDialogue}
                  />
                </div>

                <button 
                  type="submit" 
                  className="btn" 
                  style={{ width: '100%', marginTop: '1rem' }}
                  disabled={loadingDialogue}
                >
                  {loadingDialogue ? 'Generating...' : 'Generate Dialogue'}
                </button>
              </form>
            </section>

            {/* Chat Display Panel */}
            <section className="glass-panel chat-container">
              <div className="chat-header">
                <h3>Conversation Display</h3>
                {dialogueData && (
                  <div className="chat-meta">
                    <span className="meta-badge">Latency: {dialogueData.latency_s}s</span>
                    <span className="meta-badge highlight">CEFR: {dialogueData.level || level} (Score: {dialogueData.cefr_score})</span>
                  </div>
                )}
              </div>

              <div className="chat-messages">
                {loadingDialogue && (
                  <div className="spinner-container">
                    <div className="spinner"></div>
                    <p style={{ color: 'var(--text-secondary)' }}>Crafting your scenario in German...</p>
                  </div>
                )}

                {dialogueError && (
                  <div style={{ color: 'var(--danger)', padding: '1rem', textAlign: 'center' }}>
                    <p>⚠️ {dialogueError}</p>
                  </div>
                )}

                {!loadingDialogue && !dialogueData && !dialogueError && (
                  <div className="chat-empty">
                    <div className="chat-empty-icon">💬</div>
                    <p>Describe a scenario on the left and click <strong>Generate Dialogue</strong> to start practicing.</p>
                  </div>
                )}

                {dialogueData && dialogueData.dialogue && dialogueData.dialogue.map((turn, index) => {
                  const isPersonA = turn.speaker.toLowerCase().includes('a');
                  return (
                    <div 
                      key={index} 
                      className={`chat-bubble-wrapper ${isPersonA ? 'left' : 'right'}`}
                    >
                      <span className="speaker-label">{turn.speaker}</span>
                      <div className="chat-bubble">
                        <div className="german-text">
                          {renderClickableText(turn.german)}
                        </div>
                        {turn.english && (
                          <div className="english-translation">
                            {turn.english}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {dialogueData && (
                <div className="feedback-container">
                  <span className="feedback-question">Is this dialogue helpful?</span>
                  <div className="feedback-actions">
                    <button 
                      className={`feedback-btn ${dialogueFeedback === 'up' ? 'active-up' : ''}`}
                      onClick={() => handleFeedback('scenario_dialogue', 'up')}
                      title="Thumbs Up"
                    >
                      👍
                    </button>
                    <button 
                      className={`feedback-btn ${dialogueFeedback === 'down' ? 'active-down' : ''}`}
                      onClick={() => handleFeedback('scenario_dialogue', 'down')}
                      title="Thumbs Down"
                    >
                      👎
                    </button>
                  </div>
                </div>
              )}
            </section>
          </div>
        ) : (
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            {/* Word Explainer input */}
            <section className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
              <form onSubmit={handleExplainWord} className="word-search-container">
                <input 
                  type="text" 
                  className="form-control"
                  value={word}
                  onChange={(e) => setWord(e.target.value)}
                  placeholder="Type a German word (e.g. Ausbildung, Gemütlichkeit)..."
                  disabled={loadingWord}
                  required
                />
                <button type="submit" className="btn" disabled={loadingWord}>
                  {loadingWord ? 'Explaining...' : 'Explain Word'}
                </button>
              </form>
            </section>

            {/* Word details view */}
            <section className="glass-panel">
              {loadingWord && (
                <div className="spinner-container">
                  <div className="spinner"></div>
                  <p style={{ color: 'var(--text-secondary)' }}>Analyzing word, example sentences, and synonyms...</p>
                </div>
              )}

              {wordError && (
                <div style={{ color: 'var(--danger)', padding: '2rem', textAlign: 'center' }}>
                  <p>⚠️ {wordError}</p>
                </div>
              )}

              {!loadingWord && !wordData && !wordError && (
                <div className="chat-empty" style={{ padding: '4rem 2rem' }}>
                  <div className="chat-empty-icon">📖</div>
                  <p>Type any German word above to get beginner-friendly definitions, translations, and synonyms.</p>
                </div>
              )}

              {wordData && (
                <div className="word-card">
                  <div className="word-header">
                    <div className="word-title-group">
                      <h2>{wordData.word || word}</h2>
                      <span className="part-of-speech">{wordData.part_of_speech || 'N/A'}</span>
                    </div>
                    {wordData.latency_s && (
                      <span className="meta-badge">Latency: {wordData.latency_s}s</span>
                    )}
                  </div>

                  <div className="word-section">
                    <h4 className="word-section-title">Meaning</h4>
                    <p className="meaning-text">{wordData.meaning || 'No description available.'}</p>
                  </div>

                  {(wordData.example_sentence_german || wordData.example_sentence_english) && (
                    <div className="word-section">
                      <h4 className="word-section-title">Example Usage</h4>
                      <div className="example-box">
                        {wordData.example_sentence_german && (
                          <p className="example-german">{wordData.example_sentence_german}</p>
                        )}
                        {wordData.example_sentence_english && (
                          <p className="example-english">{wordData.example_sentence_english}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {wordData.synonyms && wordData.synonyms.length > 0 && (
                    <div className="word-section" style={{ marginBottom: '2rem' }}>
                      <h4 className="word-section-title">Synonyms</h4>
                      <div className="synonyms-list">
                        {wordData.synonyms.map((syn, idx) => (
                          <span 
                            key={idx} 
                            className="synonym-tag"
                            onClick={() => {
                              setWord(syn.word);
                              explainWordByName(syn.word);
                            }}
                            style={{ cursor: 'pointer' }}
                            title={`Click to explain "${syn.word}"`}
                          >
                            <strong>{syn.word}</strong>
                            {syn.english && (
                              <span className="synonym-translation">({syn.english})</span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="feedback-container" style={{ margin: '2rem -2rem -2rem -2rem', borderRadius: '0 0 16px 16px' }}>
                    <span className="feedback-question">Is this explanation accurate and helpful?</span>
                    <div className="feedback-actions">
                      <button 
                        className={`feedback-btn ${wordFeedback === 'up' ? 'active-up' : ''}`}
                        onClick={() => handleFeedback('explain_word', 'up')}
                        title="Thumbs Up"
                      >
                        👍
                      </button>
                      <button 
                        className={`feedback-btn ${wordFeedback === 'down' ? 'active-down' : ''}`}
                        onClick={() => handleFeedback('explain_word', 'down')}
                        title="Thumbs Down"
                      >
                        👎
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
