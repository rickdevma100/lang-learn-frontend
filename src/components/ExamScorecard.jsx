import React, { useState } from 'react';

export default function ExamScorecard({ evaluation, onRetake, onBackToHome }) {
  const [filter, setFilter] = useState('all'); // 'all', 'incorrect', 'correct'

  if (!evaluation) {
    return (
      <div className="scorecard-container glass-panel">
        <h2>No evaluation data available.</h2>
        <button className="scorecard-btn primary" onClick={onBackToHome}>Return to Home</button>
      </div>
    );
  }

  const isLesen = evaluation.module === 'lesen';
  const passed = evaluation.passed;
  const score = evaluation.module_score;
  const maxScore = evaluation.max_module_score || 25.0;
  const percentage = Math.round((score / maxScore) * 100);

  const breakdown = evaluation.breakdown || {};
  const lesenItems = breakdown.items || [];
  const lesenTeils = breakdown.teils || {};

  const filteredLesenItems = lesenItems.filter(item => {
    if (filter === 'correct') return item.is_correct;
    if (filter === 'incorrect') return !item.is_correct;
    return true;
  });

  return (
    <div className="scorecard-container">
      {/* Top Banner / Summary */}
      <div className={`scorecard-hero glass-panel ${passed ? 'pass-hero' : 'fail-hero'}`}>
        <div className="scorecard-status-icon">
          {passed ? '🏆' : '📚'}
        </div>
        <div className="scorecard-hero-text">
          <span className="exam-type-pill">
            Goethe-Zertifikat A2 • {isLesen ? 'Leseverstehen (Reading)' : 'Schriftlicher Ausdruck (Writing)'}
          </span>
          <h1 className="scorecard-result-title">
            {passed ? 'Herzlichen Glückwunsch! Bestanden' : 'Nicht Bestanden • Keep Practicing!'}
          </h1>
          <p className="scorecard-feedback-msg">{evaluation.general_feedback}</p>
        </div>

        <div className="scorecard-metric-card">
          <div className="metric-score-large">
            {score} <span className="metric-max">/ {maxScore}</span>
          </div>
          <div className="metric-percentage">{percentage}% Score</div>
          <div className="metric-pass-cutoff">
            Pass Threshold: $\ge 15.0 / 25$ ($60\%$)
          </div>
        </div>
      </div>

      {/* ===================== LESEN DETAILED VIEW ===================== */}
      {isLesen && (
        <div className="scorecard-details-section">
          {/* 4 Teile Summary Pills */}
          <div className="teils-summary-grid">
            {Object.entries(lesenTeils).map(([k, t]) => (
              <div key={k} className="teil-score-box glass-panel">
                <span className="teil-score-label">{t.name}</span>
                <div className="teil-score-val">
                  <strong>{t.score}</strong> / {t.max} ({t.percentage}%)
                </div>
                <div className="teil-score-bar">
                  <div
                    className="teil-score-fill"
                    style={{ width: `${t.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          {/* Filter Bar */}
          <div className="items-filter-bar glass-panel">
            <h4>Question Breakdown (All 20 Items)</h4>
            <div className="filter-btn-group">
              <button
                className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
              >
                All (20)
              </button>
              <button
                className={`filter-btn ${filter === 'incorrect' ? 'active' : ''}`}
                onClick={() => setFilter('incorrect')}
              >
                Incorrect ({lesenItems.filter(i => !i.is_correct).length})
              </button>
              <button
                className={`filter-btn ${filter === 'correct' ? 'active' : ''}`}
                onClick={() => setFilter('correct')}
              >
                Correct ({lesenItems.filter(i => i.is_correct).length})
              </button>
            </div>
          </div>

          {/* Items List */}
          <div className="items-list-container">
            {filteredLesenItems.map(item => (
              <div
                key={item.id}
                className={`result-item-card glass-panel ${item.is_correct ? 'correct' : 'incorrect'}`}
              >
                <div className="result-item-top">
                  <span className="item-id-badge">Aufgabe {item.id} (Teil {item.teil})</span>
                  <span className={`item-status-tag ${item.is_correct ? 'correct' : 'incorrect'}`}>
                    {item.is_correct ? '✓ Richtig (+1.25 Pkt)' : '✗ Falsch (0 Pkt)'}
                  </span>
                </div>

                <div className="answers-comparison-row">
                  <div className="answer-block">
                    <span className="ans-label">Your Answer:</span>
                    <span className={`ans-val user-ans ${item.is_correct ? 'correct' : 'incorrect'}`}>
                      {item.user_answer ? item.user_answer.toUpperCase() : 'None'}
                    </span>
                  </div>

                  <div className="answer-block">
                    <span className="ans-label">Correct Answer Key (Redis):</span>
                    <span className="ans-val correct-ans">
                      {item.correct_answer ? item.correct_answer.toUpperCase() : ''}
                    </span>
                  </div>
                </div>

                {item.explanation && (
                  <div className="item-explanation-box">
                    💡 <strong>Explanation:</strong> {item.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================== SCHREIBEN DETAILED VIEW ===================== */}
      {!isLesen && (
        <div className="scorecard-details-section">
          {/* Teil 1 Evaluation */}
          {breakdown.teil1 && (
            <div className="writing-eval-card glass-panel">
              <div className="eval-card-header">
                <div>
                  <span className="source-tag">Teil 1: SMS / Kurze Nachricht</span>
                  <h3>Aufgabenbewertung Teil 1</h3>
                </div>
                <div className="eval-score-pill">
                  Score: <strong>{breakdown.teil1.total_score}</strong> / 12.5 Punkte
                </div>
              </div>

              <div className="criteria-grid">
                <div className="criterion-box">
                  <span className="crit-title">Aufgabenerfüllung (Task Fulfillment)</span>
                  <div className="crit-score">
                    Band <strong>{breakdown.teil1.task_fulfillment_band}</strong> • {breakdown.teil1.task_fulfillment_score} / {breakdown.teil1.task_fulfillment_max || 5.0} Pkt
                  </div>
                </div>
                <div className="criterion-box">
                  <span className="crit-title">Sprache & Grammatik (Language & Structure)</span>
                  <div className="crit-score">
                    Band <strong>{breakdown.teil1.language_band}</strong> • {breakdown.teil1.language_score} / {breakdown.teil1.language_max || 7.5} Pkt
                  </div>
                </div>
              </div>

              <div className="eval-feedback-box">
                <strong>Examiner Feedback:</strong> {breakdown.teil1.feedback}
              </div>

              {breakdown.teil1.corrections && breakdown.teil1.corrections.length > 0 && (
                <div className="corrections-section">
                  <h5>📝 Grammar & Phrasing Corrections:</h5>
                  <div className="corrections-list">
                    {breakdown.teil1.corrections.map((corr, idx) => (
                      <div key={idx} className="correction-item">
                        <div className="corr-orig">❌ {corr.original}</div>
                        <div className="corr-fixed">✓ {corr.corrected}</div>
                        {corr.explanation && <div className="corr-exp">{corr.explanation}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {breakdown.teil1.model_answer && (
                <div className="model-answer-box">
                  <h5>🌟 Goethe A2 Model Answer (Musterlösung):</h5>
                  <p>{breakdown.teil1.model_answer}</p>
                </div>
              )}
            </div>
          )}

          {/* Teil 2 Evaluation */}
          {breakdown.teil2 && (
            <div className="writing-eval-card glass-panel" style={{ marginTop: '1.5rem' }}>
              <div className="eval-card-header">
                <div>
                  <span className="source-tag">Teil 2: Formelle E-Mail</span>
                  <h3>Aufgabenbewertung Teil 2</h3>
                </div>
                <div className="eval-score-pill">
                  Score: <strong>{breakdown.teil2.total_score}</strong> / 12.5 Punkte
                </div>
              </div>

              <div className="criteria-grid">
                <div className="criterion-box">
                  <span className="crit-title">Aufgabenerfüllung (Task Fulfillment)</span>
                  <div className="crit-score">
                    Band <strong>{breakdown.teil2.task_fulfillment_band}</strong> • {breakdown.teil2.task_fulfillment_score} / {breakdown.teil2.task_fulfillment_max || 5.0} Pkt
                  </div>
                </div>
                <div className="criterion-box">
                  <span className="crit-title">Sprache & Grammatik (Language & Structure)</span>
                  <div className="crit-score">
                    Band <strong>{breakdown.teil2.language_band}</strong> • {breakdown.teil2.language_score} / {breakdown.teil2.language_max || 7.5} Pkt
                  </div>
                </div>
              </div>

              <div className="eval-feedback-box">
                <strong>Examiner Feedback:</strong> {breakdown.teil2.feedback}
              </div>

              {breakdown.teil2.corrections && breakdown.teil2.corrections.length > 0 && (
                <div className="corrections-section">
                  <h5>📝 Grammar & Phrasing Corrections:</h5>
                  <div className="corrections-list">
                    {breakdown.teil2.corrections.map((corr, idx) => (
                      <div key={idx} className="correction-item">
                        <div className="corr-orig">❌ {corr.original}</div>
                        <div className="corr-fixed">✓ {corr.corrected}</div>
                        {corr.explanation && <div className="corr-exp">{corr.explanation}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {breakdown.teil2.model_answer && (
                <div className="model-answer-box">
                  <h5>🌟 Goethe A2 Model Answer (Musterlösung):</h5>
                  <p>{breakdown.teil2.model_answer}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Action Footer */}
      <div className="scorecard-footer-actions">
        <button
          className="scorecard-btn secondary"
          onClick={onBackToHome}
        >
          🏠 Return to Landing Page
        </button>
        <button
          className="scorecard-btn primary"
          onClick={() => onRetake(evaluation.module)}
        >
          🔄 Take Another {isLesen ? 'Reading' : 'Writing'} Test
        </button>
      </div>
    </div>
  );
}
