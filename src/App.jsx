import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import LesenTest from './components/LesenTest';
import SchreibenTest from './components/SchreibenTest';
import ExamScorecard from './components/ExamScorecard';
import DialogPractice from './components/DialogPractice';

const A2_EXAM_VOCAB_LOADER = [
  { german: "das Leseverstehen", english: "reading comprehension" },
  { german: "der Zeitungsartikel", english: "newspaper article" },
  { german: "der Wegweiser", english: "directory / signage guide" },
  { german: "die Anzeige", english: "advertisement / classified ad" },
  { german: "die Mitteilung", english: "message / notice" },
  { german: "die Entschuldigung", english: "apology / excuse" },
  { german: "der Treffpunkt", english: "meeting point" },
  { german: "die Verspätung", english: "delay" },
  { german: "die Anrede", english: "salutation / greeting" },
  { german: "die Grußformel", english: "closing greeting formula" },
  { german: "die Auskunft", english: "information / guidance" },
  { german: "das Stockwerk", english: "floor / storey" }
];

export default function App() {
  // Navigation View: 'landing' | 'lesen' | 'schreiben' | 'scorecard' | 'practice'
  const [currentView, setCurrentView] = useState('practice');

  // Exam States
  const [activeModule, setActiveModule] = useState(null); // 'lesen' | 'schreiben'
  const [paper, setPaper] = useState(null);
  const [loadingExam, setLoadingExam] = useState(false);
  const [examError, setExamError] = useState(null);
  const [evaluation, setEvaluation] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Vocabulary loader rotation during test paper generation
  const [currentLoaderVocab, setCurrentLoaderVocab] = useState(null);

  // Theme state: dark or light
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved;
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return systemPrefersDark ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Rotate vocab during exam paper generation
  useEffect(() => {
    let intervalId = null;
    if (loadingExam) {
      let pool = [...A2_EXAM_VOCAB_LOADER];
      const nextVocab = () => {
        if (pool.length === 0) pool = [...A2_EXAM_VOCAB_LOADER];
        const randIdx = Math.floor(Math.random() * pool.length);
        const sel = pool[randIdx];
        pool.splice(randIdx, 1);
        setCurrentLoaderVocab(sel);
      };
      nextVocab();
      intervalId = setInterval(nextVocab, 3000);
    } else {
      setCurrentLoaderVocab(null);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [loadingExam]);

  // Start exam - fetches paper for that module specifically with progressive streaming
  const handleStartExam = async (module) => {
    setActiveModule(module);
    setCurrentView(module);
    setLoadingExam(true);
    setExamError(null);
    setPaper(null);

    try {
      // 1. Try progressive SSE streaming endpoint
      const res = await fetch('/api/exam_generate_stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module, level: 'A2' })
      });

      if (res.ok && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let streamActive = true;
        let receivedAnyTeil = false;

        while (streamActive) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith('data:')) continue;
            const jsonStr = trimmed.replace(/^data:\s*/, '');
            try {
              const event = JSON.parse(jsonStr);

              if (event.type === 'init') {
                setPaper({
                  paper_id: event.paper_id,
                  module: event.module,
                  level: event.level,
                  created_at: event.created_at,
                  duration_minutes: event.duration_minutes || 30,
                  total_points: event.total_points || 25.0,
                  total_teils: event.total_teils,
                  teils: {},
                  is_streaming: true
                });
              } else if (event.type === 'teil') {
                receivedAnyTeil = true;
                setPaper(prev => ({
                  ...(prev || {}),
                  paper_id: prev?.paper_id || event.paper_id,
                  module: prev?.module || module,
                  level: prev?.level || 'A2',
                  duration_minutes: prev?.duration_minutes || 30,
                  total_points: prev?.total_points || 25.0,
                  teils: {
                    ...(prev?.teils || {}),
                    [event.teil_name]: event.data
                  },
                  is_streaming: true
                }));
                // Reveal the exam UI immediately once the first Teil is generated!
                setLoadingExam(false);
              } else if (event.type === 'done') {
                setPaper({
                  ...event.paper,
                  is_streaming: false
                });
                setLoadingExam(false);
                streamActive = false;
              } else if (event.type === 'error') {
                throw new Error(event.error || 'Streaming error occurred');
              }
            } catch (pErr) {
              console.warn('Error parsing SSE event:', pErr, jsonStr);
            }
          }
        }

        if (receivedAnyTeil) {
          return;
        }
      }

      // 2. Fallback to standard synchronous endpoint if stream unavailable
      const fallbackRes = await fetch('/api/exam_generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module, level: 'A2' })
      });

      if (!fallbackRes.ok) {
        throw new Error(`Server returned error status ${fallbackRes.status}`);
      }

      const paperData = await fallbackRes.json();
      if (paperData.error) {
        throw new Error(paperData.error);
      }

      setPaper(paperData);
    } catch (err) {
      console.error('Failed to generate exam paper:', err);
      setExamError(err.message || 'Failed to generate test paper. Please check server status.');
    } finally {
      setLoadingExam(false);
    }
  };

  // Load an existing saved question paper from Redis
  const handleLoadSavedPaper = async (paperId) => {
    setLoadingExam(true);
    setExamError(null);
    setPaper(null);

    try {
      const res = await fetch('/api/exam_load_paper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paper_id: paperId })
      });

      if (!res.ok) {
        throw new Error(`Failed to load saved paper (status ${res.status})`);
      }

      const data = await res.json();
      if (data.error || !data.paper) {
        throw new Error(data.error || 'Paper not found in Redis storage.');
      }

      const loadedPaper = data.paper;
      const mod = loadedPaper.module || 'lesen';
      setPaper(loadedPaper);
      setActiveModule(mod);
      setCurrentView(mod);
    } catch (err) {
      console.error('Failed to load saved paper:', err);
      setExamError(err.message || 'Failed to load saved paper.');
      setCurrentView('landing');
    } finally {
      setLoadingExam(false);
    }
  };

  // Reset / New Paper for current module
  const handleResetPaper = async (module) => {
    await handleStartExam(module);
  };

  // Submit completed exam
  const handleSubmitExam = async (module, paperId, answers) => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/exam_evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paper_id: paperId,
          module,
          answers,
          level: 'A2'
        })
      });

      if (!res.ok) {
        throw new Error(`Evaluation failed with status ${res.status}`);
      }

      const evalResult = await res.json();
      if (evalResult.error) {
        throw new Error(evalResult.error);
      }

      setEvaluation(evalResult);
      setCurrentView('scorecard');
    } catch (err) {
      console.error('Failed to evaluate exam:', err);
      alert(`Evaluation Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="app-container">
      {/* Universal App Header */}
      <header className="app-header">
        <div className="brand" onClick={() => setCurrentView('landing')} style={{ cursor: 'pointer' }}>
          <div className="brand-icon">L</div>
          <h1 className="brand-title">LangLearn</h1>
          <span className="brand-sub-badge">Goethe A2</span>
        </div>

        <div className="header-right">
          <nav className="header-nav">
            <button
              className={`header-nav-btn ${currentView === 'landing' ? 'active' : ''}`}
              onClick={() => setCurrentView('landing')}
            >
              🏠 Home
            </button>
            <button
              className={`header-nav-btn ${currentView === 'lesen' ? 'active' : ''}`}
              onClick={() => handleStartExam('lesen')}
            >
              📖 Reading Exam
            </button>
            <button
              className={`header-nav-btn ${currentView === 'schreiben' ? 'active' : ''}`}
              onClick={() => handleStartExam('schreiben')}
            >
              ✍️ Writing Exam
            </button>
            <button
              className={`header-nav-btn ${currentView === 'practice' ? 'active' : ''}`}
              onClick={() => setCurrentView('practice')}
            >
              💬 Dialog Practice
            </button>
          </nav>

          <button
            className="theme-toggle-btn"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle dark/light theme"
          >
            {theme === 'dark' ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* Main View Area */}
      <main className="app-main-viewport">
        {/* Loading Overlay for Exam Generation */}
        {loadingExam && (
          <div className="exam-loading-overlay glass-panel">
            <div className="spinner"></div>
            <h3>Generating Goethe A2 {activeModule === 'lesen' ? 'Reading' : 'Writing'} Exam...</h3>
            <p className="loading-subtext">Assembling authentic Teile, validation checks, and answer keys in parallel.</p>
            {currentLoaderVocab && (
              <div className="vocab-rotator">
                <div className="vocab-badge">Exam Vocabulary</div>
                <div className="vocab-german">{currentLoaderVocab.german}</div>
                <div className="vocab-english">{currentLoaderVocab.english}</div>
              </div>
            )}
          </div>
        )}

        {/* Error Display */}
        {examError && !loadingExam && (
          <div className="exam-error-container glass-panel">
            <div className="error-icon">⚠️</div>
            <h3>Could Not Load Exam</h3>
            <p>{examError}</p>
            <div className="error-actions">
              <button className="scorecard-btn secondary" onClick={() => setCurrentView('landing')}>
                Back to Landing
              </button>
              <button className="scorecard-btn primary" onClick={() => handleStartExam(activeModule)}>
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* 1. Landing Page View */}
        {currentView === 'landing' && !loadingExam && (
          <LandingPage
            onStartExam={handleStartExam}
            onLoadSavedPaper={handleLoadSavedPaper}
            onOpenPractice={() => setCurrentView('practice')}
            theme={theme}
            setTheme={setTheme}
          />
        )}

        {/* 2. Reading Test View */}
        {currentView === 'lesen' && !loadingExam && paper && (
          <LesenTest
            paper={paper}
            onResetPaper={handleResetPaper}
            onSubmitExam={handleSubmitExam}
            onBackToHome={() => setCurrentView('landing')}
            isSubmitting={isSubmitting}
          />
        )}

        {/* 3. Writing Test View */}
        {currentView === 'schreiben' && !loadingExam && paper && (
          <SchreibenTest
            paper={paper}
            onResetPaper={handleResetPaper}
            onSubmitExam={handleSubmitExam}
            onBackToHome={() => setCurrentView('landing')}
            isSubmitting={isSubmitting}
          />
        )}

        {/* 4. Scorecard View */}
        {currentView === 'scorecard' && (
          <ExamScorecard
            evaluation={evaluation}
            onRetake={(module) => handleStartExam(module)}
            onBackToHome={() => setCurrentView('landing')}
          />
        )}

        {/* 5. Dialog Practice View */}
        {currentView === 'practice' && (
          <DialogPractice
            onBackToHome={() => setCurrentView('landing')}
          />
        )}
      </main>
    </div>
  );
}
