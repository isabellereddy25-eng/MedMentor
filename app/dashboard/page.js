'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

function getUserKey(email) {
  return email ? `medmentor_sets_${email.toLowerCase().replace(/[^a-z0-9]/g, '_')}` : 'medmentor_sets_guest'
}

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [sets, setSets] = useState([])
  const [streak] = useState(3)

  useEffect(() => {
    const saved = localStorage.getItem('medmentor_user')
    if (!saved) { router.push('/onboarding'); return }
    const parsedUser = JSON.parse(saved)
    setUser(parsedUser)
    const key = getUserKey(parsedUser.email)
    const savedSets = JSON.parse(localStorage.getItem(key) || '[]')
    setSets(savedSets)
  }, [])

  function deleteSet(index) {
    const key = getUserKey(user?.email)
    const updated = sets.filter((_, i) => i !== index)
    setSets(updated)
    localStorage.setItem(key, JSON.stringify(updated))
  }

  function signOut() {
    localStorage.removeItem('medmentor_user')
    router.push('/')
  }

  return (
    <main style={{ minHeight: '100vh', background: '#f8f7ff' }}>
      <nav style={{ background: '#534AB7', padding: '0 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '60px' }}>
        <span style={{ color: 'white', fontWeight: '700', fontSize: '18px' }}>MedMentor</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '14px' }}>🔥 {streak} day streak</span>
          <button onClick={signOut}
            style={{ background: 'rgba(255,255,255,0.15)', color: 'white', padding: '5px 12px', fontSize: '12px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>
            Sign out
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#1a1a2e' }}>
            Hey, {user?.name || 'there'} 👋
          </h1>
          <p style={{ fontSize: '14px', color: '#888', marginTop: '4px' }}>
            {user?.grade} · {user?.goal}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px,1fr))', gap: '12px', marginBottom: '2rem' }}>
          {[
            { label: 'Study sets', value: sets.length },
            { label: 'Day streak', value: streak },
            { label: 'Topics mastered', value: Math.max(0, Math.floor(sets.length * 0.6)) },
          ].map(stat => (
            <div key={stat.label} style={{ background: 'white', borderRadius: '12px', padding: '1rem', border: '1px solid #eee', textAlign: 'center' }}>
              <div style={{ fontSize: '28px', fontWeight: '700', color: '#534AB7' }}>{stat.value}</div>
              <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1a1a2e' }}>Your study sets</h2>
          <button onClick={() => router.push('/create')}
            style={{ padding: '8px 16px', fontSize: '13px', borderRadius: '8px', border: 'none', background: '#534AB7', color: 'white', fontWeight: '500', cursor: 'pointer' }}>
            + Create new
          </button>
        </div>

        {sets.length === 0 ? (
          <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #eee', padding: '3rem', textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>📚</div>
            <p style={{ fontSize: '16px', fontWeight: '500', marginBottom: '8px' }}>No study sets yet</p>
            <p style={{ fontSize: '14px', color: '#888', marginBottom: '1.5rem' }}>
              Create your first one — paste notes or request any medical topic
            </p>
            <button onClick={() => router.push('/create')}
              style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#534AB7', color: 'white', fontWeight: '500', cursor: 'pointer' }}>
              Create your first study set →
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {sets.map((set, i) => (
              <div key={i} style={{ background: 'white', borderRadius: '16px', border: '1px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', transition: 'border-color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#534AB7'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#eee'}>
                <div style={{ cursor: 'pointer', flex: 1 }} onClick={() => router.push(`/study?index=${i}`)}>
                  <p style={{ fontWeight: '600', fontSize: '15px', marginBottom: '4px', color: '#1a1a2e' }}>{set.title}</p>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ display: 'inline-block', fontSize: '11px', fontWeight: '500', padding: '2px 8px', borderRadius: '20px', background: '#EEEDFE', color: '#534AB7' }}>
                      {set.flashcards?.length || 0} flashcards
                    </span>
                    <span style={{ fontSize: '12px', color: '#999' }}>
                      {set.questions?.length || 0} quiz questions
                    </span>
                    <span style={{ fontSize: '12px', color: '#999' }}>
                      {set.fromTopic ? '✨ AI generated' : '📄 From notes'}
                    </span>
                  </div>
                </div>
                <button onClick={() => deleteSet(i)}
                  style={{ background: 'none', border: 'none', color: '#ccc', fontSize: '18px', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer', marginLeft: '12px' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#e24b4a'}
                  onMouseLeave={e => e.currentTarget.style.color = '#ccc'}>
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
