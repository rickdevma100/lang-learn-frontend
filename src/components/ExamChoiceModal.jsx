import React, { useEffect, useState } from 'react';

export default function ExamChoiceModal({
  module,
  onClose,
  onStartNewExam,
  onSelectSavedPaper
}) {
  const [mode, setMode] = useState('choose'); // 'choose' | 'saved_list'
  const [savedPapers, setSavedPapers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    if (module) {
      setMode('choose');
      fetchPapers();
    }
  }, [module]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const fetchPapers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/exam_saved_papers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module, status: 'all', limit: 50 })
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.papers) {
          setSavedPapers(data.papers);
        }
      }
    } catch (e) {
      console.warn('Failed to load saved papers:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e, paperId) => {
    e.stopPropagation();
    if (!window.confirm('Delete this saved test paper from Redis?')) return;
    setDeletingId(paperId);
    try {
      const res = await fetch('/api/exam_delete_paper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paper_id: paperId })
      });
      if (res.ok) {
        setSavedPapers(prev => prev.filter(p => p.paper_id !== paperId));
      }
    } catch (err) {
      console.error('Failed to delete paper:', err);
    } finally {
      setDeletingId(null);
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

  if (!module) return null;

  const isLesen = module === 'lesen';
  const filteredPapers = savedPapers.filter(p => p.module === module);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="exam-choice-modal glass-panel" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="exam-choice-modal-header">
          <div className="modal-header-badge">
            <span className="badge-dot"></span>
            <span>
              Modul: {isLesen ? 'Lesen (Reading Comprehension)' : 'Schreiben (Writing Expression)'}
            </span>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="exam-choice-modal-title-group">
          <h2>
            {isLesen ? '📖 Goethe A2 Reading Exam' : '✍️ Goethe A2 Writing Exam'}
          </h2>
          <p>
            {mode === 'choose'
              ? 'Would you like to generate a brand new exam paper, or appear for an existing test cached in Redis?'
              : `Select one of the saved ${isLesen ? 'Lesen' : 'Schreiben'} question papers from Redis:`}
          </p>
        </div>

        {/* Mode 1: Choose (New vs Existing) */}
        {mode === 'choose' && (
          <div className="exam-options-grid">
            {/* Option 1: New Exam */}
            <div
              className="exam-option-card new-exam-option"
              onClick={() => {
                onClose();
                onStartNewExam(module);
              }}
            >
              <div className="option-icon-wrapper new-exam-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                </svg>
              </div>
              <div className="option-card-content">
                <div className="option-tag-pill new-tag">✨ Recommended</div>
                <h3>Generate New Exam</h3>
                <p>
                  Generate a completely fresh, authentic Goethe A2 paper with {isLesen ? '4 Teile & 20 questions' : '2 writing tasks'} powered by Metal AI.
                </p>
                <div className="option-features-list">
                  <span>✓ 100% Unique Questions</span>
                  <span>✓ Official A2 Standards</span>
                  <span>✓ Auto-saved to Redis</span>
                </div>
              </div>
              <button className="option-action-btn new-btn">
                <span>⚡ Generate & Start Exam</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </button>
            </div>

            {/* Option 2: Existing Exam from Redis */}
            <div
              className="exam-option-card existing-exam-option"
              onClick={() => setMode('saved_list')}
            >
              <div className="option-icon-wrapper existing-exam-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                </svg>
              </div>
              <div className="option-card-content">
                <div className="option-tag-pill redis-tag">
                  <span className="redis-mini-dot"></span>
                  <span>{filteredPapers.length} Available in Redis</span>
                </div>
                <h3>Appear for Existing Exam</h3>
                <p>
                  Select and take one of the previously generated question papers cached in your Redis registry.
                </p>
                <div className="option-features-list">
                  <span>✓ Instant load (0s wait)</span>
                  <span>✓ Compare past attempts</span>
                  <span>✓ Retake any test</span>
                </div>
              </div>
              <button className="option-action-btn existing-btn">
                <span>📁 Browse Saved Papers ({filteredPapers.length})</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Mode 2: Saved Papers List View */}
        {mode === 'saved_list' && (
          <div className="modal-saved-papers-view">
            <div className="modal-saved-papers-topbar">
              <button className="modal-back-btn" onClick={() => setMode('choose')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="19" y1="12" x2="5" y2="12"></line>
                  <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
                <span>Back to Choices</span>
              </button>

              <div className="modal-topbar-info">
                <span className="modal-redis-count">
                  📁 {filteredPapers.length} {isLesen ? 'Lesen' : 'Schreiben'} Papers in Redis
                </span>
                <button className="refresh-history-btn modal-refresh" onClick={fetchPapers} title="Refresh from Redis">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="23 4 23 10 17 10"></polyline>
                    <polyline points="1 20 1 14 7 14"></polyline>
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                  </svg>
                </button>
              </div>
            </div>

            {loading ? (
              <div className="modal-saved-loading">
                <div className="spinner-small"></div>
                <span>Loading saved papers from Redis...</span>
              </div>
            ) : filteredPapers.length === 0 ? (
              <div className="modal-saved-empty">
                <div className="empty-icon">📭</div>
                <h4>No Saved {isLesen ? 'Lesen' : 'Schreiben'} Papers in Redis</h4>
                <p>No cached papers exist for this module yet. You can generate a new one right now!</p>
                <button
                  className="modal-primary-action-btn"
                  onClick={() => {
                    onClose();
                    onStartNewExam(module);
                  }}
                >
                  <span>🚀 Generate New Exam Now</span>
                </button>
              </div>
            ) : (
              <div className="modal-saved-papers-scroll">
                {filteredPapers.map((p, idx) => (
                  <div key={p.paper_id} className="modal-saved-paper-row">
                    <div className="modal-paper-info">
                      <div className="modal-paper-title-row">
                        <span className="modal-paper-badge">
                          {p.module === 'lesen' ? '📖 Lesen' : '✍️ Schreiben'}
                        </span>
                        <span className="modal-paper-label-text">
                          {p.label || `Question Paper ${idx + 1}`}
                        </span>
                      </div>
                      <div className="modal-paper-meta">
                        <span>⏱️ {p.duration_minutes || 30} Min</span>
                        <span>🎯 {p.total_points || 25} Pkt</span>
                        <span>📅 {formatDate(p.created_at)}</span>
                        {p.module === 'lesen' && <span>📰 4 Teile / 20 Items</span>}
                      </div>
                    </div>

                    <div className="modal-paper-actions">
                      <button
                        className="modal-take-exam-btn"
                        onClick={() => {
                          onClose();
                          onSelectSavedPaper(p.paper_id);
                        }}
                      >
                        <span>▶️ Appear for Exam</span>
                      </button>
                      <button
                        className="modal-delete-btn"
                        onClick={(e) => handleDelete(e, p.paper_id)}
                        disabled={deletingId === p.paper_id}
                        title="Delete from Redis"
                      >
                        {deletingId === p.paper_id ? '...' : '🗑️'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
