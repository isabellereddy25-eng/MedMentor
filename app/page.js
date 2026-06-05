'use client'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      background: 'linear-gradient(135deg, #f8f7ff 0%, #eeedfe 100%)'
    }}>
      <div style={{ textAlign: 'center', maxWidth: '480px' }}>
        <div style={{
          width: '64px', height: '64px', borderRadius: '16px',
          background: '#534AB7', display: 'flex', alignItems: 'center',
          justifyContent: 'center', margin: '0 auto 1.5rem',
          fontSize: '28px'
        }}>ðŸ§ </div>

        <h1 style={{ fontSize: '36px', fontWeight: '700', color: '#534AB7', marginBottom: '12px' }}>
          MedMentor
        </h1>

        <p style={{ fontSize: '16px', color: '#666', lineHeight: '1.6', marginBottom: '2rem' }}>
          Your AI-powered medical study buddy. Import notes, generate flashcards,
          take quizzes â€” and actually understand medicine.
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn-primary" style={{ padding: '12px 28px', fontSize: '15px' }}
            onClick={() => router.push('/onboarding')}>
            Get started free â†’
          </button>
          <button className="btn-secondary" style={{ padding: '12px 28px', fontSize: '15px' }}
            onClick={() => router.push('/dashboard')}>
            Sign in
          </button>
        </div>

        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '2.5rem', flexWrap: 'wrap' }}>
          {['AI flashcards', 'Smart quizzes', 'Struggle detector', 'Free for all'].map(f => (
            <span key={f} className="badge badge-purple" style={{ fontSize: '12px', padding: '5px 12px' }}>
              âœ“ {f}
            </span>
          ))}
        </div>

        <p style={{ marginTop: '2rem', fontSize: '12px', color: '#999' }}>
          10% of Pro revenue donated to health education nonprofits
        </p>
      </div>
    </main>
  )
}
