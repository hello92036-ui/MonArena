import { memo } from "react";

const DOTS = {
  1:[{x:20,y:20}],
  2:[{x:12,y:12},{x:28,y:28}],
  3:[{x:12,y:12},{x:20,y:20},{x:28,y:28}],
  4:[{x:12,y:12},{x:28,y:12},{x:12,y:28},{x:28,y:28}],
  5:[{x:12,y:12},{x:28,y:12},{x:20,y:20},{x:12,y:28},{x:28,y:28}],
  6:[{x:12,y:10},{x:28,y:10},{x:12,y:20},{x:28,y:20},{x:12,y:30},{x:28,y:30}]
};

const DiceFace = memo(({ f }) => (
  <svg viewBox="0 0 40 40" width="100%" height="100%" style={{display: "block"}}>
    <rect x="2" y="2" width="36" height="36" rx="9" fill="white" stroke="#D9CDB1" strokeWidth="1.5"/>
    <rect x="2" y="2" width="36" height="12" rx="9" fill="#FFF8EC"/>
    {(DOTS[f] || []).map((d, i) => (
      <circle key={i} cx={d.x} cy={d.y} r="3.4" fill="#1a1f3a" />
    ))}
  </svg>
));

export const Dice3D = memo(({ face, rolling, size }) => {
  const tz = size / 2;

  const getTransform = () => {
    switch(face) {
      case 1: return 'rotateX(0deg) rotateY(0deg)';
      case 6: return 'rotateX(180deg) rotateY(0deg)';
      case 3: return 'rotateX(0deg) rotateY(-90deg)';
      case 4: return 'rotateX(0deg) rotateY(90deg)';
      case 5: return 'rotateX(-90deg) rotateY(0deg)';
      case 2: return 'rotateX(90deg) rotateY(0deg)';
      default: return 'rotateX(0deg) rotateY(0deg)';
    }
  };

  return (
    <div style={{ width: size, height: size, perspective: size * 4, zIndex: 100 }}>
      <style>
        {`
          @keyframes trueTumble {
            0% { transform: rotateX(0deg) rotateY(0deg) rotateZ(0deg); }
            100% { transform: rotateX(720deg) rotateY(1080deg) rotateZ(360deg); }
          }
        `}
      </style>
      <div style={{
        width: '100%', height: '100%', position: 'relative', transformStyle: 'preserve-3d',
        animation: rolling ? 'trueTumble 0.5s linear infinite' : 'none',
        transform: rolling ? 'none' : getTransform(),
        transition: rolling ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)'
      }}>
        {[
          { f: 1, t: `rotateY(0deg) translateZ(${tz}px)` },
          { f: 6, t: `rotateX(180deg) translateZ(${tz}px)` },
          { f: 3, t: `rotateY(90deg) translateZ(${tz}px)` },
          { f: 4, t: `rotateY(-90deg) translateZ(${tz}px)` },
          { f: 5, t: `rotateX(90deg) translateZ(${tz}px)` },
          { f: 2, t: `rotateX(-90deg) translateZ(${tz}px)` }
        ].map(({ f, t }) => (
          <div key={f} style={{
            position: 'absolute', width: '100%', height: '100%',
            transform: t, backfaceVisibility: 'hidden',
            borderRadius: '22%', overflow: 'hidden', background: 'white',
            boxShadow: 'inset 0 0 10px rgba(0,0,0,0.1)'
          }}>
            <DiceFace f={f} />
          </div>
        ))}
      </div>
    </div>
  );
});
