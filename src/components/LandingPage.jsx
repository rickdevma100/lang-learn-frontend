import React, { useEffect, useState } from 'react';

export default function LandingPage({ onStartExam, onOpenPractice, theme, setTheme }) {
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch('/api/exam_history');
      if (res.ok) {
        const data = await res.json();
        if (data && data.history) {
          setHistory(data.history);
        }
      }
    } catch (e) {
      console.warn('Failed to load exam history:', e);
    } finally {
      setLoadingHistory(false);
    }
  };

  const formatDate = (isoStr) => {
    if (!isoStr) return '';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="landing-container">
      {/* Hero Section */}
      <div className="landing-hero">
        <div className="cert-pill">
          <span className="cert-dot"></span>
          <span>Goethe-Zertifikat A2 Preparation Suite</span>
        </div>
        <h1 className="landing-title">
          Master German A2 with <span className="brand-gradient">Official Exam Simulation</span>
        </h1>
        <p className="landing-subtitle">
          Practice authentic Goethe A2 Reading and Writing papers generated dynamically and evaluated in real-time according to official institute standards.
        </p>
      </div>

      {/* 3 Main Action Cards */}
      <div className="exam-cards-grid">
        {/* Card 1: Reading Test */}
        <div className="exam-action-card reading-card">
          <div className="card-top-tag">
            <span className="module-badge">Modul: Lesen</span>
            <span className="time-badge">⏱️ 30 Min</span>
          </div>
          <div className="card-icon-wrapper reading-icon">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
            </svg>
          </div>
          <h2 className="card-title">Take Reading Test</h2>
          <p className="card-german-title">Leseverstehen (Goethe A2)</p>
          <p className="card-desc">
            4 authentic Teile with 20 items: newspaper article, department store directory, personal email, and classified ads matching. Scored automatically out of 25.
          </p>
          <div className="card-features">
            <span className="feature-tag">📰 4 Teile / 20 Items</span>
            <span className="feature-tag">🏬 Info-Board Guide</span>
            <span className="feature-tag">🎯 /25 Exact Score</span>
          </div>
          <button
            id="btn-start-reading"
            className="card-action-btn reading-btn"
            onClick={() => onStartExam('lesen')}
          >
            <span>Start Reading Test</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </button>
        </div>

        {/* Card 2: Writing Test */}
        <div className="exam-action-card writing-card">
          <div className="card-top-tag">
            <span className="module-badge writing-badge">Modul: Schreiben</span>
            <span className="time-badge">⏱️ 30 Min</span>
          </div>
          <div className="card-icon-wrapper writing-icon">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 20h9"></path>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
            </svg>
          </div>
          <h2 className="card-title">Take Writing Test</h2>
          <p className="card-german-title">Schriftlicher Ausdruck (Goethe A2)</p>
          <p className="card-desc">
            2 communicative tasks: short SMS/note and a formal/semi-formal email. Evaluated with real-time word counters and AI Goethe rubric examiner.
          </p>
          <div className="card-features">
            <span className="feature-tag">📱 Teil 1: SMS / Note</span>
            <span className="feature-tag">✉️ Teil 2: Formal Email</span>
            <span className="feature-tag">🤖 AI Goethe Rubric</span>
          </div>
          <button
            id="btn-start-writing"
            className="card-action-btn writing-btn"
            onClick={() => onStartExam('schreiben')}
          >
            <span>Start Writing Test</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </button>
        </div>

        {/* Card 3: Dialog Practice */}
        <div className="exam-action-card practice-card">
          <div className="card-top-tag">
            <span className="module-badge practice-badge">Free Practice</span>
            <span className="time-badge">⚡ Interactive</span>
          </div>
          <div className="card-icon-wrapper practice-icon">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
          <h2 className="card-title">Dialog Practice</h2>
          <p className="card-german-title">Szenarien & Wortschatz</p>
          <p className="card-desc">
            Generate customized German conversation scenarios, practice speaking with speech synthesis & recognition, and look up vocabulary definitions with audio.
          </p>
          <div className="card-features">
            <span className="feature-tag">💬 Scenario Generator</span>
            <span className="feature-tag">🔊 Natural TTS Audio</span>
            <span className="feature-tag">📖 Word Explainer</span>
          </div>
          <button
            id="btn-start-practice"
            className="card-action-btn practice-btn"
            onClick={onOpenPractice}
          >
            <span>Open Dialog Practice</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </button>
        </div>
      </div>

      {/* Test History Section */}
      <div className="history-section glass-panel">
        <div className="history-header">
          <div className="history-title-group">
            <h3>Recent Exam Attempts (Stored on Redis)</h3>
            <p className="history-subtitle">Track your past performance and Goethe A2 pass records</p>
          </div>
          <button className="refresh-history-btn" onClick={fetchHistory} title="Refresh History">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10"></polyline>
              <polyline points="1 20 1 14 7 14"></polyline>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
          </button>
        </div>

        {loadingHistory ? (
          <div className="history-loading">
            <div className="spinner-small"></div>
            <span>Loading past test results from Redis...</span>
          </div>
        ) : history.length === 0 ? (
          <div className="history-empty">
            <p>No past exams completed yet. Choose a module above to take your first test!</p>
          </div>
        ) : (
          <div className="history-table-wrapper">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Module</th>
                  <th>Date & Time</th>
                  <th>Score (/25)</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h, i) => (
                  <tr key={h.submission_id || i}>
                    <td>
                      <span className={`hist-mod-tag ${h.module}`}>
                        {h.module === 'lesen' ? '📖 Lesen (Reading)' : '✍️ Schreiben (Writing)'}
                      </span>
                    </td>
                    <td className="hist-date">{formatDate(h.timestamp)}</td>
                    <td className="hist-score">
                      <strong>{h.module_score}</strong> / {h.max_module_score || 25}
                    </td>
                    <td>
                      <span className={`status-pill ${h.passed ? 'passed' : 'failed'}`}>
                        {h.passed ? '✓ Bestanden (Pass)' : '✗ Nicht bestanden (Fail)'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
