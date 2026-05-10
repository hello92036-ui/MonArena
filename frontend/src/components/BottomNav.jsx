export function BottomNav({ current, onChange }) {
  const tabs = [
    { key:"lobby",   label:"Lobby",   icon:"M3 12L12 3l9 9M9 21V12h6v9" },
    { key:"history", label:"History", icon:"M12 3a9 9 0 100 18A9 9 0 0012 3zM12 7v5l3 3" },
    { key:"squad",   label:"Squad",   icon:"M16 7h.01M3.4 18H12a8 8 0 008-8V7a4 4 0 00-7.28-2.3L2 20" },
    { key:"profile", label:"Profile", icon:"M12 4a4 4 0 100 8 4 4 0 000-8zM4 20c0-4 3.6-7 8-7s8 3 8 7" },
  ];
  return (
    <div style={{position:"fixed",bottom:0,left:0,right:0,zIndex:100,transform:"translateZ(0)",willChange:"transform",background:"rgba(255,246,236,0.94)",backdropFilter:"blur(18px)",WebkitBackdropFilter:"blur(18px)",borderTop:"1px solid var(--border)",display:"flex",paddingBottom:"max(8px,env(safe-area-inset-bottom))",paddingTop:4}}>
      {tabs.map(tab => {
        const active = current === tab.key;
        return (
          <button key={tab.key} onClick={() => onChange(tab.key)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2,padding:"4px 0",border:"none",background:"none",cursor:"pointer",color:active?"hsl(8 95% 58%)":"var(--muted)",transition:"color 0.15s"}}>
            <div style={{padding:"3px 14px",borderRadius:999,background:active?"hsl(8 95% 60%/0.10)":"transparent",transition:"background 0.15s"}}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d={tab.icon}/>
              </svg>
            </div>
            <span style={{fontSize:10.5,fontWeight:active?800:600,fontFamily:"var(--font-body)"}}>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
