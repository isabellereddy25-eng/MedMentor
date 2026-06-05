'use client';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  return (
    <div style={{minHeight:'100vh',background:'#6d28d9',display:'flex',alignItems:'center',justifyContent:'center',padding:'32px'}}>
      <div style={{textAlign:'center',color:'white',maxWidth:'600px'}}>
        <h1 style={{fontSize:'48px',fontWeight:'bold',marginBottom:'16px'}}>🩺 MedMentor</h1>
        <p style={{fontSize:'20px',marginBottom:'8px',opacity:'0.9'}}>AI-powered medical study tool for pre-med high schoolers</p>
        <p style={{fontSize:'14px',marginBottom:'40px',opacity:'0.7'}}>10% of Pro revenue donated to health education nonprofits</p>
        <div style={{display:'flex',gap:'16px',justifyContent:'center',flexWrap:'wrap'}}>
          <button onClick={()=>router.push('/onboarding')} style={{padding:'14px 32px',background:'white',color:'#6d28d9',border:'none',borderRadius:'8px',fontSize:'18px',fontWeight:'bold',cursor:'pointer'}}>Get Started</button>
          <button onClick={()=>router.push('/dashboard')} style={{padding:'14px 32px',background:'transparent',color:'white',border:'2px solid white',borderRadius:'8px',fontSize:'18px',cursor:'pointer'}}>Sign In</button>
        </div>
      </div>
    </div>
  );
}