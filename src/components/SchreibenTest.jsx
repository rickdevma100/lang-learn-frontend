import React, { useState, useEffect } from 'react';

export default function SchreibenTest({ paper, onResetPaper, onSubmitExam, onBackToHome, isSubmitting }) {
  const [activeTeil, setActiveTeil] = useState(1);
  const [answers, setAnswers] = useState({ teil1: '', teil2: '' });
  const [timeLeft, setTimeLeft] = useState((paper?.duration_minutes || 30) * 60);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Reset state when a brand new paper is loaded
  useEffect(() => {
    setActiveTeil(1);
    setAnswers({ teil1: '', teil2: '' });
    setTimeLeft((paper?.duration_minutes || 30) * 60);
  }, [paper?.paper_id]);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const teils = paper?.teils || {};
  const teil1 = teils.teil1 || {};
  const teil2 = teils.teil2 || {};

  const countWords = (text) => {
    if (!text || !text.trim()) return 0;
    return text.trim().split(/\s+/).length;
  };

  const t1Words = countWords(answers.teil1);
  const t2Words = countWords(answers.teil2);

  const getWordBadge = (count, min, max) => {
    if (count === 0) return { label: '0 Wörter', status: 'empty' };
    if (count < min) return { label: `${count} Wörter (Zu kurz, Ziel: ${min}-${max})`, status: 'short' };
    if (count > max + 15) return { label: `${count} Wörter (Sehr lang)`, status: 'long' };
    return { label: `✓ ${count} Wörter (Optimal)`, status: 'optimal' };
  };

  const isTimeCritical = timeLeft < 300;

  const handleSubmitClick = () => {
    if (t1Words < 10 || t2Words < 15) {
      setShowSubmitModal(true);
    } else {
      onSubmitExam('schreiben', paper.paper_id, answers);
    }
  };

  const confirmSubmit = () => {
    setShowSubmitModal(false);
    onSubmitExam('schreiben', paper.paper_id, answers);
  };

  const confirmReset = () => {
    setShowResetModal(false);
    setAnswers({ teil1: '', teil2: '' });
    setTimeLeft((paper?.duration_minutes || 30) * 60);
    onResetPaper('schreiben');
  };

  const isTeilReady = (teilObj) => Boolean(teilObj && (teilObj.scenario_german || teilObj.bullet_points?.length));

  return (
    <div className="exam-runner-container">
      {/* Header Toolbar */}
      <div className="exam-header-bar glass-panel">
        <div className="exam-header-left">
          <button className="back-home-btn" onClick={onBackToHome} title="Return to Landing Page">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            <span>Exit Test</span>
          </button>
          <div className="exam-title-meta">
            <h2 className="exam-main-title">Goethe-Zertifikat A2: Schreiben</h2>
            <span className="exam-sub-meta">30 Min • 2 Teile (SMS & E-Mail) • Max 25 Punkte</span>
          </div>
          {paper?.is_streaming && (
            <div className="streaming-badge" title="Weitere Teile werden im Hintergrund generiert">
              <span className="pulse-dot"></span>
              <span>KI generiert live...</span>
            </div>
          )}
        </div>

        <div className="exam-header-center">
          <div className={`exam-timer-badge ${isTimeCritical ? 'timer-critical' : ''}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span className="timer-digits">{formatTime(timeLeft)}</span>
          </div>
        </div>

        <div className="exam-header-right">
          <button
            id="btn-reset-writing-paper"
            className="exam-tool-btn reset-btn"
            onClick={() => setShowResetModal(true)}
            title="Generate fresh writing prompts"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10"></polyline>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
            </svg>
            <span>New Paper</span>
          </button>

          <button
            id="btn-submit-writing-exam"
            className="exam-tool-btn submit-exam-btn"
            onClick={handleSubmitClick}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="spinner-mini"></div>
                <span>Evaluating via Rubric...</span>
              </>
            ) : (
              <>
                <span>Submit Writing</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Teil Navigation */}
      <div className="teil-nav-tabs">
        <button
          className={`teil-tab-btn ${activeTeil === 1 ? 'active' : ''}`}
          onClick={() => setActiveTeil(1)}
        >
          <span className="teil-tab-title">Teil 1: Kurze Nachricht</span>
          <span className="teil-tab-sub">SMS an einen Freund</span>
          <span className="teil-progress-badge">
            {isTeilReady(teil1) ? `${t1Words} Wörter` : '⏳'}
          </span>
        </button>

        <button
          className={`teil-tab-btn ${activeTeil === 2 ? 'active' : ''}`}
          onClick={() => setActiveTeil(2)}
        >
          <span className="teil-tab-title">Teil 2: E-Mail</span>
          <span className="teil-tab-sub">Formelles Schreiben</span>
          <span className="teil-progress-badge">
            {isTeilReady(teil2) ? `${t2Words} Wörter` : '⏳'}
          </span>
        </button>
      </div>

      {/* Writing Work Area */}
      <div className="writing-workspace">
        {/* ======================= WRITING TEIL 1 ======================= */}
        {activeTeil === 1 && (
          !isTeilReady(teil1) ? (
            <div className="glass-panel teil-generating-placeholder">
              <div className="spinner-large"></div>
              <h3>Schreiben Teil 1 wird gerade von der KI generiert...</h3>
              <p>Bitte haben Sie einen kurzen Moment Geduld.</p>
            </div>
          ) : (
          <div className="writing-card-panel glass-panel">
            <div className="task-header-row">
              <div>
                <span className="source-tag">📱 Teil 1 (ca. 20–30 Wörter)</span>
                <h3>{teil1.title || 'Schreiben Teil 1: Kurze Mitteilung'}</h3>
              </div>
              <div className={`word-count-badge ${getWordBadge(t1Words, 20, 30).status}`}>
                {getWordBadge(t1Words, 20, 30).label}
              </div>
            </div>

            <div className="task-scenario-box">
              <div className="scenario-german">
                <strong>Situation:</strong> {teil1.scenario_german}
              </div>
              <p className="scenario-instructions">{teil1.instructions_german}</p>

              <div className="bullet-points-list">
                {(teil1.bullet_points || []).map((bp, idx) => (
                  <div key={idx} className="bullet-item">
                    <span className="bullet-num">Punkt {idx + 1}:</span>
                    <span className="bullet-text">{bp}</span>
                  </div>
                ))}
              </div>

              {teil1.tips_english && (
                <div className="task-tip-english">
                  💡 <strong>Tip:</strong> {teil1.tips_english}
                </div>
              )}
            </div>

            <div className="editor-container">
              <label htmlFor="schreiben-teil1-input" className="editor-label">
                Ihre Antwort auf Deutsch (Your German Text):
              </label>
              <textarea
                id="schreiben-teil1-input"
                className="writing-textarea"
                rows="8"
                placeholder="Lieber Michael, ..."
                value={answers.teil1}
                onChange={(e) => setAnswers(prev => ({ ...prev, teil1: e.target.value }))}
              ></textarea>
            </div>
          </div>
        ))}

        {/* ======================= WRITING TEIL 2 ======================= */}
        {activeTeil === 2 && (
          !isTeilReady(teil2) ? (
            <div className="glass-panel teil-generating-placeholder">
              <div className="spinner-large"></div>
              <h3>Schreiben Teil 2 wird gerade im Hintergrund von der KI generiert...</h3>
              <p>Sie können bereits Teil 1 bearbeiten.</p>
            </div>
          ) : (
          <div className="writing-card-panel glass-panel">
            <div className="task-header-row">
              <div>
                <span className="source-tag">✉️ Teil 2 (ca. 30–40 Wörter)</span>
                <h3>{teil2.title || 'Schreiben Teil 2: Formelle E-Mail'}</h3>
              </div>
              <div className={`word-count-badge ${getWordBadge(t2Words, 30, 40).status}`}>
                {getWordBadge(t2Words, 30, 40).label}
              </div>
            </div>

            <div className="task-scenario-box">
              <div className="scenario-german">
                <strong>Situation:</strong> {teil2.scenario_german}
              </div>
              <p className="scenario-instructions">{teil2.instructions_german}</p>

              <div className="bullet-points-list">
                {(teil2.bullet_points || []).map((bp, idx) => (
                  <div key={idx} className="bullet-item">
                    <span className="bullet-num">Punkt {idx + 1}:</span>
                    <span className="bullet-text">{bp}</span>
                  </div>
                ))}
              </div>

              {teil2.tips_english && (
                <div className="task-tip-english">
                  💡 <strong>Tip:</strong> {teil2.tips_english}
                </div>
              )}
            </div>

            <div className="editor-container">
              <label htmlFor="schreiben-teil2-input" className="editor-label">
                Ihre Antwort auf Deutsch (Your German Text):
              </label>
              <textarea
                id="schreiben-teil2-input"
                className="writing-textarea"
                rows="10"
                placeholder="Sehr geehrte Frau Weber, ..."
                value={answers.teil2}
                onChange={(e) => setAnswers(prev => ({ ...prev, teil2: e.target.value }))}
              ></textarea>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Nav Bar */}
      <div className="exam-bottom-bar glass-panel">
        <div className="bottom-left">
          <span className="answered-summary">
            Teil 1: <strong>{t1Words}</strong> Wörter | Teil 2: <strong>{t2Words}</strong> Wörter
          </span>
        </div>

        <div className="bottom-nav-controls">
          <button
            className="bottom-nav-btn"
            disabled={activeTeil === 1}
            onClick={() => setActiveTeil(1)}
          >
            ← Teil 1 (SMS)
          </button>
          <button
            className="bottom-nav-btn next-btn"
            disabled={activeTeil === 2}
            onClick={() => setActiveTeil(2)}
          >
            Teil 2 (E-Mail) →
          </button>
        </div>
      </div>

      {/* Reset Modal */}
      {showResetModal && (
        <div className="modal-backdrop">
          <div className="modal-dialog glass-panel">
            <div className="modal-icon-badge warning">🔄</div>
            <h3>Generate New Writing Prompts?</h3>
            <p>
              This will request new scenarios and tasks for Teil 1 and Teil 2.
              Your current written text will be cleared.
            </p>
            <div className="modal-actions">
              <button className="modal-cancel-btn" onClick={() => setShowResetModal(false)}>
                Cancel
              </button>
              <button className="modal-confirm-btn reset-confirm" onClick={confirmReset}>
                Yes, Generate New Prompts
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Short Text Warning Modal */}
      {showSubmitModal && (
        <div className="modal-backdrop">
          <div className="modal-dialog glass-panel">
            <div className="modal-icon-badge info">⚠️</div>
            <h3>Short Text Warning</h3>
            <p>
              Your written response is relatively short. Goethe examiners require addressing all Leitpunkte
              (Teil 1: ~20-30 words, Teil 2: ~30-40 words) for full Aufgabenerfüllung points. Submit anyway?
            </p>
            <div className="modal-actions">
              <button className="modal-cancel-btn" onClick={() => setShowSubmitModal(false)}>
                Continue Writing
              </button>
              <button className="modal-confirm-btn" onClick={confirmSubmit}>
                Submit For Evaluation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
