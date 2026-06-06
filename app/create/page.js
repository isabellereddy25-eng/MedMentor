'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

function getUserKey() {
  try {
    const user = JSON.parse(localStorage.getItem('medmentor_user') || '{}')
    return user.email ? `medmentor_sets_${user.email.toLowerCase().replace(/[^a-z0-9]/g, '_')}` : 'medmentor_sets_guest'
  } catch { return 'medmentor_sets_guest' }
}

export default function CreateSet() {
  const router = useRouter()
  const [tab, setTab] = useState('notes')
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [topic, setTopic] = useState('')
  const [flashcardCount, setFlashcardCount] = useState('ai')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [user, setUser] = useState(null)

  useEffect(() => {
    const saved = localStorage.getItem('medmentor_user')
    if (!saved) { router.push('/onboarding'); return }
    setUser(JSON.parse(saved))
  }, [])

  async function generate() {
    if (!title.trim()) return setError('Please give your study set a title')
    if (tab === 'notes' && !notes.trim()) return setError('Please paste some notes')
    if (tab === 'topic' && !topic.trim()) return setError('Please describe a topic')
    setError('')
    setLoading(true)

    const content = tab === 'topic' ? topic : notes
    const isFromTopic = tab === 'topic'
    const count = flashcardCount === 'ai' ? null : parseInt(flashcardCount)

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content, isFromTopic,
          grade: user?.grade || '10th grade',
          goal: user?.goal || 'Learn medical concepts',
          flashcardCount: count
        })
      })

      const data = await res.json()
      if (data.error) throw new Error(data.error)

      const newSet = {
        title,
        notes: content,
        fromTopic: isFromTopic,
        flashcards: data.flashcards,
        questions: data.questions,
        createdAt: new Date().toISOString()
      }

      const key = getUserKey()
      const existing = JSON.parse(localStorage.getItem(key) || '[]')
      existing.unshift(newSet)
      localStorage.setItem(key, JSON.stringify(existing))
      router.push('/dashboard')
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const countOptions = [
    { value: 'ai', label: "AI decides (recommended for notes)" },
    { value: '5', label: '5 flashcards' },
    { value: '10', label: '10 flashcards' },
    { value: '15', label: '15 flashcards' },
    { value: '20', label: '20 flashcards' },
  ]

  return (
    <main style={{ minHeight: '100vh', background: '#f8f7ff' }}>
      <nav style={{ background: '#534AB7', padding: '0 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '60px' }}>
        <span style={{ color: 'white', fontWeight: '700', fontSize: '18px' }}>MedMentor</span>
        <button onClick={() => router.push('/dashboard')}
          style={{ background: 'rgba(255,255,255,0.15)', color: 'white', padding: '6px 14px', fontSize: '13px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>
          ← Back
        </button>
      </nav>

      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '6px' }}>Create a study set</h1>
        <p style={{ fontSize: '14px', color: '#888', marginBottom: '1.5rem' }}>
          Paste your notes or describe a topic — AI generates flashcards and quiz questions instantly
        </p>

        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #eee', padding: '1.5rem' }}>

          {/* Title */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: '#444' }}>
              Study set title
            </label>
            <input type="text" placeholder="e.g. AP Bio Chapter 4 — Cell Division"
              value={title} onChange={e => setTitle(e.target.value)} />
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '1.25rem' }}>
            {[{ id: 'notes', label: '📝 Paste notes' }, { id: 'topic', label: '✨ Request a topic' }].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '13px', background: tab === t.id ? '#534AB7' : 'white', color: tab === t.id ? 'white' : '#534AB7', border: `1.5px solid ${tab === t.id ? '#534AB7' : '#ddd'}`, fontWeight: tab === t.id ? '500' : '400', cursor: 'pointer' }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Notes input */}
          {tab === 'notes' && (
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: '#444' }}>Your notes</label>
              <textarea rows={8} placeholder="Paste your notes here... the more detail the better. The AI will read them and generate flashcards and quiz questions automatically."
                value={notes} onChange={e => setNotes(e.target.value)}
                style={{ resize: 'vertical', lineHeight: '1.6' }} />
              <p style={{ fontSize: '11px', color: '#aaa', marginTop: '6px' }}>
                Tip: include headings and definitions for better flashcard quality
              </p>
            </div>
          )}

          {/* Topic input */}
          {tab === 'topic' && (
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: '#444' }}>Describe what you want to learn</label>
              <textarea rows={4} placeholder="e.g. 'How the kidneys filter blood, for AP Biology' or 'The immune system — innate vs adaptive immunity'"
                value={topic} onChange={e => setTopic(e.target.value)} style={{ resize: 'vertical' }} />
            </div>
          )}

          {/* Flashcard count picker */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '8px', color: '#444' }}>
              How many flashcards?
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {countOptions.map(opt => (
                <button key={opt.value} onClick={() => setFlashcardCount(opt.value)}
                  style={{
                    padding: '7px 13px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer',
                    border: `1.5px solid ${flashcardCount === opt.value ? '#534AB7' : '#eee'}`,
                    background: flashcardCount === opt.value ? '#EEEDFE' : 'white',
                    color: flashcardCount === opt.value ? '#534AB7' : '#555',
                    fontWeight: flashcardCount === opt.value ? '500' : '400'
                  }}>
                  {opt.label}
                </button>
              ))}
            </div>
            {flashcardCount === 'ai' && tab === 'notes' && (
              <p style={{ fontSize: '11px', color: '#aaa', marginTop: '6px' }}>
                AI will decide based on how much content is in your notes
              </p>
            )}
          </div>

          {error && <p style={{ color: '#e24b4a', fontSize: '13px', marginBottom: '12px' }}>{error}</p>}

          <button onClick={generate} disabled={loading}
            style={{ width: '100%', padding: '13px', fontSize: '15px', borderRadius: '8px', border: 'none', background: '#534AB7', color: 'white', fontWeight: '500', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            {loading ? (
              <>
                <div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                Generating your study set...
              </>
            ) : '✨ Generate study set'}
          </button>

          {loading && (
            <p style={{ textAlign: 'center', fontSize: '12px', color: '#888', marginTop: '10px' }}>
              This takes about 10 seconds — the AI is reading your content carefully
            </p>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </main>
  )
}
