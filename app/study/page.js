'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function Study() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const [set, setSet] = useState(null);
  const [mode, setMode] = useState('flashcards');
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const sets = JSON.parse(localStorage.getItem('studySets') || '[]');
    if (sets[id]) setSet(sets[id]);
    else router.push('/dashboard');
  }, []);

  if (!set) return <div style={{padding:'32px'}}>Loading...</div>;

  const card = set.flashcards?.[cardIndex];

  const handleAnswer = (qi, answer) => {
    setAnswers(prev => ({...prev, [qi]: answer}));
  };

  const handleSubmit = () => setSubmitted(true);

  const score = submitted ? set.questions?.filter((q,i) => answers[i] === q.answer).length : 0;

  return (
    <div style={{minHeight:'100vh',background:'#f5f3ff',padding:'32px'}}>
      <div style={{maxWidth:'700px',margin:'0 auto'}}>
        <button onClick={()=>router.push('/dashboard')} style={{background:'none',border:'none',color:'#6d28d9',cursor:'pointer',marginBottom:'16px',fontSize:'16px'}}>← Back</button>
        <h1 style={{fontSize:'24px',fontWeight:'bold',marginBottom:'16px'}}>{set.title}</h1>

        <div style={{display:'flex',gap:'12px',marginBottom:'24px'}}>
          <button onClick={()=>setMode('flashcards')} style={{padding:'10px 20px',background: mode==='flashcards' ? '#6d28d9' : 'white',color: mode==='flashcards' ? 'white' : '#6d28d9',border:'2px solid #6d28d9',borderRadius:'8px',cursor:'pointer'}}>Flashcards</button>
          <button onClick={()=>setMode('quiz')} style={{padding:'10px 20px',background: mode==='quiz' ? '#6d28d9' : 'white',color: mode==='quiz' ? 'white' : '#6d28d9',border:'2px solid #6d28d9',borderRadius:'8px',cursor:'pointer'}}>Quiz</button>
        </div>

        {mode === 'flashcards' && card && (
          <div>
            <div onClick={()=>setFlipped(!flipped)} style={{background:'white',borderRadius:'16px',padding:'60px 40px',textAlign:'center',cursor:'pointer',boxShadow:'0 4px 16px rgba(0,0,0,0.1)',minHeight:'200px',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <div>
                <p style={{fontSize:'12px',color:'#999',marginBottom:'16px'}}>{flipped ? 'ANSWER' : 'QUESTION'} — click to flip</p>
                <p style={{fontSize:'20px',fontWeight:'500'}}>{flipped ? card.answer : card.question}</p>
              </div>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:'20px'}}>
              <button onClick={()=>{setCardIndex(i=>Math.max(0,i-1));setFlipped(false)}} style={{padding:'10px 20px',background:'white',border:'1px solid #ddd',borderRadius:'8px',cursor:'pointer'}}>← Prev</button>
              <span style={{color:'#666'}}>{cardIndex+1} / {set.flashcards.length}</span>
              <button onClick={()=>{setCardIndex(i=>Math.min(set.flashcards.length-1,i+1));setFlipped(false)}} style={{padding:'10px 20px',background:'white',border:'1px solid #ddd',borderRadius:'8px',cursor:'pointer'}}>Next →</button>
            </div>
          </div>
        )}

        {mode === 'quiz' && (
          <div>
            {set.questions?.map((q, qi) => (
              <div key={qi} style={{background:'white',borderRadius:'12px',padding:'24px',marginBottom:'16px'}}>
                <p style={{fontWeight:'600',marginBottom:'16px'}}>{qi+1}. {q.question}</p>
                {q.options?.map((opt, oi) => {
                  let bg = 'white'; let border = '1px solid #ddd';
                  if (submitted) {
                    if (opt === q.answer) { bg='#d1fae5'; border='1px solid #10b981'; }
                    else if (opt === answers[qi]) { bg='#fee2e2'; border='1px solid #ef4444'; }
                  } else if (answers[qi] === opt) { bg='#ede9fe'; border='1px solid #6d28d9'; }
                  return (
                    <div key={oi} onClick={()=>!submitted && handleAnswer(qi, opt)} style={{padding:'12px',border,borderRadius:'8px',marginBottom:'8px',cursor: submitted?'default':'pointer',background:bg}}>
                      {opt}
                    </div>
                  );
                })}
              </div>
            ))}
            {!submitted ? (
              <button onClick={handleSubmit} style={{width:'100%',padding:'14px',background:'#6d28d9',color:'white',border:'none',borderRadius:'8px',fontSize:'16px',cursor:'pointer'}}>Submit Quiz</button>
            ) : (
              <div style={{background:'white',borderRadius:'12px',padding:'24px',textAlign:'center'}}>
                <p style={{fontSize:'24px',fontWeight:'bold'}}>Score: {score}/{set.questions.length}</p>
                <p style={{color:'#666',marginTop:'8px'}}>{score === set.questions.length ? '🎉 Perfect!' : score >= set.questions.length/2 ? '👍 Good job!' : '💪 Keep studying!'}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}