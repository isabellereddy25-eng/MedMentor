'use client'
import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function shuffle(array) {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function normalizeAnswer(str) {
  if (!str) return ''
  return str.toString().trim().replace(/[^A-Da-d]/g, '').toUpperCase()
}

function isCorrect(selected, correct) {
  return normalizeAnswer(selected) === normalizeAnswer(correct)
}

function getUserKey() {
  try {
    const user = JSON.parse(localStorage.getItem('medmentor_user') || '{}')
    return user.email ? `medmentor_sets_${user.email.toLowerCase().replace(/[^a-z0-9]/g, '_')}` : 'medmentor_sets_guest'
  } catch { return 'medmentor_sets_guest' }
}

function formatTime(s) {
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`
}

// ─── FLAPPY BIRD GAME ───────────────────────────────────────────────────────
function FlappyGame({ questions, onExit }) {
  const canvasRef = useRef(null)
  const stateRef = useRef({
    bird: { y: 200, vy: 0 },
    pipes: [],
    frame: 0,
    score: 0,
    alive: true,
    paused: false,
    started: false,
  })
  const [showQ, setShowQ] = useState(false)
  const [currentQ, setCurrentQ] = useState(null)
  const [selectedAns, setSelectedAns] = useState(null)
  const [gameScore, setGameScore] = useState(0)
  const [dead, setDead] = useState(false)
  const [started, setStarted] = useState(false)
  const animRef = useRef(null)
  const shuffledQ = useRef(shuffle(questions))
  const qIndex = useRef(0)

  const W = 480, H = 400
  const GRAVITY = 0.35, FLAP = -7, PIPE_W = 52, GAP = 175, PIPE_SPEED = 1.8

  function flap() {
    if (!stateRef.current.alive || stateRef.current.paused) return
    stateRef.current.bird.vy = FLAP
  }

  function startGame() {
    stateRef.current = {
      bird: { y: 200, vy: 0 },
      pipes: [{ x: W, gapY: 100 + Math.random() * 160 }],
      frame: 0, score: 0, alive: true, paused: false, started: true
    }
    setDead(false)
    setStarted(true)
    setGameScore(0)
    setShowQ(false)
    setSelectedAns(null)
    shuffledQ.current = shuffle(questions)
    qIndex.current = 0
  }

  function triggerQuestion() {
    stateRef.current.paused = true
    const q = shuffledQ.current[qIndex.current % shuffledQ.current.length]
    qIndex.current++
    setCurrentQ(q)
    setSelectedAns(null)
    setShowQ(true)
  }

  function answerQuestion(letter) {
    setSelectedAns(letter)
    setTimeout(() => {
      if (isCorrect(letter, currentQ.correct)) {
        // correct — flap and unpause
        stateRef.current.bird.vy = FLAP * 1.5
        stateRef.current.paused = false
        setShowQ(false)
        setSelectedAns(null)
      } else {
        // wrong — try again message, keep showing Q
        setSelectedAns(null)
      }
    }, 600)
  }

  useEffect(() => {
    if (!started) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    function draw() {
      const s = stateRef.current
      if (!s.alive) return

      if (!s.paused) {
        // Physics
        s.bird.vy += GRAVITY
        s.bird.y += s.bird.vy
        s.frame++

        // Pipes
        if (s.frame % 90 === 0) {
          s.pipes.push({ x: W, gapY: 80 + Math.random() * 180, passed: false })
        }
        s.pipes.forEach(p => { p.x -= PIPE_SPEED })
        s.pipes = s.pipes.filter(p => p.x > -PIPE_W)

        // Score & question trigger
        s.pipes.forEach(p => {
          if (!p.passed && p.x + PIPE_W < 80) {
            p.passed = true
            s.score++
            setGameScore(s.score)
            if (s.score % 3 === 0) triggerQuestion()
          }
        })

        // Collision
        const bx = 80, by = s.bird.y, br = 14
        if (by - br < 0 || by + br > H) { s.alive = false; setDead(true); return }
        for (const p of s.pipes) {
          if (bx + br > p.x && bx - br < p.x + PIPE_W) {
            if (by - br < p.gapY || by + br > p.gapY + GAP) {
              s.alive = false; setDead(true); return
            }
          }
        }
      }

      // Draw
      ctx.clearRect(0, 0, W, H)

      // Sky
      const sky = ctx.createLinearGradient(0, 0, 0, H)
      sky.addColorStop(0, '#E8F4FD')
      sky.addColorStop(1, '#C5E3F7')
      ctx.fillStyle = sky
      ctx.fillRect(0, 0, W, H)

      // Pipes
      ctx.fillStyle = '#4CAF50'
      stateRef.current.pipes.forEach(p => {
        ctx.beginPath()
        ctx.roundRect(p.x, 0, PIPE_W, p.gapY, [0, 0, 8, 8])
        ctx.fill()
        ctx.beginPath()
        ctx.roundRect(p.x, p.gapY + GAP, PIPE_W, H - p.gapY - GAP, [8, 8, 0, 0])
        ctx.fill()
        ctx.fillStyle = '#388E3C'
        ctx.fillRect(p.x - 4, p.gapY - 20, PIPE_W + 8, 20)
        ctx.beginPath()
        ctx.roundRect(p.x - 4, p.gapY + GAP, PIPE_W + 8, 20, [4, 4, 0, 0])
        ctx.fill()
        ctx.fillStyle = '#4CAF50'
      })

      // Ground
      ctx.fillStyle = '#8BC34A'
      ctx.fillRect(0, H - 20, W, 20)
      ctx.fillStyle = '#689F38'
      ctx.fillRect(0, H - 20, W, 6)

      // Bird
      const by = stateRef.current.bird.y
      ctx.save()
      ctx.translate(80, by)
      ctx.rotate(Math.min(Math.max(stateRef.current.bird.vy * 0.06, -0.5), 0.5))
      ctx.beginPath()
      ctx.ellipse(0, 0, 18, 14, 0, 0, Math.PI * 2)
      ctx.fillStyle = '#FFC107'
      ctx.fill()
      ctx.beginPath()
      ctx.ellipse(8, -4, 9, 7, -0.3, 0, Math.PI * 2)
      ctx.fillStyle = '#FF9800'
      ctx.fill()
      ctx.beginPath()
      ctx.arc(10, -6, 3, 0, Math.PI * 2)
      ctx.fillStyle = 'white'
      ctx.fill()
      ctx.beginPath()
      ctx.arc(11, -6, 1.5, 0, Math.PI * 2)
      ctx.fillStyle = '#333'
      ctx.fill()
      ctx.beginPath()
      ctx.moveTo(14, 0)
      ctx.lineTo(22, -2)
      ctx.lineTo(14, 4)
      ctx.fillStyle = '#FF5722'
      ctx.fill()
      ctx.restore()

      // Score
      ctx.fillStyle = 'rgba(255,255,255,0.85)'
      ctx.beginPath()
      ctx.roundRect(W / 2 - 40, 12, 80, 32, 16)
      ctx.fill()
      ctx.fillStyle = '#534AB7'
      ctx.font = 'bold 18px system-ui'
      ctx.textAlign = 'center'
      ctx.fillText(`⭐ ${stateRef.current.score}`, W / 2, 34)

      if (s.paused && !showQ) {
        ctx.fillStyle = 'rgba(83,74,183,0.15)'
        ctx.fillRect(0, 0, W, H)
        ctx.fillStyle = '#534AB7'
        ctx.font = 'bold 20px system-ui'
        ctx.textAlign = 'center'
        ctx.fillText('❓ Answer to keep flying!', W / 2, H / 2)
      }

      animRef.current = requestAnimationFrame(draw)
    }

    animRef.current = requestAnimationFrame(draw)
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current) }
  }, [started])

  useEffect(() => {
    const handler = (e) => { if (e.code === 'Space' || e.code === 'ArrowUp') { e.preventDefault(); flap() } }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <div>
      <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', border: '2px solid #eee', cursor: 'pointer' }} onClick={flap}>
        <canvas ref={canvasRef} width={W} height={H} style={{ display: 'block', width: '100%', height: 'auto' }} />

        {!started && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(83,74,183,0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
            <div style={{ fontSize: '52px' }}>🐦</div>
            <p style={{ color: 'white', fontSize: '22px', fontWeight: '700', margin: 0 }}>MedFlap</p>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', textAlign: 'center', margin: '0 2rem' }}>
              Every 3 pipes you must answer a medical question correctly to keep flying!
            </p>
            <button onClick={(e) => { e.stopPropagation(); startGame() }}
              style={{ padding: '12px 28px', borderRadius: '10px', border: 'none', background: 'white', color: '#534AB7', fontWeight: '700', fontSize: '15px', cursor: 'pointer' }}>
              Start flying →
            </button>
          </div>
        )}

        {dead && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
            <p style={{ color: 'white', fontSize: '24px', fontWeight: '700', margin: 0 }}>💥 You crashed!</p>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '16px', margin: 0 }}>Score: {gameScore} pipes</p>
            <button onClick={(e) => { e.stopPropagation(); setTimeout(() => startGame(), 50) }}
              style={{ padding: '10px 24px', borderRadius: '10px', border: 'none', background: '#534AB7', color: 'white', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}>
              Try again
            </button>
          </div>
        )}

        {showQ && currentQ && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(248,247,255,0.97)', padding: '1.5rem', overflowY: 'auto' }}>
            <p style={{ fontSize: '12px', fontWeight: '600', color: '#534AB7', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
              ❓ Answer correctly to keep flying!
            </p>
            <p style={{ fontSize: '15px', fontWeight: '500', color: '#1a1a2e', marginBottom: '14px', lineHeight: '1.5' }}>{currentQ.question}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {currentQ.options.map((opt, i) => {
                const letter = ['A', 'B', 'C', 'D'][i]
                const correct = isCorrect(letter, currentQ.correct)
                const isSelected = letter === selectedAns
                let bg = 'white', border = '#ddd', color = '#1a1a2e'
                if (isSelected) {
                  if (correct) { bg = '#E1F5EE'; border = '#0F6E56'; color = '#0F6E56' }
                  else { bg = '#FAECE7'; border = '#993C1D'; color = '#993C1D' }
                }
                return (
                  <button key={i} onClick={(e) => { e.stopPropagation(); answerQuestion(letter) }}
                    disabled={!!selectedAns}
                    style={{ padding: '10px 12px', textAlign: 'left', borderRadius: '8px', border: `1.5px solid ${border}`, background: bg, color, fontSize: '13px', cursor: selectedAns ? 'default' : 'pointer', width: '100%', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: isSelected ? (correct ? '#0F6E56' : '#993C1D') : '#EEEDFE', color: isSelected ? 'white' : '#534AB7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '600', flexShrink: 0 }}>{letter}</span>
                    {opt.replace(/^[A-Da-d][.)]\s*/, '')}
                  </button>
                )
              })}
            </div>
            {selectedAns && !isCorrect(selectedAns, currentQ.correct) && (
              <p style={{ color: '#993C1D', fontSize: '12px', marginTop: '10px', fontWeight: '500' }}>
                ✗ Wrong — try again to keep flying!
              </p>
            )}
          </div>
        )}
      </div>

      <button onClick={onExit}
        style={{ width: '100%', marginTop: '10px', padding: '10px', borderRadius: '8px', border: '1.5px solid #eee', background: 'white', color: '#888', fontSize: '13px', cursor: 'pointer' }}>
        ← Back to study modes
      </button>
    </div>
  )
}

// ─── MAIN STUDY COMPONENT ────────────────────────────────────────────────────
function StudyContent() {
  const router = useRouter()
  const params = useSearchParams()
  const index = parseInt(params.get('index') || '0')
  const [set, setSet] = useState(null)
  const [mode, setMode] = useState('menu')

  // Flashcard state
  const [allCards, setAllCards] = useState([])
  const [cardIndex, setCardIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [cardProgress, setCardProgress] = useState({})
  const [reviewMode, setReviewMode] = useState(false)
  const [reviewCards, setReviewCards] = useState([])
  const [reviewIndex, setReviewIndex] = useState(0)
  const [cardsDone, setCardsDone] = useState(false)
  const [cardTimer, setCardTimer] = useState(0)
  const cardTimerRef = useRef(null)

  // Quiz state
  const [shuffledQ, setShuffledQ] = useState([])
  const [qIndex, setQIndex] = useState(0)
  const [selected, setSelected] = useState(null)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)
  const [struggled, setStruggled] = useState([])
  const [wrongCounts, setWrongCounts] = useState({})

  // Matching game state
  const [matchPairs, setMatchPairs] = useState([])
  const [matchTerms, setMatchTerms] = useState([])
  const [matchDefs, setMatchDefs] = useState([])
  const [selectedTerm, setSelectedTerm] = useState(null)
  const [selectedDef, setSelectedDef] = useState(null)
  const [matchedPairs, setMatchedPairs] = useState([])
  const [wrongPair, setWrongPair] = useState(null)
  const [matchDone, setMatchDone] = useState(false)
  const [matchTimer, setMatchTimer] = useState(0)
  const matchIntervalRef = useRef(null)

  useEffect(() => {
    const key = getUserKey()
    const sets = JSON.parse(localStorage.getItem(key) || '[]')
    if (sets[index]) {
      setSet(sets[index])
      setAllCards(sets[index].flashcards || [])
      const savedProgress = localStorage.getItem(`medmentor_progress_${key}_${index}`)
      if (savedProgress) setCardProgress(JSON.parse(savedProgress))
      const savedWrong = localStorage.getItem(`medmentor_wrong_${key}_${index}`)
      if (savedWrong) setWrongCounts(JSON.parse(savedWrong))
    } else {
      router.push('/dashboard')
    }
    return () => {
      if (cardTimerRef.current) clearInterval(cardTimerRef.current)
      if (matchIntervalRef.current) clearInterval(matchIntervalRef.current)
    }
  }, [index])

  function startCardTimer() {
    setCardTimer(0)
    if (cardTimerRef.current) clearInterval(cardTimerRef.current)
    cardTimerRef.current = setInterval(() => setCardTimer(t => t + 1), 1000)
  }

  function saveProgress(progress) {
    const key = getUserKey()
    localStorage.setItem(`medmentor_progress_${key}_${index}`, JSON.stringify(progress))
  }

  function saveWrongCounts(counts) {
    const key = getUserKey()
    localStorage.setItem(`medmentor_wrong_${key}_${index}`, JSON.stringify(counts))
  }

  const activeCards = reviewMode ? reviewCards : allCards
  const activeIndex = reviewMode ? reviewIndex : cardIndex

  function markCard(status) {
    const currentCardFront = activeCards[activeIndex]?.front
    // Find the real index in allCards
    const realIndex = allCards.findIndex(c => c.front === currentCardFront)
    const updated = { ...cardProgress, [realIndex]: status }
    setCardProgress(updated)
    saveProgress(updated)

    const nextIndex = activeIndex + 1

    if (nextIndex >= activeCards.length) {
      // Done with this pass
      if (cardTimerRef.current) clearInterval(cardTimerRef.current)
      setCardsDone(true)
    } else {
      if (reviewMode) setReviewIndex(nextIndex)
      else setCardIndex(nextIndex)
      setFlipped(false)
    }
  }

  function startReview() {
    const learning = allCards
      .map((c, i) => ({ ...c, realIndex: i }))
      .filter(c => cardProgress[c.realIndex] !== 'got_it')
    if (learning.length === 0) return
    setReviewCards(shuffle(learning))
    setReviewIndex(0)
    setFlipped(false)
    setReviewMode(true)
    setCardsDone(false)
    startCardTimer()
  }

  function startFlashcards() {
    setCardIndex(0)
    setReviewIndex(0)
    setFlipped(false)
    setReviewMode(false)
    setCardsDone(false)
    startCardTimer()
  }

  function startQuiz(questions) {
    setShuffledQ(shuffle(questions))
    setQIndex(0)
    setSelected(null)
    setScore(0)
    setDone(false)
    setStruggled([])
  }

  function answerQ(letter) {
    if (selected) return
    setSelected(letter)
    const q = shuffledQ[qIndex]
    if (isCorrect(letter, q.correct)) {
      setScore(s => s + 1)
    } else {
      const updated = { ...wrongCounts, [q.question]: (wrongCounts[q.question] || 0) + 1 }
      setWrongCounts(updated)
      saveWrongCounts(updated)
      setStruggled(prev => {
        const exists = prev.find(s => s.question === q.question)
        if (exists) return prev.map(s => s.question === q.question ? { ...s, times: (s.times || 1) + 1 } : s)
        return [...prev, { question: q.question, explanation: q.explanation, times: 1 }]
      })
    }
  }

  function nextQ() {
    if (qIndex + 1 >= shuffledQ.length) setDone(true)
    else { setQIndex(q => q + 1); setSelected(null) }
  }

  function startMatch() {
    const cards = shuffle(set.flashcards).slice(0, 6)
    setMatchPairs(cards)
    setMatchTerms(shuffle(cards.map((c, i) => ({ id: i, text: c.front }))))
    setMatchDefs(shuffle(cards.map((c, i) => ({ id: i, text: c.back.split(' ').slice(0, 4).join(' ') + '...' }))))
    setMatchedPairs([])
    setSelectedTerm(null)
    setSelectedDef(null)
    setWrongPair(null)
    setMatchDone(false)
    setMatchTimer(0)
    if (matchIntervalRef.current) clearInterval(matchIntervalRef.current)
    matchIntervalRef.current = setInterval(() => setMatchTimer(t => t + 1), 1000)
  }

  function handleMatchTerm(item) {
    if (matchedPairs.includes(item.id)) return
    if (selectedDef) {
      checkMatch(item, selectedDef)
    } else {
      setSelectedTerm(item)
    }
  }

  function handleMatchDef(item) {
    if (matchedPairs.includes(item.id)) return
    if (selectedTerm) {
      checkMatch(selectedTerm, item)
    } else {
      setSelectedDef(item)
    }
  }

  function checkMatch(term, def) {
    if (term.id === def.id) {
      const updated = [...matchedPairs, term.id]
      setMatchedPairs(updated)
      setSelectedTerm(null)
      setSelectedDef(null)
      if (updated.length === matchPairs.length) {
        clearInterval(matchIntervalRef.current)
        setMatchDone(true)
      }
    } else {
      setWrongPair({ term: term.id, def: def.id })
      setTimeout(() => { setWrongPair(null); setSelectedTerm(null); setSelectedDef(null) }, 800)
    }
  }

  if (!set) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', flexDirection: 'column', gap: '12px' }}>
      <div style={{ width: '36px', height: '36px', border: '3px solid #EEEDFE', borderTop: '3px solid #534AB7', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ color: '#888', fontSize: '14px' }}>Loading your study set...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  const gotItCount = Object.values(cardProgress).filter(v => v === 'got_it').length
  const learningCount = allCards.length - gotItCount
  const currentCard = activeCards[activeIndex]
  const currentQ = shuffledQ[qIndex]
  const points = gotItCount * 10 + Object.keys(wrongCounts).length * 0

  const modeList = [
    { id: 'flashcards', label: '🃏 Flashcards', desc: `${allCards.length} cards · ${gotItCount} mastered` },
    { id: 'quiz', label: '📝 Quiz', desc: `${set.questions?.length || 0} questions · randomized each time` },
    { id: 'match', label: '🎯 Matching game', desc: 'Match terms to definitions against the clock' },
    { id: 'flappy', label: '🐦 MedFlap', desc: 'Answer questions to keep your bird flying!' },
    { id: 'mario', label: '🍄 MedMario', desc: 'Run through the world and answer questions!' },
    { id: 'chat', label: '🩺 AI Tutor', desc: 'Ask questions and get personalized lessons' },
  ]

  return (
    <main style={{ minHeight: '100vh', background: '#f8f7ff' }}>
      <nav style={{ background: '#534AB7', padding: '0 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '60px' }}>
        <span style={{ color: 'white', fontWeight: '700', fontSize: '18px' }}>MedMentor</span>
        <button onClick={() => {
          if (mode === 'menu') router.push('/dashboard')
          else { setMode('menu'); setReviewMode(false); setCardsDone(false); if (matchIntervalRef.current) clearInterval(matchIntervalRef.current) }
        }}
          style={{ background: 'rgba(255,255,255,0.15)', color: 'white', padding: '6px 14px', fontSize: '13px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>
          ← {mode === 'menu' ? 'Dashboard' : 'Back'}
        </button>
      </nav>

      <div style={{ maxWidth: '620px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '4px' }}>{set.title}</h1>
        <p style={{ fontSize: '13px', color: '#888', marginBottom: '1.5rem' }}>
          {set.fromTopic ? '✨ AI generated' : '📄 From your notes'}
        </p>

        {/* ── MENU ── */}
        {mode === 'menu' && (
          <>
            {Object.entries(wrongCounts).filter(([, v]) => v >= 2).length > 0 && (
              <div style={{ background: '#FAEEDA', borderRadius: '12px', padding: '12px 16px', marginBottom: '16px', border: '1px solid #F5D5A0' }}>
                <p style={{ fontSize: '13px', fontWeight: '600', color: '#854F0B', marginBottom: '6px' }}>🧠 Flagged topics — you've missed these 2+ times:</p>
                {Object.entries(wrongCounts).filter(([, v]) => v >= 2).map(([q, count]) => (
                  <p key={q} style={{ fontSize: '12px', color: '#854F0B', margin: '2px 0' }}>
                    • {q.length > 70 ? q.slice(0, 70) + '...' : q}
                    <span style={{ marginLeft: '6px', fontSize: '11px', background: '#F5A623', color: 'white', padding: '1px 6px', borderRadius: '8px', fontWeight: '600' }}>{count}x</span>
                  </p>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {modeList.map(m => (
                <button key={m.id}
                  onClick={() => {
                    setMode(m.id)
                    if (m.id === 'flashcards') startFlashcards()
                    if (m.id === 'quiz') { setCardsDone(false); startQuiz(set.questions || []) }
                    if (m.id === 'match') startMatch()
                    if (m.id === 'mario') router.push(`/mario-game?index=${index}`)
                    if (m.id === 'chat') router.push(`/chat?index=${index}`)
                    if (m.id === 'flappy') router.push(`/flappy-game?index=${index}`)
                  }}
                  style={{ textAlign: 'left', cursor: 'pointer', border: '1.5px solid #eee', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', background: 'white', transition: 'border-color 0.2s', width: '100%' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#534AB7'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = '#eee'}>
                  <div>
                    <p style={{ fontWeight: '600', fontSize: '16px', marginBottom: '4px', color: '#1a1a2e' }}>{m.label}</p>
                    <p style={{ fontSize: '13px', color: '#888', margin: 0 }}>{m.desc}</p>
                  </div>
                  <span style={{ fontSize: '20px', color: '#534AB7' }}>→</span>
                </button>
              ))}
            </div>
          </>
        )}

        {/* ── FLASHCARDS ── */}
        {mode === 'flashcards' && !cardsDone && currentCard && (
          <div>
            <div style={{ display: 'flex', gap: '4px', marginBottom: '12px' }}>
              {allCards.map((_, i) => (
                <div key={i} style={{ height: '4px', flex: 1, borderRadius: '2px', background: cardProgress[i] === 'got_it' ? '#0F6E56' : cardProgress[i] === 'learning' ? '#F5A623' : '#ddd', transition: 'background 0.3s' }} />
              ))}
            </div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '20px', background: '#E1F5EE', color: '#0F6E56', fontWeight: '500' }}>✓ Got it: {gotItCount}</span>
              <span style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '20px', background: '#FAEEDA', color: '#854F0B', fontWeight: '500' }}>↩ Learning: {learningCount}</span>
              <span style={{ fontSize: '12px', color: '#888', marginLeft: 'auto' }}>
                {reviewMode ? `Review ${reviewIndex + 1}/${reviewCards.length}` : `${cardIndex + 1}/${allCards.length}`}
              </span>
              <span style={{ fontSize: '12px', color: '#534AB7', fontWeight: '500' }}>⏱ {formatTime(cardTimer)}</span>
            </div>

            <div onClick={() => setFlipped(f => !f)} style={{ background: 'white', borderRadius: '16px', border: `2px solid ${flipped ? '#534AB7' : '#eee'}`, padding: '3rem 2rem', textAlign: 'center', cursor: 'pointer', minHeight: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px', transition: 'border-color 0.2s', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <span style={{ fontSize: '11px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.05em', color: flipped ? '#534AB7' : '#aaa' }}>
                {flipped ? '✓ Answer' : 'Term — tap to reveal'}
              </span>
              <p style={{ fontSize: '18px', fontWeight: flipped ? '400' : '600', lineHeight: '1.6', color: '#1a1a2e', margin: 0 }}>
                {flipped ? currentCard.back : currentCard.front}
              </p>
            </div>

            {flipped ? (
              <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                <button onClick={() => markCard('learning')}
                  style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1.5px solid #F5A623', background: '#FAEEDA', color: '#854F0B', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}>
                  ↩ Still learning
                </button>
                <button onClick={() => markCard('got_it')}
                  style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1.5px solid #0F6E56', background: '#E1F5EE', color: '#0F6E56', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}>
                  ✓ Got it!
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                <button onClick={() => { reviewMode ? setReviewIndex(i => Math.max(0, i - 1)) : setCardIndex(i => Math.max(0, i - 1)); setFlipped(false) }}
                  disabled={activeIndex === 0}
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1.5px solid #534AB7', background: 'white', color: '#534AB7', fontWeight: '500', cursor: activeIndex === 0 ? 'not-allowed' : 'pointer', opacity: activeIndex === 0 ? 0.4 : 1 }}>
                  ← Previous
                </button>
                <button onClick={() => { reviewMode ? setReviewIndex(i => i + 1) : setCardIndex(i => i + 1); setFlipped(false) }}
                  disabled={activeIndex >= activeCards.length - 1}
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: '#534AB7', color: 'white', fontWeight: '500', cursor: activeIndex >= activeCards.length - 1 ? 'not-allowed' : 'pointer', opacity: activeIndex >= activeCards.length - 1 ? 0.4 : 1 }}>
                  Next →
                </button>
              </div>
            )}

            {!reviewMode && learningCount > 0 && (
              <button onClick={startReview}
                style={{ width: '100%', marginTop: '10px', padding: '10px', borderRadius: '8px', border: '1.5px solid #F5A623', background: '#FAEEDA', color: '#854F0B', fontWeight: '500', cursor: 'pointer', fontSize: '13px' }}>
                🔁 Review {learningCount} cards you're still learning
              </button>
            )}
          </div>
        )}

        {/* ── FLASHCARD COMPLETION SCREEN ── */}
        {mode === 'flashcards' && cardsDone && (
          <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #eee', padding: '2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>
              {gotItCount === allCards.length ? '🎉' : gotItCount >= allCards.length * 0.7 ? '🌟' : '💪'}
            </div>
            <p style={{ fontSize: '22px', fontWeight: '700', color: '#534AB7', marginBottom: '4px' }}>
              {reviewMode ? 'Review round done!' : 'Set complete!'}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', margin: '1.5rem 0' }}>
              <div style={{ background: '#E1F5EE', borderRadius: '12px', padding: '1rem' }}>
                <div style={{ fontSize: '28px', fontWeight: '700', color: '#0F6E56' }}>{gotItCount}</div>
                <div style={{ fontSize: '12px', color: '#0F6E56', marginTop: '2px' }}>✓ Got it</div>
              </div>
              <div style={{ background: '#FAEEDA', borderRadius: '12px', padding: '1rem' }}>
                <div style={{ fontSize: '28px', fontWeight: '700', color: '#854F0B' }}>{learningCount}</div>
                <div style={{ fontSize: '12px', color: '#854F0B', marginTop: '2px' }}>↩ Still learning</div>
              </div>
              <div style={{ background: '#EEEDFE', borderRadius: '12px', padding: '1rem' }}>
                <div style={{ fontSize: '28px', fontWeight: '700', color: '#534AB7' }}>{Math.round(gotItCount / allCards.length * 100)}%</div>
                <div style={{ fontSize: '12px', color: '#534AB7', marginTop: '2px' }}>Accuracy</div>
              </div>
              <div style={{ background: '#f8f7ff', borderRadius: '12px', padding: '1rem', border: '1px solid #eee' }}>
                <div style={{ fontSize: '28px', fontWeight: '700', color: '#1a1a2e' }}>{formatTime(cardTimer)}</div>
                <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>⏱ Time taken</div>
              </div>
            </div>

            <div style={{ background: '#EEEDFE', borderRadius: '12px', padding: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '32px', fontWeight: '700', color: '#534AB7' }}>+{gotItCount * 10} ⭐</div>
              <div style={{ fontSize: '13px', color: '#534AB7', marginTop: '2px' }}>Points earned this round</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {learningCount > 0 && (
                <button onClick={startReview}
                  style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1.5px solid #F5A623', background: '#FAEEDA', color: '#854F0B', fontWeight: '600', cursor: 'pointer' }}>
                  🔁 Review {learningCount} cards you're still learning
                </button>
              )}
              <button onClick={startFlashcards}
                style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1.5px solid #534AB7', background: 'white', color: '#534AB7', fontWeight: '500', cursor: 'pointer' }}>
                Start over from beginning
              </button>
              <button onClick={() => setMode('menu')}
                style={{ width: '100%', padding: '11px', borderRadius: '8px', border: 'none', background: '#534AB7', color: 'white', fontWeight: '500', cursor: 'pointer' }}>
                Back to study modes
              </button>
            </div>
          </div>
        )}

        {/* ── QUIZ ── */}
        {mode === 'quiz' && shuffledQ.length > 0 && !done && currentQ && (
          <div>
            <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
              {shuffledQ.map((_, i) => (
                <div key={i} style={{ height: '4px', flex: 1, borderRadius: '2px', background: i < qIndex ? '#534AB7' : i === qIndex ? '#9F98E8' : '#ddd', transition: 'background 0.3s' }} />
              ))}
            </div>
            <p style={{ fontSize: '12px', color: '#888', marginBottom: '1.25rem' }}>Question {qIndex + 1} of {shuffledQ.length} · Score: {score}</p>
            <div style={{ background: '#EEEDFE', borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1rem', fontWeight: '500', fontSize: '15px', lineHeight: '1.6', color: '#1a1a2e' }}>
              {currentQ.question}
              {wrongCounts[currentQ.question] >= 2 && (
                <span style={{ display: 'inline-block', marginLeft: '8px', fontSize: '11px', padding: '2px 7px', borderRadius: '10px', background: '#FAEEDA', color: '#854F0B', fontWeight: '500', verticalAlign: 'middle' }}>
                  ⚠ Missed {wrongCounts[currentQ.question]}x
                </span>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '1rem' }}>
              {currentQ.options.map((opt, i) => {
                const letter = ['A', 'B', 'C', 'D'][i]
                const correct = isCorrect(letter, currentQ.correct)
                const isSelected = letter === selected
                let bg = 'white', border = '#eee', color = '#1a1a2e', circBg = '#EEEDFE', circColor = '#534AB7'
                if (selected) {
                  if (correct) { bg = '#E1F5EE'; border = '#0F6E56'; color = '#0F6E56'; circBg = '#0F6E56'; circColor = 'white' }
                  else if (isSelected) { bg = '#FAECE7'; border = '#993C1D'; color = '#993C1D'; circBg = '#993C1D'; circColor = 'white' }
                  else { color = '#aaa'; border = '#eee' }
                }
                return (
                  <button key={i} onClick={() => answerQ(letter)} disabled={!!selected}
                    style={{ padding: '12px 14px', textAlign: 'left', borderRadius: '10px', border: `1.5px solid ${border}`, background: bg, color, fontWeight: isSelected || (selected && correct) ? '500' : '400', display: 'flex', gap: '10px', alignItems: 'flex-start', cursor: selected ? 'default' : 'pointer', transition: 'all 0.15s', width: '100%' }}>
                    <span style={{ width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0, background: circBg, color: circColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '600', marginTop: '1px' }}>{letter}</span>
                    <span style={{ lineHeight: '1.5', fontSize: '14px' }}>{opt.replace(/^[A-Da-d][.)]\s*/, '')}</span>
                  </button>
                )
              })}
            </div>
            {selected && (
              <>
                <div style={{ borderRadius: '12px', padding: '14px 16px', marginBottom: '1rem', background: isCorrect(selected, currentQ.correct) ? '#E1F5EE' : '#FAECE7', border: `1px solid ${isCorrect(selected, currentQ.correct) ? '#0F6E56' : '#993C1D'}`, lineHeight: '1.6' }}>
                  <p style={{ fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: isCorrect(selected, currentQ.correct) ? '#0F6E56' : '#993C1D' }}>
                    {isCorrect(selected, currentQ.correct) ? '✓ Correct!' : "✗ Not quite — here's why:"}
                  </p>
                  <p style={{ fontSize: '13px', margin: 0, color: isCorrect(selected, currentQ.correct) ? '#0F6E56' : '#993C1D' }}>{currentQ.explanation}</p>
                </div>
                <button onClick={nextQ} style={{ width: '100%', padding: '13px', borderRadius: '8px', border: 'none', background: '#534AB7', color: 'white', fontWeight: '500', fontSize: '15px', cursor: 'pointer' }}>
                  {qIndex + 1 === shuffledQ.length ? 'See results →' : 'Next question →'}
                </button>
              </>
            )}
          </div>
        )}

        {/* ── QUIZ RESULTS ── */}
        {mode === 'quiz' && done && (
          <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #eee', padding: '2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '52px', fontWeight: '700', color: '#534AB7', marginBottom: '6px' }}>{score}/{shuffledQ.length}</div>
            <p style={{ fontSize: '18px', fontWeight: '600', marginBottom: '4px', color: '#1a1a2e' }}>
              {score === shuffledQ.length ? '🎉 Perfect score!' : score >= shuffledQ.length * 0.8 ? '🌟 Great work!' : score >= shuffledQ.length * 0.6 ? '👍 Good effort!' : '💪 Keep practicing!'}
            </p>
            <p style={{ fontSize: '14px', color: '#888', marginBottom: '1.5rem' }}>{Math.round(score / shuffledQ.length * 100)}% correct</p>
            {struggled.length > 0 && (
              <div style={{ background: '#FAEEDA', borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1.25rem', textAlign: 'left' }}>
                <p style={{ fontSize: '13px', fontWeight: '600', color: '#854F0B', marginBottom: '10px' }}>🧠 Flagged for review:</p>
                {struggled.map((s, i) => (
                  <div key={i} style={{ marginBottom: '10px', paddingBottom: '10px', borderBottom: i < struggled.length - 1 ? '1px solid rgba(133,79,11,0.2)' : 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <p style={{ fontSize: '12px', fontWeight: '500', color: '#854F0B', marginBottom: '4px', flex: 1 }}>• {s.question}</p>
                      {s.times > 1 && <span style={{ fontSize: '11px', background: '#F5A623', color: 'white', padding: '1px 7px', borderRadius: '10px', marginLeft: '8px', fontWeight: '600' }}>{s.times}x</span>}
                    </div>
                    <p style={{ fontSize: '12px', color: '#854F0B', margin: 0, lineHeight: '1.5' }}>💡 {s.explanation}</p>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => startQuiz(set.questions)} style={{ flex: 1, padding: '11px', borderRadius: '8px', border: '1.5px solid #534AB7', background: 'white', color: '#534AB7', fontWeight: '500', cursor: 'pointer' }}>Try again</button>
              <button onClick={() => setMode('menu')} style={{ flex: 1, padding: '11px', borderRadius: '8px', border: 'none', background: '#534AB7', color: 'white', fontWeight: '500', cursor: 'pointer' }}>Back to set</button>
            </div>
          </div>
        )}

        {/* ── MATCHING GAME ── */}
        {mode === 'match' && !matchDone && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <p style={{ fontSize: '14px', color: '#888', margin: 0 }}>Match each term to its definition</p>
              <span style={{ fontSize: '16px', fontWeight: '600', color: '#534AB7', background: '#EEEDFE', padding: '4px 12px', borderRadius: '20px' }}>⏱ {formatTime(matchTimer)}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <p style={{ fontSize: '11px', fontWeight: '500', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Terms</p>
                {matchTerms.map(item => {
                  const matched = matchedPairs.includes(item.id)
                  const isSelected = selectedTerm?.id === item.id
                  const isWrong = wrongPair?.term === item.id
                  return (
                    <button key={item.id} onClick={() => !matched && handleMatchTerm(item)}
                      style={{ padding: '10px 12px', borderRadius: '10px', textAlign: 'left', fontSize: '13px', lineHeight: '1.4', cursor: matched ? 'default' : 'pointer', border: '1.5px solid', borderColor: matched ? '#0F6E56' : isWrong ? '#993C1D' : isSelected ? '#534AB7' : '#eee', background: matched ? '#E1F5EE' : isWrong ? '#FAECE7' : isSelected ? '#EEEDFE' : 'white', color: matched ? '#0F6E56' : isWrong ? '#993C1D' : isSelected ? '#534AB7' : '#1a1a2e', fontWeight: isSelected || matched ? '500' : '400', transition: 'all 0.15s', opacity: matched ? 0.7 : 1, width: '100%' }}>
                      {matched ? '✓ ' : ''}{item.text}
                    </button>
                  )
                })}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <p style={{ fontSize: '11px', fontWeight: '500', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Definitions</p>
                {matchDefs.map(item => {
                  const matched = matchedPairs.includes(item.id)
                  const isSelected = selectedDef?.id === item.id
                  const isWrong = wrongPair?.def === item.id
                  return (
                    <button key={item.id} onClick={() => !matched && handleMatchDef(item)}
                      style={{ padding: '10px 12px', borderRadius: '10px', textAlign: 'left', fontSize: '13px', lineHeight: '1.4', cursor: matched ? 'default' : 'pointer', border: '1.5px solid', borderColor: matched ? '#0F6E56' : isWrong ? '#993C1D' : isSelected ? '#534AB7' : '#eee', background: matched ? '#E1F5EE' : isWrong ? '#FAECE7' : isSelected ? '#EEEDFE' : 'white', color: matched ? '#0F6E56' : isWrong ? '#993C1D' : isSelected ? '#534AB7' : '#1a1a2e', fontWeight: isSelected || matched ? '500' : '400', transition: 'all 0.15s', opacity: matched ? 0.7 : 1, width: '100%' }}>
                      {matched ? '✓ ' : ''}{item.text}
                    </button>
                  )
                })}
              </div>
            </div>
            <p style={{ fontSize: '12px', color: '#aaa', textAlign: 'center', marginTop: '16px' }}>{matchedPairs.length}/{matchPairs.length} matched</p>
          </div>
        )}

        {mode === 'match' && matchDone && (
          <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #eee', padding: '2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎉</div>
            <p style={{ fontSize: '22px', fontWeight: '700', color: '#534AB7', marginBottom: '6px' }}>You matched them all!</p>
            <p style={{ fontSize: '16px', color: '#888', marginBottom: '1.5rem' }}>Time: {formatTime(matchTimer)}</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={startMatch} style={{ flex: 1, padding: '11px', borderRadius: '8px', border: '1.5px solid #534AB7', background: 'white', color: '#534AB7', fontWeight: '500', cursor: 'pointer' }}>Play again</button>
              <button onClick={() => setMode('menu')} style={{ flex: 1, padding: '11px', borderRadius: '8px', border: 'none', background: '#534AB7', color: 'white', fontWeight: '500', cursor: 'pointer' }}>Back to set</button>
            </div>
          </div>
        )}

        {/* ── MEDFLAP GAME ── */}
        {mode === 'flappy' && (
          <FlappyGame questions={set.questions || []} onExit={() => setMode('menu')} />
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </main>
  )
}

export default function StudyPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', flexDirection: 'column', gap: '12px' }}>
        <div style={{ width: '36px', height: '36px', border: '3px solid #EEEDFE', borderTop: '3px solid #534AB7', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: '#888', fontSize: '14px' }}>Loading...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    }>
      <StudyContent />
    </Suspense>
  )
}
