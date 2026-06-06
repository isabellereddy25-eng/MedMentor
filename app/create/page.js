'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Create() {
  const router = useRouter();
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState([]);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = (newFiles) => {
    const valid = Array.from(newFiles).filter(f =>
      f.type === 'application/pdf' || f.type.startsWith('image/')
    );
    setFiles(prev => [...prev, ...valid]);
  };

  const removeFile = (i) => setFiles(prev => prev.filter((_, idx) => idx !== i));

  const extractText = async (file) => {
    if (file.type.startsWith('image/')) {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const base64 = e.target.result.split(',')[1];
          try {
            const res = await fetch('/api/extract', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ base64, mimeType: file.type })
            });
            const data = await res.json();
            resolve(data.text || '');
          } catch { resolve(''); }
        };
        reader.readAsDataURL(file);
      });
    }
    if (file.type === 'application/pdf') {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const base64 = e.target.result.split(',')[1];
          try {
            const res = await fetch('/api/extract', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ base64, mimeType: 'application/pdf' })
            });
            const data = await res.json();
            resolve(data.text || '');
          } catch { resolve(''); }
        };
        reader.readAsDataURL(file);
      });
    }
    return '';
  };

  const getUserKey = () => {
    try {
      const user = JSON.parse(localStorage.getItem('medmentor_user') || '{}');
      return user.email ? `medmentor_sets_${user.email.toLowerCase().replace(/[^a-z0-9]/g, '_')}` : 'medmentor_sets_guest';
    } catch { return 'medmentor_sets_guest'; }
  };

  const handleGenerate = async () => {
    if (!topic && files.length === 0) return alert('Please enter a topic or upload files');
    setLoading(true);
    try {
      let fullText = topic;

      if (files.length > 0) {
        const extracted = await Promise.all(files.map(extractText));
        const fileText = extracted.filter(Boolean).join('\n\n');
        if (fileText) fullText = fullText ? `${fullText}\n\n${fileText}` : fileText;
      }

      if (!fullText) return alert('Could not extract text from files. Try typing your notes instead.');

      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: fullText })
      });
      const data = await res.json();
      const key = getUserKey();
      const sets = JSON.parse(localStorage.getItem(key) || '[]');
      const title = files.length > 0 && !topic
        ? files.map(f => f.name.replace(/\.[^.]+$/, '')).join(', ')
        : topic;
      sets.push({
        title,
        flashcards: data.flashcards,
        questions: data.questions,
        createdAt: new Date().toISOString(),
        fromFiles: files.length > 0
      });
      localStorage.setItem(key, JSON.stringify(sets));
      router.push('/dashboard');
    } catch (e) {
      alert('Something went wrong. Check your API key.');
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f3ff', padding: '32px 16px' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <button onClick={() => router.push('/dashboard')} style={{ background: 'none', border: 'none', color: '#6d28d9', cursor: 'pointer', marginBottom: '16px', fontSize: '16px' }}>← Back</button>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '4px' }}>Create Study Set</h1>
        <p style={{ color: '#666', marginBottom: '24px' }}>Upload notes, PDFs, or type a topic</p>

        {/* File Upload Zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
          onClick={() => document.getElementById('fileInput').click()}
          style={{
            border: `2px dashed ${dragOver ? '#6d28d9' : '#c4b5fd'}`,
            borderRadius: '12px',
            padding: '32px',
            textAlign: 'center',
            cursor: 'pointer',
            background: dragOver ? '#ede9fe' : 'white',
            marginBottom: '16px',
            transition: 'all 0.2s'
          }}>
          <input
            id="fileInput"
            type="file"
            multiple
            accept=".pdf,image/*"
            style={{ display: 'none' }}
            onChange={(e) => handleFiles(e.target.files)}
          />
          <div style={{ fontSize: '36px', marginBottom: '8px' }}>📎</div>
          <p style={{ fontWeight: '600', marginBottom: '4px', color: '#4c1d95' }}>Drop files here or click to upload</p>
          <p style={{ fontSize: '13px', color: '#888' }}>Supports PDFs and images (JPG, PNG) · Multiple files OK</p>
        </div>

        {/* File list */}
        {files.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            {files.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white', borderRadius: '8px', padding: '10px 14px', marginBottom: '8px', border: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>{f.type === 'application/pdf' ? '📄' : '🖼️'}</span>
                  <span style={{ fontSize: '14px', fontWeight: '500' }}>{f.name}</span>
                  <span style={{ fontSize: '12px', color: '#888' }}>({(f.size / 1024).toFixed(0)} KB)</span>
                </div>
                <button onClick={(e) => { e.stopPropagation(); removeFile(i); }} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '18px' }}>×</button>
              </div>
            ))}
          </div>
        )}

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
          <span style={{ color: '#888', fontSize: '13px' }}>or type a topic / paste notes</span>
          <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
        </div>

        <textarea
          placeholder="e.g. 'The cardiovascular system' or paste your notes here..."
          value={topic}
          onChange={e => setTopic(e.target.value)}
          style={{ width: '100%', height: '160px', padding: '16px', border: '1px solid #ddd', borderRadius: '12px', fontSize: '15px', resize: 'vertical', boxSizing: 'border-box', marginBottom: '16px', fontFamily: 'inherit' }}
        />

        <button
          onClick={handleGenerate}
          disabled={loading}
          style={{ width: '100%', padding: '14px', background: loading ? '#a78bfa' : '#6d28d9', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: '600' }}>
          {loading ? '✨ Generating...' : '✨ Generate Flashcards & Quiz'}
        </button>
      </div>
    </div>
  );
}