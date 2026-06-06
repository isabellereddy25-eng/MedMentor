'use client';
import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function ChatContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const index = parseInt(searchParams.get('index') ?? '-1');
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm your MedMentor AI tutor 🩺 I can answer questions, explain concepts, and give you short lessons on anything you're studying. What would you like to learn today?"
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [studySet, setStudySet] = useState(null);
  const bottomRef = useRef(null);

  function getUserKey() {
    try {
      const user = JSON.parse(localStorage.getItem('medmentor_user') || '{}');
      return user.email ? `medmentor_sets_${user.email.toLowerCase().replace(/[^a-z0-9]/g, '_')}` : 'medmentor_sets_guest';
    } catch { return 'medmentor_sets_guest'; }
  }

  useEffect(() => {
    if (index >= 0) {
      const key = getUserKey();
      const sets = JSON.parse(localStorage.getItem(key) || '[]');
      if (sets[index]) {
        setStudySet(sets[index]);
        setMessages([{
          role: 'assistant',
          content: `Hi! I'm your MedMentor AI tutor 🩺 I can see you're studying **${sets[index].title}**. I know your flashcards and can help explain anything you're struggling with. What would you like to go over?`
        }]);
      }
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          studySet: studySet || null
        })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }]);
    }
    setLoading(false);
  };

  const suggestedPrompts = studySet ? [
    `Explain ${studySet.flashcards?.[0]?.front || 'the first concept'} in simple terms`,
    `Give me a short lesson on ${studySet.title}`,
    `What are the most important things to know about ${studySet.title}?`,
    `Quiz me on ${studySet.title}`,
  ] : [
    'Give me a lesson on the cardiovascular system',
    'Explain how neurons work',
    'What is homeostasis?',
    'How does the immune system fight infections?',
  ];

  const formatMessage = (text) => {
    const lines = text.split('\n');
    return lines.map((line, i) => {
      // Bold text
      const parts = line.split(/\*\*(.*?)\*\*/g);
      const formatted = parts.map((part, j) =>
        j % 2 === 1 ? <strong key={j}>{part}</strong> : part
      );
      return <span key={i}>{formatted}{i < lines.length - 1 && <br />}</span>;
    });
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f3ff', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ background: '#6d28d9', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
        <button onClick={() => router.back()} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>← Back</button>
        <div style={{ flex: 1 }}>
          <p style={{ color: 'white', fontWeight: '700', fontSize: '16px', margin: 0 }}>🩺 MedMentor AI Tutor</p>
          {studySet && <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', margin: 0 }}>Studying: {studySet.title}</p>}
        </div>
        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#4ade80' }} />
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '700px', width: '100%', margin: '0 auto' }}>

        {/* Suggested prompts */}
        {messages.length <= 1 && (
          <div style={{ marginBottom: '8px' }}>
            <p style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>Try asking:</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {suggestedPrompts.map((p, i) => (
                <button key={i} onClick={() => setInput(p)}
                  style={{ padding: '8px 12px', background: 'white', border: '1px solid #ddd', borderRadius: '20px', fontSize: '13px', cursor: 'pointer', color: '#6d28d9' }}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            {msg.role === 'assistant' && (
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#6d28d9', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '8px', flexShrink: 0, fontSize: '16px' }}>🩺</div>
            )}
            <div style={{
              maxWidth: '80%',
              padding: '12px 16px',
              borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              background: msg.role === 'user' ? '#6d28d9' : 'white',
              color: msg.role === 'user' ? 'white' : '#1a1a1a',
              fontSize: '14px',
              lineHeight: '1.6',
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
              border: msg.role === 'assistant' ? '1px solid #ede9fe' : 'none'
            }}>
              {formatMessage(msg.content)}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#6d28d9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>🩺</div>
            <div style={{ background: 'white', border: '1px solid #ede9fe', borderRadius: '18px 18px 18px 4px', padding: '12px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#6d28d9', animation: 'bounce 1s infinite', animationDelay: `${i * 0.2}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '12px 16px', background: 'white', borderTop: '1px solid #ede9fe', maxWidth: '700px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="Ask anything about your study material..."
            rows={1}
            style={{ flex: 1, padding: '12px 14px', border: '1.5px solid #ddd', borderRadius: '12px', fontSize: '14px', resize: 'none', fontFamily: 'inherit', outline: 'none', maxHeight: '120px', lineHeight: '1.5' }}
          />
          <button onClick={sendMessage} disabled={loading || !input.trim()}
            style={{ padding: '12px 20px', background: loading || !input.trim() ? '#c4b5fd' : '#6d28d9', color: 'white', border: 'none', borderRadius: '12px', cursor: loading || !input.trim() ? 'not-allowed' : 'pointer', fontSize: '20px', flexShrink: 0 }}>
            ➤
          </button>
        </div>
        <p style={{ fontSize: '11px', color: '#aaa', margin: '6px 0 0', textAlign: 'center' }}>Press Enter to send · Shift+Enter for new line · AI may make mistakes — verify important info</p>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>Loading...</div>}>
      <ChatContent />
    </Suspense>
  );
}