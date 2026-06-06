'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Onboarding() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ name: '', email: '', grade: '', goal: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const grades = ['9th grade', '10th grade', '11th grade', '12th grade', 'First year college']
  const goals = [
    'Ace AP Biology or AP Chemistry',
    'Prep for pre-med in college',
    'Learn medical concepts for fun',
    'All of the above'
  ]

  function update(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
    setError('')
  }

  function nextStep() {
    if (step === 1) {
      if (!form.name.trim()) return setError('Please enter your name')
      if (!form.email.trim() || !form.email.includes('@')) return setError('Please enter a valid email')
      setError('')
      setStep(2)
      return
    }
    if (step === 2) {
      if (!form.grade) return setError('Please select your grade')
      if (!form.goal) return setError('Please select your goal')
      finish()
    }
  }

  function finish() {
    setLoading(true)
    try {
      localStorage.setItem('medmentor_user', JSON.stringify(form))
      router.push('/dashboard')
    } catch (err) {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <main style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: '2rem', background: '#f8f7ff'
    }}>
      <div style={{ width: '100%', maxWidth: '440px' }}>

        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <span style={{ fontSize: '28px', fontWeight: '700', color: '#534AB7' }}>MedMentor</span>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '16px' }}>
            {[1, 2].map(n => (
              <div key={n} style={{
                height: '4px', width: '60px', borderRadius: '2px',
                background: n <= step ? '#534AB7' : '#ddd',
                transition: 'background 0.3s'
              }} />
            ))}
          </div>
          <p style={{ marginTop: '8px', fontSize: '13px', color: '#999' }}>Step {step} of 2</p>
        </div>

        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #eee', padding: '1.5rem' }}>

          {step === 1 && (
            <>
              <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '6px' }}>Welcome! Let's get started</h2>
              <p style={{ fontSize: '14px', color: '#888', marginBottom: '1.5rem' }}>Tell us a little about yourself</p>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: '#444' }}>Your first name</label>
                <input type="text" placeholder="e.g. Isabel" value={form.name}
                  onChange={e => update('name', e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && nextStep()}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', outline: 'none' }} />
              </div>

              <div style={{ marginBottom: '8px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: '#444' }}>Email address</label>
                <input type="email" placeholder="you@email.com" value={form.email}
                  onChange={e => update('email', e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && nextStep()}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', outline: 'none' }} />
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '6px' }}>Personalize your experience</h2>
              <p style={{ fontSize: '14px', color: '#888', marginBottom: '1.5rem' }}>This helps the AI tailor every explanation to you</p>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '8px', color: '#444' }}>What grade are you in?</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {grades.map(g => (
                    <button key={g} onClick={() => update('grade', g)}
                      style={{
                        padding: '10px 14px', textAlign: 'left', borderRadius: '8px', cursor: 'pointer',
                        border: `1.5px solid ${form.grade === g ? '#534AB7' : '#eee'}`,
                        background: form.grade === g ? '#EEEDFE' : 'white',
                        color: form.grade === g ? '#534AB7' : '#333',
                        fontWeight: form.grade === g ? '500' : '400',
                        fontSize: '14px'
                      }}>
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '8px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '8px', color: '#444' }}>What are you trying to do?</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {goals.map(g => (
                    <button key={g} onClick={() => update('goal', g)}
                      style={{
                        padding: '10px 14px', textAlign: 'left', borderRadius: '8px', cursor: 'pointer',
                        border: `1.5px solid ${form.goal === g ? '#534AB7' : '#eee'}`,
                        background: form.goal === g ? '#EEEDFE' : 'white',
                        color: form.goal === g ? '#534AB7' : '#333',
                        fontWeight: form.goal === g ? '500' : '400',
                        fontSize: '14px'
                      }}>
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {error && (
            <p style={{ color: '#e24b4a', fontSize: '13px', marginTop: '12px' }}>{error}</p>
          )}

          <button onClick={nextStep} disabled={loading}
            style={{
              width: '100%', marginTop: '20px', padding: '12px', fontSize: '15px',
              borderRadius: '8px', border: 'none', fontWeight: '500', cursor: loading ? 'not-allowed' : 'pointer',
              background: '#534AB7', color: 'white', opacity: loading ? 0.7 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
            }}>
            {loading ? (
              <>
                <div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                Setting up your account...
              </>
            ) : step === 2 ? "Let's go →" : 'Continue →'}
          </button>

          {step === 2 && (
            <button onClick={() => { setStep(1); setError('') }}
              style={{ width: '100%', marginTop: '10px', padding: '10px', fontSize: '13px', borderRadius: '8px', border: '1px solid #eee', background: 'white', color: '#888', cursor: 'pointer' }}>
              ← Back
            </button>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </main>
  )
}