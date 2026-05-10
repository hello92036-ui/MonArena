import { useAccount, useBalance } from "wagmi";

export function TopBar({ onProfileClick }) {
  const { address } = useAccount();
  const { data: balance } = useBalance({ address });

  const short = address
    ? `${address.slice(0,6)}…${address.slice(-4)}`
    : "";

  const mon = balance
    ? parseFloat(balance.formatted).toFixed(1)
    : "0.0";

  return (
    <div style={{
      position:"fixed",top:0,left:0,right:0,zIndex:100,
      transform:"translateZ(0)",willChange:"transform",
      background:"rgba(255,246,236,0.94)",
      backdropFilter:"blur(18px)",WebkitBackdropFilter:"blur(18px)",
      borderBottom:"1px solid var(--border)",
      padding:"9px 16px",
      display:"flex",alignItems:"center",justifyContent:"space-between",
    }}>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <svg width="32" height="32" viewBox="0 0 40 40">
          <defs>
            <linearGradient id="lm" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FFB36A"/>
              <stop offset="55%" stopColor="#FF6B5C"/>
              <stop offset="100%" stopColor="#E0367A"/>
            </linearGradient>
          </defs>
          <rect x="2" y="2" width="36" height="36" rx="11" fill="url(#lm)"/>
          <text x="20" y="26" textAnchor="middle" fontFamily="Bricolage Grotesque,sans-serif" fontSize="14" fontWeight="800" fill="white">M</text>
        </svg>
        <span style={{fontFamily:"var(--font-display)",fontSize:20,fontWeight:800,letterSpacing:"-0.025em",color:"var(--ink)"}}>
          Mon<span style={{background:"linear-gradient(95deg,var(--coral),hsl(28 100% 58%) 50%,hsl(340 90% 60%))",WebkitBackgroundClip:"text",backgroundClip:"text",color:"transparent"}}>Arena</span>
        </span>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <div style={{display:"flex",alignItems:"center",gap:5,padding:"5px 11px",borderRadius:999,background:"white",border:"1px solid var(--border)",boxShadow:"0 1px 4px -2px rgba(40,30,20,0.08)"}}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><defs><linearGradient id="mg2" x1="0" y1="0" x2="24" y2="24"><stop offset="0%" stopColor="#FFC23D"/><stop offset="100%" stopColor="#FF7A1A"/></linearGradient></defs><circle cx="12" cy="12" r="11" fill="url(#mg2)"/><path d="M12 5.5L17.5 12L12 18.5L6.5 12Z" fill="white" opacity="0.95"/></svg>
          <span style={{fontFamily:"var(--font-display)",fontSize:14,fontWeight:800,color:"var(--ink)"}}>{mon}</span>
          <span style={{fontSize:9,color:"var(--muted)",fontWeight:700}}>MON</span>
        </div>
        <button onClick={onProfileClick} style={{width:36,height:36,borderRadius:10,border:"2px solid white",background:"linear-gradient(135deg,#FFC23D,#8C5800)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:18,boxShadow:"0 3px 8px -3px rgba(40,30,20,0.22)"}}>
          🦜
        </button>
      </div>
    </div>
  );
}
