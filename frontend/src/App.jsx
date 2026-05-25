import { useMemo, useRef, useState } from 'react';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/chat';

const examplePrompts = [
  'I have chest pain and confusion',
  'Mild headache since morning',
  'Fever with sore throat for two days',
];

const urgencyMeta = {
  High: {
    label: 'High urgency',
    className: 'urgency urgency-high',
    helper: 'Seek urgent medical assessment.',
  },
  Medium: {
    label: 'Medium urgency',
    className: 'urgency urgency-medium',
    helper: 'Monitor closely and consult a clinician.',
  },
  Low: {
    label: 'Low urgency',
    className: 'urgency urgency-low',
    helper: 'General guidance; watch for changes.',
  },
};

function createSessionId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `consultation-${crypto.randomUUID()}`;
  }
  return `consultation-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normaliseAssistantResponse(data) {
  return {
    role: 'assistant',
    content: data.reply || data.summary || 'I could not prepare a response. Please try again.',
    urgency: data.urgency || 'Low',
    summary: data.summary || data.reply || '',
    recommendedActions: Array.isArray(data.recommended_actions) ? data.recommended_actions : [],
    redFlags: Array.isArray(data.red_flags) ? data.red_flags : [],
    homeCare: Array.isArray(data.home_care) ? data.home_care : [],
    doctorVisitGuidance: data.doctor_visit_guidance || '',
    disclaimer: data.disclaimer || 'I am an AI assistant, not a doctor. This information is educational and does not replace professional medical advice.',
  };
}

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const sessionIdRef = useRef(createSessionId());
  const lastPromptRef = useRef('');

  const latestHighUrgency = useMemo(
    () => [...messages].reverse().find((message) => message.role === 'assistant' && message.urgency === 'High'),
    [messages],
  );

  const submitMessage = async (messageText) => {
    const trimmed = messageText.trim();
    if (!trimmed || isLoading) return;

    const userMessage = { role: 'user', content: trimmed };
    lastPromptRef.current = trimmed;
    setMessages((previous) => [...previous, userMessage]);
    setInput('');
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionIdRef.current,
          message: trimmed,
        }),
      });

      if (!response.ok) {
        throw new Error('The medical assistant service returned an error.');
      }

      const data = await response.json();
      setMessages((previous) => [...previous, normaliseAssistantResponse(data)]);
    } catch (requestError) {
      console.error('Error connecting to server:', requestError);
      setError('Could not connect to the medical assistant service. Please confirm the FastAPI backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    submitMessage(input);
  };

  const resetConsultation = () => {
    sessionIdRef.current = createSessionId();
    lastPromptRef.current = '';
    setMessages([]);
    setInput('');
    setError('');
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-block">
          <div className="brand-mark" aria-hidden="true">+</div>
          <div>
            <p className="eyebrow">India medical triage assistant</p>
            <h1>Clinical Symptom Guidance</h1>
          </div>
        </div>

        <div className="emergency-actions" aria-label="Emergency contact numbers in India">
          <a href="tel:112" className="emergency-link">Call 112</a>
          <a href="tel:108" className="secondary-link">Ambulance 108</a>
          <button className="ghost-button" type="button" onClick={resetConsultation}>
            New consultation
          </button>
        </div>
      </header>

      <main className="workspace">
        <aside className="side-panel" aria-label="Clinical safety information">
          <section className="info-panel critical">
            <p className="panel-kicker">Emergency care</p>
            <h2>For severe or sudden symptoms</h2>
            <p>Call 112 in India. Ambulance helplines such as 108 or 102 may also be available depending on your state.</p>
          </section>

          <section className="info-panel">
            <p className="panel-kicker">Red flags</p>
            <ul className="compact-list">
              <li>Chest pain, severe breathlessness, fainting</li>
              <li>Sudden confusion, weakness, speech difficulty</li>
              <li>Seizure, severe bleeding, major injury</li>
              <li>Self-harm thoughts or pregnancy emergency</li>
            </ul>
          </section>
        </aside>

        <section className="chat-panel" aria-label="Medical assistant chat">
          {latestHighUrgency && (
            <div className="emergency-banner" role="alert">
              <strong>High urgency detected.</strong>
              <span> Please seek emergency medical care now. Do not drive yourself if symptoms are severe.</span>
            </div>
          )}

          <div className="conversation">
            {messages.length === 0 ? (
              <EmptyState onExampleClick={submitMessage} />
            ) : (
              messages.map((message, index) => (
                <Message key={`${message.role}-${index}`} message={message} />
              ))
            )}

            {isLoading && (
              <div className="message-row assistant-row">
                <div className="assistant-card loading-card">
                  <span className="pulse-dot" aria-hidden="true" />
                  Reviewing symptoms and preparing structured guidance...
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="error-strip" role="alert">
              <span>{error}</span>
              <button type="button" onClick={() => submitMessage(lastPromptRef.current)} disabled={isLoading}>
                Retry
              </button>
            </div>
          )}

          <form className="composer" onSubmit={handleSubmit}>
            <label className="sr-only" htmlFor="symptom-input">Describe your symptoms</label>
            <textarea
              id="symptom-input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Describe symptoms, duration, age, major conditions, and any red flags..."
              rows="2"
              disabled={isLoading}
            />
            <button type="submit" disabled={isLoading || !input.trim()}>
              {isLoading ? 'Checking...' : 'Send'}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}

function EmptyState({ onExampleClick }) {
  return (
    <div className="empty-state">
      <p className="eyebrow">Start a consultation</p>
      <h2>Describe what is happening in plain language.</h2>
      <p>Include symptom duration, severity, age, known conditions, medicines, and whether symptoms are sudden or worsening.</p>
      <div className="example-grid">
        {examplePrompts.map((prompt) => (
          <button key={prompt} type="button" onClick={() => onExampleClick(prompt)}>
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}

function Message({ message }) {
  if (message.role === 'user') {
    return (
      <div className="message-row user-row">
        <div className="user-bubble">{message.content}</div>
      </div>
    );
  }

  const urgency = urgencyMeta[message.urgency] || urgencyMeta.Low;

  return (
    <div className="message-row assistant-row">
      <article className="assistant-card">
        <div className="card-head">
          <div>
            <p className="eyebrow">Assessment guidance</p>
            <h3>{message.summary || message.content}</h3>
          </div>
          <span className={urgency.className}>{urgency.label}</span>
        </div>

        <p className="urgency-helper">{urgency.helper}</p>

        <StructuredList title="Recommended actions" items={message.recommendedActions} />
        <StructuredList title="Red flags to watch" items={message.redFlags} />
        <StructuredList title="Home care" items={message.homeCare} />

        {message.doctorVisitGuidance && (
          <section className="guidance-block">
            <h4>When to see a doctor</h4>
            <p>{message.doctorVisitGuidance}</p>
          </section>
        )}

        <p className="disclaimer">{message.disclaimer}</p>
      </article>
    </div>
  );
}

function StructuredList({ title, items }) {
  if (!items.length) return null;

  return (
    <section className="guidance-block">
      <h4>{title}</h4>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

export default App;
