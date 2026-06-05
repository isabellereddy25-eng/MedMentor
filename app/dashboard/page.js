'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [studySets, setStudySets] = useState([]);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) { router.push('/onboarding'); return; }
    setUser(JSON.parse(userData));
    const sets = JSON.parse(localStorage.getItem('studySets') || '[]');
    setStudySets(sets);
  }, []);

  return (
    <div style={{minHeight:'100vh',background:'#f5f3ff',padding:'32px'}}>
      <div style={{maxWidth:'800px',margin:'0 auto'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'32px'}}>
          <div>
            <h1 style={{fontSize:'28px',fontWeight:'bold',color:'#1a1a1a'}}>Hey {user?.name} 👋</h1>
            <p style={{color:'#666'}}>Ready to study?</p>
          </div>
          <button onClick={()=>router.push('/create')} style={{padding:'12px 24px',background:'#6d28d9',color:'white',border:'none',borderRadius:'8px',fontSize:'16px',cursor:'pointer'}}>+ New Study Set</button>
        </div>

        {studySets.length === 0 ? (
          <div style={{background:'white',borderRadius:'16px',padding:'60px',textAlign:'center'}}>
            <p style={{fontSize:'48px',marginBottom:'16px'}}>📚</p>
            <h2 style={{fontSize:'20px',fontWeight:'bold',marginBottom:'8px'}}>No study sets yet</h2>
            <p style={{color:'#666',marginBottom:'24px'}}>Create your first one to get started!</p>
            <button onClick={()=>router.push('/create')} style={{padding:'12px 24px',background:'#6d28d9',color:'white',border:'none',borderRadius:'8px',fontSize:'16px',cursor:'pointer'}}>Create Study Set</button>
          </div>
        ) : (
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(250px,1fr))',gap:'16px'}}>
            {studySets.map((set, i) => (
              <div key={i} onClick={()=>router.push(`/study?id=${i}`)} style={{background:'white',borderRadius:'12px',padding:'24px',cursor:'pointer',boxShadow:'0 2px 8px rgba(0,0,0,0.08)'}}>
                <h3 style={{fontWeight:'bold',marginBottom:'8px'}}>{set.title}</h3>
                <p style={{color:'#666',fontSize:'14px'}}>{set.flashcards?.length || 0} flashcards • {set.questions?.length || 0} questions</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}