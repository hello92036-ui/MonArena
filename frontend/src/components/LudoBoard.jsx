import { memo } from "react";

const CELL = 36;
const BW = 15 * CELL;

const HOMES = [
  { id:"red",    base:"#FF5A5F", hi:"#FF8A8E", lo:"#C7363B", x:0,      y:9*CELL },
  { id:"green",  base:"#34D399", hi:"#7BEAC0", lo:"#14935E", x:0,      y:0      },
  { id:"yellow", base:"#FFC23D", hi:"#FFD97A", lo:"#D89400", x:9*CELL, y:0      },
  { id:"blue",   base:"#3DA9FF", hi:"#7CC4FF", lo:"#1D7BCB", x:9*CELL, y:9*CELL },
];

const SAFE_STARS = [
  {c:1,r:6},{c:8,r:1},{c:13,r:8},{c:6,r:13},
  {c:2,r:6},{c:6,r:2},{c:12,r:8},{c:8,r:12},
];

const ENTRY = [
  {x:1*CELL,y:6*CELL,fill:"#FF5A5F"},
  {x:8*CELL,y:1*CELL,fill:"#34D399"},
  {x:13*CELL,y:8*CELL,fill:"#FFC23D"},
  {x:6*CELL,y:13*CELL,fill:"#3DA9FF"},
];

function Cell({x,y,fill="#FFFDF8",stroke="#E7DFD0"}){
  return <rect x={x+1} y={y+1} width={CELL-2} height={CELL-2} rx="5" fill={fill} stroke={stroke} strokeWidth="0.8"/>;
}

function Star({cx,cy}){
  const pts=[];
  for(let i=0;i<10;i++){
    const r=i%2===0?9:3.8;
    const a=(i*Math.PI)/5-Math.PI/2;
    pts.push(`${cx+r*Math.cos(a)},${cy+r*Math.sin(a)}`);
  }
  return <polygon points={pts.join(" ")} fill="#C9B98A" opacity="0.9"/>;
}

function Piece({cx,cy,color,rim}){
  return (
    <g>
      <ellipse cx={cx} cy={cy+2.5} rx="11" ry="3.5" fill="rgba(0,0,0,0.18)"/>
      <circle cx={cx} cy={cy} r="12" fill={rim}/>
      <circle cx={cx} cy={cy} r="10" fill={color}/>
      <ellipse cx={cx-3} cy={cy-3.5} rx="4.5" ry="3" fill="white" opacity="0.5"/>
      <circle cx={cx} cy={cy} r="2.5" fill={rim} opacity="0.6"/>
    </g>
  );
}

function HomeBase({h}){
  const ix=h.x+CELL,iy=h.y+CELL,iw=4*CELL;
  const slots=[
    {x:ix+CELL,y:iy+CELL},{x:ix+3*CELL,y:iy+CELL},
    {x:ix+CELL,y:iy+3*CELL},{x:ix+3*CELL,y:iy+3*CELL},
  ];
  return (
    <g>
      <rect x={h.x+3} y={h.y+3} width={6*CELL-6} height={6*CELL-6} rx="18" fill={`url(#f-${h.id})`} stroke="rgba(0,0,0,0.06)"/>
      <rect x={h.x+3} y={h.y+3} width={6*CELL-6} height={(6*CELL-6)*0.44} rx="18" fill={`url(#g-${h.id})`} opacity="0.5"/>
      <rect x={ix} y={iy} width={iw} height={iw} rx="12" fill="#FFFCF6" stroke="rgba(0,0,0,0.05)"/>
      <rect x={ix+6} y={iy+6} width={iw-12} height={iw-12} rx="8" fill="none" stroke={h.base} strokeOpacity="0.3" strokeWidth="1.5" strokeDasharray="4 7"/>
      {slots.map((s,i)=><Piece key={i} cx={s.x} cy={s.y} color={h.base} rim={h.lo}/>)}
    </g>
  );
}

export const LudoBoard = memo(function LudoBoard({size=340}){
  const path=[];
  for(let r=0;r<6;r++) for(let c=6;c<9;c++) path.push({x:c*CELL,y:r*CELL});
  for(let r=9;r<15;r++) for(let c=6;c<9;c++) path.push({x:c*CELL,y:r*CELL});
  for(let r=6;r<9;r++) for(let c=0;c<6;c++) path.push({x:c*CELL,y:r*CELL});
  for(let r=6;r<9;r++) for(let c=9;c<15;c++) path.push({x:c*CELL,y:r*CELL});
  const lanes=[
    {cells:Array.from({length:5},(_,i)=>({x:(1+i)*CELL,y:7*CELL})),fill:"#FF5A5F"},
    {cells:Array.from({length:5},(_,i)=>({x:7*CELL,y:(1+i)*CELL})),fill:"#34D399"},
    {cells:Array.from({length:5},(_,i)=>({x:(13-i)*CELL,y:7*CELL})),fill:"#FFC23D"},
    {cells:Array.from({length:5},(_,i)=>({x:7*CELL,y:(13-i)*CELL})),fill:"#3DA9FF"},
  ];
  return (
    <svg viewBox={`0 0 ${BW} ${BW}`} width={size} height={size} style={{display:"block",borderRadius:18,boxShadow:"0 16px 48px -12px rgba(40,30,20,0.24)"}}>
      <defs>
        {HOMES.map(h=>[
          <linearGradient key={`f-${h.id}`} id={`f-${h.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={h.hi}/><stop offset="55%" stopColor={h.base}/><stop offset="100%" stopColor={h.lo}/>
          </linearGradient>,
          <linearGradient key={`g-${h.id}`} id={`g-${h.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.8"/><stop offset="100%" stopColor="#fff" stopOpacity="0"/>
          </linearGradient>,
        ])}
        <linearGradient id="bf" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFDF8"/><stop offset="100%" stopColor="#F1E7D3"/>
        </linearGradient>
        <linearGradient id="cx-r" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FF8A8E"/><stop offset="1" stopColor="#C7363B"/></linearGradient>
        <linearGradient id="cx-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#7BEAC0"/><stop offset="1" stopColor="#0E7E55"/></linearGradient>
        <linearGradient id="cx-y" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFD97A"/><stop offset="1" stopColor="#B97800"/></linearGradient>
        <linearGradient id="cx-b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#7CC4FF"/><stop offset="1" stopColor="#0D4D85"/></linearGradient>
      </defs>
      <rect width={BW} height={BW} rx="22" fill="url(#bf)"/>
      <rect x="4" y="4" width={BW-8} height={BW-8} rx="17" fill="#FFFDF8" stroke="#EAD9B6" strokeWidth="1.2"/>
      {path.map((c,i)=><Cell key={i} x={c.x} y={c.y}/>)}
      {lanes.map((l,li)=>l.cells.map((c,i)=><Cell key={`l${li}-${i}`} x={c.x} y={c.y} fill={l.fill} stroke="rgba(0,0,0,0.04)"/>))}
      {ENTRY.map((e,i)=><Cell key={`e${i}`} x={e.x} y={e.y} fill={e.fill} stroke="rgba(0,0,0,0.04)"/>)}
      {SAFE_STARS.map((s,i)=><Star key={i} cx={s.c*CELL+CELL/2} cy={s.r*CELL+CELL/2}/>)}
      {HOMES.map(h=><HomeBase key={h.id} h={h}/>)}
      <g transform={`translate(${6*CELL},${6*CELL})`}>
        <rect width={3*CELL} height={3*CELL} fill="#FFFDF8" stroke="#EAD9B6" strokeWidth="0.8"/>
        <polygon points={`0,0 ${3*CELL},0 ${1.5*CELL},${1.5*CELL}`} fill="url(#cx-g)"/>
        <polygon points={`${3*CELL},0 ${3*CELL},${3*CELL} ${1.5*CELL},${1.5*CELL}`} fill="url(#cx-y)"/>
        <polygon points={`0,${3*CELL} ${3*CELL},${3*CELL} ${1.5*CELL},${1.5*CELL}`} fill="url(#cx-b)"/>
        <polygon points={`0,0 0,${3*CELL} ${1.5*CELL},${1.5*CELL}`} fill="url(#cx-r)"/>
        <circle cx={1.5*CELL} cy={1.5*CELL} r="8" fill="#FFFDF8" stroke="rgba(0,0,0,0.12)"/>
      </g>
    </svg>
  );
});
