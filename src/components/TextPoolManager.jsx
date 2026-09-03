import React, { useState, useEffect, useCallback, useRef } from 'react';

const TEIL_OPTIONS = [
  { value: 'lesen_teil1', label: 'Lesen Teil 1 — Newspaper Articles', icon: '📰', fields: ['title', 'text'] },
  { value: 'lesen_teil2', label: 'Lesen Teil 2 — Floor Directories', icon: '🏬', fields: ['title', 'directory'] },
  { value: 'lesen_teil3', label: 'Lesen Teil 3 — Emails / Letters', icon: '✉️', fields: ['sender', 'recipient', 'subject', 'text'] },
  { value: 'lesen_teil4', label: 'Lesen Teil 4 — Classified Ads', icon: '📢', fields: ['title', 'ads'] },
];

const TEIL_TEMPLATES = {
  lesen_teil1: `{
  "title": "Your article title in German",
  "text": "Full German article text (180-220 words). Write the complete newspaper/magazine article here.",
  "category": "zeitung"
}`,
  lesen_teil2: `{
  "title": "Kaufhaus Name Wegweiser",
  "directory": [
    {"floor": "3. Stock", "departments": "Department 1, Department 2, Department 3"},
    {"floor": "2. Stock", "departments": "Department 1, Department 2, Department 3"},
    {"floor": "1. Stock", "departments": "Department 1, Department 2, Department 3"},
    {"floor": "Erdgeschoss (EG)", "departments": "Department 1, Department 2, Department 3"},
    {"floor": "Untergeschoss (UG)", "departments": "Department 1, Department 2, Department 3"}
  ]
}`,
  lesen_teil3: `{
  "title": "Lesen Teil 3: E-Mail / Brief",
  "sender": "Name of sender",
  "recipient": "Name of recipient",
  "subject": "Email subject line",
  "text": "Full email text in German (200-250 words). Start with 'Liebe/r ...' greeting."
}`,
  lesen_teil4: `{
  "title": "Category title (e.g. Sport und Freizeit)",
  "ads": [
    {"id": "a", "title": "www.example1.de", "text": "Ad description text..."},
    {"id": "b", "title": "www.example2.de", "text": "Ad description text..."},
    {"id": "c", "title": "www.example3.de", "text": "Ad description text..."},
    {"id": "d", "title": "www.example4.de", "text": "Ad description text..."},
    {"id": "e", "title": "www.example5.de", "text": "Ad description text..."},
    {"id": "f", "title": "www.example6.de", "text": "Ad description text..."}
  ]
}`,
};

export default function TextPoolManager({ onBackToHome, onOpenWordExplainer }) {
  const [selectedTeil, setSelectedTeil] = useState('lesen_teil1');
  const [texts, setTexts] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [newTextJson, setNewTextJson] = useState('');
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');
  const [expandedIndex, setExpandedIndex] = useState(0);

  // Quick Word Explainer Modal State
  const [explainingWord, setExplainingWord] = useState(null);
  const [wordData, setWordData] = useState(null);
  const [loadingWord, setLoadingWord] = useState(false);
  const [wordError, setWordError] = useState(null);
  const [audioLoading, setAudioLoading] = useState(false);
  const audioRef = useRef(null);

  const apiBase = '/api';

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${apiBase}/pool_stats`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      const data = await res.json();
      if (data.success) setStats(data.stats);
    } catch (e) {
      console.error('Failed to fetch pool stats:', e);
    }
  }, []);

  const fetchTexts = useCallback(async (teil) => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/pool_list_texts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teil }),
      });
      const data = await res.json();
      if (data.success) {
        setTexts(data.texts || []);
        // Auto-expand first item if available
        if (data.texts && data.texts.length > 0) {
          setExpandedIndex(0);
        } else {
          setExpandedIndex(null);
        }
      }
    } catch (e) {
      console.error('Failed to fetch texts:', e);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchStats();
    fetchTexts(selectedTeil);
  }, [selectedTeil, fetchStats, fetchTexts]);

  // Handle clicking on any word in the text
  const handleWordClick = async (clickedWord) => {
    const cleaned = clickedWord.replace(/[^a-zA-ZäöüÄÖÜß]/g, '').trim();
    if (!cleaned || cleaned.length < 2) return;

    setExplainingWord(cleaned);
    setWordData(null);
    setWordError(null);
    setLoadingWord(true);

    try {
      const res = await fetch(`${apiBase}/explain_word`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: cleaned })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setWordData(data);
    } catch (err) {
      console.error('Failed to explain word:', err);
      setWordError(err.message || 'Could not explain word.');
    } finally {
      setLoadingWord(false);
    }
  };

  // Play TTS audio pronunciation for the word
  const handlePlayWordAudio = async (textToSpeak) => {
    if (!textToSpeak) return;
    setAudioLoading(true);
    try {
      const res = await fetch(`${apiBase}/tts_synthesize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToSpeak,
          language: 'German',
          speaker_role: 'default'
        })
      });
      if (!res.ok) throw new Error(`Audio status ${res.status}`);
      const blob = await res.blob();
      const audioUrl = URL.createObjectURL(blob);
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play();
      } else {
        const audio = new Audio(audioUrl);
        audio.play();
      }
    } catch (e) {
      console.warn('TTS playback error:', e);
    } finally {
      setAudioLoading(false);
    }
  };

  // Render clickable text tokens
  const renderClickableText = (text) => {
    if (!text) return null;
    const tokens = String(text).split(/(\s+|[.,!?;:"'()«»„“—\n]+)/g);
    return tokens.map((token, i) => {
      if (token === '\n') {
        return <br key={i} />;
      }
      const isWord = /[a-zA-ZäöüÄÖÜß]{2,}/.test(token);
      if (isWord) {
        return (
          <span
            key={i}
            className="pool-clickable-word"
            onClick={() => handleWordClick(token)}
            title={`Click to explain "${token}"`}
          >
            {token}
          </span>
        );
      }
      return <span key={i}>{token}</span>;
    });
  };

  const handleAddText = async () => {
    setAddError('');
    setAddSuccess('');
    try {
      JSON.parse(newTextJson); // Validate client-side
    } catch (e) {
      setAddError(`Invalid JSON: ${e.message}`);
      return;
    }
    try {
      const res = await fetch(`${apiBase}/pool_add_text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teil: selectedTeil, text_data: newTextJson }),
      });
      const data = await res.json();
      if (data.success) {
        setAddSuccess(`Added! Pool now has ${data.count} texts.`);
        setNewTextJson('');
        fetchTexts(selectedTeil);
        fetchStats();
      } else {
        setAddError(data.error || 'Failed to add text.');
      }
    } catch (e) {
      setAddError(`Network error: ${e.message}`);
    }
  };

  const handleRemoveText = async (index) => {
    if (!window.confirm(`Remove text #${index + 1}? This cannot be undone.`)) return;
    try {
      const res = await fetch(`${apiBase}/pool_remove_text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teil: selectedTeil, index }),
      });
      const data = await res.json();
      if (data.success) {
        fetchTexts(selectedTeil);
        fetchStats();
      }
    } catch (e) {
      console.error('Failed to remove text:', e);
    }
  };

  const loadTemplate = () => {
    setNewTextJson(TEIL_TEMPLATES[selectedTeil] || '');
    setAddError('');
    setAddSuccess('');
  };

  // Render complete structured text based on Teil type
  const renderFullTeilContent = (t) => {
    const full = t.full_data || t;

    if (selectedTeil === 'lesen_teil1') {
      // Newspaper Article
      const articleText = full.text || t.text || t.preview || '';
      const paragraphs = articleText.split(/\n+/).filter(p => p.trim());

      return (
        <div className="pool-full-view teil1-article-view">
          <div className="pool-reading-tip-banner">
            <span className="tip-icon">💡</span>
            <span><strong>Interactive Reading:</strong> Click any German word to see its translation, grammar explanation, and pronunciation.</span>
          </div>

          <div className="pool-article-headline">
            <h4>{renderClickableText(full.title || t.title)}</h4>
            <div className="pool-article-meta-tags">
              <span className="pool-badge-chip">📰 Newspaper Article</span>
              <span className="pool-badge-chip">⏱️ ~{Math.ceil((t.word_count || 180) / 100)} Min Read</span>
              <span className="pool-badge-chip">📊 {t.word_count || articleText.split(/\s+/).length} words</span>
            </div>
          </div>

          <div className="pool-article-body">
            {paragraphs.map((p, pIdx) => (
              <p key={pIdx} className="pool-article-paragraph">
                {renderClickableText(p)}
              </p>
            ))}
          </div>
        </div>
      );
    }

    if (selectedTeil === 'lesen_teil2') {
      // Floor Directory
      const directory = full.directory || t.directory || [];

      return (
        <div className="pool-full-view teil2-directory-view">
          <div className="pool-reading-tip-banner">
            <span className="tip-icon">💡</span>
            <span><strong>Store Directory:</strong> Click any department or floor text to look up vocabulary meanings.</span>
          </div>

          <div className="pool-directory-title">
            <h4>🏬 {renderClickableText(full.title || t.title || 'Kaufhaus Wegweiser')}</h4>
            <span className="pool-badge-chip">{directory.length} Floors</span>
          </div>

          <div className="pool-directory-table">
            {directory.map((row, rIdx) => (
              <div key={rIdx} className="pool-dir-row">
                <div className="pool-dir-floor-badge">
                  {row.floor}
                </div>
                <div className="pool-dir-dept-content">
                  {renderClickableText(row.departments)}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (selectedTeil === 'lesen_teil3') {
      // Emails / Letters
      const emailText = full.text || t.text || t.preview || '';
      const paragraphs = emailText.split(/\n+/).filter(p => p.trim());

      return (
        <div className="pool-full-view teil3-email-view">
          <div className="pool-reading-tip-banner">
            <span className="tip-icon">💡</span>
            <span><strong>Email / Letter:</strong> Click any German word to translate and hear its pronunciation.</span>
          </div>

          <div className="pool-email-envelope">
            <div className="pool-email-meta-row">
              <span className="email-meta-label">Von:</span>
              <span className="email-meta-value">{full.sender || t.sender || '—'}</span>
            </div>
            <div className="pool-email-meta-row">
              <span className="email-meta-label">An:</span>
              <span className="email-meta-value">{full.recipient || t.recipient || '—'}</span>
            </div>
            <div className="pool-email-meta-row">
              <span className="email-meta-label">Betreff:</span>
              <span className="email-meta-value email-subject">{renderClickableText(full.subject || t.subject || full.title || t.title)}</span>
            </div>
          </div>

          <div className="pool-email-body">
            {paragraphs.map((p, pIdx) => (
              <p key={pIdx} className="pool-email-paragraph">
                {renderClickableText(p)}
              </p>
            ))}
          </div>
        </div>
      );
    }

    if (selectedTeil === 'lesen_teil4') {
      // Classified Ads
      const ads = full.ads || t.ads || [];

      return (
        <div className="pool-full-view teil4-ads-view">
          <div className="pool-reading-tip-banner">
            <span className="tip-icon">💡</span>
            <span><strong>Classified Ads:</strong> Click any ad words to study German vocabulary in daily life contexts.</span>
          </div>

          <div className="pool-ads-header">
            <h4>📢 {renderClickableText(full.title || t.title || 'Kleinanzeigen')}</h4>
            <span className="pool-badge-chip">{ads.length} Classified Ads</span>
          </div>

          <div className="pool-ads-grid">
            {ads.map((ad, aIdx) => (
              <div key={ad.id || aIdx} className="pool-ad-card">
                <div className="pool-ad-card-top">
                  <span className="pool-ad-id-badge">Anzeige {String(ad.id || String.fromCharCode(97 + aIdx)).toUpperCase()}</span>
                  <span className="pool-ad-title-text">{renderClickableText(ad.title)}</span>
                </div>
                <div className="pool-ad-body-text">
                  {renderClickableText(ad.text)}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="pool-item-preview">
        {renderClickableText(t.preview || JSON.stringify(full))}
      </div>
    );
  };

  return (
    <div className="text-pool-manager">
      <audio ref={audioRef} style={{ display: 'none' }} />

      <div className="pool-header">
        <button className="back-btn" onClick={onBackToHome}>← Back to Home</button>
        <h2>📚 Manage Text Pool</h2>
        <p className="pool-subtitle">View full authentic texts, practice reading, look up word explanations, or manage certified content</p>
      </div>

      {/* Pool Stats Navigation */}
      <div className="pool-stats-grid">
        {TEIL_OPTIONS.map(opt => (
          <div
            key={opt.value}
            className={`pool-stat-card ${selectedTeil === opt.value ? 'active' : ''}`}
            onClick={() => setSelectedTeil(opt.value)}
          >
            <div className="stat-label">{opt.icon} {opt.label.split('—')[0].trim()}</div>
            <div className="stat-count">{stats[opt.value] || 0}</div>
            <div className="stat-desc">{opt.label.split('—')[1]?.trim()}</div>
          </div>
        ))}
      </div>

      <div className="pool-content-grid">
        {/* Left: Current Texts List & Full Reader */}
        <div className="pool-texts-list glass-panel">
          <div className="pool-list-topbar">
            <h3>📖 {TEIL_OPTIONS.find(o => o.value === selectedTeil)?.label}</h3>
            <span className="pool-total-badge">{texts.length} Available Texts</span>
          </div>

          {loading ? (
            <div className="pool-loading">
              <div className="spinner-small"></div>
              <span>Loading complete certified texts...</span>
            </div>
          ) : texts.length === 0 ? (
            <div className="pool-empty">No texts in this pool yet. Add one on the right!</div>
          ) : (
            <div className="pool-items">
              {texts.map((t, i) => {
                const isExpanded = expandedIndex === i;
                return (
                  <div key={i} className={`pool-item ${isExpanded ? 'expanded' : ''}`}>
                    <div
                      className="pool-item-header"
                      onClick={() => setExpandedIndex(isExpanded ? null : i)}
                    >
                      <span className="pool-item-index">#{i + 1}</span>
                      <span className="pool-item-title">{t.title || `Text ${i + 1}`}</span>
                      {t.word_count && <span className="pool-item-wc">📊 {t.word_count} words</span>}
                      {t.floors && <span className="pool-item-wc">🏬 {t.floors} floors</span>}
                      {t.ad_count && <span className="pool-item-wc">📢 {t.ad_count} ads</span>}
                      <span className="pool-item-toggle">{isExpanded ? '▲ Collapse' : '▼ Read Full'}</span>
                      <button
                        className="pool-item-delete"
                        onClick={(e) => { e.stopPropagation(); handleRemoveText(i); }}
                        title="Remove this text"
                      >✕</button>
                    </div>

                    {isExpanded && (
                      <div className="pool-item-expanded-container">
                        {renderFullTeilContent(t)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Add New Text */}
        <div className="pool-add-section glass-panel">
          <h3>➕ Add New Text to Pool</h3>
          <p className="pool-add-subtext">
            Add authentic CEFR A2 German material formatted in JSON to expand your exam question pool.
          </p>
          <div className="add-text-controls">
            <button className="template-btn" onClick={loadTemplate}>
              📋 Load Official {selectedTeil.replace('lesen_', 'Teil ').replace('teil', '')} Template
            </button>
          </div>
          <textarea
            className="add-text-area"
            value={newTextJson}
            onChange={(e) => setNewTextJson(e.target.value)}
            placeholder="Paste your JSON text object here, or click 'Load Template' above..."
            rows={15}
            spellCheck={false}
          />
          {addError && <div className="add-feedback error">{addError}</div>}
          {addSuccess && <div className="add-feedback success">{addSuccess}</div>}
          <button
            className="add-text-submit"
            onClick={handleAddText}
            disabled={!newTextJson.trim()}
          >
            ➕ Add Text to Pool
          </button>
        </div>
      </div>

      {/* =========================================================================
          QUICK WORD EXPLAINER MODAL / POPUP
          ========================================================================= */}
      {explainingWord && (
        <div className="modal-backdrop" onClick={() => setExplainingWord(null)}>
          <div className="quick-word-modal glass-panel" onClick={(e) => e.stopPropagation()}>
            <div className="quick-word-header">
              <div className="quick-word-title-group">
                <span className="quick-word-badge">📖 Word Explainer</span>
                <h3>{explainingWord}</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setExplainingWord(null)}>✕</button>
            </div>

            {loadingWord ? (
              <div className="quick-word-loading">
                <div className="spinner-small"></div>
                <span>Analyzing "{explainingWord}" with German Language AI...</span>
              </div>
            ) : wordError ? (
              <div className="quick-word-error">
                <p>⚠️ {wordError}</p>
                <button
                  className="quick-word-btn secondary"
                  onClick={() => handleWordClick(explainingWord)}
                >
                  Try Again
                </button>
              </div>
            ) : wordData ? (
              <div className="quick-word-content">
                <div className="quick-word-meta-row">
                  <span className="quick-word-pos">{wordData.part_of_speech || 'noun / verb'}</span>
                  <button
                    className="quick-word-audio-btn"
                    onClick={() => handlePlayWordAudio(wordData.word || explainingWord)}
                    disabled={audioLoading}
                    title="Listen to German pronunciation"
                  >
                    {audioLoading ? '⏳' : '🔊 Listen'}
                  </button>
                </div>

                <div className="quick-word-meaning-box">
                  <div className="meaning-label">Meaning:</div>
                  <div className="meaning-text">{wordData.meaning}</div>
                </div>

                {wordData.example_sentence_german && (
                  <div className="quick-word-example-box">
                    <div className="example-german">{wordData.example_sentence_german}</div>
                    <div className="example-english">{wordData.example_sentence_english}</div>
                  </div>
                )}

                {wordData.synonyms && wordData.synonyms.length > 0 && (
                  <div className="quick-word-synonyms">
                    <div className="synonyms-label">Related words:</div>
                    <div className="synonyms-chips">
                      {wordData.synonyms.map((s, sIdx) => (
                        <span
                          key={sIdx}
                          className="synonym-chip"
                          onClick={() => handleWordClick(s.word || s)}
                        >
                          {s.word || s} {s.english ? `(${s.english})` : ''}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="quick-word-actions">
                  {onOpenWordExplainer && (
                    <button
                      className="quick-word-btn primary"
                      onClick={() => {
                        setExplainingWord(null);
                        onOpenWordExplainer(explainingWord);
                      }}
                    >
                      <span>🔍 Open in Full Word Explainer ↗</span>
                    </button>
                  )}
                  <button
                    className="quick-word-btn secondary"
                    onClick={() => setExplainingWord(null)}
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
