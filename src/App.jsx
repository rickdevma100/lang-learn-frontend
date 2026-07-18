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
  { german: "uninteressant", english: "uninteresting" },
  { german: "langweilig", english: "boring" },
  { german: "wichtig", english: "important" },
  { german: "traurig", english: "sad" },
  { german: "einwerfen", english: "to drop in / to mail" },
  { german: "die Überweisung", english: "bank transfer" },
  { german: "umziehen", english: "to move (house) / to change clothes" },
  { german: "In die Berge", english: "Into the mountains" },
  { german: "ans Meer", english: "to the sea / seaside" },
  { german: "aufs Land", english: "to the countryside" },
  { german: "in die Großstadt", english: "to the big city" },
  { german: "faul", english: "lazy" },
  { german: "fleißig", english: "industrious / hard-working" },
  { german: "launisch", english: "moody" },
  { german: "kurz", english: "short" },
  { german: "groß", english: "big / tall" },
  { german: "klein", english: "small" },
  { german: "schlank", english: "slim / slender" },
  { german: "dick", english: "thick / fat" },
  { german: "ruhig", english: "quiet / calm" },
  { german: "laut", english: "loud" },
  { german: "freundlich", english: "friendly" },
  { german: "unfreundlich", english: "unfriendly" },
  { german: "intelligent", english: "intelligent" },
  { german: "unintelligent", english: "unintelligent" },
  { german: "die Augen", english: "eyes" },
  { german: "lang", english: "long" },
  { german: "keine", english: "none / no" },
  { german: "feiert", english: "celebrates / parties" },
  { german: "nehmen", english: "to take" },
  { german: "die Kirche", english: "church" },
  { german: "großartig", english: "great / magnificent" },
  { german: "günstig", english: "cheap / inexpensive / favorable" },
  { german: "der Nachbar", english: "neighbor" },
  { german: "schwarz", english: "black" },
  { german: "grau", english: "gray" },
  { german: "grün", english: "green" },
  { german: "gelb", english: "yellow" },
  { german: "das Auto", english: "car" },
  { german: "das Rad", english: "bicycle / wheel" },
  { german: "das Motorrad", english: "motorcycle" },
  { german: "das Boot", english: "boat" },
  { german: "der Zug", english: "train" },
  { german: "die U-Bahn", english: "subway / underground train" },
  { german: "das Flugzeug", english: "airplane" },
  { german: "die Bootsfahrt", english: "boat trip" },
  { german: "der Geldbeutel", english: "wallet / purse" },
  { german: "schnell", english: "fast / quick" },
  { german: "bequem", english: "comfortable / convenient" },
  { german: "langsam", english: "slow" },
  { german: "teuer", english: "expensive" },
  { german: "fliegen", english: "to fly" },
  { german: "fahren", english: "to drive / to travel / to go" },
  { german: "reisen", english: "to travel" },
  { german: "passieren", english: "to happen / to pass" },
  { german: "gehören", english: "to belong to" },
  { german: "gestohlen", english: "stolen" },
  { german: "zusammen", english: "together" },
  { german: "getrennt", english: "separated / separately" },
  { german: "zeigen", english: "to show" },
  { german: "die Fahrkarte", english: "ticket (for train/bus)" },
  { german: "die Kneipe", english: "pub / tavern" },
  { german: "der Abschied", english: "farewell / parting" },
  { german: "das Klima", english: "climate" },
  { german: "trocken", english: "dry" },
  { german: "heiß", english: "hot" },
  { german: "der Frühling", english: "spring" },
  { german: "nass", english: "wet" },
  { german: "warm", english: "warm" },
  { german: "der Sommer", english: "summer" },
  { german: "der Winter", english: "winter" },
  { german: "der Herbst", english: "autumn / fall" },
  { german: "regnet", english: "rains / it rains" },
  { german: "regnerisch", english: "rainy" },
  { german: "schneit", english: "snows / it snows" },
  { german: "das Gewitter", english: "thunderstorm" },
  { german: "hagelt", english: "hails / it hails" },
  { german: "wechselhaft", english: "changeable / unstable" },
  { german: "donnert", english: "thunders / it thunders" },
  { german: "blitzt", english: "flashes (lightning)" },
  { german: "geschlossen", english: "closed" },
  { german: "sauber", english: "clean" },
  { german: "putzt", english: "cleans / is cleaning" },
  { german: "die Nähe", english: "proximity / vicinity (near)" },
  { german: "weit", english: "far / wide" },
  { german: "gegenüber", english: "opposite / across from" },
  { german: "neben", english: "next to" },
  { german: "hinter", english: "behind" },
  { german: "geradeaus", english: "straight ahead" },
  { german: "weil", english: "because" },
  { german: "obwohl", english: "although / even though" },
  { german: "denn", english: "because / for" },
  { german: "da", english: "since / because / there" },
  { german: "deshalb", english: "therefore / that's why" },
  { german: "der Norden", english: "north / the north" },
  { german: "der Süden", english: "south / the south" },
  { german: "der Westen", english: "west / the west" },
  { german: "der Osten", english: "east / the east" },
  { german: "der Freund / die Freundin", english: "friend (male / female)" }
];

function App() {
  const [activeTab, setActiveTab] = useState('dialogue'); // 'dialogue' or 'explain'

  // Dialogue states
  const [scenario, setScenario] = useState('ordering a hot chocolate');
  const [level, setLevel] = useState('A2');
  const [temperature, setTemperature] = useState(0.5);
  const [loadingDialogue, setLoadingDialogue] = useState(false);
  const [dialogueData, setDialogueData] = useState(null);
  const [dialogueError, setDialogueError] = useState(null);
  const [dialogueFeedback, setDialogueFeedback] = useState(null); // 'up', 'down', or null

  // Streaming state
  const [streamingTurns, setStreamingTurns] = useState([]);   // turns received so far during SSE
  const [streamingMeta, setStreamingMeta] = useState(null);   // metadata from the 'done' event
  const [isStreaming, setIsStreaming] = useState(false);       // true while receiving SSE events

  // Word Explainer states
  const [word, setWord] = useState('Ausbildung');
  const [loadingWord, setLoadingWord] = useState(false);
  const [wordData, setWordData] = useState(null);
  const [wordError, setWordError] = useState(null);
  const [wordFeedback, setWordFeedback] = useState(null); // 'up', 'down', or null

  const [clearingCache, setClearingCache] = useState(false);
  const [currentVocab, setCurrentVocab] = useState(null);

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
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // TTS state
  const [ttsLoadingIndex, setTtsLoadingIndex] = useState(null);  // index being fetched
  const [ttsPlayingIndex, setTtsPlayingIndex] = useState(null);  // index currently playing
  const audioCacheRef = useRef(new Map());  // text -> object URL (avoids re-fetching)
  const currentAudioRef = useRef(null);     // currently playing Audio element

  // Word TTS state (separate from dialogue TTS)
  const [wordTtsLoading, setWordTtsLoading] = useState(null); // cache key being fetched
  const [wordTtsPlaying, setWordTtsPlaying] = useState(null); // cache key currently playing
  const wordAudioRef = useRef(null);        // currently playing word Audio element

  // Practice Mode state
  const [practiceMode, setPracticeMode] = useState(false);
  const [practiceHiddenIndices, setPracticeHiddenIndices] = useState([]);
  const [practiceInputs, setPracticeInputs] = useState({});
  const [practiceResults, setPracticeResults] = useState({});
  const [practiceChecking, setPracticeChecking] = useState(null);

  // STT (Speech-to-Text) state
  const [sttRecording, setSttRecording] = useState(null);    // index currently recording
  const [sttLoading, setSttLoading] = useState(null);        // index being transcribed
  const mediaRecorderRef = useRef(null);

  useEffect(() => {
    let intervalId = null;
    const isLoading = loadingDialogue || loadingWord;

    if (isLoading) {
      let pool = [...A2_VOCAB_LOADER_LIST];

      const selectNextVocab = () => {
        if (pool.length === 0) {
          pool = [...A2_VOCAB_LOADER_LIST];
        }
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
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [loadingDialogue, loadingWord]);

  const messagesEndRef = useRef(null);

  // Auto scroll to bottom of chat (also triggers when new streaming turns arrive)
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [dialogueData, loadingDialogue, streamingTurns]);

  // Handle generating a new dialogue via SSE streaming
  const handleGenerateDialogue = async (e) => {
    e.preventDefault();
    if (!scenario.trim()) return;

    // Reset all state
    setLoadingDialogue(true);
    setIsStreaming(false);
    setStreamingTurns([]);
    setStreamingMeta(null);
    setDialogueError(null);
    setDialogueData(null);
    setDialogueFeedback(null);
    // Reset practice mode state
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

      // Switch from loading spinner to streaming mode
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

        // Process complete SSE events (each ends with \n\n)
        const events = buffer.split('\n\n');
        buffer = events.pop(); // Keep incomplete event in buffer

        for (const eventStr of events) {
          const trimmed = eventStr.trim();
          if (!trimmed) continue;

          // Parse SSE data lines
          const dataLine = trimmed.split('\n')
            .find(line => line.startsWith('data: '));
          if (!dataLine) continue;

          const jsonStr = dataLine.slice(6); // Remove 'data: '
          let event;
          try {
            event = JSON.parse(jsonStr);
          } catch {
            console.warn('Failed to parse SSE event:', jsonStr);
            continue;
          }

          if (event.type === 'turn') {
            accumulatedTurns.push(event.turn);
            setStreamingTurns([...accumulatedTurns]);
          } else if (event.type === 'done') {
            setStreamingMeta(event);
            // Build final dialogueData for downstream features (TTS, Practice, etc.)
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
      // Try falling back to non-streaming endpoint
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
        console.error('Fallback also failed:', fallbackErr);
      }
      setDialogueError(err.message || 'Failed to generate dialogue. Please try again.');
    } finally {
      setIsStreaming(false);
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

  // Helper: map dialogue turn → speaker role for voice selection
  const getSpeakerRole = (turn) => {
    return turn.speaker.toLowerCase().includes('a') ? 'person_a' : 'person_b';
  };

  // Play TTS audio for a single dialogue line (with Redis-backed caching via /api/tts)
  const playTtsLine = useCallback(async (turn, index) => {
    // Stop any currently playing audio
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
      if (ttsPlayingIndex === index) {
        setTtsPlayingIndex(null);
        return; // toggle off when clicking the same button again
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

  // Play TTS for a single word / sentence in the Word Explainer
  const playWordTts = useCallback(async (text) => {
    const cacheKey = `word|${text}`;

    // Toggle off if same item is playing
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

  // Helper: small inline TTS button for the word explainer
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
        aria-label={isPlaying ? 'Stop audio' : `Listen to: ${text}`}
      >
        {isLoading ? '⏳' : isPlaying ? '⏹' : '🔊'}
      </button>
    );
  };

  // ── Practice Mode handlers ──
  const togglePracticeMode = () => {
    if (practiceMode) {
      // Turn off — reset all practice state
      setPracticeMode(false);
      setPracticeHiddenIndices([]);
      setPracticeInputs({});
      setPracticeResults({});
      setPracticeChecking(null);
    } else {
      // Turn on — randomly hide ~50% of turns
      if (!dialogueData || !dialogueData.dialogue) return;
      const indices = [];
      dialogueData.dialogue.forEach((_, i) => {
        if (Math.random() < 0.5) indices.push(i);
      });
      // Ensure at least 1 turn is hidden
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
    // If already recording this index, stop
    if (sttRecording === index) {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
      setSttRecording(null);
      return;
    }

    // If recording a different index, stop that first
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
        // Stop all tracks to release the microphone
        stream.getTracks().forEach(t => t.stop());

        if (chunks.length === 0) return;

        const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
        setSttLoading(index);

        try {
          const formData = new FormData();
          formData.append('audio', blob, 'recording.webm');

          const res = await fetch('/api/stt', {
            method: 'POST',
            body: formData,
          });

          if (!res.ok) throw new Error(`Server returned ${res.status}`);
          const data = await res.json();

          if (data.text) {
            setPracticeInputs(prev => ({ ...prev, [index]: data.text }));
          } else if (data.error) {
            console.error('STT error:', data.error);
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
      alert('Microphone access is required for voice input. Please allow microphone access in your browser settings.');
    }
  };

  const handlePracticeCheck = async (index) => {
    const userText = (practiceInputs[index] || '').trim();
    if (!userText || !dialogueData) return;

    setPracticeChecking(index);

    try {
      // Build preceding context (up to 3 previous turns)
      const dialogue = dialogueData.dialogue;
      const contextStart = Math.max(0, index - 3);
      const contextLines = dialogue.slice(contextStart, index)
        .map(t => `${t.speaker}: ${t.german}`)
        .join('\n');

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

      if (!res.ok) throw new Error(`Server returned status ${res.status}`);
      const data = await res.json();

      if (data.error) {
        setPracticeResults(prev => ({
          ...prev,
          [index]: { type: 'error', feedback: data.error, score: 0 },
        }));
      } else {
        let type = 'correct';
        if (!data.on_topic) type = 'error';
        else if (!data.grammar_ok) type = 'warning';

        setPracticeResults(prev => ({
          ...prev,
          [index]: {
            type,
            feedback: data.feedback,
            corrected_text: data.corrected_text,
            score: data.score,
          },
        }));
      }
    } catch (err) {
      console.error('Practice check error:', err);
      setPracticeResults(prev => ({
        ...prev,
        [index]: { type: 'error', feedback: err.message || 'Failed to check.', score: 0 },
      }));
    } finally {
      setPracticeChecking(null);
    }
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

  // Handle clearing semantic cache
  const handleClearCache = async () => {
    if (!window.confirm('Are you sure you want to clear the semantic cache?')) return;
    setClearingCache(true);
    try {
      const response = await fetch('/api/clear_cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }
      const data = await response.json();
      if (data.status === 'success') {
        alert('Cache cleared successfully!');
      } else {
        throw new Error(data.message || 'Failed to clear cache.');
      }
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to clear cache.');
    } finally {
      setClearingCache(false);
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

        <div className="header-right">
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

      {/* Main Content Area */}
      <main>
        {activeTab === 'dialogue' ? (
          <div className="dashboard-grid">
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
                    <option value="B1">B1 (Intermediate)</option>
                    <option value="B2">B2 (Upper Intermediate)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">🎛️ Creativity (Temperature: {temperature})</label>
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
                  {loadingDialogue ? '⏳ Generating...' : '✨ Generate Dialogue'}
                </button>

                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{
                    width: '100%',
                    marginTop: '0.75rem',
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    color: 'var(--text-secondary)',
                    border: '1px solid rgba(255, 255, 255, 0.06)'
                  }}
                  onClick={handleClearCache}
                  disabled={clearingCache}
                >
                  {clearingCache ? '🧹 Clearing Cache...' : '🧹 Clear Semantic Cache'}
                </button>
              </form>
            </section>

            {/* Chat Display Panel */}
            <section className="glass-panel chat-container">
              <div className="chat-header">
                <h3>Conversation Display</h3>
                {dialogueData && (
                  <div className="chat-meta">
                    <span className="meta-badge">⏱️ Latency: {dialogueData.latency_s}s</span>
                    <span className="meta-badge highlight">🎯 CEFR: {dialogueData.level || level} (Score: {dialogueData.cefr_score})</span>
                    <button
                      className={`practice-mode-btn ${practiceMode ? 'active' : ''}`}
                      onClick={togglePracticeMode}
                      title={practiceMode ? 'Exit Practice Mode' : 'Enter Practice Mode'}
                    >
                      {practiceMode ? '✏️ Exit Practice' : '🎯 Practice Mode'}
                    </button>
                  </div>
                )}
              </div>

              <div className="chat-messages">
                {loadingDialogue && (
                  <div className="spinner-container">
                    <div className="spinner"></div>
                    <p style={{ color: 'var(--text-secondary)' }}>Crafting your scenario in German...</p>
                    {currentVocab && (
                      <div className="vocab-loader-card" key={currentVocab.german}>
                        <div className="vocab-loader-title">
                          <span>💡</span> A2 German Vocabulary Tip
                        </div>
                        <div className="vocab-loader-german">
                          {currentVocab.german}
                        </div>
                        <div className="vocab-loader-english">
                          {currentVocab.english}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {dialogueError && (
                  <div style={{ color: 'var(--danger)', padding: '1rem', textAlign: 'center' }}>
                    <p>⚠️ {dialogueError}</p>
                  </div>
                )}

                {!loadingDialogue && !isStreaming && !dialogueData && !dialogueError && (
                  <div className="chat-empty">
                    <div className="chat-empty-icon">💬</div>
                    <p>Describe a scenario on the left and click <strong>Generate Dialogue</strong> to start practicing.</p>
                  </div>
                )}

                {/* Streaming turns: render each as a chat bubble as it arrives */}
                {isStreaming && streamingTurns.map((turn, index) => {
                  const isPersonA = turn.speaker.toLowerCase().includes('a');
                  return (
                    <div
                      key={`stream-${index}`}
                      className={`chat-bubble-wrapper ${isPersonA ? 'left' : 'right'} streaming-new`}
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

                {/* Streaming typing indicator */}
                {isStreaming && (
                  <div className="typing-indicator">
                    <span></span><span></span><span></span>
                  </div>
                )}

                {dialogueData && dialogueData.dialogue && dialogueData.dialogue.map((turn, index) => {
                  const isPersonA = turn.speaker.toLowerCase().includes('a');
                  const isTtsLoading = ttsLoadingIndex === index;
                  const isTtsPlaying = ttsPlayingIndex === index;
                  const isHidden = practiceMode && practiceHiddenIndices.includes(index);
                  const result = practiceResults[index];
                  const isChecking = practiceChecking === index;

                  return (
                    <div
                      key={index}
                      className={`chat-bubble-wrapper ${isPersonA ? 'left' : 'right'}`}
                    >
                      <span className="speaker-label">{turn.speaker}</span>
                      <div className="chat-bubble">
                        {isHidden ? (
                          /* ── Practice: hidden turn with input ── */
                          <div className="practice-input-wrapper">
                            <div className="practice-input-row">
                              <textarea
                                className={`practice-input ${isChecking ? 'practice-checking' : ''}`}
                                value={practiceInputs[index] || ''}
                                onChange={(e) => handlePracticeInputChange(index, e.target.value)}
                                placeholder={sttLoading === index ? 'Transcribing…' : 'Write or speak your German sentence…'}
                                disabled={isChecking || sttLoading === index}
                                rows={2}
                              />
                              <button
                                className={`stt-mic-btn ${sttRecording === index ? 'recording' : ''} ${sttLoading === index ? 'transcribing' : ''}`}
                                onClick={() => handleMicClick(index)}
                                disabled={isChecking || sttLoading === index}
                                title={sttRecording === index ? 'Stop recording' : 'Record voice'}
                              >
                                {sttLoading === index ? '⏳' : sttRecording === index ? '⏹' : '🎤'}
                              </button>
                            </div>
                            {turn.english && (
                              <div className="practice-hint">
                                💡 Hint: {turn.english}
                              </div>
                            )}
                            <button
                              className="practice-check-btn"
                              onClick={() => handlePracticeCheck(index)}
                              disabled={isChecking || !(practiceInputs[index] || '').trim()}
                            >
                              {isChecking ? '⏳ Checking…' : '✓ Check'}
                            </button>
                            {result && (
                              <div className={`practice-feedback ${result.type}`}>
                                <span className="pf-icon">
                                  {result.type === 'correct' ? '✅' : result.type === 'warning' ? '⚠️' : '❌'}
                                </span>
                                <span>{result.feedback}</span>
                                {result.score != null && (
                                  <span className={`practice-score-badge ${result.score >= 0.8 ? 'high' : result.score >= 0.5 ? 'medium' : 'low'}`}>
                                    {result.score.toFixed(1)}
                                  </span>
                                )}
                              </div>
                            )}
                            {result && result.corrected_text && (
                              <div className="practice-feedback warning" style={{ marginTop: '4px' }}>
                                <span className="pf-icon">📝</span>
                                <span>Correction: <strong>{result.corrected_text}</strong></span>
                              </div>
                            )}
                          </div>
                        ) : (
                          /* ── Normal display ── */
                          <>
                            <div className="german-text">
                              {renderClickableText(turn.german)}
                            </div>
                            {turn.english && (
                              <div className="english-translation">
                                {turn.english}
                              </div>
                            )}
                            <button
                              className={`tts-btn ${isTtsPlaying ? 'tts-playing' : ''} ${isTtsLoading ? 'tts-loading' : ''}`}
                              onClick={() => playTtsLine(turn, index)}
                              disabled={isTtsLoading}
                              title={isTtsPlaying ? 'Stop' : 'Listen'}
                              aria-label={`${isTtsPlaying ? 'Stop' : 'Listen to'} ${turn.speaker}`}
                            >
                              {isTtsLoading ? '⏳' : isTtsPlaying ? '⏹' : '🔊'}
                            </button>
                          </>
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
                  {currentVocab && (
                    <div className="vocab-loader-card" key={currentVocab.german}>
                      <div className="vocab-loader-title">
                        <span>💡</span> A2 German Vocabulary Tip
                      </div>
                      <div className="vocab-loader-german">
                        {currentVocab.german}
                      </div>
                      <div className="vocab-loader-english">
                        {currentVocab.english}
                      </div>
                    </div>
                  )}
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
                      <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {wordData.word || word}
                        <WordTtsBtn text={wordData.word || word} />
                      </h2>
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
                            <WordTtsBtn text={syn.word} />
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
