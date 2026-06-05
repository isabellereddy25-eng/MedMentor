'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [grade, setGrade] = useState('');
  const [goal, setGoal] = useState('');

  const handleNext = () => {
    if (!name || !email) return alert('Please fill in all fields');
    setStep(2);
  };

  const handleFinish = () => {
    if (!grade || !goal) return alert('Please fill in all fields');
    localStorage.setItem('user', JSON.stringify({ name, email, grade, goal }));
    router.push('/dashboard');
  };

  return (
    <div style={{minHeight:'100vh',background:'#6d28d9',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{background:'white',borderRadius:'16px',padding:'40px',width:'100%',maxWidth:'400px'}}>
        {step === 1 ? (
          <>
            <h1 style={{fontSize:'24px',fontWeight:'bold',marginBottom:'8px'}}>Welcome to MedMentor 🩺</h1>
            <p style={{color:'#666',marginBottom:'24px'}}>Let's get you set up</p>
            <input placeholder="Your name" value={name} onChange={e=>setName(e.target.value)} style={{width:'100%',padding:'12px',border:'1px solid #ddd',borderRadius:'8px',marginBottom:'12px',boxSizing:'border-box'}} />
            <input placeholder="Your email" value={email} onChange={e=>setEmail(e.target.value)} style={{width:'100%',padding:'12px',border:'1px solid #ddd',borderRadius:'8px',marginBottom:'20px',boxSizing:'border-box'}} />
            <button onClick={handleNext} style={{width:'100%',padding:'12px',background:'#6d28d9',color:'white',border:'none',borderRadius:'8px',fontSize:'16px',cursor:'pointer'}}>Next →</button>
          </>
        ) : (
          <>
            <h1 style={{fontSize:'24px',fontWeight:'bold',marginBottom:'8px'}}>Almost there!</h1>
            <p style={{color:'#666',marginBottom:'24px'}}>Tell us about yourself</p>
            <select value={grade} onChange={e=>setGrade(e.target.value)} style={{width:'100%',padding:'12px',border:'1px solid #ddd',borderRadius:'8px',marginBottom:'12px',boxSizing:'border-box'}}>
              <option value="">Select your grade</option>
              <option>9th grade</option><option>10th grade</option><option>11th grade</option><option>12th grade</option>
            </select>
            <select value={goal} onChange={e=>setGoal(e.target.value)} style={{width:'100%',padding:'12px',border:'1px solid #ddd',borderRadius:'8px',marginBottom:'20px',boxSizing:'border-box'}}>
              <option value="">Select your goal</option>
              <option>Get into a top pre-med program</option><option>Ace my AP Biology class</option><option>Prepare for med school</option><option>Just exploring medicine</option>
            </select>
            <button onClick={handleFinish} style={{width:'100%',padding:'12px',background:'#6d28d9',color:'white',border:'none',borderRadius:'8px',fontSize:'16px',cursor:'pointer'}}>Let's go! 🚀</button>
          </>
        )}
      </div>
    </div>
  );
}
