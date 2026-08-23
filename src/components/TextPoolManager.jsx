import React, { useState, useEffect, useCallback } from 'react';

const TEIL_OPTIONS = [
  { value: 'lesen_teil1', label: 'Lesen Teil 1 — Newspaper Articles', fields: ['title', 'text'] },
  { value: 'lesen_teil2', label: 'Lesen Teil 2 — Floor Directories', fields: ['title', 'directory'] },
  { value: 'lesen_teil3', label: 'Lesen Teil 3 — Emails / Letters', fields: ['sender', 'recipient', 'subject', 'text'] },
  { value: 'lesen_teil4', label: 'Lesen Teil 4 — Classified Ads', fields: ['title', 'ads'] },
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

export default function TextPoolManager({ onBackToHome }) {
  const [selectedTeil, setSelectedTeil] = useState('lesen_teil1');
  const [texts, setTexts] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [newTextJson, setNewTextJson] = useState('');
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');
  const [expandedIndex, setExpandedIndex] = useState(null);

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

  return (
    <div className="text-pool-manager">
      <div className="pool-header">
        <button className="back-btn" onClick={onBackToHome}>← Back to Home</button>
        <h2>📚 Manage Text Pool</h2>
        <p className="pool-subtitle">Add, view, and remove certified texts for exam generation</p>
      </div>

      {/* Pool Stats */}
      <div className="pool-stats-grid">
        {TEIL_OPTIONS.map(opt => (
          <div
            key={opt.value}
            className={`pool-stat-card ${selectedTeil === opt.value ? 'active' : ''}`}
            onClick={() => setSelectedTeil(opt.value)}
          >
            <div className="stat-label">{opt.label.split('—')[0].trim()}</div>
            <div className="stat-count">{stats[opt.value] || 0}</div>
            <div className="stat-desc">texts</div>
          </div>
        ))}
      </div>

      <div className="pool-content-grid">
        {/* Left: Current Texts List */}
        <div className="pool-texts-list glass-panel">
          <h3>Current Texts — {TEIL_OPTIONS.find(o => o.value === selectedTeil)?.label}</h3>
          {loading ? (
            <div className="pool-loading">Loading texts...</div>
          ) : texts.length === 0 ? (
            <div className="pool-empty">No texts in this pool yet.</div>
          ) : (
            <div className="pool-items">
              {texts.map((t, i) => (
                <div key={i} className="pool-item">
                  <div className="pool-item-header" onClick={() => setExpandedIndex(expandedIndex === i ? null : i)}>
                    <span className="pool-item-index">#{i + 1}</span>
                    <span className="pool-item-title">{t.title}</span>
                    {t.word_count && <span className="pool-item-wc">{t.word_count} words</span>}
                    {t.floors && <span className="pool-item-wc">{t.floors} floors</span>}
                    {t.ad_count && <span className="pool-item-wc">{t.ad_count} ads</span>}
                    <button
                      className="pool-item-delete"
                      onClick={(e) => { e.stopPropagation(); handleRemoveText(i); }}
                      title="Remove this text"
                    >✕</button>
                  </div>
                  {expandedIndex === i && (
                    <div className="pool-item-preview">
                      {t.preview}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Add New Text */}
        <div className="pool-add-section glass-panel">
          <h3>Add New Text</h3>
          <div className="add-text-controls">
            <button className="template-btn" onClick={loadTemplate}>
              📋 Load Template for {selectedTeil.replace('lesen_', 'Teil ').replace('teil', '')}
            </button>
          </div>
          <textarea
            className="add-text-area"
            value={newTextJson}
            onChange={(e) => setNewTextJson(e.target.value)}
            placeholder="Paste your JSON text object here, or click 'Load Template' above..."
            rows={16}
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
    </div>
  );
}
