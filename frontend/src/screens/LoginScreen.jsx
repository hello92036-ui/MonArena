import { Dice3D } from "../components/Dice3D";
import { useState, useEffect, useCallback, memo } from "react";

const C = 38;
const BW = 15 * C;
const HOMES = [
  { id:"r", base:"#FF5A5F", hi:"#FF8A8E", lo:"#C7363B", x:0,    y:9*C },
  { id:"g", base:"#34D399", hi:"#7BEAC0", lo:"#14935E", x:0,    y:0   },
  { id:"y", base:"#FFC23D", hi:"#FFD97A", lo:"#D89400", x:9*C,  y:0   },
  { id:"b", base:"#3DA9FF", hi:"#7CC4FF", lo:"#1D7BCB", x:9*C,  y:9*C },
];
const SAFE=[{c:1,r:6},{c:8,r:1},{c:13,r:8},{c:6,r:13},{c:2,r:8},{c:6,r:2},{c:12,r:6},{c:8,r:12}];
const ENTRY=[{x:C,y:6*C,f:"#FF5A5F"},{x:8*C,y:C,f:"#34D399"},{x:13*C,y:8*C,f:"#FFC23D"},{x:6*C,y:13*C,f:"#3DA9FF"}];

function GCell({x,y,fill="#FFFDF8",stroke="#E7DFD0"}){
  return <rect x={x+1} y={y+1} width={C-2} height={C-2} rx="5" fill={fill} stroke={stroke} strokeWidth="0.8"/>;
}
function GStar({cx,cy}){
  const p=[];for(let i=0;i<10;i++){const r=i%2===0?10:4;const a=(i*Math.PI)/5-Math.PI/2;p.push(`${cx+r*Math.cos(a)},${cy+r*Math.sin(a)}`);}
  return <polygon points={p.join(" ")} fill="#C9B98A" opacity="0.9"/>;
}
function GPiece({cx,cy,color,rim}){
  return <g><ellipse cx={cx} cy={cy+2.5} rx="10" ry="3" fill="rgba(0,0,0,0.18)"/><circle cx={cx} cy={cy} r="11" fill={rim}/><circle cx={cx} cy={cy} r="9.5" fill={color}/><ellipse cx={cx-2.5} cy={cy-3} rx="4" ry="2.5" fill="white" opacity="0.5"/></g>;
}
function GHome({h}){
  const ix=h.x+C,iy=h.y+C,iw=4*C;
  const sl=[{x:ix+C,y:iy+C},{x:ix+3*C,y:iy+C},{x:ix+C,y:iy+3*C},{x:ix+3*C,y:iy+3*C}];
  return <g>
    <rect x={h.x+3} y={h.y+3} width={6*C-6} height={6*C-6} rx="20" fill={`url(#f${h.id})`} stroke="rgba(0,0,0,0.06)"/>
    <rect x={h.x+3} y={h.y+3} width={6*C-6} height={(6*C-6)*0.44} rx="20" fill={`url(#gl${h.id})`} opacity="0.5"/>
    <rect x={ix} y={iy} width={iw} height={iw} rx="12" fill="#FFFCF6" stroke="rgba(0,0,0,0.05)"/>
    <rect x={ix+5} y={iy+5} width={iw-10} height={iw-10} rx="8" fill="none" stroke={h.base} strokeOpacity="0.25" strokeWidth="1.5" strokeDasharray="4 8"/>
    {sl.map((s,i)=><GPiece key={i} cx={s.x} cy={s.y} color={h.base} rim={h.lo}/>)}
  </g>;
}

const LudoBoardSVG = memo(function LudoBoardSVG({size}){
  const pc=[];
  for(let r=0;r<6;r++) for(let c=6;c<9;c++) pc.push({x:c*C,y:r*C});
  for(let r=9;r<15;r++) for(let c=6;c<9;c++) pc.push({x:c*C,y:r*C});
  for(let r=6;r<9;r++) for(let c=0;c<6;c++) pc.push({x:c*C,y:r*C});
  for(let r=6;r<9;r++) for(let c=9;c<15;c++) pc.push({x:c*C,y:r*C});
  const lanes=[
    {cc:Array.from({length:5},(_,i)=>({x:(1+i)*C,y:7*C})),f:"#FF5A5F"},
    {cc:Array.from({length:5},(_,i)=>({x:7*C,y:(1+i)*C})),f:"#34D399"},
    {cc:Array.from({length:5},(_,i)=>({x:(13-i)*C,y:7*C})),f:"#FFC23D"},
    {cc:Array.from({length:5},(_,i)=>({x:7*C,y:(13-i)*C})),f:"#3DA9FF"},
  ];
  return (
    <svg viewBox={`0 0 ${BW} ${BW}`} width={size} height={size} style={{display:"block",borderRadius:20,boxShadow:"0 20px 60px -16px rgba(40,30,20,0.26)"}}>
      <defs>
        {HOMES.map(h=>[
          <linearGradient key={`f${h.id}`} id={`f${h.id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={h.hi}/><stop offset="55%" stopColor={h.base}/><stop offset="100%" stopColor={h.lo}/></linearGradient>,
          <linearGradient key={`gl${h.id}`} id={`gl${h.id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#fff" stopOpacity="0.8"/><stop offset="100%" stopColor="#fff" stopOpacity="0"/></linearGradient>,
        ])}
        <linearGradient id="lbg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#FFFDF8"/><stop offset="100%" stopColor="#F1E7D3"/></linearGradient>
        <linearGradient id="cxr" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FF8A8E"/><stop offset="1" stopColor="#C7363B"/></linearGradient>
        <linearGradient id="cxg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#7BEAC0"/><stop offset="100%" stopColor="#0E7E55"/></linearGradient>
        <linearGradient id="cxy" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFD97A"/><stop offset="1" stopColor="#B97800"/></linearGradient>
        <linearGradient id="cxb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#7CC4FF"/><stop offset="1" stopColor="#0D4D85"/></linearGradient>
      </defs>
      <rect width={BW} height={BW} rx="22" fill="url(#lbg)"/>
      <rect x="4" y="4" width={BW-8} height={BW-8} rx="17" fill="#FFFDF8" stroke="#EAD9B6" strokeWidth="1.2"/>
      {pc.map((c,i)=><GCell key={i} x={c.x} y={c.y}/>)}
      {lanes.map((l,li)=>l.cc.map((c,i)=><GCell key={"l"+li+i} x={c.x} y={c.y} fill={l.f} stroke="rgba(0,0,0,0.04)"/>))}
      {ENTRY.map((e,i)=><GCell key={"e"+i} x={e.x} y={e.y} fill={e.f} stroke="rgba(0,0,0,0.04)"/>)}
      {SAFE.map((s,i)=><GStar key={i} cx={s.c*C+C/2} cy={s.r*C+C/2}/>)}
      {HOMES.map(h=><GHome key={h.id} h={h}/>)}
      <g transform={"translate("+(6*C)+","+(6*C)+")"}>
        <rect width={3*C} height={3*C} fill="#FFFDF8" stroke="#EAD9B6" strokeWidth="0.8"/>
        <polygon points={"0,0 "+(3*C)+",0 "+(1.5*C)+","+(1.5*C)} fill="url(#cxg)"/>
        <polygon points={(3*C)+",0 "+(3*C)+","+(3*C)+" "+(1.5*C)+","+(1.5*C)} fill="url(#cxy)"/>
        <polygon points={"0,"+(3*C)+" "+(3*C)+","+(3*C)+" "+(1.5*C)+","+(1.5*C)} fill="url(#cxb)"/>
        <polygon points={"0,0 0,"+(3*C)+" "+(1.5*C)+","+(1.5*C)} fill="url(#cxr)"/>
        <circle cx={1.5*C} cy={1.5*C} r="8" fill="#FFFDF8" stroke="rgba(0,0,0,0.12)"/>
      </g>
    </svg>
  );
});

const SC=58,SW=10*SC;
const RTINTS=["#FFF8EC","#FFF1E6","#FFEEDA","#FFE9D8","#FDE6D2","#FAE6E0","#F4E7E8","#E9E7F0","#E2E9F4","#E1EEF7"];
function sCell(n){const idx=n-1,r=Math.floor(idx/10),ic=idx%10,c=r%2===0?ic:9-ic;return{x:c*SC+SC/2,y:(9-r)*SC+SC/2};}
function SLadder({from,to}){
  const a=sCell(from),b=sCell(to),dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy),ux=dx/len,uy=dy/len,px=-uy,py=ux,h=10;
  const r1a={x:a.x+px*h,y:a.y+py*h},r1b={x:b.x+px*h,y:b.y+py*h},r2a={x:a.x-px*h,y:a.y-py*h},r2b={x:b.x-px*h,y:b.y-py*h};
  const rungs=Math.max(3,Math.floor(len/36)),rl=[];
  for(let i=1;i<rungs;i++){const t=i/rungs;rl.push(<line key={i} x1={a.x+dx*t+px*h} y1={a.y+dy*t+py*h} x2={a.x+dx*t-px*h} y2={a.y+dy*t-py*h} stroke="#FFB000" strokeWidth="3" strokeLinecap="round"/>);}
  return <g style={{filter:"drop-shadow(0 3px 5px rgba(120,70,0,0.2))"}}>
    <line x1={r1a.x} y1={r1a.y} x2={r1b.x} y2={r1b.y} stroke="#FFB000" strokeWidth="4.5" strokeLinecap="round"/>
    <line x1={r2a.x} y1={r2a.y} x2={r2b.x} y2={r2b.y} stroke="#FFB000" strokeWidth="4.5" strokeLinecap="round"/>
    {rl}
  </g>;
}
function SSnake({from,to,color="#34D399",belly="#0E5E3D",cs=1,id}){
  const hd=sCell(from),tl=sCell(to),dx=tl.x-hd.x,dy=tl.y-hd.y,len=Math.hypot(dx,dy),px=-(dy/len),py=dx/len;
  const c1={x:hd.x+dx*0.33+px*55*cs,y:hd.y+dy*0.33+py*55*cs},c2={x:hd.x+dx*0.66-px*55*cs,y:hd.y+dy*0.66-py*55*cs};
  const path=`M ${hd.x} ${hd.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${tl.x} ${tl.y}`;
  const ang=Math.atan2(c1.y-hd.y,c1.x-hd.x),hdx=Math.cos(ang),hdy=Math.sin(ang);
  return <g style={{filter:"drop-shadow(0 4px 6px rgba(20,40,30,0.22))"}}>
    <defs><linearGradient id={`sg${id}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor={color}/><stop offset="100%" stopColor={belly}/></linearGradient></defs>
    <path d={path} fill="none" stroke={belly} strokeWidth="20" strokeLinecap="round" opacity="0.9"/>
    <path d={path} fill="none" stroke={`url(#sg${id})`} strokeWidth="15" strokeLinecap="round"/>
    <path d={path} fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.35" strokeDasharray="2 10"/>
    <ellipse cx={hd.x} cy={hd.y} rx="14" ry="10" fill={color} stroke={belly} strokeWidth="1.8" transform={`rotate(${(ang*180)/Math.PI} ${hd.x} ${hd.y})`}/>
    <circle cx={hd.x+hdx*4+hdy*4} cy={hd.y+hdy*4-hdx*4} r="2.2" fill="white"/>
    <circle cx={hd.x+hdx*4-hdy*4} cy={hd.y+hdy*4+hdx*4} r="2.2" fill="white"/>
    <circle cx={hd.x+hdx*4+hdy*4} cy={hd.y+hdy*4-hdx*4} r="1" fill="#0a0a0a"/>
    <circle cx={hd.x+hdx*4-hdy*4} cy={hd.y+hdy*4+hdx*4} r="1" fill="#0a0a0a"/>
  </g>;
}
const SnakeLadderBoardSVG = memo(function SnakeLadderBoardSVG({size}){
  const cells=[];
  for(let n=1;n<=100;n++){
    const idx=n-1,r=Math.floor(idx/10),ic=idx%10,c=r%2===0?ic:9-ic,x=c*SC,y=(9-r)*SC;
    cells.push(<g key={n}><rect x={x+1.5} y={y+1.5} width={SC-3} height={SC-3} rx="8" fill={RTINTS[r]} stroke="rgba(120,90,40,0.08)" strokeWidth="1"/><text x={x+6} y={y+13} fontFamily="Plus Jakarta Sans,sans-serif" fontSize="8.5" fontWeight="700" fill="rgba(60,40,20,0.4)">{n}</text></g>);
  }
  const st=sCell(1),fi=sCell(100);
  return (
    <svg viewBox={`0 0 ${SW} ${SW}`} width={size} height={size} style={{display:"block",borderRadius:20,boxShadow:"0 20px 60px -16px rgba(40,30,20,0.26)"}}>
      <defs>
        <linearGradient id="slbg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#FFFDF8"/><stop offset="100%" stopColor="#F1E7D3"/></linearGradient>
        <linearGradient id="slfi" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#FFE177"/><stop offset="100%" stopColor="#E08A1E"/></linearGradient>
        <linearGradient id="slst" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#A4F2C9"/><stop offset="100%" stopColor="#15A36A"/></linearGradient>
      </defs>
      <rect width={SW} height={SW} rx="22" fill="url(#slbg)"/>
      <rect x="4" y="4" width={SW-8} height={SW-8} rx="17" fill="#FFFDF8" stroke="#EAD9B6" strokeWidth="1.2"/>
      {cells}
      <rect x={st.x-SC/2+4} y={st.y-SC/2+4} width={SC-8} height={SC-8} rx="7" fill="url(#slst)" opacity="0.85"/>
      <text x={st.x} y={st.y+5} fontFamily="Bricolage Grotesque,sans-serif" fontSize="13" fontWeight="800" fill="#0a3322" textAnchor="middle">START</text>
      <rect x={fi.x-SC/2+4} y={fi.y-SC/2+4} width={SC-8} height={SC-8} rx="7" fill="url(#slfi)"/>
      <text x={fi.x} y={fi.y+5} fontFamily="Bricolage Grotesque,sans-serif" fontSize="13" fontWeight="800" fill="#4a2900" textAnchor="middle">100</text>
      <SLadder from={4}  to={25}/>
      <SLadder from={21} to={42}/>
      <SLadder from={51} to={84}/>
      <SSnake id="s1" from={99} to={41} color="#34D399" belly="#0E5E3D" cs={1}/>
      <SSnake id="s2" from={87} to={36} color="#FF8AA1" belly="#A21B40" cs={-1}/>
      <SSnake id="s3" from={67} to={19} color="#A678FF" belly="#5A2FB0" cs={1}/>
    </svg>
  );
});

const DOTS={1:[{x:20,y:20}],2:[{x:12,y:12},{x:28,y:28}],3:[{x:12,y:12},{x:20,y:20},{x:28,y:28}],4:[{x:12,y:12},{x:28,y:12},{x:12,y:28},{x:28,y:28}],5:[{x:12,y:12},{x:28,y:12},{x:20,y:20},{x:12,y:28},{x:28,y:28}],6:[{x:12,y:10},{x:28,y:10},{x:12,y:20},{x:28,y:20},{x:12,y:30},{x:28,y:30}]};
const LPATH=[{x:10,y:43.3},{x:16.7,y:43.3},{x:23.3,y:43.3},{x:30,y:43.3},{x:36.7,y:43.3},{x:43.3,y:36.7},{x:43.3,y:30}];
const SPATH=[{x:35,y:35},{x:45,y:35},{x:55,y:35},{x:65,y:35}];
const SBEZ=[{x:65,y:35},{x:50.6,y:45.4},{x:40.2,y:59.8},{x:29.7,y:74.3},{x:15,y:85}];

function LudoOverlay({size,onComplete}){
  const [face,setFace]=useState(1);
  const [dots,setDots]=useState(false);
  const [rolling,setRolling]=useState(false);
  const [tp,setTp]=useState(0);
  const [dv,setDv]=useState(false);
  useEffect(()=>{
    let x=false;const T=(f,ms)=>{const t=setTimeout(()=>{if(!x)f();},ms);return t;};
    const ts=[
      T(()=>{setDv(true);setRolling(true);},500),
      T(()=>{setFace(4);setDots(true);setRolling(false);},1050),
      T(()=>setTp(1),1350),T(()=>setTp(2),1650),T(()=>setTp(3),1950),T(()=>setTp(4),2250),
      T(()=>setDv(false),2500),
      T(()=>onComplete?.(),3000),
    ];
    return()=>{x=true;ts.forEach(clearTimeout);};
  },[onComplete]);
  const ds=Math.round(size*0.13),ts=Math.round(size*0.072);
  const pos=LPATH[tp]??LPATH[0];
  return (
    <div style={{position:"absolute",inset:0,pointerEvents:"none"}}>
      {dv&&<div style={{position:"absolute",left:"50%",top:"50%",marginLeft:-ds/2,marginTop:-ds/2,animation:rolling?"diceRoll 0.5s ease forwards":undefined,filter:"drop-shadow(0 5px 8px rgba(40,30,20,0.28))"}}>
        <Dice3D size={ds} face={face} rolling={rolling} />
      </div>}
      <div style={{position:"absolute",left:pos.x+"%",top:pos.y+"%",marginLeft:-ts/2,marginTop:-ts/2,transition:"left 0.25s cubic-bezier(0.4,0,0.2,1),top 0.25s cubic-bezier(0.4,0,0.2,1)",filter:"drop-shadow(0 3px 6px rgba(40,30,20,0.3))"}}>
        <svg viewBox="0 0 24 24" width={ts} height={ts}>
          <ellipse cx="12" cy="14.5" rx="8.5" ry="2.5" fill="rgba(0,0,0,0.25)"/>
          <circle cx="12" cy="11" r="9.5" fill="#A21B20"/>
          <circle cx="12" cy="11" r="8" fill="#FF5A5F"/>
          <ellipse cx="9.5" cy="8.5" rx="4" ry="2.3" fill="white" opacity="0.5"/>
        </svg>
      </div>
    </div>
  );
}

function SnakeOverlay({size,onComplete}){
  const [face,setFace]=useState(1);
  const [dots,setDots]=useState(false);
  const [rolling,setRolling]=useState(false);
  const [ti,setTi]=useState(0);
  const [dv,setDv]=useState(false);
  const [hv,setHv]=useState(false);
  const [flash,setFlash]=useState(false);
  const [si,setSi]=useState(0);
  useEffect(()=>{
    let x=false;const T=(f,ms)=>{const t=setTimeout(()=>{if(!x)f();},ms);return t;};
    const ts=[
      T(()=>{setDv(true);setRolling(true);},400),
      T(()=>{setFace(3);setDots(true);setRolling(false);},950),
      T(()=>setTi(1),1250),T(()=>setTi(2),1550),T(()=>setTi(3),1850),
      T(()=>{setDv(false);setHv(true);},2100),
      T(()=>setFlash(true),2400),T(()=>setFlash(false),2700),
      T(()=>setHv(false),2600),
      T(()=>setSi(1),2700),T(()=>setSi(2),2920),T(()=>setSi(3),3140),T(()=>setSi(4),3360),
      T(()=>onComplete?.(),3800),
    ];
    return()=>{x=true;ts.forEach(clearTimeout);};
  },[onComplete]);
  const ds=Math.round(size*0.12),ts=Math.round(size*0.068),hs=Math.round(size*0.18),fs=Math.round(size*0.24);
  const tp=si>0?SBEZ[si]??SBEZ[SBEZ.length-1]:SPATH[ti]??SPATH[0];
  return (
    <div style={{position:"absolute",inset:0,pointerEvents:"none"}}>
      {dv&&<div style={{position:"absolute",left:"18%",top:"75%",marginLeft:-ds/2,marginTop:-ds/2,animation:rolling?"diceRoll 0.5s ease forwards":undefined,filter:"drop-shadow(0 5px 8px rgba(40,30,20,0.28))"}}>
        <Dice3D size={ds} face={face} rolling={rolling} />
      </div>}
      {flash&&<div style={{position:"absolute",width:fs,height:fs,marginLeft:-fs/2,marginTop:-fs/2,left:"65%",top:"35%",borderRadius:"50%",background:"radial-gradient(circle,rgba(166,120,255,0.85) 0%,rgba(90,47,176,0.4) 35%,transparent 70%)",animation:"pop 0.4s ease forwards"}}/>}
      {hv&&<div style={{position:"absolute",width:hs,height:hs,marginLeft:-hs/2,marginTop:-hs/2,left:"65%",top:"35%",animation:"pop 0.3s ease forwards",filter:"drop-shadow(0 6px 10px rgba(60,30,120,0.4))"}}>
        <svg viewBox="0 0 80 80" width={hs} height={hs}>
          <defs><linearGradient id="shg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#A678FF"/><stop offset="100%" stopColor="#5A2FB0"/></linearGradient></defs>
          <ellipse cx="40" cy="40" rx="22" ry="15" fill="url(#shg)" stroke="#5A2FB0" strokeWidth="1.8"/>
          <circle cx="33" cy="34" r="3" fill="white"/><circle cx="33" cy="34" r="1.5" fill="#0a0a0a"/>
          <circle cx="33" cy="46" r="3" fill="white"/><circle cx="33" cy="46" r="1.5" fill="#0a0a0a"/>
        </svg>
      </div>}
      <div style={{position:"absolute",left:tp.x+"%",top:tp.y+"%",marginLeft:-ts/2,marginTop:-ts/2,transition:"left 0.24s cubic-bezier(0.4,0,0.2,1),top 0.24s cubic-bezier(0.4,0,0.2,1)",filter:"drop-shadow(0 3px 6px rgba(40,30,20,0.3))"}}>
        <svg viewBox="0 0 24 24" width={ts} height={ts}>
          <ellipse cx="12" cy="14.5" rx="8.5" ry="2.5" fill="rgba(0,0,0,0.25)"/>
          <circle cx="12" cy="11" r="9.5" fill="#8C5800"/>
          <circle cx="12" cy="11" r="8" fill="#FFC23D"/>
          <ellipse cx="9.5" cy="8.5" rx="4" ry="2.3" fill="white" opacity="0.5"/>
        </svg>
      </div>
    </div>
  );
}

export function LoginScreen({onConnectClick}){
  const [tab,setTab]=useState("ludo");
  const [key,setKey]=useState(0);
  const [fading,setFading]=useState(false);
  const switchTab=useCallback((next)=>{
    if(fading)return;
    setFading(true);
    setTimeout(()=>{setTab(next);setKey(k=>k+1);setFading(false);},280);
  },[fading]);
  const onLudoDone=useCallback(()=>switchTab("snakes"),[switchTab]);
  const onSnakeDone=useCallback(()=>switchTab("ludo"),[switchTab]);
  const size=Math.min(typeof window!=="undefined"?window.innerWidth-32:340,400);

  return (
    <div style={{minHeight:"100svh",background:"hsl(36 100% 96%)",display:"flex",flexDirection:"column",fontFamily:"var(--font-body)",WebkitFontSmoothing:"antialiased",position:"relative",overflow:"hidden"}}>
      <style>{"@keyframes lsPing{75%,100%{transform:scale(2.2);opacity:0;}} @keyframes boardIn{from{opacity:0;transform:scale(0.88);}to{opacity:1;transform:scale(1);}} @keyframes boardOut{from{opacity:1;transform:scale(1);}to{opacity:0;transform:scale(1.05);}}"}</style>
      <div aria-hidden="true" style={{position:"absolute",inset:0,pointerEvents:"none",overflow:"hidden"}}>
        <div style={{position:"absolute",width:"55%",paddingBottom:"55%",borderRadius:"50%",background:"radial-gradient(circle,hsl(8 95% 65%/0.45) 0%,transparent 70%)",filter:"blur(32px)",top:"-5%",left:"-15%"}}/>
        <div style={{position:"absolute",width:"60%",paddingBottom:"60%",borderRadius:"50%",background:"radial-gradient(circle,hsl(207 95% 70%/0.42) 0%,transparent 70%)",filter:"blur(36px)",bottom:"-5%",right:"-16%"}}/>
        <div style={{position:"absolute",width:"45%",paddingBottom:"45%",borderRadius:"50%",background:"radial-gradient(circle,hsl(152 70% 70%/0.35) 0%,transparent 70%)",filter:"blur(28px)",top:"50%",left:"-10%"}}/>
      </div>
      <header style={{position:"relative",zIndex:20,padding:"13px 18px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontFamily:"var(--font-display)",fontSize:20,fontWeight:800,color:"var(--ink)"}}>MonArena</span>
        </div>
        <button onClick={onConnectClick} style={{padding:"9px 18px",borderRadius:999,border:"none",color:"white",fontWeight:800,background:"linear-gradient(180deg,hsl(14 100% 70%),hsl(8 95% 60%))"}}>Connect</button>
      </header>
      <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:"10px 16px 8px",position:"relative",zIndex:10}}>
         <div key={tab+key} style={{animation:fading?"boardOut 0.28s ease forwards":"boardIn 0.55s cubic-bezier(0.16,1,0.3,1) forwards"}}>
            {tab==="ludo"
              ?<><LudoBoardSVG size={size}/><LudoOverlay key={key} size={size} onComplete={onLudoDone}/></>
              :<><SnakeLadderBoardSVG size={size}/><SnakeOverlay key={key} size={size} onComplete={onSnakeDone}/></>
            }
         </div>
      </div>
      <div style={{display:"flex",justifyContent:"center",position:"relative",zIndex:20,marginBottom:10}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:3,padding:"3px",borderRadius:999,background:"white",border:"1px solid hsl(36 30% 87%)"}}>
          {[{k:"ludo",label:"Ludo"},{k:"snakes",label:"Snake & Ladder"}].map(t=>(
            <button key={t.k} onClick={()=>{if(tab!==t.k)switchTab(t.k);}} style={{padding:"7px 16px",borderRadius:999,border:"none",fontSize:12.5,fontWeight:800,color:tab===t.k?"white":"var(--muted)",background:tab===t.k?"linear-gradient(180deg,hsl(14 100% 70%),hsl(8 95% 60%))":"transparent"}}>
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div style={{padding:"0 16px 20px",position:"relative",zIndex:20}}>
        <button onClick={onConnectClick} style={{width:"100%",padding:"15px",borderRadius:16,border:"none",color:"white",fontWeight:800,background:"linear-gradient(180deg,hsl(14 100% 70%),hsl(8 95% 60%))"}}>Connect Wallet</button>
      </div>
    </div>
  );
}
