import React, { useState, useEffect } from 'react';

export default function LesenTest({ paper, onResetPaper, onSubmitExam, onBackToHome, isSubmitting }) {
  const [activeTeil, setActiveTeil] = useState(1);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState((paper?.duration_minutes || 30) * 60);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Timer countdown
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

  const handleSelectAnswer = (questionId, optionKey) => {
    setAnswers(prev => ({
      ...prev,
      [String(questionId)]: optionKey
    }));
  };

  const teils = paper?.teils || {};
  const teil1 = teils.teil1 || {};
  const teil2 = teils.teil2 || {};
  const teil3 = teils.teil3 || {};
  const teil4 = teils.teil4 || {};

  // Count answered questions per Teil
  const countTeilAnswered = (startId, endId) => {
    let count = 0;
    for (let id = startId; id <= endId; id++) {
      if (answers[String(id)]) count++;
    }
    return count;
  };

  const totalAnswered = Object.keys(answers).length;
  const isTimeCritical = timeLeft < 300; // < 5 mins

  const handleSubmitClick = () => {
    if (totalAnswered < 20) {
      setShowSubmitModal(true);
    } else {
      onSubmitExam('lesen', paper.paper_id, answers);
    }
  };

  const confirmSubmit = () => {
    setShowSubmitModal(false);
    onSubmitExam('lesen', paper.paper_id, answers);
  };

  const confirmReset = () => {
    setShowResetModal(false);
    setAnswers({});
    setTimeLeft((paper?.duration_minutes || 30) * 60);
    onResetPaper('lesen');
  };

  return (
    <div className="exam-runner-container">
      {/* Top Navigation / Toolbar */}
      <div className="exam-header-bar glass-panel">
        <div className="exam-header-left">
          <button className="back-home-btn" onClick={onBackToHome} title="Return to Landing Page">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            <span>Exit Test</span>
          </button>
          <div className="exam-title-meta">
            <h2 className="exam-main-title">Goethe-Zertifikat A2: Lesen</h2>
            <span className="exam-sub-meta">30 Min • 4 Teile • 20 Items • Max 25 Punkte</span>
          </div>
        </div>

        <div className="exam-header-center">
          {/* Timer */}
          <div className={`exam-timer-badge ${isTimeCritical ? 'timer-critical' : ''}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span className="timer-digits">{formatTime(timeLeft)}</span>
          </div>
        </div>

        <div className="exam-header-right">
          {/* Reset / New Paper Button */}
          <button
            id="btn-reset-reading-paper"
            className="exam-tool-btn reset-btn"
            onClick={() => setShowResetModal(true)}
            title="Discard current questions and generate a brand new paper"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10"></polyline>
              <polyline points="1 20 1 14 7 14"></polyline>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
            <span>New Paper / Reset</span>
          </button>

          {/* Submit Button */}
          <button
            id="btn-submit-reading-exam"
            className="exam-tool-btn submit-exam-btn"
            onClick={handleSubmitClick}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="spinner-mini"></div>
                <span>Evaluating...</span>
              </>
            ) : (
              <>
                <span>Submit Exam</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Teil Navigation Tabs */}
      <div className="teil-nav-tabs">
        <button
          className={`teil-tab-btn ${activeTeil === 1 ? 'active' : ''}`}
          onClick={() => setActiveTeil(1)}
        >
          <span className="teil-tab-title">Teil 1 (1–5)</span>
          <span className="teil-tab-sub">Zeitungsartikel</span>
          <span className="teil-progress-badge">{countTeilAnswered(1, 5)}/5</span>
        </button>

        <button
          className={`teil-tab-btn ${activeTeil === 2 ? 'active' : ''}`}
          onClick={() => setActiveTeil(2)}
        >
          <span className="teil-tab-title">Teil 2 (6–10)</span>
          <span className="teil-tab-sub">Kaufhaus-Wegweiser</span>
          <span className="teil-progress-badge">{countTeilAnswered(6, 10)}/5</span>
        </button>

        <button
          className={`teil-tab-btn ${activeTeil === 3 ? 'active' : ''}`}
          onClick={() => setActiveTeil(3)}
        >
          <span className="teil-tab-title">Teil 3 (11–15)</span>
          <span className="teil-tab-sub">E-Mail / Brief</span>
          <span className="teil-progress-badge">{countTeilAnswered(11, 15)}/5</span>
        </button>

        <button
          className={`teil-tab-btn ${activeTeil === 4 ? 'active' : ''}`}
          onClick={() => setActiveTeil(4)}
        >
          <span className="teil-tab-title">Teil 4 (16–20)</span>
          <span className="teil-tab-sub">Anzeigen & Personen</span>
          <span className="teil-progress-badge">{countTeilAnswered(16, 20)}/5</span>
        </button>
      </div>

      {/* Teil Content Pane */}
      <div className="teil-content-area">
        {/* ======================= TEIL 1 ======================= */}
        {activeTeil === 1 && (
          <div className="split-view-container">
            {/* Left: Article */}
            <div className="split-pane article-pane glass-panel">
              <div className="article-header">
                <span className="source-tag">📰 Zeitung / Magazin</span>
                <h3 className="article-title">{teil1.title || 'Lesetext'}</h3>
              </div>
              <div className="article-body">
                {teil1.text ? (
                  teil1.text.split('\n\n').map((paragraph, idx) => (
                    <p key={idx}>{paragraph}</p>
                  ))
                ) : (
                  <p>Text wird geladen...</p>
                )}
              </div>
            </div>

            {/* Right: 5 MCQs */}
            <div className="split-pane questions-pane glass-panel">
              <div className="questions-header">
                <h4>Aufgaben 1–5 (Wählen Sie die richtige Antwort: a, b oder c)</h4>
              </div>
              <div className="questions-list">
                {(teil1.items || []).map(item => (
                  <div key={item.id} className="question-card">
                    <div className="question-number-badge">Aufgabe {item.id}</div>
                    <p className="question-prompt">{item.question}</p>
                    <div className="options-group">
                      {Object.entries(item.options || {}).map(([optKey, optText]) => {
                        const isSelected = answers[String(item.id)] === optKey;
                        return (
                          <label
                            key={optKey}
                            className={`option-label ${isSelected ? 'selected' : ''}`}
                            onClick={() => handleSelectAnswer(item.id, optKey)}
                          >
                            <input
                              type="radio"
                              name={`question-${item.id}`}
                              checked={isSelected}
                              onChange={() => handleSelectAnswer(item.id, optKey)}
                            />
                            <span className="option-letter">{optKey.toUpperCase()}</span>
                            <span className="option-text">{optText}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ======================= TEIL 2 ======================= */}
        {activeTeil === 2 && (
          <div className="split-view-container">
            {/* Left: Kaufhaus Directory Board */}
            <div className="split-pane info-board-pane glass-panel">
              <div className="board-header">
                <span className="source-tag">🏬 Kaufhaus-Wegweiser</span>
                <h3 className="board-title">{teil2.title || 'Kaufhaus Wegweiser'}</h3>
                <p className="board-hint">Lesen Sie die Informationen und entscheiden Sie für jede Aufgabe, in welches Stockwerk Sie gehen.</p>
              </div>

              <div className="directory-floors-list">
                {(teil2.directory || []).map((floorItem, idx) => (
                  <div key={idx} className="directory-floor-card">
                    <div className="floor-badge">{floorItem.floor}</div>
                    <div className="floor-departments">{floorItem.departments}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: 5 Floor questions */}
            <div className="split-pane questions-pane glass-panel">
              <div className="questions-header">
                <h4>Aufgaben 6–10 (Wohin gehen Sie?)</h4>
              </div>
              <div className="questions-list">
                {(teil2.items || []).map(item => (
                  <div key={item.id} className="question-card">
                    <div className="question-number-badge">Aufgabe {item.id}</div>
                    <p className="question-prompt">{item.question}</p>
                    <div className="options-group">
                      {Object.entries(item.options || {}).map(([optKey, optText]) => {
                        const isSelected = answers[String(item.id)] === optKey;
                        return (
                          <label
                            key={optKey}
                            className={`option-label ${isSelected ? 'selected' : ''}`}
                            onClick={() => handleSelectAnswer(item.id, optKey)}
                          >
                            <input
                              type="radio"
                              name={`question-${item.id}`}
                              checked={isSelected}
                              onChange={() => handleSelectAnswer(item.id, optKey)}
                            />
                            <span className="option-letter">{optKey.toUpperCase()}</span>
                            <span className="option-text">{optText}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ======================= TEIL 3 ======================= */}
        {activeTeil === 3 && (
          <div className="split-view-container">
            {/* Left: Email */}
            <div className="split-pane email-pane glass-panel">
              <div className="email-header-envelope">
                <span className="source-tag">✉️ Persönliche E-Mail</span>
                <div className="email-meta-line">
                  <strong>Von:</strong> <span>{teil3.sender || 'Sabine'}</span>
                </div>
                <div className="email-meta-line">
                  <strong>An:</strong> <span>{teil3.recipient || 'Thomas'}</span>
                </div>
                <div className="email-meta-line">
                  <strong>Betreff:</strong> <span>{teil3.subject || 'Einladung'}</span>
                </div>
              </div>
              <div className="email-body">
                {teil3.text ? (
                  teil3.text.split('\n').map((line, idx) => (
                    <p key={idx}>{line}</p>
                  ))
                ) : (
                  <p>E-Mail wird geladen...</p>
                )}
              </div>
            </div>

            {/* Right: 5 MCQs */}
            <div className="split-pane questions-pane glass-panel">
              <div className="questions-header">
                <h4>Aufgaben 11–15 (Wählen Sie die richtige Lösung)</h4>
              </div>
              <div className="questions-list">
                {(teil3.items || []).map(item => (
                  <div key={item.id} className="question-card">
                    <div className="question-number-badge">Aufgabe {item.id}</div>
                    <p className="question-prompt">{item.question}</p>
                    <div className="options-group">
                      {Object.entries(item.options || {}).map(([optKey, optText]) => {
                        const isSelected = answers[String(item.id)] === optKey;
                        return (
                          <label
                            key={optKey}
                            className={`option-label ${isSelected ? 'selected' : ''}`}
                            onClick={() => handleSelectAnswer(item.id, optKey)}
                          >
                            <input
                              type="radio"
                              name={`question-${item.id}`}
                              checked={isSelected}
                              onChange={() => handleSelectAnswer(item.id, optKey)}
                            />
                            <span className="option-letter">{optKey.toUpperCase()}</span>
                            <span className="option-text">{optText}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ======================= TEIL 4 ======================= */}
        {activeTeil === 4 && (
          <div className="teil4-container">
            {/* Top / Left: 6 Classified Ads */}
            <div className="ads-section glass-panel">
              <div className="section-title-bar">
                <span className="source-tag">📢 Anzeigen A bis F</span>
                <h3>{teil4.title || 'Kleinanzeigen'}</h3>
                <p className="instructions-sub">{teil4.instructions || 'Finden Sie für jede Person die passende Anzeige (a-f) oder wählen Sie "x" (keine Anzeige).'}</p>
              </div>

              <div className="ads-grid">
                {(teil4.ads || []).map(ad => (
                  <div key={ad.id} className="ad-card">
                    <div className="ad-id-badge">Anzeige {ad.id.toUpperCase()}</div>
                    <h5 className="ad-card-title">{ad.title}</h5>
                    <p className="ad-card-text">{ad.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom / Right: 5 People to Match */}
            <div className="people-match-section glass-panel">
              <div className="section-title-bar">
                <h4>Aufgaben 16–20 (Personen 16–20 zuordnen)</h4>
              </div>

              <div className="people-list">
                {(teil4.items || []).map(personItem => {
                  const currentChoice = answers[String(personItem.id)] || '';
                  const optionsList = ['a', 'b', 'c', 'd', 'e', 'f', 'x'];

                  return (
                    <div key={personItem.id} className="person-match-card">
                      <div className="person-desc-col">
                        <span className="person-num">Person {personItem.id}</span>
                        <p className="person-text">{personItem.person}</p>
                      </div>

                      <div className="match-selector-col">
                        <span className="match-label">Passende Anzeige:</span>
                        <div className="match-buttons-row">
                          {optionsList.map(opt => {
                            const isMatchSelected = currentChoice === opt;
                            return (
                              <button
                                key={opt}
                                className={`match-btn ${isMatchSelected ? 'selected' : ''} ${opt === 'x' ? 'no-match-btn' : ''}`}
                                onClick={() => handleSelectAnswer(personItem.id, opt)}
                                title={opt === 'x' ? 'Keine Anzeige passt' : `Anzeige ${opt.toUpperCase()}`}
                              >
                                {opt === 'x' ? '✗ X' : opt.toUpperCase()}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Progress Navigation */}
      <div className="exam-bottom-bar glass-panel">
        <div className="bottom-left">
          <span className="answered-summary">
            Answered: <strong>{totalAnswered}</strong> / 20 items
          </span>
          <div className="mini-progress-bar">
            <div
              className="mini-progress-fill"
              style={{ width: `${(totalAnswered / 20) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="bottom-nav-controls">
          <button
            className="bottom-nav-btn"
            disabled={activeTeil === 1}
            onClick={() => setActiveTeil(prev => Math.max(1, prev - 1))}
          >
            ← Previous Teil
          </button>
          <button
            className="bottom-nav-btn next-btn"
            disabled={activeTeil === 4}
            onClick={() => setActiveTeil(prev => Math.min(4, prev + 1))}
          >
            Next Teil →
          </button>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetModal && (
        <div className="modal-backdrop">
          <div className="modal-dialog glass-panel">
            <div className="modal-icon-badge warning">🔄</div>
            <h3>Generate New Test Paper?</h3>
            <p>
              This will request a brand new set of reading comprehension questions from the server.
              Your current answers and progress on this paper will be discarded.
            </p>
            <div className="modal-actions">
              <button className="modal-cancel-btn" onClick={() => setShowResetModal(false)}>
                Cancel
              </button>
              <button className="modal-confirm-btn reset-confirm" onClick={confirmReset}>
                Yes, Generate New Paper
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unanswered Warning Submit Modal */}
      {showSubmitModal && (
        <div className="modal-backdrop">
          <div className="modal-dialog glass-panel">
            <div className="modal-icon-badge info">⚠️</div>
            <h3>Unanswered Questions</h3>
            <p>
              You have answered <strong>{totalAnswered} of 20</strong> questions.
              Unanswered questions will be scored as 0 points. Do you want to submit anyway?
            </p>
            <div className="modal-actions">
              <button className="modal-cancel-btn" onClick={() => setShowSubmitModal(false)}>
                Continue Test
              </button>
              <button className="modal-confirm-btn" onClick={confirmSubmit}>
                Submit Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
