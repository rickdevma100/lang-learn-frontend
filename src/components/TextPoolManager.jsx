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
  // Input mode: 'form' (plain text, default) or 'json' (raw json)
  const [inputMode, setInputMode] = useState('form');

  // Plain text form fields
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('zeitung');
  const [formText, setFormText] = useState('');
  const [formSender, setFormSender] = useState('');
  const [formRecipient, setFormRecipient] = useState('');
  const [formSubject, setFormSubject] = useState('');
  const [formDirectory, setFormDirectory] = useState([
    { floor: '2. Stock', departments: 'Sportartikel, Fahrräder, Outdoor, Camping' },
    { floor: '1. Stock', departments: 'Damenmode, Herrenmode, Schuhe, Taschen' },
    { floor: 'Erdgeschoss (EG)', departments: 'Bäckerei, Zeitschriften, Kosmetik, Information' },
    { floor: 'Untergeschoss (UG)', departments: 'Supermarkt, Drogerie, Parkhaus' }
  ]);
  const [formAds, setFormAds] = useState([
    { id: 'a', title: 'Fitnessclub Aktiv', text: 'Training ab 19 € pro Monat. Mo-So 6-23 Uhr. Kostenloses Probetraining!' },
    { id: 'b', title: 'Tanzschule Rhythmus', text: 'Salsa- und Standard-Tanzkurse für Anfänger jeden Freitag 19 Uhr.' },
    { id: 'c', title: 'Kletterhalle Gipfelstürmer', text: 'Kletterwände für alle Level. Ausrüstung zum Ausleihen vorhanden.' }
  ]);
  const [showSmartPasteModal, setShowSmartPasteModal] = useState(false);
  const [smartPasteInput, setSmartPasteInput] = useState('');
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
  const audioCacheRef = useRef(new Map());

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
    const cacheKey = `word|${textToSpeak}`;

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    let audioUrl = audioCacheRef.current.get(cacheKey);

    if (!audioUrl) {
      setAudioLoading(true);
      try {
        const res = await fetch(`${apiBase}/tts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: textToSpeak,
            language: 'German',
            level: 'A2',
            speaker: 'default'
          })
        });
        if (!res.ok) throw new Error(`Audio status ${res.status}`);
        const blob = await res.blob();
        audioUrl = URL.createObjectURL(blob);
        audioCacheRef.current.set(cacheKey, audioUrl);
      } catch (e) {
        console.warn('TTS playback error:', e);
        return;
      } finally {
        setAudioLoading(false);
      }
    }

    if (audioRef.current) {
      audioRef.current.src = audioUrl;
      audioRef.current.play().catch(err => console.warn('Audio play error:', err));
    } else {
      const audio = new Audio(audioUrl);
      audio.play().catch(err => console.warn('Audio play error:', err));
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

  // Directory helpers (Teil 2)
  const handleUpdateDirRow = (index, field, value) => {
    setFormDirectory(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleAddDirRow = () => {
    setFormDirectory(prev => [
      ...prev,
      { floor: `${prev.length + 1}. Stock`, departments: '' }
    ]);
  };

  const handleRemoveDirRow = (index) => {
    setFormDirectory(prev => prev.filter((_, i) => i !== index));
  };

  // Classified Ads helpers (Teil 4)
  const handleUpdateAd = (index, field, value) => {
    setFormAds(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleAddAd = () => {
    setFormAds(prev => {
      const nextLetter = String.fromCharCode(97 + prev.length);
      return [...prev, { id: nextLetter, title: '', text: '' }];
    });
  };

  const handleRemoveAd = (index) => {
    setFormAds(prev => prev.filter((_, i) => i !== index));
  };

  // Sample data loader for plain text form
  const handleLoadSample = () => {
    setAddError('');
    setAddSuccess('');
    if (selectedTeil === 'lesen_teil1') {
      setFormTitle('Neue Stadtbibliothek in Nürnberg eröffnet');
      setFormCategory('zeitung');
      setFormText(
        'Gestern hat in Nürnberg die neue Stadtbibliothek ihre Türen für Besucher geöffnet. Auf vier Etagen finden Lesebegeisterte mehr als 200.000 Bücher, Zeitungen und digitale Medien.\n\nBesonders beliebt sind die modernen Arbeitsplätze mit schnellem Internet und gemütlichen Sesseln. Für Kinder gibt es einen eigenen Lesebereich mit bunten Kissen und Hörspielen.\n\nDie Bibliotheksleiterin Marion Weber freut sich über das große Interesse: „Schon am ersten Tag kamen über tausend Besucher. Unser Ziel ist es, einen Treffpunkt für alle Generationen zu schaffen.\"\n\nDer Eintritt ist kostenlos, ein Ausweis kostet nur 12 Euro im Jahr.'
      );
    } else if (selectedTeil === 'lesen_teil2') {
      setFormTitle('Kaufhaus City-Galerie Wegweiser');
      setFormDirectory([
        { floor: '3. Stock', departments: 'Restaurant, Dachterrasse, Kundentoiletten, Wickelraum' },
        { floor: '2. Stock', departments: 'Sportbekleidung, Fahrräder, Camping, Fitnessgeräte' },
        { floor: '1. Stock', departments: 'Damen- und Herrenmode, Schuhe, Lederwaren, Schmuck' },
        { floor: 'Erdgeschoss (EG)', departments: 'Information, Kosmetik, Parfümerie, Blumen, Bäcker' },
        { floor: 'Untergeschoss (UG)', departments: 'Supermarkt, Drogerie, Apotheke, Parkhaus' }
      ]);
    } else if (selectedTeil === 'lesen_teil3') {
      setFormSender('Lisa Hoffmann');
      setFormRecipient('Stefan Meier');
      setFormSubject('Einladung zu unserer Einweihungsfeier');
      setFormText(
        'Lieber Stefan,\n\nwir sind endlich in unsere neue Wohnung in der Schillerstraße umgezogen! Jetzt möchten wir das gerne mit unseren Freunden feiern.\n\nDie Party findet nächsten Samstag ab 18 Uhr statt. Für Essen und Getränke ist gesorgt, aber wenn du möchtest, kannst du gerne einen Salat oder Nachtisch mitbringen.\n\nGib mir bitte bis Donnerstag Bescheid, ob du kommen kannst.\n\nHerzliche Grüße,\nLisa'
      );
    } else if (selectedTeil === 'lesen_teil4') {
      setFormTitle('Sport- und Freizeitangebote in Freiburg');
      setFormAds([
        { id: 'a', title: 'Yoga am See', text: 'Entspannung in der Natur. Jeden Samstag 10 Uhr am Seepark. Alle Level willkommen! Matten vorhanden.' },
        { id: 'b', title: 'Fahrrad-Verleih & Touren', text: 'E-Bikes und Mountainbikes günstig mieten. Geführte Schwarzwald-Touren ab 25 €.' },
        { id: 'c', title: 'Kanu-Club Breisgau', text: 'Paddeln auf der Dreisam. Anfängerkurse für Jugendliche und Erwachsene. Sa/So 14 Uhr.' },
        { id: 'd', title: 'Kletterzentrum Süd', text: 'Große Kletter- und Boulderhalle. Schnupperkurse jeden Mittwoch 18 Uhr.' }
      ]);
    }
  };

  // Smart Paste Handler: parses raw pasted text into form fields
  const handleExecuteSmartPaste = (rawText) => {
    if (!rawText || !rawText.trim()) return;
    const clean = rawText.trim();
    setAddError('');
    setAddSuccess('');

    if (selectedTeil === 'lesen_teil1') {
      const lines = clean.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length > 1) {
        setFormTitle(lines[0]);
        setFormText(lines.slice(1).join('\n\n'));
      } else {
        setFormText(clean);
      }
    } else if (selectedTeil === 'lesen_teil3') {
      // Check for email header markers
      let sender = '';
      let recipient = '';
      let subject = '';
      const bodyLines = [];

      clean.split('\n').forEach(line => {
        const l = line.trim();
        if (/^von:\s*/i.test(l)) sender = l.replace(/^von:\s*/i, '');
        else if (/^an:\s*/i.test(l)) recipient = l.replace(/^an:\s*/i, '');
        else if (/^betreff:\s*/i.test(l)) subject = l.replace(/^betreff:\s*/i, '');
        else bodyLines.push(line);
      });

      if (sender) setFormSender(sender);
      if (recipient) setFormRecipient(recipient);
      if (subject) setFormSubject(subject);
      
      const bodyText = bodyLines.join('\n').trim();
      if (!subject && bodyLines.length > 1) {
        const firstLine = bodyLines.find(l => l.trim());
        if (firstLine && !firstLine.toLowerCase().startsWith('liebe') && !firstLine.toLowerCase().startsWith('hallo')) {
          setFormSubject(firstLine.trim());
          setFormText(bodyText.replace(firstLine, '').trim());
        } else {
          setFormText(bodyText);
        }
      } else {
        setFormText(bodyText);
      }
    } else if (selectedTeil === 'lesen_teil2') {
      // Parse Floor lines like "1. Stock: Mode, Schuhe"
      const lines = clean.split('\n').map(l => l.trim()).filter(Boolean);
      const rows = [];
      let detectedTitle = formTitle || 'Kaufhaus Wegweiser';

      lines.forEach((line, idx) => {
        if (idx === 0 && !line.includes(':') && !/\d+\.\s*stock|eg|ug|erdgeschoss|untergeschoss/i.test(line)) {
          detectedTitle = line;
          return;
        }
        if (line.includes(':')) {
          const parts = line.split(':');
          rows.push({ floor: parts[0].trim(), departments: parts.slice(1).join(':').trim() });
        } else if (line.includes('—') || line.includes('-')) {
          const parts = line.split(/[-—]/);
          rows.push({ floor: parts[0].trim(), departments: parts.slice(1).join('-').trim() });
        } else {
          rows.push({ floor: `Etage ${rows.length + 1}`, departments: line });
        }
      });

      if (detectedTitle) setFormTitle(detectedTitle);
      if (rows.length > 0) setFormDirectory(rows);
    } else if (selectedTeil === 'lesen_teil4') {
      // Split ads by double newlines or "Anzeige"
      const blocks = clean.split(/\n\s*\n/).map(b => b.trim()).filter(Boolean);
      if (blocks.length > 0) {
        const newAds = blocks.map((block, idx) => {
          const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
          const letter = String.fromCharCode(97 + idx);
          if (lines.length > 1) {
            return { id: letter, title: lines[0], text: lines.slice(1).join(' ') };
          }
          return { id: letter, title: `Anzeige ${letter.toUpperCase()}`, text: block };
        });
        setFormAds(newAds);
      }
    }

    setShowSmartPasteModal(false);
    setSmartPasteInput('');
    setAddSuccess('✨ Auto-filled text into form fields successfully!');
  };

  const handleClearForm = () => {
    setFormTitle('');
    setFormText('');
    setFormSender('');
    setFormRecipient('');
    setFormSubject('');
    setNewTextJson('');
    setAddError('');
    setAddSuccess('');
  };

  const handleAddText = async () => {
    setAddError('');
    setAddSuccess('');

    let payloadString = '';

    if (inputMode === 'json') {
      if (!newTextJson.trim()) {
        setAddError('Please enter a JSON text object or load the template.');
        return;
      }
      try {
        JSON.parse(newTextJson); // Validate client-side
        payloadString = newTextJson;
      } catch (e) {
        setAddError(`Invalid JSON: ${e.message}`);
        return;
      }
    } else {
      // Plain text form mode validation and serialization
      try {
        if (selectedTeil === 'lesen_teil1') {
          if (!formTitle.trim()) throw new Error('Please enter a title for the article.');
          if (!formText.trim()) throw new Error('Please enter the article text.');
          payloadString = JSON.stringify({
            title: formTitle.trim(),
            text: formText.trim(),
            category: formCategory || 'zeitung'
          });
        } else if (selectedTeil === 'lesen_teil2') {
          if (!formTitle.trim()) throw new Error('Please enter a building or mall title.');
          const validRows = formDirectory.filter(r => r.floor.trim() && r.departments.trim());
          if (validRows.length === 0) throw new Error('Please provide at least one floor with department information.');
          payloadString = JSON.stringify({
            title: formTitle.trim(),
            directory: validRows
          });
        } else if (selectedTeil === 'lesen_teil3') {
          if (!formSubject.trim() && !formTitle.trim()) throw new Error('Please enter a subject (Betreff).');
          if (!formText.trim()) throw new Error('Please enter the letter/email text.');
          payloadString = JSON.stringify({
            sender: formSender.trim() || 'Unbekannt',
            recipient: formRecipient.trim() || 'Freund/in',
            subject: (formSubject || formTitle).trim(),
            text: formText.trim()
          });
        } else if (selectedTeil === 'lesen_teil4') {
          if (!formTitle.trim()) throw new Error('Please enter a category title for the classified ads.');
          const validAds = formAds.filter(a => a.title.trim() || a.text.trim());
          if (validAds.length === 0) throw new Error('Please add at least one classified ad.');
          payloadString = JSON.stringify({
            title: formTitle.trim(),
            ads: validAds.map((a, idx) => ({
              id: a.id || String.fromCharCode(97 + idx),
              title: a.title.trim() || `Anzeige ${String.fromCharCode(65 + idx)}`,
              text: a.text.trim()
            }))
          });
        }
      } catch (err) {
        setAddError(err.message);
        return;
      }
    }

    try {
      const res = await fetch(`${apiBase}/pool_add_text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teil: selectedTeil, text_data: payloadString }),
      });
      const data = await res.json();
      if (data.success) {
        setAddSuccess(`🎉 Successfully submitted! Pool now has ${data.count} certified texts.`);
        handleClearForm();
        fetchTexts(selectedTeil);
        fetchStats();
      } else {
        setAddError(data.error || 'Failed to add text to pool.');
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
          <div className="pool-add-header-row">
            <div>
              <h3>➕ Add New Text to Pool</h3>
              <p className="pool-add-subtext">
                Submit authentic CEFR A2 German material directly to expand your exam pool.
              </p>
            </div>
            {/* Segmented Mode Selector */}
            <div className="pool-mode-toggle">
              <button
                type="button"
                className={`mode-toggle-btn ${inputMode === 'form' ? 'active' : ''}`}
                onClick={() => setInputMode('form')}
              >
                📝 Text Form
              </button>
              <button
                type="button"
                className={`mode-toggle-btn ${inputMode === 'json' ? 'active' : ''}`}
                onClick={() => setInputMode('json')}
              >
                ⚙️ Raw JSON
              </button>
            </div>
          </div>

          {/* Quick Action Toolbar */}
          <div className="form-quick-actions">
            {inputMode === 'form' ? (
              <>
                <button type="button" className="quick-action-btn sample" onClick={handleLoadSample}>
                  💡 Load Sample A2 Text
                </button>
                <button type="button" className="quick-action-btn auto-extract" onClick={() => setShowSmartPasteModal(true)}>
                  📋 Paste & Auto-Fill
                </button>
                <button type="button" className="quick-action-btn clear" onClick={handleClearForm}>
                  🔄 Clear
                </button>
              </>
            ) : (
              <>
                <button type="button" className="template-btn" onClick={loadTemplate}>
                  📋 Load {selectedTeil.replace('lesen_', 'Teil ').replace('teil', '')} JSON Template
                </button>
                <button type="button" className="quick-action-btn clear" onClick={() => setNewTextJson('')}>
                  🔄 Clear
                </button>
              </>
            )}
          </div>

          {/* FORM MODE */}
          {inputMode === 'form' && (
            <div className="pool-form-body">
              {/* TEIL 1: NEWSPAPER ARTICLE */}
              {selectedTeil === 'lesen_teil1' && (
                <div className="teil-form-container">
                  <div className="pool-form-group">
                    <label className="pool-form-label">
                      <span>Article Title (Titel)</span>
                      <span className="required-star">*</span>
                    </label>
                    <input
                      type="text"
                      className="pool-form-input"
                      placeholder="z.B. Mobilität im Wandel: Immer mehr Menschen fahren Fahrrad"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                    />
                  </div>

                  <div className="pool-form-group">
                    <label className="pool-form-label">
                      <span>Category / Medium</span>
                    </label>
                    <div className="category-chips">
                      {['zeitung', 'magazin', 'nachrichten', 'blog'].map(cat => (
                        <button
                          key={cat}
                          type="button"
                          className={`cat-chip ${formCategory === cat ? 'active' : ''}`}
                          onClick={() => setFormCategory(cat)}
                        >
                          {cat === 'zeitung' ? '📰 Zeitung' : cat === 'magazin' ? '📖 Magazin' : cat === 'nachrichten' ? '📢 Nachrichten' : '🌐 Blog'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pool-form-group">
                    <div className="label-with-counter">
                      <label className="pool-form-label">
                        <span>German Article Text (Vollständiger Text)</span>
                        <span className="required-star">*</span>
                      </label>
                      <span className="word-counter-badge">
                        📊 {formText.trim() ? formText.trim().split(/\s+/).length : 0} words
                      </span>
                    </div>
                    <textarea
                      className="pool-form-textarea"
                      placeholder="Fügen Sie hier den vollständigen deutschen Text ein..."
                      value={formText}
                      onChange={(e) => setFormText(e.target.value)}
                      rows={10}
                    />
                    <span className="field-hint">💡 Recommendation for Goethe A2: 180–220 words across 2–4 paragraphs.</span>
                  </div>
                </div>
              )}

              {/* TEIL 2: FLOOR DIRECTORY */}
              {selectedTeil === 'lesen_teil2' && (
                <div className="teil-form-container">
                  <div className="pool-form-group">
                    <label className="pool-form-label">
                      <span>Store / Building Name (Kaufhaus Wegweiser)</span>
                      <span className="required-star">*</span>
                    </label>
                    <input
                      type="text"
                      className="pool-form-input"
                      placeholder="z.B. Einkaufszentrum City-Galerie Wegweiser"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                    />
                  </div>

                  <div className="pool-form-group">
                    <div className="label-with-counter">
                      <label className="pool-form-label">
                        <span>Floor Directory Entries (Etagen & Abteilungen)</span>
                        <span className="required-star">*</span>
                      </label>
                      <button type="button" className="add-mini-btn" onClick={handleAddDirRow}>
                        ➕ Add Floor
                      </button>
                    </div>

                    <div className="directory-rows-list">
                      {formDirectory.map((row, rIdx) => (
                        <div key={rIdx} className="directory-input-row">
                          <input
                            type="text"
                            className="dir-floor-input"
                            placeholder="z.B. 2. Stock / EG"
                            value={row.floor}
                            onChange={(e) => handleUpdateDirRow(rIdx, 'floor', e.target.value)}
                          />
                          <input
                            type="text"
                            className="dir-depts-input"
                            placeholder="Abteilungen (z.B. Damenmode, Schuhe, Taschen)"
                            value={row.departments}
                            onChange={(e) => handleUpdateDirRow(rIdx, 'departments', e.target.value)}
                          />
                          <button
                            type="button"
                            className="row-delete-btn"
                            onClick={() => handleRemoveDirRow(rIdx)}
                            title="Remove floor"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TEIL 3: EMAIL / LETTER */}
              {selectedTeil === 'lesen_teil3' && (
                <div className="teil-form-container">
                  <div className="form-two-col">
                    <div className="pool-form-group">
                      <label className="pool-form-label">
                        <span>Sender (Von)</span>
                      </label>
                      <input
                        type="text"
                        className="pool-form-input"
                        placeholder="z.B. Anna Schmidt"
                        value={formSender}
                        onChange={(e) => setFormSender(e.target.value)}
                      />
                    </div>
                    <div className="pool-form-group">
                      <label className="pool-form-label">
                        <span>Recipient (An)</span>
                      </label>
                      <input
                        type="text"
                        className="pool-form-input"
                        placeholder="z.B. Markus Weber"
                        value={formRecipient}
                        onChange={(e) => setFormRecipient(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="pool-form-group">
                    <label className="pool-form-label">
                      <span>Subject Line (Betreff)</span>
                      <span className="required-star">*</span>
                    </label>
                    <input
                      type="text"
                      className="pool-form-input"
                      placeholder="z.B. Einladung zur Geburtstagsfeier am Samstag"
                      value={formSubject}
                      onChange={(e) => setFormSubject(e.target.value)}
                    />
                  </div>

                  <div className="pool-form-group">
                    <div className="label-with-counter">
                      <label className="pool-form-label">
                        <span>Email / Letter Text (Nachricht)</span>
                        <span className="required-star">*</span>
                      </label>
                      <span className="word-counter-badge">
                        📊 {formText.trim() ? formText.trim().split(/\s+/).length : 0} words
                      </span>
                    </div>
                    <textarea
                      className="pool-form-textarea"
                      placeholder="Lieber Markus, ... (Schreiben Sie hier den deutschen Brief oder E-Mail-Text)"
                      value={formText}
                      onChange={(e) => setFormText(e.target.value)}
                      rows={9}
                    />
                  </div>
                </div>
              )}

              {/* TEIL 4: CLASSIFIED ADS */}
              {selectedTeil === 'lesen_teil4' && (
                <div className="teil-form-container">
                  <div className="pool-form-group">
                    <label className="pool-form-label">
                      <span>Category Title (Rubrik / Thema)</span>
                      <span className="required-star">*</span>
                    </label>
                    <input
                      type="text"
                      className="pool-form-input"
                      placeholder="z.B. Sport und Freizeitangebote in Freiburg"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                    />
                  </div>

                  <div className="pool-form-group">
                    <div className="label-with-counter">
                      <label className="pool-form-label">
                        <span>Classified Ads (Kleinanzeigen)</span>
                        <span className="required-star">*</span>
                      </label>
                      <button type="button" className="add-mini-btn" onClick={handleAddAd}>
                        ➕ Add Ad
                      </button>
                    </div>

                    <div className="ads-input-list">
                      {formAds.map((ad, aIdx) => (
                        <div key={aIdx} className="ad-card-input">
                          <div className="ad-card-input-top">
                            <span className="ad-badge-label">Anzeige {String(ad.id || String.fromCharCode(97 + aIdx)).toUpperCase()}</span>
                            <input
                              type="text"
                              className="ad-title-input"
                              placeholder="Ad Headline / Website (z.B. www.fitness-aktiv.de)"
                              value={ad.title}
                              onChange={(e) => handleUpdateAd(aIdx, 'title', e.target.value)}
                            />
                            <button
                              type="button"
                              className="row-delete-btn"
                              onClick={() => handleRemoveAd(aIdx)}
                              title="Remove ad"
                            >
                              ✕
                            </button>
                          </div>
                          <textarea
                            className="ad-text-input"
                            placeholder="Ad description text in German..."
                            value={ad.text}
                            onChange={(e) => handleUpdateAd(aIdx, 'text', e.target.value)}
                            rows={3}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* JSON MODE */}
          {inputMode === 'json' && (
            <div className="pool-json-body">
              <textarea
                className="add-text-area"
                value={newTextJson}
                onChange={(e) => setNewTextJson(e.target.value)}
                placeholder="Paste your JSON text object here, or click 'Load Template' above..."
                rows={14}
                spellCheck={false}
              />
            </div>
          )}

          {addError && <div className="add-feedback error">⚠️ {addError}</div>}
          {addSuccess && <div className="add-feedback success">{addSuccess}</div>}

          <button
            type="button"
            className="add-text-submit"
            onClick={handleAddText}
          >
            ➕ Submit Text to Pool
          </button>
        </div>
      </div>

      {/* Smart Paste / Auto-Extract Modal */}
      {showSmartPasteModal && (
        <div className="modal-backdrop" onClick={() => setShowSmartPasteModal(false)}>
          <div className="smart-paste-modal glass-panel" onClick={(e) => e.stopPropagation()}>
            <div className="quick-word-header">
              <div className="quick-word-title-group">
                <span className="quick-word-badge">✨ Smart Auto-Fill</span>
                <h3>Paste Any German Text</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setShowSmartPasteModal(false)}>✕</button>
            </div>
            <p className="smart-paste-desc">
              Paste your raw German text below. The system will automatically detect the title, paragraphs, and structure for <strong>{TEIL_OPTIONS.find(o => o.value === selectedTeil)?.label}</strong>.
            </p>
            <textarea
              className="smart-paste-textarea"
              placeholder="Paste German article, email, or text here..."
              value={smartPasteInput}
              onChange={(e) => setSmartPasteInput(e.target.value)}
              rows={10}
              autoFocus
            />
            <div className="smart-paste-actions">
              <button
                type="button"
                className="quick-word-btn primary"
                disabled={!smartPasteInput.trim()}
                onClick={() => handleExecuteSmartPaste(smartPasteInput)}
              >
                ✨ Auto-Fill Form Fields
              </button>
              <button
                type="button"
                className="quick-word-btn secondary"
                onClick={() => setShowSmartPasteModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

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
