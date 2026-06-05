'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Create() {
  const router = useRouter();
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!topic) return alert('Please enter a topic or paste your notes');
    setLoading(true);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic })
      });
      const data = await res.json();
      const sets = JSON.parse(localStorage.getItem('studySets') || '[]');
      sets.push({ title: topic, flashcards: data.flashcards, questions: data.questions, createdAt: new Date().toISOString() });
      localStorage.setItem('studySets', JSON.stringify(sets));
      router.push('/dashboard');
    } catch (e) {
      alert('Something went wrong. Check your API key.');
    }
    setLoading(false);
  };

  return (
    <div style={{minHeight:'100vh',background:'#f5f3ff',padding:'32px'}}>
      <div style={{maxWidth:'600px',margin:'0 auto'}}>
        <button onClick={()=>router.push('/dashboard')} style={{background:'none',border:'none',color:'#6d28d9',cursor:'pointer',marginBottom:'16px',fontSize:'16px'}}>← Back</button>
        <h1 style={{fontSize:'28px',fontWeight:'bold',marginBottom:'8px'}}>Create Study Set</h1>
        <p style={{color:'#666',marginBottom:'24px'}}>Paste your notes or type a topic</p>
        <textarea
          placeholder="e.g. 'The cardiovascular system' or paste your class notes here..."
          value={topic}
          onChange={e=>setTopic(e.target.value)}
          style={{width:'100%',height:'200px',padding:'16px',border:'1px solid #ddd',borderRadius:'12px',fontSize:'16px',resize:'vertical',boxSizing:'border-box',marginBottom:'16px'}}
        />
        <button onClick={handleGenerate} disabled={loading} style={{width:'100%',padding:'14px',background: loading ? '#a78bfa' : '#6d28d9',color:'white',border:'none',borderRadius:'8px',fontSize:'16px',cursor: loading ? 'not-allowed' : 'pointer'}}>
          {loading ? '✨ Generating...' : '✨ Generate Flashcards & Quiz'}
        </button>
      </div>
    </div>
  );
}