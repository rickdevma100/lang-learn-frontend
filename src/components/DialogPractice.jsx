import React, { useState, useEffect, useRef, useCallback } from 'react';

const A2_VOCAB_LOADER_LIST = [
  { german: "Ja natürlich", english: "Yes, of course" },
  { german: "Vielen Dank", english: "Thank you very much" },
  { german: "Herzlichen Dank", english: "Heartfelt thanks" },
  { german: "Danke schön", english: "Thank you" },
  { german: "Bitte schön", english: "You're welcome / Here you go" },
  { german: "Ihnen auch", english: "You too / To you as well" },
  { german: "Ebenfalls, danke", english: "Likewise, thank you" },
  { german: "Danke schön, Auf Wiedersehen!", english: "Thank you, goodbye!" },
  { german: "vielleicht", english: "maybe / perhaps" },
  { german: "bedeutet", english: "means / signifies" },
  { german: "sagt man", english: "one says / you say" },
  { german: "liegt", english: "lies / is located" },
  { german: "prima", english: "great / wonderful" },
  { german: "klasse", english: "great / fantastic" },
  { german: "toll", english: "great / awesome" },
  { german: "hässlich", english: "ugly" },
  { german: "interessant", english: "interesting" },
  { german: "wichtig", english: "important" },
  { german: "die Überweisung", english: "bank transfer" },
  { german: "umziehen", english: "to move (house)" },
  { german: "In die Berge", english: "Into the mountains" },
  { german: "ans Meer", english: "to the sea / seaside" },
  { german: "fleißig", english: "industrious / hard-working" },
  { german: "die Fahrkarte", english: "ticket (for train/bus)" }
];

export default function DialogPractice({ onBackToHome }) {
  const [activeTab, setActiveTab] = useState('dialogue'); // 'dialogue' or 'explain'

  // Dialogue states
  const [scenario, setScenario] = useState('ordering a hot chocolate');
  const [level, setLevel] = useState('A2');
  const [temperature, setTemperature] = useState(0.5);
  const [loadingDialogue, setLoadingDialogue] = useState(false);
  const [dialogueData, setDialogueData] = useState(null);
  const [dialogueError, setDialogueError] = useState(null);
  const [dialogueFeedback, setDialogueFeedback] = useState(null);

  // Streaming state
  const [streamingTurns, setStreamingTurns] = useState([]);
  const [streamingMeta, setStreamingMeta] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);

  // Word Explainer states
  const [word, setWord] = useState('Ausbildung');
  const [loadingWord, setLoadingWord] = useState(false);
  const [wordData, setWordData] = useState(null);
  const [wordError, setWordError] = useState(null);
  const [wordFeedback, setWordFeedback] = useState(null);

  const [clearingCache, setClearingCache] = useState(false);
  const [currentVocab, setCurrentVocab] = useState(null);

  // TTS state
  const [ttsLoadingIndex, setTtsLoadingIndex] = useState(null);
  const [ttsPlayingIndex, setTtsPlayingIndex] = useState(null);
  const audioCacheRef = useRef(new Map());
  const currentAudioRef = useRef(null);

  // Word TTS state
  const [wordTtsLoading, setWordTtsLoading] = useState(null);
  const [wordTtsPlaying, setWordTtsPlaying] = useState(null);
  const wordAudioRef = useRef(null);

  // Practice Mode state
  const [practiceMode, setPracticeMode] = useState(false);
  const [practiceHiddenIndices, setPracticeHiddenIndices] = useState([]);
  const [practiceInputs, setPracticeInputs] = useState({});
  const [practiceResults, setPracticeResults] = useState({});
  const [practiceChecking, setPracticeChecking] = useState(null);

  // STT state
  const [sttRecording, setSttRecording] = useState(null);
  const [sttLoading, setSttLoading] = useState(null);
  const mediaRecorderRef = useRef(null);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    let intervalId = null;
    const isLoading = loadingDialogue || loadingWord;

    if (isLoading) {
      let pool = [...A2_VOCAB_LOADER_LIST];
      const selectNextVocab = () => {
        if (pool.length === 0) pool = [...A2_VOCAB_LOADER_LIST];
        const randomIndex = Math.floor(Math.random() * pool.length);
        const selected = pool[randomIndex];
        pool.splice(randomIndex, 1);
        setCurrentVocab(selected);
      };
      selectNextVocab();
      intervalId = setInterval(selectNextVocab, 4000);
    } else {
      setCurrentVocab(null);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [loadingDialogue, loadingWord]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [dialogueData, loadingDialogue, streamingTurns]);

  const handleGenerateDialogue = async (e) => {
    e.preventDefault();
    if (!scenario.trim()) return;

    setLoadingDialogue(true);
    setIsStreaming(false);
    setStreamingTurns([]);
    setStreamingMeta(null);
    setDialogueError(null);
    setDialogueData(null);
    setDialogueFeedback(null);
    setPracticeMode(false);
    setPracticeHiddenIndices([]);
    setPracticeInputs({});
    setPracticeResults({});
    setPracticeChecking(null);

    try {
      const response = await fetch('/api/scenario_dialogue_stream', {
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

      setLoadingDialogue(false);
      setIsStreaming(true);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      const accumulatedTurns = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop();

        for (const eventStr of events) {
          const trimmed = eventStr.trim();
          if (!trimmed) continue;

          const dataLine = trimmed.split('\n').find(line => line.startsWith('data: '));
          if (!dataLine) continue;

          const jsonStr = dataLine.slice(6);
          let event;
          try {
            event = JSON.parse(jsonStr);
          } catch {
            continue;
          }

          if (event.type === 'turn') {
            accumulatedTurns.push(event.turn);
            setStreamingTurns([...accumulatedTurns]);
          } else if (event.type === 'done') {
            setStreamingMeta(event);
            setDialogueData({
              title: 'Conversation',
              level: event.level,
              cefr_score: event.cefr_score,
              latency_s: event.latency_s,
              dialogue: [...accumulatedTurns],
              cached: event.cached,
              cache_similarity: event.cache_similarity,
            });
            setIsStreaming(false);
          } else if (event.type === 'error') {
            throw new Error(event.error || 'Stream error');
          }
        }
      }
    } catch (err) {
      console.error('Streaming error:', err);
      try {
        const fallbackRes = await fetch('/api/scenario_dialogue', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scenario,
            level,
            temperature: parseFloat(temperature),
            language: 'German'
          })
        });
        if (fallbackRes.ok) {
          const data = await fallbackRes.json();
          if (!data.error) {
            setDialogueData(data);
            setIsStreaming(false);
            setLoadingDialogue(false);
            return;
          }
        }
      } catch (fallbackErr) {
        console.error('Fallback failed:', fallbackErr);
      }
      setDialogueError(err.message || 'Failed to generate dialogue.');
    } finally {
      setIsStreaming(false);
      setLoadingDialogue(false);
    }
  };

  const parsePartialJson = (str) => {
    const data = {
      word: '',
      part_of_speech: '',
      meaning: '',
      example_sentence_german: '',
      example_sentence_english: '',
      synonyms: []
    };
    let cleaned = str.trim().replace(/^```(?:json|JSON)?\s*\n?/, '').replace(/\n?\s*```$/, '').trim();

    const wordMatch = cleaned.match(/"word"\s*:\s*"([^"]*)"?/);
    if (wordMatch) data.word = wordMatch[1];
    const posMatch = cleaned.match(/"part_of_speech"\s*:\s*"([^"]*)"?/);
    if (posMatch) data.part_of_speech = posMatch[1];
    const meaningMatch = cleaned.match(/"meaning"\s*:\s*"([^"]*)"?/);
    if (meaningMatch) data.meaning = meaningMatch[1];
    const exGerMatch = cleaned.match(/"example_sentence_german"\s*:\s*"([^"]*)"?/);
    if (exGerMatch) data.example_sentence_german = exGerMatch[1];
    const exEngMatch = cleaned.match(/"example_sentence_english"\s*:\s*"([^"]*)"?/) ||
                       cleaned.match(/"example_sentence_sentence_english"\s*:\s*"([^"]*)"?/) ||
                       cleaned.match(/"example_sentence_english_translation"\s*:\s*"([^"]*)"?/) ||
                       cleaned.match(/"example_english"\s*:\s*"([^"]*)"?/);
    if (exEngMatch) data.example_sentence_english = exEngMatch[1];

    const synsMatch = cleaned.match(/"synonyms"\s*:\s*\[([\s\S]*)/);
    if (synsMatch) {
      const synsStr = synsMatch[1];
      const objRegex = /\{\s*"word"\s*:\s*"([^"]*)"?\s*(?:,\s*"english"\s*:\s*"([^"]*)"?)?\s*\}/g;
      let match;
      while ((match = objRegex.exec(synsStr)) !== null) {
        data.synonyms.push({ word: match[1], english: match[2] || '' });
      }
    }
    return data;
  };

  const explainWordByName = async (wordToExplain) => {
    if (!wordToExplain.trim()) return;

    setLoadingWord(true);
    setWordError(null);
    setWordData(null);
    setWordFeedback(null);

    try {
      const response = await fetch('/api/explain_word_stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: wordToExplain })
      });

      if (!response.ok) throw new Error(`Server status ${response.status}`);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop();

        for (const line of lines) {
          const cleanedLine = line.replace(/^data:\s*/, '').trim();
          if (!cleanedLine) continue;

          try {
            const event = JSON.parse(cleanedLine);
            if (event.type === 'token') {
              setWordData((prev) => {
                const newRaw = (prev?._raw || '') + event.text;
                const parsed = parsePartialJson(newRaw);
                return { ...parsed, _raw: newRaw, latency_s: prev?.latency_s || null };
              });
            } else if (event.type === 'done') {
              setWordData((prev) => ({ ...prev, latency_s: event.latency_s }));
            }
          } catch (e) {
            console.error('Error parsing SSE line:', e);
          }
        }
      }
    } catch (err) {
      console.error(err);
      try {
        const fallbackRes = await fetch('/api/explain_word', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ word: wordToExplain })
        });
        if (fallbackRes.ok) {
          const data = await fallbackRes.json();
          if (data.error) throw new Error(data.error);
          setWordData(data);
        }
      } catch (fallbackErr) {
        setWordError(fallbackErr.message || 'Failed to explain word.');
      }
    } finally {
      setLoadingWord(false);
    }
  };

  const handleExplainWord = async (e) => {
    e.preventDefault();
    explainWordByName(word);
  };

  const handleWordClick = (clickedWord) => {
    const cleaned = clickedWord.replace(/[^a-zA-ZäöüÄÖÜß]/g, '');
    if (!cleaned) return;
    setWord(cleaned);
    setActiveTab('explain');
    explainWordByName(cleaned);
  };

  const renderClickableText = (text) => {
    if (!text) return null;
    const tokens = text.split(/(\s+|[.,!?;:"'()]+)/g);
    return tokens.map((token, i) => {
      const isWord = /[a-zA-ZäöüÄÖÜß]+/.test(token);
      if (isWord) {
        return (
          <span key={i} className="clickable-word" onClick={() => handleWordClick(token)}>
            {token}
          </span>
        );
      }
      return <span key={i}>{token}</span>;
    });
  };

  const getSpeakerRole = (turn) => {
    return turn.speaker.toLowerCase().includes('a') ? 'person_a' : 'person_b';
  };

  const playTtsLine = useCallback(async (turn, index) => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
      if (ttsPlayingIndex === index) {
        setTtsPlayingIndex(null);
        return;
      }
    }
    setTtsPlayingIndex(null);

    const cacheKey = `${turn.german}|${level}|${getSpeakerRole(turn)}`;
    let objectUrl = audioCacheRef.current.get(cacheKey);

    if (!objectUrl) {
      setTtsLoadingIndex(index);
      try {
        const res = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: turn.german,
            language: (dialogueData && dialogueData.language) || 'German',
            level,
            speaker: getSpeakerRole(turn),
          }),
        });
        if (!res.ok) throw new Error(`TTS request failed: ${res.status}`);
        const blob = await res.blob();
        objectUrl = URL.createObjectURL(blob);
        audioCacheRef.current.set(cacheKey, objectUrl);
      } catch (err) {
        console.error('TTS error:', err);
        return;
      } finally {
        setTtsLoadingIndex(null);
      }
    }

    const audio = new Audio(objectUrl);
    currentAudioRef.current = audio;
    setTtsPlayingIndex(index);
    audio.play();
    audio.onended = () => {
      setTtsPlayingIndex(null);
      currentAudioRef.current = null;
    };
  }, [dialogueData, level, ttsPlayingIndex]);

  const playWordTts = useCallback(async (text) => {
    const cacheKey = `word|${text}`;
    if (wordAudioRef.current) {
      wordAudioRef.current.pause();
      wordAudioRef.current = null;
      if (wordTtsPlaying === cacheKey) {
        setWordTtsPlaying(null);
        return;
      }
    }
    setWordTtsPlaying(null);

    let objectUrl = audioCacheRef.current.get(cacheKey);

    if (!objectUrl) {
      setWordTtsLoading(cacheKey);
      try {
        const res = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text,
            language: 'German',
            level: 'A2',
            speaker: 'default',
          }),
        });
        if (!res.ok) throw new Error(`TTS failed: ${res.status}`);
        const blob = await res.blob();
        objectUrl = URL.createObjectURL(blob);
        audioCacheRef.current.set(cacheKey, objectUrl);
      } catch (err) {
        console.error('Word TTS error:', err);
        return;
      } finally {
        setWordTtsLoading(null);
      }
    }

    const audio = new Audio(objectUrl);
    wordAudioRef.current = audio;
    setWordTtsPlaying(cacheKey);
    audio.play();
    audio.onended = () => {
      setWordTtsPlaying(null);
      wordAudioRef.current = null;
    };
  }, [wordTtsPlaying]);

  const WordTtsBtn = ({ text }) => {
    const key = `word|${text}`;
    const isLoading = wordTtsLoading === key;
    const isPlaying = wordTtsPlaying === key;
    return (
      <button
        className={`tts-btn tts-btn-inline ${isPlaying ? 'tts-playing' : ''} ${isLoading ? 'tts-loading' : ''}`}
        onClick={(e) => { e.stopPropagation(); playWordTts(text); }}
        disabled={isLoading}
        title={isPlaying ? 'Stop' : 'Listen'}
      >
        {isLoading ? '⏳' : isPlaying ? '⏹' : '🔊'}
      </button>
    );
  };

  const togglePracticeMode = () => {
    if (practiceMode) {
      setPracticeMode(false);
      setPracticeHiddenIndices([]);
      setPracticeInputs({});
      setPracticeResults({});
      setPracticeChecking(null);
    } else {
      if (!dialogueData || !dialogueData.dialogue) return;
      const indices = [];
      dialogueData.dialogue.forEach((_, i) => {
        if (Math.random() < 0.5) indices.push(i);
      });
      if (indices.length === 0 && dialogueData.dialogue.length > 0) {
        indices.push(Math.floor(Math.random() * dialogueData.dialogue.length));
      }
      setPracticeHiddenIndices(indices);
      setPracticeInputs({});
      setPracticeResults({});
      setPracticeChecking(null);
      setPracticeMode(true);
    }
  };

  const handlePracticeInputChange = (index, value) => {
    setPracticeInputs(prev => ({ ...prev, [index]: value }));
  };

  const handleMicClick = async (index) => {
    if (sttRecording === index) {
      if (mediaRecorderRef.current) mediaRecorderRef.current.stop();
      setSttRecording(null);
      return;
    }
    if (sttRecording !== null && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setSttRecording(null);
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        if (chunks.length === 0) return;

        const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
        setSttLoading(index);

        try {
          const formData = new FormData();
          formData.append('audio', blob, 'recording.webm');

          const res = await fetch('/api/stt', { method: 'POST', body: formData });
          if (!res.ok) throw new Error(`Server returned ${res.status}`);
          const data = await res.json();
          if (data.text) {
            setPracticeInputs(prev => ({ ...prev, [index]: data.text }));
          }
        } catch (err) {
          console.error('STT fetch error:', err);
        } finally {
          setSttLoading(null);
        }
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setSttRecording(index);
    } catch (err) {
      console.error('Microphone access denied:', err);
      alert('Microphone access is required for voice input.');
    }
  };

  const handlePracticeCheck = async (index) => {
    const userText = (practiceInputs[index] || '').trim();
    if (!userText || !dialogueData) return;

    setPracticeChecking(index);

    try {
      const dialogue = dialogueData.dialogue;
      const contextStart = Math.max(0, index - 3);
      const contextLines = dialogue.slice(contextStart, index).map(t => `${t.speaker}: ${t.german}`).join('\n');

      const res = await fetch('/api/practice_check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_text: userText,
          expected_english: dialogue[index].english || '',
          scenario,
          speaker: dialogue[index].speaker,
          preceding_context: contextLines,
          language: 'German',
          level,
        }),
      });

      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();

      if (data.error) {
        setPracticeResults(prev => ({ ...prev, [index]: { type: 'error', feedback: data.error, score: 0 } }));
      } else {
        let type = 'correct';
        if (!data.on_topic) type = 'error';
        else if (!data.grammar_ok) type = 'warning';

        setPracticeResults(prev => ({
          ...prev,
          [index]: { type, feedback: data.feedback, corrected_text: data.corrected_text, score: data.score }
        }));
      }
    } catch (err) {
      console.error('Practice check error:', err);
      setPracticeResults(prev => ({ ...prev, [index]: { type: 'error', feedback: err.message, score: 0 } }));
    } finally {
      setPracticeChecking(null);
    }
  };

  const handleFeedback = async (endpoint, type) => {
    if (endpoint === 'scenario_dialogue') {
      if (dialogueFeedback === type) return;
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
      console.error('Feedback error:', err);
    }
  };

  const handleClearCache = async () => {
    if (!window.confirm('Clear the semantic cache in Redis?')) return;
    setClearingCache(true);
    try {
      const response = await fetch('/api/clear_cache', { method: 'POST', headers: { 'Content-Type': 'application/json' } });
      const data = await response.json();
      if (data.status === 'success') alert('Cache cleared successfully!');
    } catch (err) {
      alert('Failed to clear cache.');
    } finally {
      setClearingCache(false);
    }
  };

  return (
    <div className="dialog-practice-container">
      {/* Top Bar with Navigation Tabs */}
      <div className="practice-sub-header glass-panel">
        <button className="back-home-btn" onClick={onBackToHome}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          <span>Home</span>
        </button>

        <nav className="nav-tabs">
          <button
            className={`tab-btn ${activeTab === 'dialogue' ? 'active' : ''}`}
            onClick={() => setActiveTab('dialogue')}
          >
            💬 Dialogue Practice
          </button>
          <button
            className={`tab-btn ${activeTab === 'explain' ? 'active' : ''}`}
            onClick={() => setActiveTab('explain')}
          >
            🔍 Word Explainer
          </button>
        </nav>
      </div>

      <div className="dashboard-grid">
        {activeTab === 'dialogue' ? (
          <>
            {/* Sidebar configuration */}
            <section className="glass-panel" style={{ padding: '1.5rem' }}>
              <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Configure Scenario</h2>
              <form onSubmit={handleGenerateDialogue}>
                <div className="form-group">
                  <label className="form-label">🎯 Scenario / Topic</label>
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
                  <label className="form-label">📊 Difficulty (CEFR Level)</label>
                  <select
                    className="form-control"
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    disabled={loadingDialogue}
                  >
                    <option value="A1">A1 (Beginner)</option>
                    <option value="A2">A2 (Elementary)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <span>🌡️ Creativity (Temperature)</span>
                    <span style={{ color: 'var(--primary)' }}>{temperature}</span>
                  </label>
                  <input
                    type="range"
                    className="form-control"
                    min="0.1"
                    max="1.0"
                    step="0.1"
                    value={temperature}
                    onChange={(e) => setTemperature(e.target.value)}
                    disabled={loadingDialogue}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: '1rem' }}
                  disabled={loadingDialogue || isStreaming}
                >
                  {loadingDialogue ? 'Generating Dialogue...' : isStreaming ? 'Receiving Dialogue...' : 'Generate Dialogue'}
                </button>
              </form>

              <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                <button
                  type="button"
                  className="btn"
                  style={{
                    width: '100%',
                    background: 'transparent',
                    border: '1px solid var(--border)',
                    color: 'var(--text-muted)',
                    fontSize: '0.85rem'
                  }}
                  onClick={handleClearCache}
                  disabled={clearingCache}
                >
                  {clearingCache ? 'Clearing Cache...' : '🗑️ Clear Semantic Cache'}
                </button>
              </div>
            </section>

            {/* Dialogue View Area */}
            <section className="chat-container glass-panel">
              <div className="chat-header">
                <h2>{dialogueData?.title || 'Interactive Conversation'}</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {dialogueData && dialogueData.dialogue && dialogueData.dialogue.length > 0 && !isStreaming && (
                    <button
                      className={`practice-toggle-btn ${practiceMode ? 'active' : ''}`}
                      onClick={togglePracticeMode}
                    >
                      {practiceMode ? '📖 View Mode' : '✏️ Practice Mode'}
                    </button>
                  )}
                  {dialogueData && dialogueData.cached && (
                    <span className="badge badge-cache" title={`Similarity: ${(dialogueData.cache_similarity * 100).toFixed(1)}%`}>
                      ⚡ Cached ({(dialogueData.cache_similarity * 100).toFixed(0)}%)
                    </span>
                  )}
                  {dialogueData && dialogueData.latency_s && (
                    <span className="badge badge-latency">
                      ⏱️ {dialogueData.latency_s}s
                    </span>
                  )}
                </div>
              </div>

              <div className="chat-messages">
                {loadingDialogue && (
                  <div className="loading-container">
                    <div className="spinner"></div>
                    <p style={{ color: 'var(--text-secondary)' }}>Crafting natural German dialogue...</p>
                    {currentVocab && (
                      <div className="vocab-rotator">
                        <div className="vocab-badge">Vocabulary Tip</div>
                        <div className="vocab-german">{currentVocab.german}</div>
                        <div className="vocab-english">{currentVocab.english}</div>
                      </div>
                    )}
                  </div>
                )}

                {dialogueError && (
                  <div style={{ padding: '1rem', background: 'rgba(244, 63, 94, 0.1)', color: 'var(--danger)', borderRadius: '8px', border: '1px solid var(--danger)' }}>
                    {dialogueError}
                  </div>
                )}

                {!loadingDialogue && !isStreaming && !dialogueData && !dialogueError && (
                  <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
                    <p>Enter a scenario on the left and click "Generate Dialogue".</p>
                  </div>
                )}

                {/* Display streaming turns */}
                {isStreaming && (
                  <>
                    {streamingTurns.map((turn, index) => (
                      <div key={index} className={`chat-bubble-wrapper ${turn.speaker.includes('A') ? 'left' : 'right'}`}>
                        <div className="speaker-label">{turn.speaker}</div>
                        <div className="chat-bubble">
                          <p className="german-text">{renderClickableText(turn.german)}</p>
                          {turn.english && <p className="english-text">{turn.english}</p>}
                        </div>
                      </div>
                    ))}
                    <div className="streaming-cursor-container">
                      <span className="streaming-dot"></span>
                      <span className="streaming-dot"></span>
                      <span className="streaming-dot"></span>
                    </div>
                  </>
                )}

                {/* Display final completed dialogue */}
                {!isStreaming && dialogueData && dialogueData.dialogue && dialogueData.dialogue.map((turn, index) => {
                  const isHidden = practiceMode && practiceHiddenIndices.includes(index);
                  const result = practiceResults[index];
                  const isChecking = practiceChecking === index;
                  const isRecording = sttRecording === index;
                  const isTranscribing = sttLoading === index;

                  return (
                    <div
                      key={index}
                      className={`chat-bubble-wrapper ${turn.speaker.includes('A') ? 'left' : 'right'}`}
                    >
                      <div className="speaker-label">{turn.speaker}</div>
                      <div className={`chat-bubble ${isHidden ? 'practice-bubble' : ''}`}>
                        {isHidden ? (
                          <div className="practice-turn">
                            <div className="practice-prompt">
                              <span className="practice-hint-label">Translate into German:</span>
                              <p className="practice-english">{turn.english}</p>
                            </div>
                            <div className="practice-input-group">
                              <input
                                type="text"
                                className="practice-input"
                                placeholder="Type in German or click 🎙️ to speak..."
                                value={practiceInputs[index] || ''}
                                onChange={(e) => handlePracticeInputChange(index, e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handlePracticeCheck(index);
                                }}
                                disabled={isChecking || isTranscribing}
                              />
                              <button
                                className={`mic-btn ${isRecording ? 'recording' : ''} ${isTranscribing ? 'transcribing' : ''}`}
                                onClick={() => handleMicClick(index)}
                                disabled={isChecking}
                                title={isRecording ? 'Stop recording' : 'Speak your answer (German)'}
                              >
                                {isTranscribing ? '⏳' : isRecording ? '⏹' : '🎙️'}
                              </button>
                              <button
                                className="practice-check-btn"
                                onClick={() => handlePracticeCheck(index)}
                                disabled={isChecking || !(practiceInputs[index] || '').trim()}
                              >
                                {isChecking ? 'Checking...' : 'Check'}
                              </button>
                            </div>

                            {result && (
                              <div className={`practice-feedback practice-feedback-${result.type}`}>
                                <p className="feedback-text">{result.feedback}</p>
                                {result.corrected_text && result.corrected_text !== practiceInputs[index] && (
                                  <p className="feedback-corrected">
                                    <span className="feedback-label">Better:</span> {result.corrected_text}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <>
                            <div className="dialogue-line-header">
                              <p className="german-text">{renderClickableText(turn.german)}</p>
                              <button
                                className={`tts-btn ${ttsPlayingIndex === index ? 'tts-playing' : ''} ${ttsLoadingIndex === index ? 'tts-loading' : ''}`}
                                onClick={() => playTtsLine(turn, index)}
                                disabled={ttsLoadingIndex === index}
                                title={ttsPlayingIndex === index ? 'Stop audio' : 'Listen to pronunciation'}
                              >
                                {ttsLoadingIndex === index ? '⏳' : ttsPlayingIndex === index ? '⏹' : '🔊'}
                              </button>
                            </div>
                            {turn.english && (
                              <p className="english-text">{turn.english}</p>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}

                <div ref={messagesEndRef} />
              </div>

              {dialogueData && !isStreaming && (
                <div className="chat-footer">
                  <div className="feedback-container">
                    <span className="feedback-label">Was this helpful?</span>
                    <button
                      className={`feedback-btn ${dialogueFeedback === 'up' ? 'active-up' : ''}`}
                      onClick={() => handleFeedback('scenario_dialogue', 'up')}
                      title="Helpful"
                    >
                      👍
                    </button>
                    <button
                      className={`feedback-btn ${dialogueFeedback === 'down' ? 'active-down' : ''}`}
                      onClick={() => handleFeedback('scenario_dialogue', 'down')}
                      title="Not helpful"
                    >
                      👎
                    </button>
                  </div>
                </div>
              )}
            </section>
          </>
        ) : (
          /* Word Explainer Tab */
          <>
            <section className="glass-panel" style={{ padding: '1.5rem' }}>
              <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>German Word Explainer</h2>
              <form onSubmit={handleExplainWord}>
                <div className="form-group">
                  <label className="form-label">🔍 German Word</label>
                  <input
                    type="text"
                    className="form-control"
                    value={word}
                    onChange={(e) => setWord(e.target.value)}
                    placeholder="e.g. Ausbildung, Gemütlichkeit..."
                    disabled={loadingWord}
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: '1rem' }}
                  disabled={loadingWord}
                >
                  {loadingWord ? 'Explaining Word...' : 'Explain Word'}
                </button>
              </form>
            </section>

            <section className="chat-container glass-panel" style={{ padding: '2rem' }}>
              {loadingWord && (
                <div className="loading-container">
                  <div className="spinner"></div>
                  <p style={{ color: 'var(--text-secondary)' }}>Analyzing word, example sentences, and synonyms...</p>
                </div>
              )}

              {wordError && (
                <div style={{ padding: '1rem', background: 'rgba(244, 63, 94, 0.1)', color: 'var(--danger)', borderRadius: '8px', border: '1px solid var(--danger)' }}>
                  {wordError}
                </div>
              )}

              {!loadingWord && !wordData && !wordError && (
                <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
                  <p>Enter a German word on the left or click any word in a dialogue to see its full breakdown.</p>
                </div>
              )}

              {wordData && (
                <div className="word-detail-card">
                  <div className="word-detail-header">
                    <div>
                      <h2 className="word-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {wordData.word || word}
                        {wordData.word && <WordTtsBtn text={wordData.word} />}
                      </h2>
                      {wordData.part_of_speech && (
                        <span className="part-of-speech-badge">{wordData.part_of_speech}</span>
                      )}
                    </div>
                  </div>

                  {wordData.meaning && (
                    <div className="word-section">
                      <h4 className="section-heading">Meaning / Definition</h4>
                      <p className="meaning-text">{wordData.meaning}</p>
                    </div>
                  )}

                  {(wordData.example_sentence_german || wordData.example_sentence_english) && (
                    <div className="word-section">
                      <h4 className="section-heading">Example Sentence</h4>
                      <div className="example-box">
                        {wordData.example_sentence_german && (
                          <p className="example-german" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {wordData.example_sentence_german}
                            <WordTtsBtn text={wordData.example_sentence_german} />
                          </p>
                        )}
                        {wordData.example_sentence_english && (
                          <p className="example-english">{wordData.example_sentence_english}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {wordData.synonyms && wordData.synonyms.length > 0 && (
                    <div className="word-section">
                      <h4 className="section-heading">Synonyms</h4>
                      <div className="synonyms-grid">
                        {wordData.synonyms.map((syn, index) => (
                          <div
                            key={index}
                            className="synonym-chip"
                            onClick={() => {
                              setWord(syn.word);
                              explainWordByName(syn.word);
                            }}
                            title={`Click to explain "${syn.word}"`}
                          >
                            <span className="synonym-word">{syn.word}</span>
                            {syn.english && <span className="synonym-english">({syn.english})</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="chat-footer" style={{ borderTop: '1px solid var(--border)', marginTop: '2rem', paddingTop: '1rem' }}>
                    <div className="feedback-container">
                      <span className="feedback-label">Was this explanation helpful?</span>
                      <button
                        className={`feedback-btn ${wordFeedback === 'up' ? 'active-up' : ''}`}
                        onClick={() => handleFeedback('explain_word', 'up')}
                        title="Helpful"
                      >
                        👍
                      </button>
                      <button
                        className={`feedback-btn ${wordFeedback === 'down' ? 'active-down' : ''}`}
                        onClick={() => handleFeedback('explain_word', 'down')}
                        title="Not helpful"
                      >
                        👎
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
