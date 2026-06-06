'use client';
import { useEffect, useRef, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function MarioContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const index = parseInt(searchParams.get('index') || '0');
  const canvasRef = useRef(null);
  const stateRef = useRef(null);
  const animRef = useRef(null);
  const [started, setStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [question, setQuestion] = useState(null);
  const [selectedAns, setSelectedAns] = useState(null);
  const [studySet, setStudySet] = useState(null);

  const W = 480, H = 320;
  const GRAVITY = 0.5;
  const WORLD_WIDTH = 3000;

  useEffect(() => {
    const sets = JSON.parse(localStorage.getItem('medmentor_sets_guest') || localStorage.getItem(getUserKey()) || '[]');
    if (sets[index]) setStudySet(sets[index]);
  }, []);

  function getUserKey() {
    try {
      const user = JSON.parse(localStorage.getItem('medmentor_user') || '{}');
      return user.email ? `medmentor_sets_${user.email.toLowerCase().replace(/[^a-z0-9]/g, '_')}` : 'medmentor_sets_guest';
    } catch { return 'medmentor_sets_guest'; }
  }

  function buildQuestions(set) {
    const questions = [];
    // Multiple choice from quiz
    if (set.questions) {
      set.questions.forEach(q => {
        questions.push({ type: 'mc', question: q.question, options: q.options, answer: q.answer, explanation: q.explanation });
      });
    }
    // True/false from flashcards
    if (set.flashcards) {
      set.flashcards.forEach(f => {
        questions.push({
          type: 'mc',
          question: `What is the correct definition of: "${f.front}"?`,
          options: shuffle([
            f.back,
            ...shuffle(set.flashcards.filter(x => x.front !== f.front)).slice(0, 3).map(x => x.back)
          ]).slice(0, 4),
          answer: f.back,
        });
      });
    }
    return shuffle(questions);
  }

  function initState(set) {
    const platforms = [
      { x: 0, y: 280, w: 400, h: 20 },
      { x: 450, y: 280, w: 300, h: 20 },
      { x: 800, y: 280, w: 400, h: 20 },
      { x: 1250, y: 280, w: 350, h: 20 },
      { x: 1650, y: 280, w: 400, h: 20 },
      { x: 2100, y: 280, w: 400, h: 20 },
      { x: 2550, y: 280, w: 450, h: 20 },
      // Elevated platforms
      { x: 200, y: 220, w: 80, h: 12 },
      { x: 500, y: 200, w: 80, h: 12 },
      { x: 700, y: 180, w: 80, h: 12 },
      { x: 900, y: 210, w: 80, h: 12 },
      { x: 1100, y: 190, w: 80, h: 12 },
      { x: 1300, y: 200, w: 80, h: 12 },
      { x: 1500, y: 170, w: 80, h: 12 },
      { x: 1700, y: 210, w: 80, h: 12 },
      { x: 1900, y: 180, w: 80, h: 12 },
      { x: 2100, y: 200, w: 80, h: 12 },
      { x: 2300, y: 170, w: 80, h: 12 },
      { x: 2500, y: 210, w: 80, h: 12 },
      { x: 2700, y: 180, w: 80, h: 12 },
      { x: 2850, y: 200, w: 80, h: 12 },
    ];

    const coins = [];
    for (let x = 100; x < WORLD_WIDTH - 100; x += 120) {
      coins.push({ x, y: 230, collected: false });
    }

    const enemies = [];
    for (let x = 400; x < WORLD_WIDTH - 200; x += 350) {
      enemies.push({ x, y: 252, vx: -1.2, width: 24, height: 20, alive: true, startX: x });
    }

    // Checkpoints every 600px
    const checkpoints = [];
    for (let x = 600; x < WORLD_WIDTH - 200; x += 600) {
      checkpoints.push({ x, triggered: false });
    }

    const qs = buildQuestions(set);

    return {
      mario: { x: 50, y: 220, vy: 0, vx: 0, onGround: false, width: 24, height: 32, facing: 1 },
      camera: 0,
      platforms,
      coins,
      enemies,
      checkpoints,
      questions: qs,
      qIndex: 0,
      score: 0,
      lives: 3,
      gameOver: false,
      won: false,
      paused: false,
      invincible: 0,
      keys: {},
      frame: 0,
    };
  }

  function startGame() {
    if (!studySet) return;
    stateRef.current = initState(studySet);
    setScore(0); setLives(3); setGameOver(false); setWon(false);
    setQuestion(null); setSelectedAns(null);
    setStarted(true);
  }

  function answerQuestion(opt) {
    const s = stateRef.current;
    const q = question;
    setSelectedAns(opt);
    const correct = opt === q.answer;
    setTimeout(() => {
      if (!correct) {
        s.lives--;
        setLives(s.lives);
        if (s.lives <= 0) { s.gameOver = true; setGameOver(true); }
      } else {
        s.score += 50;
        setScore(s.score);
      }
      s.paused = false;
      setQuestion(null);
      setSelectedAns(null);
    }, 900);
  }

  useEffect(() => {
    if (!started) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const keyDown = (e) => {
      stateRef.current.keys[e.code] = true;
      if (['Space','ArrowUp','ArrowLeft','ArrowRight'].includes(e.code)) e.preventDefault();
    };
    const keyUp = (e) => { stateRef.current.keys[e.code] = false; };
    window.addEventListener('keydown', keyDown);
    window.addEventListener('keyup', keyUp);

    function update() {
      const s = stateRef.current;
      if (s.gameOver || s.won || s.paused) return;
      const m = s.mario;
      s.frame++;

      if (s.keys['ArrowLeft'] || s.keys['KeyA']) { m.vx = -3.5; m.facing = -1; }
      else if (s.keys['ArrowRight'] || s.keys['KeyD']) { m.vx = 3.5; m.facing = 1; }
      else m.vx *= 0.8;

      if ((s.keys['Space'] || s.keys['ArrowUp'] || s.keys['KeyW']) && m.onGround) {
        m.vy = -11; m.onGround = false;
      }

      m.vy += GRAVITY;
      m.x += m.vx;
      m.y += m.vy;
      m.onGround = false;

      for (const p of s.platforms) {
        if (m.x + m.width > p.x && m.x < p.x + p.w &&
            m.y + m.height > p.y && m.y + m.height < p.y + p.h + 12 && m.vy >= 0) {
          m.y = p.y - m.height; m.vy = 0; m.onGround = true;
        }
      }

      if (m.x < 0) m.x = 0;
      if (m.x > WORLD_WIDTH - m.width) m.x = WORLD_WIDTH - m.width;
      if (m.y > H + 50) {
        s.lives--; setLives(s.lives);
        if (s.lives <= 0) { s.gameOver = true; setGameOver(true); return; }
        m.x = Math.max(s.camera, 50); m.y = 220; m.vy = 0;
      }

      // Camera
      const targetCam = m.x - W / 3;
      s.camera = Math.max(0, Math.min(targetCam, WORLD_WIDTH - W));

      // Coins
      for (const c of s.coins) {
        if (!c.collected && m.x < c.x + 12 && m.x + m.width > c.x && m.y < c.y + 12 && m.y + m.height > c.y) {
          c.collected = true; s.score += 10; setScore(s.score);
        }
      }

      // Enemies
      for (const e of s.enemies) {
        if (!e.alive) continue;
        e.x += e.vx;
        if (Math.abs(e.x - e.startX) > 120) e.vx *= -1;
        if (m.x + m.width > e.x + 4 && m.x < e.x + e.width - 4 &&
            m.y + m.height > e.y && m.y + m.height < e.y + 12 && m.vy > 0) {
          e.alive = false; m.vy = -8; s.score += 20; setScore(s.score);
        } else if (m.x + m.width > e.x + 4 && m.x < e.x + e.width - 4 &&
                   m.y + m.height > e.y + 4 && m.y < e.y + e.height && s.invincible <= 0) {
          s.lives--; setLives(s.lives); s.invincible = 90;
          if (s.lives <= 0) { s.gameOver = true; setGameOver(true); return; }
        }
      }
      if (s.invincible > 0) s.invincible--;

      // Checkpoints
      for (const cp of s.checkpoints) {
        if (!cp.triggered && m.x > cp.x) {
          cp.triggered = true;
          const q = s.questions[s.qIndex % s.questions.length];
          s.qIndex++;
          s.paused = true;
          setQuestion(q);
        }
      }

      // Win
      if (m.x > WORLD_WIDTH - 150) { s.won = true; setWon(true); }
    }

    function draw() {
      const s = stateRef.current;
      const cam = s.camera;
      const m = s.mario;

      ctx.clearRect(0, 0, W, H);

      // Sky gradient
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, '#1a1a6e'); sky.addColorStop(1, '#4a90d9');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);

      // Clouds
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      [[100, 50], [300, 30], [500, 60], [700, 40], [900, 55]].forEach(([wx, wy]) => {
        const sx = wx - cam;
        if (sx > -80 && sx < W + 80) {
          ctx.beginPath(); ctx.ellipse(sx, wy, 45, 18, 0, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.ellipse(sx - 25, wy + 5, 30, 14, 0, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.ellipse(sx + 25, wy + 5, 30, 14, 0, 0, Math.PI * 2); ctx.fill();
        }
      });

      // Platforms
      s.platforms.forEach(p => {
        const sx = p.x - cam;
        if (sx + p.w < 0 || sx > W) return;
        ctx.fillStyle = '#5D4037';
        ctx.fillRect(sx, p.y, p.w, p.h);
        ctx.fillStyle = '#388E3C';
        ctx.fillRect(sx, p.y, p.w, 7);
        // Grass tufts
        ctx.fillStyle = '#4CAF50';
        for (let i = 0; i < p.w; i += 20) {
          ctx.fillRect(sx + i, p.y - 3, 8, 4);
        }
      });

      // Coins
      s.coins.forEach(c => {
        if (c.collected) return;
        const sx = c.x - cam;
        if (sx < -20 || sx > W + 20) return;
        const bob = Math.sin(s.frame * 0.1 + c.x) * 3;
        ctx.fillStyle = '#FFD700';
        ctx.beginPath(); ctx.arc(sx + 6, c.y + 6 + bob, 8, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#FF8F00';
        ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('✦', sx + 6, c.y + 10 + bob);
      });

      // Enemies
      s.enemies.forEach(e => {
        if (!e.alive) return;
        const sx = e.x - cam;
        if (sx < -30 || sx > W + 30) return;
        ctx.fillStyle = '#4E342E';
        ctx.beginPath(); ctx.ellipse(sx + 12, e.y + 10, 14, 10, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#6D4C41';
        ctx.fillRect(sx + 2, e.y + 6, 20, 12);
        ctx.fillStyle = '#FF5722';
        ctx.fillRect(sx + 4, e.y + 7, 5, 5);
        ctx.fillRect(sx + 13, e.y + 7, 5, 5);
        ctx.fillStyle = 'white';
        ctx.fillRect(sx + 5, e.y + 8, 3, 3);
        ctx.fillRect(sx + 14, e.y + 8, 3, 3);
      });

      // Checkpoints (flags)
      s.checkpoints.forEach(cp => {
        const sx = cp.x - cam;
        if (sx < -20 || sx > W + 20) return;
        ctx.fillStyle = cp.triggered ? '#aaa' : '#FF5722';
        ctx.fillRect(sx, 200, 3, 80);
        ctx.fillStyle = cp.triggered ? '#ddd' : '#FF9800';
        ctx.fillRect(sx + 3, 200, 20, 14);
        if (!cp.triggered) {
          ctx.fillStyle = 'white';
          ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center';
          ctx.fillText('?', sx + 13, 211);
        }
      });

      // Finish flag
      const flagX = WORLD_WIDTH - 150 - cam;
      if (flagX > -20 && flagX < W + 20) {
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(flagX, 160, 4, 120);
        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(flagX + 4, 160, 28, 20);
        ctx.fillStyle = 'white';
        ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('END', flagX + 18, 174);
      }

      // Mario
      const mx = m.x - cam;
      const my = m.y;
      const flash = s.invincible > 0 && Math.floor(s.invincible / 5) % 2 === 0;
      if (!flash) {
        ctx.save();
        if (m.facing === -1) {
          ctx.translate(mx + m.width / 2, 0);
          ctx.scale(-1, 1);
          ctx.translate(-(mx + m.width / 2), 0);
        }
        // Legs (animated)
        const legAnim = m.onGround ? Math.sin(s.frame * 0.3) * 4 : 0;
        ctx.fillStyle = '#1565C0';
        ctx.fillRect(mx + 3, my + 22, 8, 10 + legAnim);
        ctx.fillRect(mx + 13, my + 22, 8, 10 - legAnim);
        // Body
        ctx.fillStyle = '#E53935';
        ctx.fillRect(mx + 2, my + 12, 20, 12);
        // Head
        ctx.fillStyle = '#FFCC02';
        ctx.fillRect(mx + 2, my + 3, 20, 12);
        // Hat
        ctx.fillStyle = '#E53935';
        ctx.fillRect(mx, my, 24, 7);
        ctx.fillRect(mx + 4, my - 5, 16, 7);
        // Eyes
        ctx.fillStyle = '#333';
        ctx.fillRect(mx + 13, my + 5, 4, 4);
        ctx.fillStyle = 'white';
        ctx.fillRect(mx + 14, my + 6, 2, 2);
        // Mustache
        ctx.fillStyle = '#5D4037';
        ctx.fillRect(mx + 8, my + 10, 12, 3);
        ctx.restore();
      }

      // HUD
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, W, 28);
      ctx.fillStyle = 'white'; ctx.font = 'bold 13px system-ui';
      ctx.textAlign = 'left'; ctx.fillText(`⭐ ${s.score}`, 10, 18);
      ctx.textAlign = 'center'; ctx.fillText('🍄 MedMario', W / 2, 18);
      ctx.textAlign = 'right'; ctx.fillText(`❤️ x${s.lives}`, W - 10, 18);

      // Progress bar
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.fillRect(0, 28, W, 4);
      ctx.fillStyle = '#4CAF50';
      ctx.fillRect(0, 28, (m.x / WORLD_WIDTH) * W, 4);

      update();
      animRef.current = requestAnimationFrame(draw);
    }

    animRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('keydown', keyDown);
      window.removeEventListener('keyup', keyUp);
    };
  }, [started]);

  const isCorrect = (opt) => opt === question?.answer;

  return (
    <div style={{ minHeight: '100vh', background: '#1a1a2e', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ marginBottom: '12px', display: 'flex', gap: '16px', alignItems: 'center' }}>
        <button onClick={() => router.back()} style={{ padding: '6px 14px', background: 'rgba(255,255,255,0.15)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>← Back</button>
        <span style={{ color: 'white', fontWeight: '700', fontSize: '18px' }}>🍄 MedMario</span>
        {studySet && <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>{studySet.title}</span>}
      </div>

      <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
        <canvas ref={canvasRef} width={W} height={H} style={{ display: 'block' }} />

        {!started && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
            <div style={{ fontSize: '52px', marginBottom: '8px' }}>🍄</div>
            <p style={{ color: 'white', fontSize: '24px', fontWeight: '700', margin: '0 0 4px' }}>MedMario</p>
            {studySet && <p style={{ color: '#4CAF50', fontSize: '14px', margin: '0 0 8px' }}>{studySet.title}</p>}
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', margin: '0 0 24px', textAlign: 'center' }}>
              Run through the world · Answer questions at checkpoints<br/>
              Correct = bonus points · Wrong = lose a life<br/>
              Arrow keys / WASD · Space to jump
            </p>
            <button onClick={startGame} disabled={!studySet} style={{ padding: '12px 32px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: '700', cursor: 'pointer' }}>
              {studySet ? 'Start Game' : 'No study set loaded'}
            </button>
          </div>
        )}

        {question && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.88)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', overflowY: 'auto' }}>
            <p style={{ color: '#FFD700', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 10px' }}>🚩 Checkpoint! Answer to keep going</p>
            <p style={{ color: 'white', fontSize: '15px', fontWeight: '600', margin: '0 0 16px', textAlign: 'center', lineHeight: '1.4' }}>{question.question}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', maxWidth: '380px' }}>
              {question.options?.map((opt, i) => {
                let bg = 'rgba(255,255,255,0.1)', border = '1px solid rgba(255,255,255,0.2)', color = 'white';
                if (selectedAns) {
                  if (opt === question.answer) { bg = '#1B5E20'; border = '1px solid #4CAF50'; }
                  else if (opt === selectedAns) { bg = '#B71C1C'; border = '1px solid #F44336'; }
                }
                return (
                  <button key={i} onClick={() => !selectedAns && answerQuestion(opt)}
                    style={{ padding: '10px 14px', background: bg, border, borderRadius: '8px', color, fontSize: '13px', textAlign: 'left', cursor: selectedAns ? 'default' : 'pointer', lineHeight: '1.4' }}>
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {gameOver && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ color: 'white', fontSize: '28px', fontWeight: '700', margin: '0 0 8px' }}>💀 Game Over</p>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '16px', margin: '0 0 24px' }}>Score: {score}</p>
            <button onClick={startGame} style={{ padding: '12px 32px', background: '#F44336', color: 'white', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: '700', cursor: 'pointer' }}>Try Again</button>
          </div>
        )}

        {won && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ color: '#FFD700', fontSize: '28px', fontWeight: '700', margin: '0 0 8px' }}>🎉 You Win!</p>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '16px', margin: '0 0 4px' }}>Score: {score}</p>
            <p style={{ color: '#4CAF50', fontSize: '13px', margin: '0 0 24px' }}>You made it through all the checkpoints!</p>
            <button onClick={startGame} style={{ padding: '12px 32px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: '700', cursor: 'pointer' }}>Play Again</button>
          </div>
        )}
      </div>
      <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', marginTop: '10px' }}>Arrow keys / WASD · Space or Up to jump · Answer questions at 🚩 checkpoints</p>
    </div>
  );
}

export default function MarioGame() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#1a1a2e', color: 'white' }}>Loading...</div>}>
      <MarioContent />
    </Suspense>
  );
}