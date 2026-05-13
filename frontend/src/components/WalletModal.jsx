import { useState } from "react";
import { useConnect } from "wagmi";

const WALLETS = [
  { id:"haha",          name:"HaHa Wallet",   color:"#F5C100" },
  { id:"rabby",         name:"Rabby Wallet",   color:"#8697FF" },
  { id:"backpack",      name:"Backpack",        color:"#E84125" },
  { id:"phantom",       name:"Phantom",         color:"#551BF9" },
  { id:"walletconnect", name:"WalletConnect",   color:"#3B99FC" },
];

export function WalletModal({ open, onClose, onConnected }) {
  const [phase, setPhase] = useState("select");
  const [chosen, setChosen] = useState(null);
  const { connectAsync, connectors } = useConnect();

  const handleConnect = async (wallet) => {
    setChosen(wallet);
    setPhase("connecting");
    try {
      const connector = wallet.id === "walletconnect"
        ? connectors.find(c => c.id === "walletConnect")
        : connectors.find(c => c.id === "injected");
      
      await connectAsync({ connector });
      setPhase("connected");
      setTimeout(() => onConnected?.(), 1000);
    } catch (e) {
      console.error(e);
      setPhase("error");
    }
  };

  if (!open) return null;

  return (
    <>
      <div onClick={phase==="connecting"?undefined:onClose} style={{position:"fixed",inset:0,zIndex:300,background:"rgba(15,27,61,0.42)",backdropFilter:"blur(6px)",animation:"fadeIn 0.22s ease"}}/>
      <div style={{position:"fixed",bottom:0,left:0,right:0,zIndex:301,maxWidth:520,margin:"0 auto",background:"hsl(36 100% 97%)",borderRadius:"24px 24px 0 0",boxShadow:"0 -8px 40px -8px rgba(40,30,20,0.18)",animation:"slideUp 0.32s cubic-bezier(0.16,1,0.3,1)",paddingBottom:"max(20px,env(safe-area-inset-bottom))"}}>
        <div style={{display:"flex",justifyContent:"center",padding:"10px 0 2px"}}>
          <div style={{width:36,height:4,borderRadius:999,background:"hsl(36 30% 82%)"}}/>
        </div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 18px 0"}}>
          <div style={{fontFamily:"var(--font-display)",fontSize:20,fontWeight:800,color:"var(--ink)"}}>
            {phase==="select"&&"Connect Wallet"}
            {phase==="connecting"&&"Connecting…"}
            {phase==="connected"&&"Connected"}
            {phase==="error"&&"Failed"}
          </div>
          {phase!=="connecting"&&(
            <button onClick={onClose} style={{width:32,height:32,borderRadius:9,border:"1px solid var(--border)",background:"white",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"var(--muted)"}}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          )}
        </div>
        {phase==="select"&&(
          <div style={{padding:"14px 14px 0",display:"flex",flexDirection:"column",gap:8}}>
            {WALLETS.map(w=>(
              <button key={w.id} onClick={()=>handleConnect(w)} style={{width:"100%",display:"flex",alignItems:"center",gap:12,padding:"13px 14px",borderRadius:14,border:"1px solid var(--border)",background:"white",cursor:"pointer",textAlign:"left",transition:"all 0.18s"}}>
                <div style={{width:40,height:40,borderRadius:12,background:w.color,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><rect x="2" y="6" width="20" height="14" rx="3"/><path d="M16 12h2"/><path d="M2 10h20"/></svg>
                </div>
                <div style={{fontFamily:"var(--font-display)",fontSize:15,fontWeight:800,color:"var(--ink)",flex:1}}>{w.name}</div>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
              </button>
            ))}
          </div>
        )}
        {phase==="connecting"&&(
          <div style={{padding:"32px 18px 16px",display:"flex",flexDirection:"column",alignItems:"center",gap:16}}>
            <div style={{width:64,height:64,borderRadius:"50%",border:`3px solid ${chosen?.color}22`,position:"relative",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <svg style={{position:"absolute",inset:0,animation:"wmSpin 1s linear infinite"}} width="64" height="64" viewBox="0 0 64 64" fill="none">
                <circle cx="32" cy="32" r="30" stroke={chosen?.color} strokeWidth="3" strokeOpacity="0.15" strokeDasharray="188"/>
                <circle cx="32" cy="32" r="30" stroke={chosen?.color} strokeWidth="3" strokeDasharray="188" strokeDashoffset="141" strokeLinecap="round"/>
              </svg>
              <div style={{width:44,height:44,borderRadius:"50%",background:`${chosen?.color}18`,display:"flex",alignItems:"center",justifyContent:"center"}}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={chosen?.color} strokeWidth="2" strokeLinecap="round"><rect x="2" y="6" width="20" height="14" rx="3"/><path d="M16 12h2"/><path d="M2 10h20"/></svg>
              </div>
            </div>
            <div style={{fontSize:13,color:"var(--muted)",fontWeight:600,textAlign:"center"}}>Open {chosen?.name} and approve</div>
            <button onClick={onClose} style={{padding:"8px 22px",borderRadius:999,border:"1px solid var(--border)",background:"white",cursor:"pointer",fontSize:12.5,fontWeight:700,color:"var(--muted)",fontFamily:"var(--font-body)"}}>Cancel</button>
          </div>
        )}
        {phase==="connected"&&(
          <div style={{padding:"32px 18px 16px",display:"flex",flexDirection:"column",alignItems:"center",gap:12}}>
            <div style={{width:64,height:64,borderRadius:"50%",background:"linear-gradient(135deg,#3EDD9B,#1BAD6E)",display:"flex",alignItems:"center",justifyContent:"center",animation:"pop 0.5s cubic-bezier(0.34,1.56,0.64,1) both"}}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.8" strokeLinecap="round"><polyline points="20,6 9,17 4,12"/></svg>
            </div>
            <div style={{fontSize:13,color:"var(--muted)",fontWeight:600}}>Entering the arena…</div>
          </div>
        )}
      </div>
    </>
  );
}
